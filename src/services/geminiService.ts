export async function generateSpiritualResponse(
  messages: any[],
  user?: any,
  cost?: number,
  oracleContext?: any
) {
  try {
    const safeMessages = Array.isArray(messages) ? messages : [];

    const lastMessage =
      safeMessages.length > 0
        ? safeMessages[safeMessages.length - 1]
        : "";

    const extractText = (message: any): string => {
      if (typeof message === "string") return message;

      return (
        message?.text ||
        message?.content ||
        message?.parts?.[0]?.text ||
        ""
      );
    };

    const messageText = extractText(lastMessage).trim();

    if (!messageText) {
      throw new Error("Mensagem inválida.");
    }

    const history = safeMessages
      .slice(0, -1)
      .slice(-8)
      .map((item: any) => ({
        role: item?.role === "model" ? "model" : "user",
        text: extractText(item).trim(),
      }))
      .filter((item: any) => item.text);

    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: messageText,
        history,
        user,
        cost,
        oracleContext,
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
      error?.message || "Erro na conexão com o oráculo espiritual."
    );
  }
}
