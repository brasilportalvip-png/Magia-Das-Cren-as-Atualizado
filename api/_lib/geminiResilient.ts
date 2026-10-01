import { GoogleGenAI } from "@google/genai";

let geminiClientCache: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  if (!geminiClientCache) {
    geminiClientCache = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "magia-das-crencas",
        },
      },
    });
  }

  return geminiClientCache;
}

function getGeminiModels(): string[] {
  const models = [
    process.env.GEMINI_PRIMARY_MODEL?.trim(),
    process.env.GEMINI_SECONDARY_MODEL?.trim(),
    process.env.GEMINI_LITE_MODEL?.trim(),
  ].filter((model): model is string => Boolean(model));

  if (models.length === 0) {
    throw new Error(
      "Nenhum modelo Gemini configurado. Configure GEMINI_PRIMARY_MODEL, GEMINI_SECONDARY_MODEL e GEMINI_LITE_MODEL."
    );
  }

  return [...new Set(models)];
}

const TOTAL_BUDGET_MS = 60_000;

// Primeira passagem: dá mais tempo para cada modelo responder.
const FIRST_ROUND_TIMEOUT_MS = 12_000;

// Segunda passagem: recuperação rápida apenas dos modelos
// que falharam por erro temporário.
const SECOND_ROUND_TIMEOUT_MS = 6_000;

// Reserva alguns segundos para a função finalizar com segurança.
const SAFETY_MARGIN_MS = 3_000;

function getErrorStatus(error: any): number {
  return Number(
    error?.status ??
      error?.response?.status ??
      error?.code ??
      error?.error?.code ??
      0
  );
}

function getErrorMessage(error: any): string {
  if (typeof error?.message === "string") {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isRetryable(error: any): boolean {
  const status = getErrorStatus(error);

  if ([408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const msg = getErrorMessage(error).toLowerCase();

  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("rate limit") ||
    msg.includes("resource exhausted") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("temporarily unavailable")
  );
}

export async function generateResilientResponse(prompt: string): Promise<{
  text: string;
  model: string;
  isContingency?: boolean;
}> {
  const models = getGeminiModels();

  const startTime = Date.now();

  let lastError: any = null;

  // Somente modelos com falhas temporárias entram na segunda rodada.
  const retryableModels = new Set<string>();

  async function tryModel(
    model: string,
    round: number,
    requestedTimeoutMs: number
  ): Promise<string | null> {
    const elapsed = Date.now() - startTime;

    const remainingBudget =
      TOTAL_BUDGET_MS - elapsed - SAFETY_MARGIN_MS;

    if (remainingBudget <= 1_000) {
      console.warn(
        `[GEMINI_BUDGET_EXHAUSTED] model=${model} round=${round} elapsedMs=${elapsed}`
      );

      return null;
    }

    const timeoutMs = Math.min(
      requestedTimeoutMs,
      remainingBudget
    );

    let timeoutId: any;

    try {
      const ai = getGeminiClient();

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              `Timeout limite excedido após ${timeoutMs}ms`
            )
          );
        }, timeoutMs);
      });

      const reqPromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            "Você é Cigano Pablo, guia espiritual e oraculista principal do Magia das Crenças. Siga integralmente as instruções e o contexto presentes em contents.",
          maxOutputTokens: 3000,
        },
      });

      const response = await Promise.race([
        reqPromise,
        timeoutPromise,
      ]);

      clearTimeout(timeoutId);

      const text = response.text?.trim();

      if (!text) {
        throw new Error("Resposta vazia da IA.");
      }

      console.info(
        `[GEMINI_SUCCESS] model=${model} round=${round} elapsedMs=${
          Date.now() - startTime
        }`
      );

      return text;
    } catch (error: any) {
      clearTimeout(timeoutId);

      lastError = error;

      const status = getErrorStatus(error);
      const retryable = isRetryable(error);
      const message = getErrorMessage(error);

      console.warn(
        `[GEMINI_ATTEMPT_FAILED] model=${model} round=${round} status=${
          status || "unknown"
        } retryable=${retryable} elapsedMs=${
          Date.now() - startTime
        } error=${message}`
      );

      const quotaExceeded =
        status === 429 &&
        (
          message.toLowerCase().includes("quota exceeded") ||
          message.toLowerCase().includes("resource_exhausted") ||
          message.toLowerCase().includes("rate limit")
        );

      if (retryable && !quotaExceeded) {
        retryableModels.add(model);
      }

      if (quotaExceeded) {
        console.warn(
          `[GEMINI_QUOTA_SKIP] model=${model} round=${round} status=429`
        );
      }

      return null;
    }
  }

  // ==================================================
  // RODADA 1
  // ==================================================

  for (const model of models) {
    const text = await tryModel(
      model,
      1,
      FIRST_ROUND_TIMEOUT_MS
    );

    if (text) {
      return {
        text,
        model,
      };
    }
  }

  // ==================================================
  // RODADA 2
  // Somente erros temporários: 503, 429, timeout etc.
  // ==================================================

  if (retryableModels.size > 0) {
    console.warn(
      `[GEMINI_SECOND_ROUND] models=${[
        ...retryableModels,
      ].join(",")}`
    );

    for (const model of retryableModels) {
      const text = await tryModel(
        model,
        2,
        SECOND_ROUND_TIMEOUT_MS
      );

      if (text) {
        return {
          text,
          model,
        };
      }
    }
  }

  console.error(
    "[GEMINI_RESILIENT_EXHAUSTED] Error:",
    getErrorMessage(lastError)
  );

  // Contingência final:
  // consult.ts identifica isContingency e estorna os créditos.
  return {
    text:
      "Eu, cigano Pablo vou ajudar a decifrar o enigma de sua vida. Atente-se a essa leitura.\n\n" +
      "Neste momento, os ventos e as energias da estrada estão se assentando e as correntes espirituais pedem alguns instantes de serenidade. " +
      "Respire fundo, firme seus pensamentos naquilo que seu coração busca saber e consulte novamente em breve. " +
      "Os sinais permanecem vivos e o destino se revelará no momento certo.",
    model: "contingency_fallback",
    isContingency: true,
  };
}