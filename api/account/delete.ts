import crypto from "crypto";
import { verifyAuthToken, getDb, admin } from "../_lib/firebaseAdmin.js";
import { checkRateLimit } from "../_lib/rateLimit.js";
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
        error: "Não autorizado.",
        requestId,
      });
    }

    const uid = decoded.uid;

    // P1-18: Rate limit account deletion
    const rate = await checkRateLimit(`account_delete_${uid}`, 3, 60 * 60 * 1000);
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfterSec || 3600));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        error: "Muitas solicitações de exclusão. Tente novamente mais tarde.",
        requestId,
      });
    }

    // P1-17: Require recent authentication (auth_time within 10 minutes)
    const authTime = Number(decoded.auth_time || 0);
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - authTime > 600) {
      return res.status(403).json({
        success: false,
        code: "REAUTH_REQUIRED",
        error: "Por segurança, reautentique-se recentemente para confirmar a exclusão da sua conta.",
        requestId,
      });
    }

    const db = getDb();
    const userRef = db.collection("users").doc(uid);

   // P1-2: Delete user subcollections safely in batches
const subcollections = ["consultations", "credit_logs", "transactions"];

for (const sub of subcollections) {
  const subcollectionRef = userRef.collection(sub);

  while (true) {
    const snap = await subcollectionRef
      .limit(400)
      .get();

    if (snap.empty) {
      break;
    }

    const batch = db.batch();

    snap.docs.forEach((document) => {
      batch.delete(document.ref);
    });

    await batch.commit();

    if (snap.size < 400) {
      break;
    }
  }
}

    // P1-1 & P1-3: Anonymize financial records for legal/fiscal retention
    const anonymizedHash = crypto.createHash("sha256").update(uid).digest("hex").slice(0, 16);
    try {
      const intentsSnap = await db
        .collection("payment_intents")
        .where("userId", "==", uid)
        .get();

      if (!intentsSnap.empty) {
        const batch = db.batch();
        intentsSnap.forEach((doc) => {
          batch.update(doc.ref, {
            userId: `anonymized_${anonymizedHash}`,
            userEmail: "deleted@lgpd.anonymized",
            ip: "0.0.0.0",
            anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn("[ANONYMIZE_PAYMENTS_WARN]", e);
    }

    // Delete user document
    await userRef.delete();

    // Delete from Firebase Auth
    try {
      await admin.auth().deleteUser(uid);
    } catch (authErr) {
      console.warn("[DELETE_USER_AUTH_WARN]", authErr);
    }

    // Record deletion in audit log
    try {
      await db.collection("security_logs").add({
        type: "account_deleted_lgpd",
        uidHash: anonymizedHash,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn("[LOG_ACCOUNT_DELETED_WARN]", e);
    }

    return res.status(200).json({
      success: true,
      code: "ACCOUNT_DELETED",
      message: "Conta e histórico excluídos com sucesso conforme a LGPD.",
      requestId,
    });
  } catch (error: any) {
    console.error("[ACCOUNT_DELETE_ERROR]", error);
    return res.status(500).json({
      success: false,
      code: "DELETE_FAILED",
      error: "Erro ao processar exclusão de conta.",
      requestId,
    });
  }
}
