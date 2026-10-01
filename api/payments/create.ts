import crypto from "crypto";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { verifyAuthToken, getDb, admin } from "../_lib/firebaseAdmin";
import { checkRateLimit, getClientIp } from "../_lib/rateLimit";

export const PLANS: Record<
  string,
  { id: string; title: string; amount: number; credits: number; planName: string }
> = {
  silver: {
    id: "silver",
    title: "Plano Prata - Magia das Crenças",
    amount: 49,
    credits: 50,
    planName: "silver",
  },
  prata: {
    id: "silver",
    title: "Plano Prata - Magia das Crenças",
    amount: 49,
    credits: 50,
    planName: "silver",
  },
  gold: {
    id: "gold",
    title: "Plano Ouro - Magia das Crenças",
    amount: 120,
    credits: 125,
    planName: "gold",
  },
  ouro: {
    id: "gold",
    title: "Plano Ouro - Magia das Crenças",
    amount: 120,
    credits: 125,
    planName: "gold",
  },
};

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
        error: "Não autorizado. Faça login para adquirir créditos.",
        requestId,
      });
    }

    const userId = decoded.uid;
    const userEmail = decoded.email || "";
    const ip = getClientIp(req);

    const rate = await checkRateLimit(`payment_create_${userId}`, 10, 60 * 1000);
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfterSec || 60));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        error: "Muitas tentativas de compra recentes. Aguarde um minuto.",
        requestId,
      });
    }

    // P0-15: Never trust price, credits, or user from body
    const { packageId } = req.body || {};
    const normalizedPkg = String(packageId || "").toLowerCase().trim();
    const plan = PLANS[normalizedPkg];

    if (!plan) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PACKAGE",
        error: "Pacote inválido selecionado.",
        requestId,
      });
    }

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      return res.status(503).json({
        success: false,
        code: "PAYMENT_UNAVAILABLE",
        error: "Serviço de pagamento indisponível no momento. Tente mais tarde.",
        requestId,
      });
    }

    const mp = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(mp);

    const appUrl = process.env.APP_URL || "https://www.magiadascrencas.com.br";
    const externalRef = `order_${userId}_${plan.id}_${crypto.randomUUID()}`;

    // Record authoritative payment intent in Firestore
    const db = getDb();
    const intentData = {
      externalReference: externalRef,
      userId,
      userEmail,
      packageId: plan.id,
      plan: plan.planName,
      expectedAmount: plan.amount,
      amount: plan.amount,
      currency: "BRL",
      credits: plan.credits,
      status: "pending",
      ip,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("payment_intents").doc(externalRef).set(intentData);
    await db.collection("payment_logs").doc(externalRef).set(intentData);

    const result: any = await preference.create({
      body: {
        items: [
          {
            id: plan.id,
            title: plan.title,
            quantity: 1,
            currency_id: "BRL",
            unit_price: plan.amount,
          },
        ],
        payer: {
          email: userEmail || undefined,
        },
        external_reference: externalRef,
        metadata: {
          userId,
          packageId: plan.id,
          credits: plan.credits,
          amount: plan.amount,
        },
        back_urls: {
          success: `${appUrl}/?payment=success&ref=${externalRef}`,
          failure: `${appUrl}/?payment=failure&ref=${externalRef}`,
          pending: `${appUrl}/?payment=pending&ref=${externalRef}`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/payments/webhook`,
      },
    });

    return res.status(200).json({
      success: true,
      checkoutUrl: result.init_point || result.sandbox_init_point,
      preferenceId: result.id,
      externalReference: externalRef,
      requestId,
    });
  } catch (error: any) {
    console.error("[PAYMENTS_CREATE_ERROR]", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "PAYMENT_CREATION_FAILED",
      error: "Erro ao gerar preferência de pagamento.",
      requestId,
    });
  }
}
