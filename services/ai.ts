import { GoogleGenAI } from "@google/genai";

const getSystemInstruction = () => `
You are an expert robotics professor. 
Explain the concepts of RRT (Rapidly-exploring Random Trees) and RRT* simply and clearly.
Focus on the trade-off between speed (RRT) and optimality (RRT*).
Keep explanations concise (under 150 words) and suitable for a web demo sidebar.
Use Markdown for formatting.
`;

export const getExplanation = async (topic: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not found. Please configure the environment variable.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain this topic in the context of path planning: ${topic}`,
      config: {
        systemInstruction: getSystemInstruction(),
        temperature: 0.7,
      },
    });
    
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to retrieve explanation. Please try again later.";
  }
};
