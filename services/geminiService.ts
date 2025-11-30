import { GoogleGenAI, Modality } from "@google/genai";
import { ChapterContent } from "../types";
import { fullContent } from "../data/fullContent";
import { chapterTitles } from "../data/chapterTitles";

// Initialize Gemini Client
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

/**
 * Fetches the text, translation, and analysis for a specific chapter.
 * NOW USES LOCAL DATA.
 */
export const fetchChapterContent = async (chapterNumber: number): Promise<ChapterContent> => {
  // Simulate a very short network delay for UI smoothness, or return instantly
  // Using local data from fullContent.ts
  const localData = fullContent[chapterNumber];

  if (localData) {
    return Promise.resolve(localData);
  }

  // Fallback for chapters not yet in the fullContent file
  // This ensures the app doesn't crash for chapters 4-81
  const title = chapterTitles[chapterNumber - 1] || `第 ${chapterNumber} 章`;
  return Promise.resolve({
    chapterNumber,
    title,
    originalText: "（该章节内容尚未录入本地数据库）\n\n请在 data/fullContent.ts 文件中补充该章节的原文、译文和解析。",
    translation: "暂无译文",
    analysis: "暂无解析",
    keywords: ["待录入"]
  });
};

/**
 * Generates audio.
 * Strategy: 
 * 1. If API Key exists -> Use Gemini High Quality TTS.
 * 2. If NO API Key -> Use Browser Native SpeechSynthesis (Offline/Free).
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  // --- OPTION 1: Gemini AI TTS (Requires API Key) ---
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' }, 
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data from AI");

      return await decodeBase64Audio(base64Audio);
    } catch (error) {
      console.warn("Gemini TTS failed, falling back to browser TTS:", error);
      // Fall through to browser TTS
    }
  }

  // --- OPTION 2: Browser Native TTS (Fallback) ---
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Browser does not support speech synthesis"));
      return;
    }

    // Browser TTS doesn't give us an AudioBuffer directly easily without complex recording.
    // However, to keep the App component simple (which expects an AudioBuffer), 
    // we have a dilemma. 
    // TRICK: We will throw a specific error that the UI handles by calling a direct `speak` method,
    // OR we change the pattern. 
    // BETTER: We can't easily return an AudioBuffer from `speechSynthesis.speak()`.
    // So we will return a "dummy" silent AudioBuffer and handle the actual speaking here? 
    // No, `AudioContext` is required for the visualizer/control in App.tsx.
    
    // ADJUSTMENT: Since the user wants "Read Aloud" and the current App.tsx logic is 
    // heavily tied to `AudioBufferSourceNode`, mixing both is tricky.
    // BUT, let's try to stick to the Gemini approach first. 
    // If we want to support browser TTS, we usually need to change App.tsx to handle it.
    
    // FOR THIS UPDATE: I will assume the user prefers the Gemini Quality if possible, 
    // but if they really want NO API KEY, we must change App.tsx to support `window.speechSynthesis`.
    // I will throw a specific error code that App.tsx can catch to trigger browser TTS.
    
    reject(new Error("USE_BROWSER_TTS"));
  });
};

// Helper for Gemini Audio Decoding
async function decodeBase64Audio(base64: string): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const sampleRate = 24000;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass({ sampleRate });
  
  const numSamples = Math.floor(bytes.length / 2);
  const dataInt16 = new Int16Array(bytes.buffer, 0, numSamples);
  
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < numSamples; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return audioBuffer;
}
