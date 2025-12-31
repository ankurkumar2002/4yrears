
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Initialize GoogleGenAI strictly using process.env.API_KEY without fallbacks as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateThoughtfulQuote = async (context: string): Promise<string> => {
  if (!process.env.API_KEY) return "The heart knows what it knows, in ways words cannot always reach.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a mature, warm, and thoughtful romantic quote based on this context: ${context}. Keep it brief, poetic, and avoid cheesy cliches.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    // Fix: Correctly access the .text property from the GenerateContentResponse
    return response.text || "A silent promise kept over four beautiful years.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Love is the bridge between two souls.";
  }
};
