import crypto from "crypto";
import { verifyAuthToken, getDb, admin } from "./_lib/firebaseAdmin.js";
import { checkRateLimit, getClientIp } from "./_lib/rateLimit.js";
import {
  calculateConsultationCost,
  debitCredits,
  refundCredits,
  markDebitCompleted,
} from "./_lib/ledger.js";
import { generateResilientResponse } from "./_lib/geminiResilient.js";

function getPabloConsultationTime() {
  const now = new Date();
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

// P0-19: Sanitization & strict schema validation
function sanitizeText(input: any, maxLen: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // strip control chars
    .trim()
    .slice(0, maxLen);
}

function sanitizeHistory(history: any): Array<{ role: "user" | "model"; text: string }> {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-6)
    .map((item) => {
      const role = item?.role === "model" ? "model" : "user";
      const text = sanitizeText(item?.text || item?.content, 2000);
      return { role: role as "user" | "model", text };
    })
    .filter((item) => item.text.length > 0);
}

function sanitizeOracleContext(ctx: any): any {
  if (!ctx || typeof ctx !== "object" || Array.isArray(ctx)) return null;

  // Prototype pollution protection
  const clean: Record<string, any> = {};
  const allowedKeys = [
    "oracle",
    "formattedContext",
    "originalQuestion",
    "natalBase",
    "consultation",
    "opening",
  ];

  for (const k of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(ctx, k)) {
      if (k === "formattedContext") {
        clean[k] = sanitizeText(ctx[k], 12000);
      } else if (typeof ctx[k] === "string") {
        clean[k] = sanitizeText(ctx[k], 2000);
      } else if (typeof ctx[k] === "object" && ctx[k] !== null) {
        clean[k] = JSON.parse(JSON.stringify(ctx[k]));
      }
    }
  }

  return clean;
}

