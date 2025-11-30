import React, { useState, useEffect, useRef } from 'react';
import ChapterNavigation from './components/ChapterNavigation';
import ReaderView from './components/ReaderView';
import { ChapterContent, BookmarkState, LoadingState } from './types';
import { fetchChapterContent, generateSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [currentChapterNum, setCurrentChapterNum] = useState<number>(1);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BookmarkState>({});
  
  // Audio Refs (Gemini)
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Audio Refs (Browser TTS fallback)
  const isBrowserTTSPlayingRef = useRef<boolean>(false);

  // Load bookmarks from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tao_bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  // Fetch content when chapter changes
  useEffect(() => {
    const loadChapter = async () => {
      setLoadingState(LoadingState.LOADING_TEXT);
      stopAudio(); // Stop any playing audio
      
      try {
        const data = await fetchChapterContent(currentChapterNum);
        setContent(data);
        setLoadingState(LoadingState.IDLE);
      } catch (error) {
        console.error(error);
        setLoadingState(LoadingState.ERROR);
      }
    };

    loadChapter();
  }, [currentChapterNum]);

  // Handle Bookmarking
  const toggleBookmark = () => {
    const newBookmarks = { ...bookmarks };
    if (newBookmarks[currentChapterNum]) {
      delete newBookmarks[currentChapterNum];
    } else {
      newBookmarks[currentChapterNum] = true;
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('tao_bookmarks', JSON.stringify(newBookmarks));
  };

  // Handle Audio
  const stopAudio = () => {
    // Stop Gemini Audio
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { 
        // ignore error if already stopped 
      }
      sourceNodeRef.current = null;
    }
    
    // Stop Browser TTS
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        isBrowserTTSPlayingRef.current = false;
    }

    if (loadingState === LoadingState.PLAYING || loadingState === LoadingState.LOADING_AUDIO) {
        setLoadingState(LoadingState.IDLE);
    }
  };

  const playAudio = async () => {
    if (loadingState === LoadingState.PLAYING) {
      stopAudio();
      return;
    }

    if (!content) return;

    setLoadingState(LoadingState.LOADING_AUDIO);

    try {
      const audioBuffer = await generateSpeech(content.originalText);
      
      // --- GEMINI AUDIO PATH ---
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setLoadingState(LoadingState.IDLE);
        sourceNodeRef.current = null;
      };

      source.start();
      sourceNodeRef.current = source;
      setLoadingState(LoadingState.PLAYING);

    } catch (error: any) {
      // Check for the specific fallback signal or generic error
      if (error.message === 'USE_BROWSER_TTS' || !process.env.API_KEY) {
        // --- BROWSER TTS FALLBACK PATH ---
        if (!window.speechSynthesis) {
           alert("您的浏览器不支持语音朗读功能。");
           setLoadingState(LoadingState.IDLE);
           return;
        }

        const utterance = new SpeechSynthesisUtterance(content.originalText);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8; // Slower for ancient text
        
        utterance.onend = () => {
            setLoadingState(LoadingState.IDLE);
            isBrowserTTSPlayingRef.current = false;
        };
        
        utterance.onerror = (e) => {
            console.error("Browser TTS Error", e);
            setLoadingState(LoadingState.IDLE);
            isBrowserTTSPlayingRef.current = false;
        };

        isBrowserTTSPlayingRef.current = true;
        setLoadingState(LoadingState.PLAYING);
        window.speechSynthesis.speak(utterance);
        
      } else {
        console.error("Audio playback failed", error);
        setLoadingState(LoadingState.IDLE); 
        alert("语音生成失败，请稍后重试。");
      }
    }
  };

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      
      <ChapterNavigation 
        currentChapter={currentChapterNum}
        onSelectChapter={setCurrentChapterNum}
        bookmarks={bookmarks}
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative w-full scroll-smooth">
        {/* Mobile Header Toggle */}
        <div className="sticky top-0 z-30 lg:hidden bg-stone-100/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex justify-between items-center">
          <button 
            onClick={() => setIsNavOpen(true)}
            className="p-2 -ml-2 text-stone-600 hover:text-stone-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-calligraphy text-lg">道德经</span>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        <ReaderView 
          content={content}
          loadingState={loadingState}
          isBookmarked={!!bookmarks[currentChapterNum]}
          onToggleBookmark={toggleBookmark}
          onPlayAudio={playAudio}
        />
        
        {/* Footer */}
        <footer className="py-8 text-center text-stone-400 text-sm font-serif">
          <p>
            {process.env.API_KEY ? "AI 深度语音" : "浏览器离线朗读"}
          </p>
          <p className="mt-1">大道至简 · 悟在心中</p>
        </footer>
      </main>

    </div>
  );
};

export default App;