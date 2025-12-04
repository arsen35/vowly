import { GoogleGenAI, Type } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// Assume this variable is pre-configured, valid, and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWeddingCaption = async (base64Image: string): Promise<{ caption: string; hashtags: string[] }> => {
  try {
    const model = "gemini-2.5-flash";
    
    const prompt = `
      Bu bir gelinlik ve düğün fotoğrafı. 
      Bu fotoğraf için sosyal medyada paylaşılacak çok romantik, duygusal ve zarif bir Türkçe açıklama (caption) yaz.
      Ayrıca bu fotoğrafın stiline uygun 5 adet Türkçe hashtag öner.
      
      Yanıtı JSON formatında ver:
      {
        "caption": "...",
        "hashtags": ["#...", "#..."]
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            hashtags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    
    throw new Error("AI yanıtı boş döndü.");

  } catch (error) {
    console.error("Gemini Caption Error:", error);
    // Hata durumunda varsayılan bir değer dön
    return {
      caption: "En mutlu günümüzden bir kare... ✨",
      hashtags: ["#düğün", "#gelinlik", "#aşk"]
    };
  }
};