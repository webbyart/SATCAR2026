import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function identifyLicensePlate(base64Image: string): Promise<{ plate: string; province: string } | null> {
  try {
    const model = 'gemini-2.5-flash';
    // Optimized prompt for Thai License Plates
    const prompt = `
      Analyze this image of a vehicle. 
      Identify the Thai license plate number and the province name.
      
      Rules:
      1. Return ONLY valid JSON. No markdown code blocks.
      2. JSON keys: "plate" (string), "province" (string).
      3. For "plate": Remove all spaces. Keep Thai characters and numbers. (e.g., "1กข1234").
      4. For "province": Return the full Thai province name if visible (e.g., "กรุงเทพมหานคร"). If not visible, use "ไม่ระบุ".
      5. If the image is too blurry or no plate is found, return null.
      
      Example Output:
      { "plate": "3กอ1234", "province": "เชียงใหม่" }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;

    try {
      const data = JSON.parse(text);
      if (data && data.plate) {
        return {
           plate: data.plate,
           province: data.province || "ไม่ระบุ"
        };
      }
    } catch (e) {
      console.error("Failed to parse Gemini JSON output", e);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // In a real app, you might want to throw specific errors for UI feedback
    return null;
  }
}