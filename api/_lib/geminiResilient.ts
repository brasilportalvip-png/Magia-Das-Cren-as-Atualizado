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
    return ["gemini-2.5-flash", "gemini-2.5-pro"];
  }

  return [...new Set(models)];
}

const TOTAL_BUDGET_MS = 50_000;
const INDIVIDUAL_TIMEOUT_MS = 30_000;

function isRetryable(error: any): boolean {
  const status = Number(error?.status ?? error?.response?.status ?? error?.code ?? 0);
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;

  const msg = String(error?.message || "").toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("rate limit") ||
    msg.includes("resource exhausted") ||
    msg.includes("unavailable")
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

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const model = models[mIdx];
    const maxAttempts = 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const elapsed = Date.now() - startTime;
      if (elapsed > TOTAL_BUDGET_MS - 3000) {
        break; // Out of overall request budget
      }

      const timeoutMs = Math.min(INDIVIDUAL_TIMEOUT_MS, TOTAL_BUDGET_MS - elapsed);
      let timeoutId: any;

      try {
        const ai = getGeminiClient();

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout limite excedido")), timeoutMs);
        });

        const reqPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              "Você é Cigano Pablo, guia espiritual e oraculista principal do Magia das Crenças. Siga integralmente as instruções e o contexto presentes em contents.",
            maxOutputTokens: 2000,
          },
        });

        const response = await Promise.race([reqPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        const text = response.text?.trim();
        if (text) {
          return { text, model };
        }
        throw new Error("Resposta vazia da IA.");
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        if (!isRetryable(err) || attempt >= maxAttempts - 1) {
          break; // Move to next model
        }

        // Exponential backoff with jitter
        const jitter = Math.random() * 300;
        const delay = Math.min(2500, Math.pow(2, attempt) * 600 + jitter);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  console.error("[GEMINI_RESILIENT_EXHAUSTED] Error:", lastError?.message || lastError);

  // Friendly spiritual contingency fallback
  return {
    text: "Eu, cigano Pablo vou ajudar a decifrar o enigma de sua vida. Atente-se a essa leitura.\n\nNeste momento, os ventos e as energias da estrada estão se assentando e as correntes espirituais pedem alguns instantes de serenidade. Respire fundo, firme seus pensamentos naquilo que seu coração busca saber e consulte novamente em breve. Os sinais permanecem vivos e o destino se revelará no momento certo.",
    model: "contingency_fallback",
    isContingency: true,
  };
}
