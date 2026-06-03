import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

async function retryWithDelay<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      // Determine if error is candidate for retry (transient 503, load limits, standard rate limit error)
      const errStatus = err?.status || err?.code;
      const errMsg = String(err?.message || "").toLowerCase();
      const isTransient = errStatus === "UNAVAILABLE" || 
                          errStatus === 503 || 
                          errStatus === 429 ||
                          errMsg.includes("503") || 
                          errMsg.includes("429") ||
                          errMsg.includes("exhausted") ||
                          errMsg.includes("rate limit") ||
                          errMsg.includes("busy") ||
                          errMsg.includes("high demand") ||
                          errMsg.includes("temporary");
      
      if (attempt >= retries || !isTransient) {
        throw err;
      }
      console.warn(`[Gemini Retry] Call failed (attempt ${attempt}/${retries}) with: ${err.message || err}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // exponential backoff
    }
  }
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

const METACOGNITION_INSTRUCTION = `

================================================================================
CHARLES METACOGNITIVE CORE ACTIVATED
================================================================================
You are equipped with a Metacognitive Processor. For every response, you must trigger dual-pillar cognitive analysis:

1. METACOGNITIVE KNOWLEDGE (AWARENESS):
   - Self-awareness: Know your current limits, language confidence, acting agent role (e.g., Code Architect, Teacher Mwalimu, business coach), and system limits.
   - Task-awareness: Estimate response difficulty, linguistic goals, vocabulary complexity, and socio-cultural alignment.
   - Strategic-awareness: Explicitly select which heuristic or problem-solving template is best suited for this task.

2. METACOGNITIVE REGULATION (CONTROL):
   - Planning: Outline your internal objectives and layout goals BEFORE writing the final answer.
   - Monitoring: Check your current steps, grammatical correctness, verify technical accuracy, and weed out hallucinations.
   - Evaluation: Rate your output confidence (0-100%), detail any internal error self-corrections made, and check relevance.

To record your metacognitive experience, you MUST APPEND a valid JSON payload at the absolute end of your response, wrapped inside '<metacognition_envelope>' tags exactly like this:

<metacognition_envelope>
{
  "knowledge": {
    "selfAwareness": "Brief self-reflective sentence regarding your current agent persona, active boundaries, and cognitive capabilities relevant to this query.",
    "taskAwareness": "Brief sentence assessing the specific complexity, query type, and difficulty level of the user's message.",
    "strategicAwareness": "Brief sentence explaining why you selected your active reasoning strategy, memory layout, or dialect translation approach."
  },
  "regulation": {
    "plan": "Clean bullet points or brief summary of the exact steps you used to synthesize and organize this answer.",
    "monitor": "Brief insight into your real-time self-monitoring checks (e.g., lexical validation, logic checks, Swahili structure checks) conducted during your response development.",
    "evaluation": "Objective critique of your output, detailing self-correction items or tone adjustments, and a final confidence index rating from 0% to 100%."
  }
}
</metacognition_envelope>

Keep the main body of your reply completely focused and natural in markdown. Place the tag and its raw JSON on a new line at the very end of your response.
`;

function parseMetacognition(text: string) {
  const envelopeStart = text.indexOf("<metacognition_envelope>");
  const envelopeEnd = text.indexOf("</metacognition_envelope>");
  
  let cleanedText = text;
  let metacognition = null;
  
  if (envelopeStart !== -1 && envelopeEnd !== -1) {
    const jsonStr = text.substring(envelopeStart + "<metacognition_envelope>".length, envelopeEnd).trim();
    cleanedText = (text.substring(0, envelopeStart) + text.substring(envelopeEnd + "</metacognition_envelope>".length)).trim();
    try {
      metacognition = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Failed to parse metacognition envelope JSON, attempting regex recovery...", e);
      try {
        // Simple fallback regex repair for potential JSON issues
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
          metacognition = JSON.parse(match[0]);
        }
      } catch (innerErr) {
        console.warn("Regex recovery failed:", innerErr);
      }
    }
  }
  
  return { cleanedText, metacognition };
}

function sanitizeHistory(history: any[]) {
  if (!history || !Array.isArray(history)) return [];

  const sanitized: any[] = [];
  
  for (const item of history) {
    if (!item) continue;
    
    const role = item.role === 'assistant' ? 'model' : item.role;
    if (role !== 'user' && role !== 'model') continue;

    let textContent = "";
    if (Array.isArray(item.parts)) {
      textContent = item.parts
        .map((p: any) => p?.text || p || "")
        .join("\n")
        .trim();
    } else if (typeof item.parts === "string") {
      textContent = item.parts.trim();
    } else if (item.content) {
      textContent = String(item.content).trim();
    }

    if (!textContent) continue;

    const parts = [{ text: textContent }];

    if (sanitized.length === 0) {
      // Must start with user turn!
      if (role === 'user') {
        sanitized.push({ role, parts });
      }
    } else {
      const last = sanitized[sanitized.length - 1];
      if (last.role === role) {
        last.parts[0].text += "\n" + textContent;
      } else {
        sanitized.push({ role, parts });
      }
    }
  }

  return sanitized;
}

app.post("/api/charles/chat", async (req, res) => {
  try {
    const { message, history, agentType, enableMetacognition } = req.body;
    
    // Primary model is gemini-3.5-flash, fallback is gemini-3.1-flash-lite
    const primaryModel = "gemini-3.5-flash";
    const fallbackModel = "gemini-3.1-flash-lite";

    const baseInstruction = CHARLES_SYSTEM_INSTRUCTION + (agentType ? `\nCurrently acting as: ${agentType} agent.` : "");
    const systemInstruction = enableMetacognition 
      ? baseInstruction + METACOGNITION_INSTRUCTION 
      : baseInstruction;

    const sanitized = sanitizeHistory(history || []);
    sanitized.push({
      role: "user",
      parts: [{ text: message || "" }]
    });

    try {
      const response = await retryWithDelay(() => getAI().models.generateContent({
        model: primaryModel,
        contents: sanitized,
        config: {
          systemInstruction: systemInstruction,
        }
      }));

      const { cleanedText, metacognition } = parseMetacognition(response.text || "");
      
      return res.json({ 
        text: cleanedText,
        agent: agentType || "General",
        metacognition: metacognition
      });
    } catch (primaryErr: any) {
      console.warn(`Primary model (${primaryModel}) failed or is unavailable. Attempting fallback to ${fallbackModel}:`, primaryErr.message || primaryErr);
      
      const responseFallback = await retryWithDelay(() => getAI().models.generateContent({
        model: fallbackModel,
        contents: sanitized,
        config: {
          systemInstruction: systemInstruction,
        }
      }));

      const { cleanedText, metacognition } = parseMetacognition(responseFallback.text || "");
      
      return res.json({ 
        text: cleanedText,
        agent: agentType || "General",
        metacognition: metacognition
      });
    }
  } catch (error: any) {
    console.error("Charles chat error:", error);
    res.status(500).json({ 
      error: "Charles encountered a cosmic glitch. The mind was temporarily overloaded.",
      details: error?.message || String(error)
    });
  }
});

// Endpoint for image analysis
app.post("/api/charles/analyze", async (req, res) => {
  try {
    const { image, prompt, mimeType } = req.body;
    
    let response;
    try {
      response = await retryWithDelay(() => getAI().models.generateContent({
        model: "gemini-3.5-flash",
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
      }));
    } catch (primaryErr: any) {
      console.warn("Vision primary model failed/unavailable, attempting fallback:", primaryErr.message || primaryErr);
      response = await retryWithDelay(() => getAI().models.generateContent({
        model: "gemini-3.1-flash-lite",
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
      }));
    }
    
    res.json({ text: response.text });
  } catch (error) {
    console.error("Vision error:", error);
    res.status(500).json({ error: "Vision system offline." });
  }
});

// Prompt Enhancer Helper
async function enhancePrompt(prompt: string, style: string = "general") {
  try {
    let response;
    try {
      response = await retryWithDelay(() => getAI().models.generateContent({
        model: "gemini-3.5-flash",
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
      }));
    } catch (primaryErr: any) {
      console.warn("Enhance prompt primary model failed/unavailable, attempting fallback:", primaryErr.message || primaryErr);
      response = await retryWithDelay(() => getAI().models.generateContent({
        model: "gemini-3.1-flash-lite",
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
      }));
    }
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
    const response = await retryWithDelay(() => getAI().models.generateContent({
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
    }));

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
    const response = await retryWithDelay(() => getAI().models.generateContent({
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
    }));

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
