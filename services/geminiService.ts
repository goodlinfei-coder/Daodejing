import { ChapterContent } from "../types";
import { fullContent } from "../data/fullContent";

/**
 * Fetches the text, translation, and analysis for a specific chapter from local data.
 */
export const fetchChapterContent = async (chapterNumber: number): Promise<ChapterContent> => {
  const localData = fullContent[chapterNumber];

  if (localData) {
    return Promise.resolve(localData);
  }

  // Fallback
  return Promise.resolve({
    chapterNumber,
    title: `第 ${chapterNumber} 章`,
    originalText: "内容加载中...",
    translation: "暂无译文",
    analysis: "暂无解析",
    keywords: []
  });
};

/**
 * Wrapper for Browser Native TTS.
 * Not strictly necessary as App.tsx can call window.speechSynthesis directly,
 * but kept for architectural consistency if we wanted to add more logic later.
 */
export const speakText = (text: string, onEnd: () => void, onError: (e: any) => void): SpeechSynthesisUtterance => {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.85; // Slightly slower for classical text
  utterance.pitch = 1.0;
  
  utterance.onend = onEnd;
  utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeech = () => {
  window.speechSynthesis.cancel();
};
