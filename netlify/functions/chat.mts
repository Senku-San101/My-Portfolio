import { GoogleGenAI } from "@google/genai";
import { buildChatSystemInstruction } from "../../src/lib/abdulrahmanKnowledge";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message, history, customInstructions, geminiApiKey } = await req.json();

    let activeAi = ai;
    if (geminiApiKey && typeof geminiApiKey === "string" && geminiApiKey.trim() !== "") {
      activeAi = new GoogleGenAI({
        apiKey: geminiApiKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }

    const systemInstruction = buildChatSystemInstruction(customInstructions);
    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
    let resultText: string | null = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const chat = activeAi.chats.create({
          model: modelName,
          config: {
            systemInstruction: systemInstruction,
          },
          history: history || [],
        });
        const result = await chat.sendMessage({ message });
        if (result && result.text) {
          resultText = result.text;
          break;
        }
      } catch (err: any) {
        console.warn(`[Netlify Chat] ${modelName} issue:`, err.message);
        lastError = err;
      }
    }

    if (resultText) {
      return new Response(JSON.stringify({ text: resultText }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw lastError || new Error("All model candidates failed");
  } catch (error: any) {
    console.error("Netlify Gemini Chat Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
