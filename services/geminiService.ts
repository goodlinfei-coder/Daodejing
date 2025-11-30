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

// Global reference to prevent Garbage Collection during playback
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Attempt to pre-load voices on module load to populate the browser's cache
if (typeof window !== 'undefined' && window.speechSynthesis) {
  try {
    window.speechSynthesis.getVoices();
  } catch(e) { /* ignore */ }
}

/**
 * Wrapper for Browser Native TTS.
 * Enhanced for Mobile stability.
 */
export const speakText = (text: string, onEnd: () => void, onError: (e: any) => void): SpeechSynthesisUtterance => {
  // 1. Mandatory cancel to clear stack and reset engine state
  window.speechSynthesis.cancel();

  // 2. Mobile Safari/Chrome Fix: Resume context if suspended
  if (window.speechSynthesis.paused || window.speechSynthesis.pending) {
     window.speechSynthesis.resume();
  }

  // 3. Create Utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; 
  utterance.rate = 0.9; 
  utterance.pitch = 1.0;
  
  // 4. Voice Selection
  // Note: On mobile, getVoices() might return [] initially. 
  // We try our best to find a Chinese voice, otherwise rely on 'lang' prop.
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => 
    v.lang === 'zh-CN' || 
    v.lang === 'zh_CN' || 
    (v.lang.includes('zh') && v.lang.includes('CN'))
  );
  
  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  // 5. Event Handlers
  utterance.onend = () => {
    currentUtterance = null;
    onEnd();
  };

  utterance.onerror = (e) => {
    // Some browsers fire 'interrupted' or 'canceled' as error, which is fine
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn("TTS Error Event:", e);
    }
    currentUtterance = null;
    onError(e);
  };

  // 6. Speak
  currentUtterance = utterance; // Retain reference
  window.speechSynthesis.speak(utterance);
  
  // 7. Double check resume for iOS
  setTimeout(() => {
     if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
     }
  }, 50);

  return utterance;
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
};
