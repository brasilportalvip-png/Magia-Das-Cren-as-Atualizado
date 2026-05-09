import { GoogleGenAI } from "@google/genai";
import { PABLO_SYSTEM_INSTRUCTION } from "../lib/gemini";

// Initialize the API with the key from process.env (or import.meta.env for VITE prefix)
// AI Studio automatically provides GEMINI_API_KEY in the environment.
const getApiKey = () => {
  const env = (import.meta as any).env || {};
  const procEnv = (window as any).process?.env || {};
  
  const rawKey = env.VITE_GEMINI_API_KEY || 
                 env.VITE_GOOGLE_API_KEY || 
                 env.GEMINI_API_KEY || 
                 procEnv.GEMINI_API_KEY || 
                 "";
                 
  const key = rawKey.trim().replace(/^["']|["']$/g, "");
  
  if (!key) {
    console.warn("⚠️ [Gemini] No API key found in frontend environment. Please check Settings.");
  } else {
    const masked = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : "****";
    console.log(`✅ [Gemini] Frontend using key: ${masked}`);
  }
  return key;
};

const ai = new GoogleGenAI({ 
  apiKey: getApiKey()
});

export async function generateSpiritualResponse(messages: any[], systemInstruction: string) {
  try {
    // Current model recommended by skill for text tasks
    const modelName = "gemini-3-flash-preview";
    
    // The skill says ai.models.generateContent is the way to query
    const response = await ai.models.generateContent({
      model: modelName,
      contents: messages,
      config: {
        systemInstruction: systemInstruction || PABLO_SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
      },
    });

    if (!response.text) {
      throw new Error("O oráculo permaneceu em silêncio. Tente novamente.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Frontend Error:", error);
    
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("key not valid")) {
       throw new Error("A chave do oráculo é inválida. Por favor, verifique as configurações nas ferramentas do sistema.");
    }
    
    if (error.message?.includes("quota") || error.message?.includes("429")) {
       throw new Error("O oráculo está exausto. Muitas consultas simultâneas. Tente em alguns instantes.");
    }

    throw new Error(error.message || "Erro na conexão com o oráculo espiritual.");
  }
}
