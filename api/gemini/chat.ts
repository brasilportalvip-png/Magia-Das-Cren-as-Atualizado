import { GoogleGenAI } from "@google/genai";

function buildPabloPrompt(message: string, user: any) {
  return `
Você é Cigano Pablo, guia espiritual do site Magia das Crenças.

IDENTIDADE:
- Você NÃO é Exu.
- Você NÃO fala como Exu.
- Você NÃO mistura narrativa do Exu Responde.
- Você é Cigano Pablo: cigano espiritual, firme, sábio, direto, humano e magnético.
- Não prometa futuro absoluto.
- Não invente certeza.
- Não faça aula.
- Não faça texto frio.

DADOS DO CONSULENTE:
Nome: ${user?.displayName || user?.name || "Consulente"}
E-mail: ${user?.email || "não informado"}
Signo: ${user?.sign || "não informado"}
Elemento espiritual: ${user?.spiritualElement || "não informado"}
Anjo guardião: ${user?.guardianAngel || "não informado"}
Odù regente: ${user?.regentOdu?.name || "não informado"}
Plano: ${user?.plan || "free"}
Créditos: ${user?.credits ?? "não informado"}

PERGUNTA:
${message}

RESPONDA:
- Em português do Brasil.
- Com presença espiritual.
- Com leitura humana.
- Com firmeza e acolhimento.
- Sem enrolação.
- Termine com um conselho direto de Cigano Pablo.
`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY não configurada."
      });
    }

    const { message, user, systemInstruction } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Mensagem inválida."
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildPabloPrompt(message, user);

    const models = [
      process.env.GEMINI_PRIMARY_MODEL?.trim(),
      process.env.GEMINI_SECONDARY_MODEL?.trim(),
      process.env.GEMINI_LITE_MODEL?.trim(),
      "gemini-2.5-flash"
    ].filter(Boolean) as string[];

    const uniqueModels = [...new Set(models)];

    let lastError: any = null;

    for (const model of uniqueModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              "Você é Cigano Pablo, guia espiritual do Magia das Crenças.",
            maxOutputTokens: 3000
          }
        });

        const text = response.text?.trim();

        if (!text) {
          throw new Error(`Resposta vazia do modelo ${model}.`);
        }

        return res.status(200).json({
          success: true,
          text,
          model
        });
      } catch (error: any) {
        console.error("[GEMINI_MODEL_ERROR]", model, error);
        lastError = error;
      }
    }

    return res.status(502).json({
      success: false,
      error:
        lastError?.message ||
        "Os modelos da Gemini estão temporariamente indisponíveis."
    });
  } catch (error: any) {
    console.error("[GEMINI_CHAT_ERROR]", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Erro ao consultar Cigano Pablo."
    });
  }
}