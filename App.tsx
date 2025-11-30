import React, { useState, useEffect, useRef } from 'react';
import ChapterNavigation from './components/ChapterNavigation';
import ReaderView from './components/ReaderView';
import { ChapterContent, BookmarkState, LoadingState } from './types';
import { fetchChapterContent, speakText, stopSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [currentChapterNum, setCurrentChapterNum] = useState<number>(1);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BookmarkState>({});
  
  // Track browser TTS state
  const isPlayingRef = useRef<boolean>(false);

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

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifiers are pressed
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault(); // Prevent page scroll
        setCurrentChapterNum(prev => (prev < 81 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault(); // Prevent page scroll
        setCurrentChapterNum(prev => (prev > 1 ? prev - 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    stopSpeech();
    isPlayingRef.current = false;
    if (loadingState === LoadingState.PLAYING || loadingState === LoadingState.LOADING_AUDIO) {
        setLoadingState(LoadingState.IDLE);
    }
  };

  // REMOVED 'async' keyword to ensure strict user-gesture association for Mobile Browsers
  const playAudio = () => {
    if (loadingState === LoadingState.PLAYING) {
      stopAudio();
      return;
    }

    if (!content) return;

    // Check browser support
    if (!window.speechSynthesis) {
        alert("您的浏览器不支持语音朗读功能。");
        return;
    }

    setLoadingState(LoadingState.PLAYING);
    isPlayingRef.current = true;

    speakText(
        content.originalText, 
        () => {
            // onEnd
            setLoadingState(LoadingState.IDLE);
            isPlayingRef.current = false;
        },
        (e) => {
            // onError
            console.error("TTS Error", e);
            setLoadingState(LoadingState.IDLE);
            isPlayingRef.current = false;
        }
    );
  };

  return (
    <div className="flex h-screen w-full bg-stone-100 overflow-hidden">
      
      <ChapterNavigation 
        currentChapter={currentChapterNum}
        onSelectChapter={setCurrentChapterNum}
        bookmarks={bookmarks}
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative w-full scroll-smooth flex flex-col">
        {/* Mobile Header Toggle */}
        <div className="sticky top-0 z-30 lg:hidden bg-stone-100/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex justify-between items-center flex-none">
          <button 
            onClick={() => setIsNavOpen(true)}
            className="p-2 -ml-2 text-stone-600 hover:text-stone-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-calligraphy text-lg">道德经</span>
          <div className="w-8"></div>
        </div>

        <div className="flex-1">
            <ReaderView 
            content={content}
            loadingState={loadingState}
            isBookmarked={!!bookmarks[currentChapterNum]}
            onToggleBookmark={toggleBookmark}
            onPlayAudio={playAudio}
            />
        </div>
        
        {/* Footer */}
        <footer className="py-6 text-center text-stone-400 text-sm font-serif flex-none bg-stone-100 border-t border-stone-200">
          <p>离线模式 · 浏览器语音朗读</p>
          <p className="mt-1">大道至简 · 悟在心中</p>
        </footer>
      </main>

    </div>
  );
};

export default App;