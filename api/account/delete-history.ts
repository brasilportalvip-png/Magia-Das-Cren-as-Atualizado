import crypto from "crypto";
import { verifyAuthToken, getDb } from "../_lib/firebaseAdmin.js";
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

    const rate = await checkRateLimit(`delete_history_${uid}`, 5, 60 * 1000);
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfterSec || 60));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        error: "Muitas solicitações recentes. Tente novamente mais tarde.",
        requestId,
      });
    }

    const db = getDb();
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("consultations")
      .get();

    if (!snap.empty) {
      const batch = db.batch();
      snap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      message: "Histórico de consultas espirituais excluído com sucesso.",
      requestId,
    });
  } catch (error: any) {
    console.error("[DELETE_HISTORY_ERROR]", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      error: "Erro ao excluir histórico de consultas.",
      requestId,
    });
  }
}
