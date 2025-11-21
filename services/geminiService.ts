import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenParams } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for the generative parameters
const paramsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    baseColor: { type: Type.STRING, description: "Hex color code for the darkest/base tone (e.g., #001220)" },
    secondaryColor: { type: Type.STRING, description: "Hex color code for the mid-tone (e.g., #005588)" },
    accentColor: { type: Type.STRING, description: "Hex color code for the brightest highlights (e.g., #88ccff)" },
    scale: { type: Type.NUMBER, description: "Zoom scale of noise (0.0001 to 0.01). Lower is more zoomed in/smooth (macro), Higher is more detailed/noisy." },
    distortion: { type: Type.NUMBER, description: "How much the domain warps (1.0 to 10.0). Higher is more liquid/swirly." },
    detail: { type: Type.INTEGER, description: "Complexity/Roughness (1 to 8). 1 is smooth blobs, 8 is gritty/detailed." },
    phase: { type: Type.NUMBER, description: "Ripples/Banding effect (0 to 20). 0 is smooth clouds, 5+ creates distinct agate-like bands." },
    contrast: { type: Type.NUMBER, description: "Contrast multiplier (0.8 to 2.0)" },
    brightness: { type: Type.NUMBER, description: "Brightness offset (-0.2 to 0.2)" }
  },
  required: ["baseColor", "secondaryColor", "accentColor", "scale", "distortion", "detail", "phase", "contrast", "brightness"]
};

export const generateParamsFromPrompt = async (userPrompt: string): Promise<GenParams | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this request and generate visualization parameters for a fluid/noise generative art algorithm: "${userPrompt}". The output represents a color palette and mathematical inputs for domain warping simplex noise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: paramsSchema,
        systemInstruction: "You are an expert generative artist and colorist. You translate abstract moods and descriptions into precise mathematical parameters for a domain-warping noise shader. Scale should usually be between 0.001 and 0.008, but go as low as 0.0002 for 'macro' or 'minimalist' requests. Distortion usually between 2.0 and 8.0. Use 'phase' > 5 to create banded, strata-like, or agate effects. Use 'detail' > 5 for rougher, rock-like textures. Colors should form a cohesive, high-end palette."
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    
    // Add a random seed since the AI doesn't need to decide that
    return {
      ...data,
      seed: Math.random() * 10000
    };

  } catch (error) {
    console.error("Failed to generate parameters:", error);
    return null;
  }
};