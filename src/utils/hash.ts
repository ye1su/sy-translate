import CryptoJS from 'crypto-js';

/**
 * Compute SHA-256 hash of content
 * @param content - Raw string content
 * @returns SHA-256 hash as hex string
 */
export function computeContentHash(content: string): string {
  return CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex);
}
