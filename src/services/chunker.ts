import { TranslationChunk } from '../types';

const MAX_WORDS_PER_CHUNK = 2000; // Conservative limit

/**
 * Split document content into chunks for translation
 * Preserves sentence integrity - never splits mid-sentence
 */
export function chunkDocument(content: string): TranslationChunk[] {
  if (!content.trim()) {
    return [];
  }

  // Step 1: Split by paragraphs (double newlines)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const chunks: TranslationChunk[] = [];
  let currentChunk = '';
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);

    // If single paragraph exceeds max, need to split it
    if (paragraphWords > MAX_WORDS_PER_CHUNK) {
      // First, save current chunk if not empty
      if (currentChunk.trim()) {
        chunks.push(createChunk(chunkIndex, currentChunk));
        chunkIndex++;
        currentChunk = '';
        currentWordCount = 0;
      }

      // Split the large paragraph by sentences
      const sentences = splitBySentences(paragraph);
      let currentSentenceChunk = '';
      let currentSentenceCount = 0;

      for (const sentence of sentences) {
        const sentenceWords = countWords(sentence);

        // If adding this sentence would exceed limit
        if (currentSentenceCount + sentenceWords > MAX_WORDS_PER_CHUNK) {
          // Save current sentence chunk
          if (currentSentenceChunk.trim()) {
            chunks.push(createChunk(chunkIndex, currentSentenceChunk));
            chunkIndex++;
          }
          currentSentenceChunk = sentence;
          currentSentenceCount = sentenceWords;
        } else {
          currentSentenceChunk += (currentSentenceChunk ? ' ' : '') + sentence;
          currentSentenceCount += sentenceWords;
        }
      }

      // Don't forget the last sentence chunk
      if (currentSentenceChunk.trim()) {
        chunks.push(createChunk(chunkIndex, currentSentenceChunk));
        chunkIndex++;
      }
    }
    // Normal case: add paragraph to current chunk
    else if (currentWordCount + paragraphWords > MAX_WORDS_PER_CHUNK) {
      // Save current chunk and start new one
      if (currentChunk.trim()) {
        chunks.push(createChunk(chunkIndex, currentChunk));
        chunkIndex++;
      }
      currentChunk = paragraph;
      currentWordCount = paragraphWords;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentWordCount += paragraphWords;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(createChunk(chunkIndex, currentChunk));
  }

  return chunks;
}

/**
 * Split text by sentences - tries to keep sentences intact
 * Handles common abbreviations and edge cases
 */
function splitBySentences(content: string): string[] {
  // First, protect certain patterns that look like sentence endings but aren't
  const safe = content
    .replace(/([A-Z]\.){2,}/g, match => match.replace(/\./g, '<<<DOT>>>')) // e.g., U.S.A.
    .replace(/(\w\.){2,}(?=\s[A-Z])/g, match => match.replace(/\./g, '<<<DOT>>>')) // abbreviations
    .replace(/e\.g\./gi, 'e<<<DOT>>>g<<<DOT>>>')
    .replace(/i\.e\./gi, 'i<<<DOT>>>e<<<DOT>>>')
    .replace(/vs\./gi, 'vs<<<DOT>>>')
    .replace(/etc\./gi, 'etc<<<DOT>>>');

  // Split on sentence-ending punctuation followed by space and capital letter
  // or end of string
  const parts = safe.split(/(?<=[.!?])\s+(?=[A-Z])/);

  // Restore protected patterns
  return parts.map(part => part.replace(/<<<DOT>>>/g, '.'));
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Create a TranslationChunk object
 */
function createChunk(index: number, content: string): TranslationChunk {
  return {
    index,
    content: content.trim(),
    charCount: content.length,
    translatedContent: null,
    status: 'pending'
  };
}
