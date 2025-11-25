import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeminiVehicleResult {
  plate: string;
  province: string;
  make?: string;
  color?: string;
}

export async function identifyLicensePlate(base64Image: string): Promise<GeminiVehicleResult | null> {
  try {
    const model = 'gemini-2.5-flash';
    // Optimized prompt for Thai License Plates and vehicle details
    const prompt = `
      Analyze this image of a vehicle. 
      Identify the Thai license plate number, the province name, the vehicle make (brand), and the color.
      
      Rules:
      1. Return ONLY valid JSON. No markdown code blocks.
      2. JSON keys: "plate" (string), "province" (string), "make" (string, optional), "color" (string, optional).
      3. For "plate": Remove all spaces. Keep Thai characters and numbers. (e.g., "1กข1234").
      4. For "province": Return the full Thai province name if visible (e.g., "กรุงเทพมหานคร"). If not visible, use "ไม่ระบุ".
      5. For "make": Detect the brand (e.g., Toyota, Honda, Isuzu).
      6. For "color": Detect the main color of the vehicle (in Thai, e.g., ขาว, ดำ, เทา, บรอนซ์เงิน).
      7. If the image is too blurry or no plate is found, return null.
      
      Example Output:
      { "plate": "3กอ1234", "province": "เชียงใหม่", "make": "Honda", "color": "ขาว" }
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
           province: data.province || "ไม่ระบุ",
           make: data.make,
           color: data.color
        };
      }
    } catch (e) {
      console.error("Failed to parse Gemini JSON output", e);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}