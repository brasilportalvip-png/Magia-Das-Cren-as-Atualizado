import { PABLO_SYSTEM_INSTRUCTION } from "../lib/gemini";

export async function generateSpiritualResponse(
  messages: any[],
  systemInstruction: string,
  user?: any,
  cost?: number
) {
  try {
    const lastMessage =
      Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1]
        : "";

    const messageText =
      typeof lastMessage === "string"
        ? lastMessage
        : lastMessage?.text ||
          lastMessage?.content ||
          lastMessage?.parts?.[0]?.text ||
          "";

    if (!messageText || typeof messageText !== "string") {
      throw new Error("Mensagem inválida.");
    }

    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: messageText,
        systemInstruction: systemInstruction || PABLO_SYSTEM_INSTRUCTION,
        user,
        cost,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Erro ao consultar Cigano Pablo.");
    }

    if (!data.text) {
      throw new Error("O oráculo permaneceu em silêncio. Tente novamente.");
    }

    return data.text;
  } catch (error: any) {
    console.error("Gemini Backend Error:", error);

    throw new Error(
      error.message || "Erro na conexão com o oráculo espiritual."
    );
  }
}