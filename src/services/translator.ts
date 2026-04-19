import OpenAI from 'openai';
import { TranslationChunk } from '../types';

const SYSTEM_PROMPT = `You are a professional translator. Translate the following English text to Simplified Chinese (zh-CN).
IMPORTANT:
- Preserve all markdown formatting (headers #, lists -, code blocks \`\`\`, etc.)
- Preserve line breaks and paragraph structure
- Only translate the content, do not add explanations or notes
- If the text is already in Chinese or contains mostly Chinese, return it unchanged`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Translate a single chunk of text using OpenAI-compatible API
 */
export async function translateChunk(
  chunk: TranslationChunk,
  apiKey: string,
  apiEndpoint: string,
  model: string = 'minimax/text-01'
): Promise<string> {
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: apiEndpoint
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: chunk.content }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return content.trim();
      }

      throw new Error('Invalid response format from API');

    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof OpenAI.APIError) {
        const status = error.status;
        // 401 Unauthorized - bad API key, don't retry
        if (status === 401) {
          throw new Error(`Authentication failed. Please check your API key.`);
        }
        // 429 Rate limit - could retry
        if (status === 429) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        // 500+ server errors - could retry
        if (status !== undefined && status >= 500) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
      }

      // For other errors, don't retry
      break;
    }
  }

  throw lastError || new Error('Translation failed after retries');
}

/**
 * Translate multiple chunks sequentially and combine results
 */
export async function translateChunks(
  chunks: TranslationChunk[],
  apiKey: string,
  apiEndpoint: string,
  model: string = 'minimax/text-01',
  onProgress?: (chunkIndex: number, totalChunks: number) => void
): Promise<string> {
  const results: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Update progress callback
    if (onProgress) {
      onProgress(i, chunks.length);
    }

    // Translate this chunk
    const translated = await translateChunk(chunk, apiKey, apiEndpoint, model);
    results.push(translated);
  }

  // Final progress update
  if (onProgress) {
    onProgress(chunks.length, chunks.length);
  }

  // Combine results with double newlines (markdown paragraph separation)
  return results.join('\n\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
