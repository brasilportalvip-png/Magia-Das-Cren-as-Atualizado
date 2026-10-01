import { MercadoPagoConfig, Payment } from "mercadopago";
import { verifyAuthToken, getDb } from "../_lib/firebaseAdmin.js";
import { checkRateLimit } from "../_lib/rateLimit.js";

export default async function handler(req: any, res: any) {
  const requestId = crypto.randomUUID();

  if (req.method !== "GET") {
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

    const rate = await checkRateLimit(`payment_status_${decoded.uid}`, 30, 60 * 1000);
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfterSec || 60));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        error: "Muitas consultas de status. Aguarde um momento.",
        requestId,
      });
    }

    const paymentId = req.query?.paymentId || req.query?.id;
    const ref = req.query?.ref || req.query?.externalReference;

    if (!paymentId && !ref) {
      return res.status(400).json({
        success: false,
        code: "MISSING_IDENTIFIER",
        error: "Identificador do pagamento não informado.",
        requestId,
      });
    }

    const db = getDb();

    // P0-16: Verify internal intent first as source of truth for authorization
    let intentDoc = null;
    if (ref) {
      intentDoc = await db.collection("payment_intents").doc(String(ref)).get();
    } else if (paymentId) {
      const snap = await db
        .collection("payments")
        .doc(String(paymentId))
        .get();
      if (snap.exists) {
        intentDoc = snap;
      } else {
        const intentByPaySnap = await db
          .collection("payment_intents")
          .where("paymentId", "==", String(paymentId))
          .limit(1)
          .get();
        if (!intentByPaySnap.empty) {
          intentDoc = intentByPaySnap.docs[0];
        }
      }
    }

    if (intentDoc && intentDoc.exists) {
      const data = intentDoc.data();
      if (data?.userId !== decoded.uid) {
        return res.status(403).json({
          success: false,
          code: "FORBIDDEN",
          error: "Acesso negado ao pagamento solicitado.",
          requestId,
        });
      }

      // If already marked as credited in internal database
      if (data?.status === "credited") {
        return res.status(200).json({
          success: true,
          status: "approved",
          credited: true,
          credits: data?.credits,
          requestId,
        });
      }
    }

    // Query Mercado Pago directly if paymentId exists
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (paymentId && token) {
      try {
        const mp = new MercadoPagoConfig({ accessToken: token });
        const paymentClient = new Payment(mp);
        const paymentData: any = await paymentClient.get({ id: String(paymentId) });

        const metadata = paymentData?.metadata || {};
        const paymentOwner = metadata.userId || metadata.user_id;

        if (paymentOwner && paymentOwner !== decoded.uid) {
          return res.status(403).json({
            success: false,
            code: "FORBIDDEN",
            error: "Acesso negado.",
            requestId,
          });
        }

        const status = paymentData?.status;
        return res.status(200).json({
          success: true,
          status,
          approved: status === "approved",
          requestId,
        });
      } catch (mpErr) {
        console.warn("[MP_STATUS_QUERY_WARN]", mpErr);
      }
    }

    if (intentDoc && intentDoc.exists) {
      return res.status(200).json({
        success: true,
        status: intentDoc.data()?.status || "pending",
        approved: intentDoc.data()?.status === "credited",
        requestId,
      });
    }

    return res.status(404).json({
      success: false,
      code: "NOT_FOUND",
      error: "Pagamento não encontrado.",
      requestId,
    });
  } catch (error: any) {
    console.error("[PAYMENT_STATUS_ERROR]", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      error: "Erro ao consultar status do pagamento.",
      requestId,
    });
  }
}
