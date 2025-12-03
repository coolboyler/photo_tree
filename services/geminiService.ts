import { GoogleGenAI } from "@google/genai";

export const generateChristmasWish = async (): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "请配置 API_KEY 以获取 AI 祝福 (Please configure API_KEY).";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using flash model for speed
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "请用中文写一段非常温馨、传统且充满快乐氛围的圣诞祝福，适合放在一颗挂满回忆照片的圣诞树网页上。语气要像老朋友一样亲切。不要超过40个字。",
    });

    return response.text || "愿这棵树上的每一个瞬间，都化作你心中最温暖的光。圣诞快乐！";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "系统繁忙，但祝福依然送达：圣诞快乐！";
  }
};