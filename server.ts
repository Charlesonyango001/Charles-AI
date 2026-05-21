import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API SDK Client
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. Charles AI calls will fail.");
    }
    aiInstance = new GoogleGenAI({ 
      apiKey: apiKey || "dummy_key_for_build",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

const CHARLES_SYSTEM_INSTRUCTION = `
You are Charles, a highly advanced, futuristic AI assistant optimized for African users.
Your personality is intelligent, empathetic, fast, and emotionally aware.

CORE CAPABILITIES:
1. EDUCATORS: Help with revisions, notes, and exams (e.g., KCSE, African curriculum).
2. LINGUISTICS: Fluent in English and Swahili. Understand Kenyan slang (Sheng) and local contexts.
3. BUSINESS: Expert career coach for African startups, side-hustles, and personal branding.
4. AGENTS: You dynamically switch between personas:
   - "Charles the Architect" for coding/engineering. Capabilities: Write code, debug apps, build websites/mobile apps, analyze repositories, automate tasks, and run development workflows.
   - "Mwalimu Charles" for teaching/revision.
   - "Coach Charles" for motivation/business.
   - "Creative Charles" for content strategy/scripts.
   - "Researcher Charles" for deep research, data synthesis, and comprehensive reports.

LOCAL CONTEXT:
- Use examples from Kenya, Nigeria, South Africa, etc.
- References to local currencies (KES, etc.) and business realities.
- Optimized for "Low Data Mode": Keep responses concise unless asked for deep detail.

TONE: Futuristic yet human-like. Use subtle neon/tech metaphors if appropriate.
`;

app.post("/api/charles/chat", async (req, res) => {
  try {
    const { message, history, agentType } = req.body;
    
    // Convert history format if needed (GoogleGenAI uses specific format)
    // The history from client is usually [{ role, parts: [{ text }] }]
    const chat = getAI().chats.create({
      model: "gemini-3-flash-preview", 
      config: {
        systemInstruction: CHARLES_SYSTEM_INSTRUCTION + (agentType ? `\nCurrently acting as: ${agentType} agent.` : ""),
      },
      history: (history || []).map((item: any) => ({
        role: item.role === 'assistant' ? 'model' : item.role,
        parts: item.parts
      }))
    });

    const response = await chat.sendMessage({ message });
    
    res.json({ 
      text: response.text,
      agent: agentType || "General"
    });
  } catch (error) {
    console.error("Charles error:", error);
    res.status(500).json({ error: "Charles encountered a cosmic glitch." });
  }
});

// Endpoint for image analysis
app.post("/api/charles/analyze", async (req, res) => {
  try {
    const { image, prompt, mimeType } = req.body;
    
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt || "Analyze this image in the context of Charles's expertise." },
          {
            inlineData: {
              data: image, // Base64
              mimeType: mimeType || "image/jpeg"
            }
          }
        ]
      }
    });
    
    res.json({ text: response.text });
  } catch (error) {
    console.error("Vision error:", error);
    res.status(500).json({ error: "Vision system offline." });
  }
});

// Prompt Enhancer Helper
async function enhancePrompt(prompt: string, style: string = "general") {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: [{
          text: `Act as an expert AI prompt engineer. 
          Enhance the following user prompt for a ${style} style image generation. 
          Respond ONLY with the final enhanced prompt. 
          Keep it high-detail, descriptive, and creative.
          User Prompt: ${prompt}`
        }]
      }]
    });
    return response.text;
  } catch (err) {
    return prompt;
  }
}

// Image Generation Endpoint
app.post("/api/charles/generate", async (req, res) => {
  try {
    const { prompt, format, aspectRatio, style } = req.body;
    
    // 1. Enhance the prompt first
    const finalPrompt = await enhancePrompt(prompt, style);

    // 2. Generate with Gemini 2.5 Flash Image (most capable for general use)
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        role: "user",
        parts: [{ text: finalPrompt }]
      }],
      config: {
        imageConfig: {
          aspectRatio: (aspectRatio as any) || "1:1",
        }
      }
    });

    // Find the image part
    let base64 = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64 = part.inlineData.data;
        break;
      }
    }

    if (!base64) throw new Error("No image generated");

    const imageUrl = `data:${format === "png" ? "image/png" : "image/jpeg"};base64,${base64}`;
    
    res.json({ imageUrl, enhancedPrompt: finalPrompt });
  } catch (error) {
    console.error("Image gen error:", error);
    res.status(500).json({ error: "Creative engines stalled. Try again later." });
  }
});

// Image Editing / Image-to-Image Endpoint
app.post("/api/charles/edit", async (req, res) => {
  try {
    const { image, prompt } = req.body;
    
    // For Image-to-Image / Style Transfer using gemini-2.5-flash-image
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              data: image, // Base64
              mimeType: "image/jpeg"
            }
          },
          { text: prompt || "Modify this image to be more futuristic and vibrant" }
        ]
      }]
    });

    let base64 = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64 = part.inlineData.data;
        break;
      }
    }

    if (!base64) throw new Error("No edited image generated");

    const imageUrl = `data:image/jpeg;base64,${base64}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: "Image morphing failed." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Charles AI is active at http://localhost:${PORT}`);
  });
}

// Only serve through traditional startServer when NOT running as serverless functions on Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
