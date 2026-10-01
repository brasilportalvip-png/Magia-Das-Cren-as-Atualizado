import { verifyAuthToken, getDb, admin } from "../_lib/firebaseAdmin.js";
import { getClientIp, checkRateLimit } from "../_lib/rateLimit.js";

export default async function handler(req: any, res: any) {
  const requestId = crypto.randomUUID();

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      code: "METHOD_NOT_ALLOWED",
      error: "Método não permitido.",
      requestId,
    });
  }

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded || !decoded.uid) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        error: "Não autorizado. Token de sessão obrigatório.",
        requestId,
      });
    }

    const uid = decoded.uid;
    const email = decoded.email || "";
    const ip = getClientIp(req);

    const rate = await checkRateLimit(`register_check_${ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfterSec || 60));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        error: "Muitas solicitações recentes. Tente novamente mais tarde.",
        requestId,
      });
    }

    const { deviceId, browser, sessionSign } = req.body || {};
    const fraudReasons: string[] = [];

    const db = getDb();

    // Check device ID reuse if provided
    if (deviceId && typeof deviceId === "string" && deviceId !== "dev_not_tracked") {
      try {
        const devSnap = await db
          .collection("users")
          .where("deviceId", "==", deviceId.slice(0, 128))
          .limit(2)
          .get();

        const otherUsersWithDevice = devSnap.docs.filter((d) => d.id !== uid);
        if (otherUsersWithDevice.length > 0) {
          fraudReasons.push("device_already_used");
        }
      } catch (e) {
        console.warn("[FRAUD_CHECK_DEVICE_QUERY_WARN]", e);
      }
    }

    // Shared IP is a secondary signal, only flags if excessive accounts created rapidly
    if (ip && ip !== "unknown") {
      try {
        const ipSnap = await db
          .collection("users")
          .where("ip", "==", ip)
          .limit(10)
          .get();

        const otherUsersWithIp = ipSnap.docs.filter((d) => d.id !== uid);
        if (otherUsersWithIp.length >= 5) {
          fraudReasons.push("too_many_accounts_same_ip");
        }
      } catch (e) {
        console.warn("[FRAUD_CHECK_IP_QUERY_WARN]", e);
      }
    }

    const promotionalCreditsBlocked = fraudReasons.length > 0;
    const initialCredits = promotionalCreditsBlocked ? 0 : 7;

    // Backend is the sole authority: initialize credits and plan directly in Firestore
    const userRef = db.collection("users").doc(uid);
    const existingDoc = await userRef.get();

    // Only grant promotional credits once upon initial registration
    if (!existingDoc.exists || existingDoc.data()?.creditsGranted === undefined) {
      await userRef.set(
        {
          uid,
          credits: initialCredits,
          plan: "free",
          creditsGranted: initialCredits,
          promotionalCreditsBlocked,
          fraudReasons,
          freeQueriesUsed: 0,
          freeRefillsCount: 0,
          deviceId: typeof deviceId === "string" ? deviceId.slice(0, 128) : "dev_not_tracked",
          ip,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: existingDoc.exists
            ? existingDoc.data()?.createdAt
            : admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Save security log with TTL retention (90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    try {
      await db.collection("security_logs").add({
        type: "register_check",
        uid,
        email,
        ip,
        deviceId: typeof deviceId === "string" ? deviceId.slice(0, 128) : "dev_not_tracked",
        browser: typeof browser === "string" ? browser.slice(0, 256) : "unknown",
        sessionSign: typeof sessionSign === "string" ? sessionSign.slice(0, 256) : "unknown",
        creditsGranted: initialCredits,
        promotionalCreditsBlocked,
        fraudReasons,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn("[SECURITY_LOG_WARN]", e);
    }

    // Data minimization (LGPD): DO NOT expose internal IP in public response
    return res.status(200).json({
      success: true,
      promotionEligible: !promotionalCreditsBlocked,
      message: promotionalCreditsBlocked
        ? "Registro concluído. Limite promocional de dispositivo atingido."
        : "Registro concluído com sucesso. Energias vitais iniciais liberadas.",
      requestId,
    });
  } catch (error: any) {
    // P0-4: FAIL-CLOSED! Never grant credits on failure
    console.error("[REGISTER_CHECK_ERROR]", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "SECURITY_CHECK_FAILED",
      error: "Não foi possível concluir a validação de segurança.",
      requestId,
    });
  }
}
