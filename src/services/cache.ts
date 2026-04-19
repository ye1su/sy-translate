import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CacheStore, TranslationCache } from '../types';
import { computeContentHash } from '../utils/hash';

const CACHE_FILE_NAME = 'translations.json';
const CACHE_VERSION = '1.0';

/**
 * Get the cache directory path (.vscode-translate-cache/)
 */
function getCacheDir(): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error('No workspace folder found');
  }
  return path.join(workspaceFolder.uri.fsPath, '.vscode-translate-cache');
}

/**
 * Get the full path to the cache file
 */
function getCacheFilePath(): string {
  return path.join(getCacheDir(), CACHE_FILE_NAME);
}

/**
 * Load the cache store from disk
 */
function loadCacheStore(): CacheStore {
  const cachePath = getCacheFilePath();

  if (!fs.existsSync(cachePath)) {
    return {
      version: CACHE_VERSION,
      translations: [],
      lastUpdated: new Date().toISOString()
    };
  }

  try {
    const content = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(content) as CacheStore;
  } catch (error) {
    // If corrupted, return empty cache
    vscode.window.showWarningMessage('Cache file corrupted. Starting with empty cache.');
    return {
      version: CACHE_VERSION,
      translations: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Save the cache store to disk
 */
function saveCacheStore(store: CacheStore): void {
  const cacheDir = getCacheDir();
  const cachePath = getCacheFilePath();

  // Ensure cache directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(cachePath, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * Get cached translation for content if it exists
 */
export function getCachedTranslation(content: string, filePath: string): TranslationCache | null {
  const store = loadCacheStore();
  const hash = computeContentHash(content);

  return store.translations.find(t => t.hash === hash && t.filePath === filePath) || null;
}

/**
 * Save translation to cache
 */
export function saveTranslation(
  content: string,
  translatedContent: string,
  filePath: string,
  sourceLanguage: 'en' = 'en'
): void {
  const store = loadCacheStore();
  const hash = computeContentHash(content);

  // Remove existing entry for this file+content
  store.translations = store.translations.filter(
    t => !(t.hash === hash && t.filePath === filePath)
  );

  // Add new entry
  store.translations.push({
    hash,
    translatedContent,
    timestamp: new Date().toISOString(),
    sourceLanguage,
    filePath
  });

  saveCacheStore(store);
}

/**
 * Check if content has changed since last translation
 */
export function hasContentChanged(content: string, filePath: string): boolean {
  const cached = getCachedTranslation(content, filePath);
  return cached === null;
}
