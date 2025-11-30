import React from 'react';
import { BookmarkState } from '../types';

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
  const chapters = Array.from({ length: 81 }, (_, i) => i + 1);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-stone-50 border-r border-stone-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block flex flex-col
      `}>
        <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-100">
          <h2 className="text-xl font-calligraphy text-stone-800">道德经目录</h2>
          <button onClick={onClose} className="lg:hidden text-stone-500 hover:text-stone-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chapters.map((num) => (
            <button
              key={num}
              onClick={() => {
                onSelectChapter(num);
                onClose();
              }}
              className={`
                w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-colors
                ${currentChapter === num 
                  ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                  : 'hover:bg-stone-200 text-stone-600'}
              `}
            >
              <span className="font-serif">第 {num} 章</span>
              {bookmarks[num] && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default ChapterNavigation;