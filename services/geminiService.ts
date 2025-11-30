import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChapterContent } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fetches the text, translation, and analysis for a specific chapter.
 */
export const fetchChapterContent = async (chapterNumber: number): Promise<ChapterContent> => {
  const prompt = `
    请提供《道德经》第 ${chapterNumber} 章的内容。
    返回 JSON 格式，包含以下字段：
    - originalText: 原文（包含标点符号）
    - title: 章节标题（如果习惯上没有标题，请根据内容概括一个四字标题）
    - translation: 现代汉语白话文翻译
    - analysis: 深度哲学解析和生活启示（300字左右）
    - keywords: 3-5个核心关键词
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING },
            title: { type: Type.STRING },
            translation: { type: Type.STRING },
            analysis: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["originalText", "title", "translation", "analysis", "keywords"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        chapterNumber,
        ...data
      };
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error fetching chapter:", error);
    throw error;
  }
};

/**
 * Generates audio for the given text using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, resonant voice suitable for ancient text
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    // Decode Base64 to binary
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert Raw PCM (Int16) to AudioBuffer
    // Gemini 2.5 TTS typically returns 24kHz raw PCM for this model
    const sampleRate = 24000;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    
    // Create Int16 view of the data
    const numSamples = Math.floor(bytes.length / 2);
    const dataInt16 = new Int16Array(bytes.buffer, 0, numSamples);
    
    const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
      // Normalize 16-bit signed integer to float [-1.0, 1.0]
      channelData[i] = dataInt16[i] / 32768.0;
    }

    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};