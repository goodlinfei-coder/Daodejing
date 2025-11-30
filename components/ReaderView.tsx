import React from 'react';
import { ChapterContent, LoadingState } from '../types';

interface ReaderViewProps {
  content: ChapterContent | null;
  loadingState: LoadingState;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onPlayAudio: () => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({ 
  content, 
  loadingState, 
  isBookmarked, 
  onToggleBookmark,
  onPlayAudio
}) => {
  if (loadingState === LoadingState.LOADING_TEXT) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="text-stone-500 font-serif text-lg">正在悟道...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
         <p className="text-stone-400">请选择章节</p>
      </div>
    );
  }

  const isPlaying = loadingState === LoadingState.PLAYING;
  const isLoadingAudio = loadingState === LoadingState.LOADING_AUDIO;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 space-y-12">
      
      {/* Header Section */}
      <header className="text-center space-y-4 border-b-2 border-stone-200 pb-8 relative">
        <h1 className="text-4xl md:text-5xl font-calligraphy text-stone-900 mb-2">
          第 {content.chapterNumber} 章
        </h1>
        <h2 className="text-xl md:text-2xl text-stone-600 font-serif font-light tracking-widest">
          {content.title}
        </h2>
        
        {/* Actions */}
        <div className="absolute top-0 right-0 flex gap-2">
           <button 
            onClick={onToggleBookmark}
            className={`p-2 rounded-full hover:bg-stone-200 transition-colors ${isBookmarked ? 'text-red-500' : 'text-stone-400'}`}
            title="收藏"
          >
            {isBookmarked ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Original Text */}
      <section className="bg-white p-6 md:p-10 shadow-sm rounded-lg border border-stone-100 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        <div className="flex justify-between items-start mb-6">
          <span className="text-xs font-bold text-amber-600 tracking-widest uppercase border border-amber-200 px-2 py-1 rounded">原文</span>
          <button 
            onClick={onPlayAudio}
            disabled={isLoadingAudio || isPlaying}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${isPlaying 
                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-opacity-50' 
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoadingAudio ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin"></div>
                生成语音中...
              </>
            ) : isPlaying ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                正在朗读
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
                朗读原文
              </>
            )}
          </button>
        </div>
        <div className="text-2xl md:text-3xl leading-relaxed font-serif text-stone-800 text-justify tracking-wide whitespace-pre-line">
          {content.originalText}
        </div>
      </section>

      {/* Translation */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-stone-500 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-stone-300"></span>
          译文
          <span className="w-8 h-[1px] bg-stone-300"></span>
        </h3>
        <p className="text-lg leading-loose text-stone-700 font-serif">
          {content.translation}
        </p>
      </section>

      {/* Analysis */}
      <section className="bg-stone-200/50 p-6 md:p-8 rounded-xl space-y-4">
        <h3 className="text-lg font-bold text-stone-600">哲学解析</h3>
        <p className="text-base md:text-lg leading-relaxed text-stone-700">
          {content.analysis}
        </p>
        <div className="pt-4 flex flex-wrap gap-2">
          {content.keywords.map((keyword, idx) => (
            <span key={idx} className="bg-white border border-stone-300 text-stone-500 px-3 py-1 rounded-full text-sm">
              #{keyword}
            </span>
          ))}
        </div>
      </section>

    </div>
  );
};

export default ReaderView;