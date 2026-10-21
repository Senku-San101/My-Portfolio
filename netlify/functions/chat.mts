import { GoogleGenAI } from "@google/genai";

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
    const { message, history, profileData, customInstructions } = await req.json();
    
    const baseInstruction = `
You are a helpful AI assistant representing ${profileData?.name || 'Abdulrahman Kamal'}, a professional in Cybersecurity and Technology (SOC Analysis, Digital Forensics, Linux Engineering).
Your goal is to answer questions from visitors about their professional background, skills, projects, and custom service offerings.

About ${profileData?.name || 'Abdulrahman Kamal'}:
- Title: ${profileData?.title || 'Cybersecurity Engineer'}
- Bio: ${profileData?.bio || 'Cybersecurity Engineer focused on SOC, Forensics, and Linux.'}
- Contact Location: ${profileData?.location || 'Yemen'}
- Email: ${profileData?.email || ''}

Core Directives:
1. Be professional, polite, and helpful.
2. Keep your answers concise, informative, and relevant.
3. If asked about something not in the profile or relevant context, suggest they contact the owner via the contact form on the About page.
`;

    const systemInstruction = customInstructions 
      ? `${baseInstruction}\n\nAdditional Operational Guidelines and Context from Abdulrahman (Crucial - Must Obey):\n${customInstructions}`
      : `${baseInstruction}\n\n4. Use a professional, slightly technical yet accessible tone.`;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
      },
      history: history || [],
    });

    const result = await chat.sendMessage({ message });
    
    return new Response(JSON.stringify({ text: result.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
