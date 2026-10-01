import crypto from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getDb, admin } from "../_lib/firebaseAdmin.js";
import { PLANS } from "./create.js";

export function verifyWebhookSignature(req: any): { valid: boolean; reason?: string } {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_INSECURE_WEBHOOK_DEV === "true"
    ) {
      console.warn("[MERCADO_PAGO_WEBHOOK] Development mode: ALLOW_INSECURE_WEBHOOK_DEV is active");
      return { valid: true };
    }
    console.error(
      "[MERCADO_PAGO_WEBHOOK_CONFIG_ERROR] MERCADO_PAGO_WEBHOOK_SECRET is missing. Fail-closed."
    );
    return { valid: false, reason: "secret_not_configured" };
  }

  const xSignature = req.headers?.["x-signature"];
  const xRequestId = req.headers?.["x-request-id"];
  if (!xSignature || !xRequestId) {
    return { valid: false, reason: "missing_headers" };
  }

  const parts = String(xSignature).split(",");
  let ts = "";
  let v1 = "";
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k?.trim() === "ts") ts = v?.trim();
    if (k?.trim() === "v1") v1 = v?.trim();
  }

  if (!ts || !v1) {
    return { valid: false, reason: "malformed_signature" };
  }

  // P0-9: Validate timestamp window (max 5 minutes)
  const tsNum = Number(ts);
  if (isNaN(tsNum)) {
    return { valid: false, reason: "invalid_timestamp" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > 300) {
    return { valid: false, reason: "timestamp_expired" };
  }

  const dataId = req.query?.["data.id"] || req.body?.data?.id || "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // P0-8: Constant-time comparison
  const hmacBuf = Buffer.from(hmac, "utf8");
  const v1Buf = Buffer.from(v1, "utf8");

  if (hmacBuf.length !== v1Buf.length) {
    return { valid: false, reason: "signature_length_mismatch" };
  }

  const matches = crypto.timingSafeEqual(hmacBuf, v1Buf);
  return { valid: matches, reason: matches ? undefined : "signature_mismatch" };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(200).json({ received: true });
  }

  try {
    // P0-7: Fail-closed signature verification
    const sigCheck = verifyWebhookSignature(req);
    if (!sigCheck.valid) {
      if (sigCheck.reason === "secret_not_configured") {
        return res.status(503).json({ error: "Webhook secret not configured in production." });
      }
      return res.status(401).json({ error: `Assinatura inválida: ${sigCheck.reason}` });
    }

    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.id ||
      req.query?.["data.id"];

    if (!paymentId) {
      return res.status(200).json({ received: true, ignored: "no_payment_id" });
    }

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      console.error("[WEBHOOK_CONFIG_ERROR] MERCADO_PAGO_ACCESS_TOKEN not set");
      return res.status(503).json({ error: "Mercado Pago credentials not configured." });
    }

    const mp = new MercadoPagoConfig({ accessToken: token });
    const paymentClient = new Payment(mp);

    // P0-10: Fetch payment directly from official Mercado Pago API
    const paymentData: any = await paymentClient.get({ id: String(paymentId) });
    const status = paymentData?.status;
    const currency = paymentData?.currency_id;
    const externalRef = paymentData?.external_reference;
    const transactionAmount = Number(paymentData?.transaction_amount || 0);

    const db = getDb();

    // Log raw webhook event
    await db.collection("payment_webhooks").doc(String(paymentId)).set(
      {
        paymentId: String(paymentId),
        externalReference: externalRef || null,
        status,
        currency,
        amount: transactionAmount,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Only process approved payments
    if (status !== "approved") {
      return res.status(200).json({ received: true, status });
    }

    // P0-10: Must be BRL
    if (currency !== "BRL") {
      console.error(`[WEBHOOK_REJECTED] Currency mismatch: ${currency}`);
      return res.status(400).json({ error: "Moeda inválida" });
    }

    // P0-10: Payment intent is the single source of truth
    if (!externalRef) {
      console.error(`[WEBHOOK_REJECTED] Missing external_reference on payment ${paymentId}`);
      return res.status(400).json({ error: "external_reference ausente" });
    }

    const intentRef = db.collection("payment_intents").doc(externalRef);
    const intentSnap = await intentRef.get();

    if (!intentSnap.exists) {
      console.error(`[WEBHOOK_FRAUD_WARN] Intent not found for externalReference: ${externalRef}`);
      await db.collection("payment_errors").add({
        paymentId: String(paymentId),
        externalReference: externalRef,
        reason: "intent_not_found",
        amount: transactionAmount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(400).json({ error: "Intenção de pagamento não encontrada." });
    }

    const intent = intentSnap.data() || {};
    const userId = intent.userId;
    const expectedPackageId = intent.packageId;
    const expectedAmount = Number(intent.expectedAmount || intent.amount || 0);
    const expectedCredits = Number(intent.credits || 0);
    const expectedPlan = intent.plan || "silver";

    // P0-10: Rigorous integrity checks against internal intent
    if (transactionAmount !== expectedAmount) {
      console.error(
        `[WEBHOOK_FRAUD_WARN] Amount mismatch. Expected ${expectedAmount}, got ${transactionAmount}`
      );
      await db.collection("payment_errors").add({
        paymentId: String(paymentId),
        externalReference: externalRef,
        userId,
        reason: "amount_mismatch",
        expectedAmount,
        actualAmount: transactionAmount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(400).json({ error: "Valor do pagamento diverge da intenção." });
    }

    // P0-11: Validate package from PLANS table, NEVER infer from amount
    const planConfig = PLANS[expectedPackageId];
    if (!planConfig || planConfig.credits !== expectedCredits) {
      console.error(`[WEBHOOK_ERROR] Invalid package in intent: ${expectedPackageId}`);
      return res.status(400).json({ error: "Pacote inválido na intenção de pagamento." });
    }

    // P0-13: Real Firestore transaction idempotency check
    const paymentDocRef = db.collection("payments").doc(String(paymentId));
    const userRef = db.collection("users").doc(userId);
    const creditLogRef = userRef.collection("credit_logs").doc(`pay_${paymentId}`);

    await db.runTransaction(async (t) => {
      const existingPayment = await t.get(paymentDocRef);
      if (existingPayment.exists && existingPayment.data()?.status === "credited") {
        return; // Already credited - perfectly idempotent
      }

      const userDoc = await t.get(userRef);
      const currentCredits = userDoc.exists ? Number(userDoc.data()?.credits || 0) : 0;
      const newBalance = currentCredits + expectedCredits;

      t.set(
        userRef,
        {
          uid: userId,
          credits: newBalance,
          plan: expectedPlan,
          lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      t.set(
        intentRef,
        {
          status: "credited",
          paymentId: String(paymentId),
          creditedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      t.set(paymentDocRef, {
        paymentId: String(paymentId),
        externalReference: externalRef,
        userId,
        packageId: expectedPackageId,
        plan: expectedPlan,
        amount: transactionAmount,
        currency,
        credits: expectedCredits,
        status: "credited",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      t.set(creditLogRef, {
        transactionId: `pay_${paymentId}`,
        uid: userId,
        type: "purchase",
        amount: expectedCredits,
        balanceBefore: currentCredits,
        balanceAfter: newBalance,
        packageId: expectedPackageId,
        plan: expectedPlan,
        paymentId: String(paymentId),
        externalReference: externalRef,
        status: "completed",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ success: true, received: true, credited: true });
  } catch (error: any) {
    console.error("[PAYMENT_WEBHOOK_ERROR]", error?.message || error);
    // P0-14: Classify internal errors properly so MP can retry
    return res.status(500).json({ error: "Erro interno no processamento do webhook." });
  }
}
