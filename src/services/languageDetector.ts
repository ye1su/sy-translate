/**
 * Detect if document content is primarily English
 * Uses >70% ASCII characters heuristic
 * @param content - Document content to analyze
 * @returns 'en' if primarily English, 'zh' if primarily Chinese, 'mixed' if both, 'unknown' if unclear
 */
export function detectLanguage(content: string): 'en' | 'zh' | 'mixed' | 'unknown' {
  if (!content || content.trim().length === 0) {
    return 'unknown';
  }

  let asciiCount = 0;
  let cjkCount = 0;
  let otherCount = 0;

  for (const char of content) {
    const code = char.charCodeAt(0);

    // ASCII printable range
    if (code >= 32 && code <= 126) {
      asciiCount++;
    }
    // CJK Unified Ideographs (Chinese, Japanese, Korean)
    else if ((code >= 0x4E00 && code <= 0x9FFF) ||
             (code >= 0x3400 && code <= 0x4DBF) ||
             (code >= 0xF900 && code <= 0xFAFF)) {
      cjkCount++;
    }
    // Other characters (punctuation, numbers, etc.)
    else {
      otherCount++;
    }
  }

  const total = asciiCount + cjkCount + otherCount;
  if (total === 0) {
    return 'unknown';
  }

  const asciiRatio = asciiCount / total;
  const cjkRatio = cjkCount / total;

  // >70% ASCII = English
  if (asciiRatio > 0.7) {
    return 'en';
  }
  // >40% CJK = Chinese
  else if (cjkRatio > 0.4) {
    return 'zh';
  }
  // Both present in significant amounts = mixed
  else if (asciiCount > 50 && cjkCount > 50) {
    return 'mixed';
  }

  return 'unknown';
}