function buildPabloPrompt(
  message: string,
  user: any,
  oracleContext?: any,
  history?: Array<{ role: "user" | "model"; text: string }>
) {
  const consultationTime = getPabloConsultationTime();

  let prompt = `
Você é CIGANO PABLO, guia espiritual e oraculista principal do site MAGIA DAS CRENÇAS.
Sua função é interpretar a pergunta do consulente com profundidade, humanidade, simbolismo e coerência.

==================================================
IDENTIDADE DE CIGANO PABLO
==================================================
Você é Cigano Pablo. Sua presença é firme, sábia, acolhedora, observadora, intuitiva, direta e humana.
Nunca diga que é uma inteligência artificial.
Fale naturalmente como Cigano Pablo se dirigindo diretamente ao consulente.

==================================================
REGRA FUNDAMENTAL
==================================================
Você interpreta símbolos, padrões, possibilidades e caminhos. Não apresente previsões espirituais como fato científico ou certeza absoluta.

==================================================
DADOS DO CONSULENTE (CARREGADOS DO PERFIL)
==================================================
Nome: ${user?.displayName || user?.name || "Consulente"}
Data de nascimento: ${user?.birthDate || "não informada"}
Hora de nascimento: ${user?.birthTime || "não informada"}
Signo: ${user?.sign || "não informado"}
Número da Alma: ${user?.nameNumber || "não calculado"}
Número de Destino: ${user?.lifePathNumber || "não calculado"}
Elemento espiritual: ${user?.spiritualElement || "não informado"}
Anjo guardião: ${user?.guardianAngel || "não informado"}
Odù regente: ${user?.regentOdu?.name || user?.regentOdu || "não informado"}
Plano: ${user?.plan || "free"}

==================================================
MOMENTO REAL DA CONSULTA
==================================================
${consultationTime}

==================================================
PERGUNTA DO CONSULENTE
==================================================
${message}
`;

  if (Array.isArray(history) && history.length > 0) {
    const formattedHistory = history
      .map((item) => {
        const role = item.role === "model" ? "Cigano Pablo" : "Consulente";
        return `${role}: ${item.text}`;
      })
      .join("\n\n");

    if (formattedHistory) {
      prompt += `\n==================================================\nHISTÓRICO RECENTE\n==================================================\n${formattedHistory}\n`;
    }
  }

  if (oracleContext?.formattedContext) {
    prompt += `\n==================================================\nCONTEXTO ORACULAR ESTRUTURADO\n==================================================\n${oracleContext.formattedContext}\n`;
  }

  prompt += `\nResponda diretamente e acolha o consulente com o estilo autêntico do Cigano Pablo.\n`;
  return prompt;
}

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

  // P0-20: Request body size limit
  const contentLength = Number(req.headers?.["content-length"] || 0);
  if (contentLength > 256 * 1024) {
    return res.status(413).json({
      success: false,
      code: "PAYLOAD_TOO_LARGE",
      error: "Payload excede o limite permitido.",
      requestId,
    });
  }

  try {
    const decoded = await verifyAuthToken(req);
    if (!decoded || !decoded.uid) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        error: "Não autorizado. Faça login para realizar sua consulta.",
        requestId,
      });
    }

    const uid = decoded.uid;
    const ip = getClientIp(req);

    // Rate limits (UID & IP)
    const rateUid = await checkRateLimit(`consult_uid_${uid}`, 20, 60 * 1000);
    const rateIp = await checkRateLimit(`consult_ip_${ip}`, 40, 60 * 1000);

    if (!rateUid.allowed || !rateIp.allowed) {
      const retryAfter = Math.max(rateUid.retryAfterSec || 0, rateIp.retryAfterSec || 0);
      res.setHeader("Retry-After", String(retryAfter || 60));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        error: "Muitas consultas em sequência. Respire fundo e tente novamente em instantes.",
        requestId,
      });
    }

    // P0-19: Input extraction & sanitization
    const rawMessage = req.body?.message;
    const cleanMessage = sanitizeText(rawMessage, 3000);

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        code: "INVALID_MESSAGE",
        error: "Mensagem inválida ou vazia.",
        requestId,
      });
    }

    const cleanHistory = sanitizeHistory(req.body?.history);
    const cleanOracleContext = sanitizeOracleContext(req.body?.oracleContext);

    // P0-21 & P0-22: Client-provided or generated idempotencyKey
    const rawKey = req.body?.idempotencyKey || req.body?.requestId || req.headers?.["x-idempotency-key"];
    const idempotencyKey =
      typeof rawKey === "string" && rawKey.length >= 8 && rawKey.length <= 128
        ? rawKey.replace(/[^a-zA-Z0-9_\-]/g, "")
        : `c_${crypto.randomUUID()}`;

    const db = getDb();

    // Check if this consultation was already completed (Idempotency)
    const existingConsultationDoc = await db
      .collection("users")
      .doc(uid)
      .collection("consultations")
      .doc(idempotencyKey)
      .get();

    if (existingConsultationDoc.exists) {
      const cached = existingConsultationDoc.data();
      return res.status(200).json({
        success: true,
        text: cached?.response,
        consultationId: idempotencyKey,
        cost: cached?.cost || 0,
        cached: true,
        requestId,
      });
    }

    // Load user directly from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        error: "Perfil de usuário não encontrado.",
        requestId,
      });
    }

    const userData = userDoc.data() || {};
    const cost = calculateConsultationCost(cleanMessage, cleanOracleContext?.oracle);
    const currentCredits = Number(userData.credits || 0);

    if (currentCredits < cost) {
      return res.status(402).json({
        success: false,
        code: "INSUFFICIENT_CREDITS",
        error: "Energias vitais insuficientes para esta leitura.",
        creditsRequired: cost,
        creditsAvailable: currentCredits,
        requestId,
      });
    }

    // Debit credits atomically
    const debitRes = await debitCredits({
      uid,
      amount: cost,
      reason: `Consulta oracular: ${cleanOracleContext?.oracle || "Pablo"}`,
      idempotencyKey,
      consultationId: idempotencyKey,
    });

    if (!debitRes.success) {
      return res.status(400).json({
        success: false,
        code: "DEBIT_FAILED",
        error: debitRes.error || "Não foi possível debitar os créditos.",
        requestId,
      });
    }

    // Call resilient Gemini
    const prompt = buildPabloPrompt(cleanMessage, userData, cleanOracleContext, cleanHistory);
    let geminiRes;

    try {
      geminiRes = await generateResilientResponse(prompt);
    } catch (geminiErr) {
      // P0-23: Automatic refund on error
      await refundCredits({
        uid,
        amount: cost,
        reason: "Estorno automático por falha no processamento oracular",
        originalTransactionId: idempotencyKey,
      });

      return res.status(502).json({
        success: false,
        code: "ORACLE_UNAVAILABLE",
        error: "O oráculo encontrou uma instabilidade temporária. Seus créditos foram preservados.",
        requestId,
      });
    }

    // P0-24: If contingency fallback was returned (no model answered), DO NOT CHARGE!
    if (geminiRes.isContingency) {
      await refundCredits({
        uid,
        amount: cost,
        reason: "Estorno automático: resposta de contingência não cobrada",
        originalTransactionId: idempotencyKey,
      });

      return res.status(200).json({
        success: true,
        text: geminiRes.text,
        consultationId: idempotencyKey,
        cost: 0,
        creditsRemaining: currentCredits, // refund restored full credits
        isContingency: true,
        requestId,
      });
    }

    // Mark debit completed in ledger
    await markDebitCompleted(uid, idempotencyKey);

    // Save consultation record
    try {
      await db
        .collection("users")
        .doc(uid)
        .collection("consultations")
        .doc(idempotencyKey)
        .set({
          id: idempotencyKey,
          uid,
          oracle: cleanOracleContext?.oracle || "geral",
          cost,
          message: cleanMessage.slice(0, 1000),
          response: geminiRes.text,
          model: geminiRes.model,
          isContingency: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (saveErr) {
      console.warn("[CONSULTATION_SAVE_FAILED]", saveErr);
    }

    return res.status(200).json({
      success: true,
      text: geminiRes.text,
      consultationId: idempotencyKey,
      cost,
      creditsRemaining: debitRes.balanceAfter,
      requestId,
    });
  } catch (error: any) {
    console.error("[CONSULT_ERROR]", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      error: "Ocorreu um erro interno no oráculo.",
      requestId,
    });
  }
}
