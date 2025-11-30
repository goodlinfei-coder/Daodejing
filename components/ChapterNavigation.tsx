import React from 'react';
import { BookmarkState } from '../types';
import { chapterTitles } from '../data/chapterTitles';

interface ChapterNavigationProps {
  currentChapter: number;
  onSelectChapter: (num: number) => void;
  bookmarks: BookmarkState;
  isOpen: boolean;
  onClose: () => void;
}

const ChapterNavigation: React.FC<ChapterNavigationProps> = ({ 
  currentChapter, 
  onSelectChapter, 
  bookmarks,
  isOpen,
  onClose
}) => {
  // Use the titles file, mapping index to chapter number
  const chapters = chapterTitles.map((title, index) => ({
    num: index + 1,
    title
  }));

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer Container */}
      {/* Updated CSS for scrolling: h-full and max-h-screen ensure it fills the parent flex container height */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#faf9f6] border-r border-stone-200 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
        h-full max-h-screen overflow-hidden
      `}>
        {/* Header - Fixed at top of drawer */}
        <div className="flex-none p-6 border-b border-stone-200 flex justify-between items-center bg-[#faf9f6]">
          <div>
            <h2 className="text-2xl font-calligraphy text-stone-900">道德经</h2>
            <p className="text-xs text-stone-500 font-serif mt-1">Tao Te Ching</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-stone-500 hover:text-stone-800 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable List 
            Using flex-1 and overflow-y-auto ensures this section takes available space and scrolls internally.
        */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <div className="p-3 space-y-1 pb-20">
            {chapters.map(({ num, title }) => (
              <button
                key={num}
                onClick={() => {
                  onSelectChapter(num);
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all duration-200
                  ${currentChapter === num 
                    ? 'bg-amber-100/60 text-amber-900 shadow-sm border border-amber-200/50' 
                    : 'hover:bg-stone-200/50 text-stone-600 border border-transparent'}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`text-sm font-serif w-6 flex-shrink-0 ${currentChapter === num ? 'text-amber-700 font-bold' : 'text-stone-400'}`}>
                    {num}
                  </span>
                  <span className="font-serif truncate">{title}</span>
                </div>
                
                {bookmarks[num] && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-red-400 flex-shrink-0">
                    <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Footer - Fixed at bottom of drawer */}
        <div className="flex-none p-4 border-t border-stone-200 bg-[#faf9f6] text-center z-10">
           <div className="text-[10px] text-stone-400 font-serif">
             共 81 章
           </div>
        </div>
      </aside>
    </>
  );
};

export default ChapterNavigation;