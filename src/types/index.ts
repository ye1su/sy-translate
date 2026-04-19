// Document entity representing an open document being translated
export interface Document {
  filePath: string;
  fileType: '.md' | '.txt';
  content: string;
  language: 'en' | 'zh' | 'mixed' | 'unknown';
  status: TranslationStatus;
}

// Translation status enum
export enum TranslationStatus {
  Idle = 'idle',
  Detecting = 'detecting',
  Translating = 'translating',
  Cached = 'cached',
  Completed = 'completed',
  Error = 'error'
}

// Local cache storage for translated documents
export interface TranslationCache {
  hash: string;
  translatedContent: string;
  timestamp: string;
  sourceLanguage: 'en';
  filePath: string;
}

// A portion of content sent to the model for translation
export interface TranslationChunk {
  index: number;
  content: string;
  charCount: number;
  translatedContent: string | null;
  status: 'pending' | 'translating' | 'completed' | 'error';
}

// JSON file stored at .vscode-translate-cache/translations.json
export interface CacheStore {
  version: string;
  translations: TranslationCache[];
  lastUpdated: string;
}

// API request/response types
export interface TranslateRequest {
  content: string;
  sourceLanguage: 'en';
  targetLanguage: 'zh';
}

export interface TranslateResponse {
  translatedContent: string;
  success: boolean;
  error?: string;
}
