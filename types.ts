export interface ChapterContent {
  chapterNumber: number;
  title: string;
  originalText: string;
  translation: string; // Modern Chinese translation
  analysis: string; // Detailed philosophical explanation
  keywords: string[];
}

export interface BookmarkState {
  [chapterNumber: number]: boolean;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING_TEXT = 'LOADING_TEXT',
  LOADING_AUDIO = 'LOADING_AUDIO',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}