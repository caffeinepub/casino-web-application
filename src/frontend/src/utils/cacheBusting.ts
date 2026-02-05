/**
 * Cache-busting utilities for ExternalBlob-backed images
 * Appends version tokens to URLs to ensure fresh images after replacement
 */

/**
 * Generates a cache-busted URL by appending a version token
 * @param baseUrl - The base URL (typically from ExternalBlob.getDirectURL())
 * @param version - Version token (timestamp or version number)
 * @returns URL with version query parameter
 */
export function addVersionToUrl(baseUrl: string, version: number | bigint | string): string {
  if (!baseUrl) return baseUrl;
  
  const versionStr = typeof version === 'bigint' ? version.toString() : String(version);
  const separator = baseUrl.includes('?') ? '&' : '?';
  
  return `${baseUrl}${separator}v=${versionStr}`;
}

/**
 * Generates a cache-busted URL from an ExternalBlob with version metadata
 * @param blob - ExternalBlob instance
 * @param updatedAt - Timestamp when the asset was last updated (required for stable caching)
 * @returns Cache-busted URL
 */
export function getCacheBustedUrl(blob: { getDirectURL: () => string }, updatedAt: number | bigint): string {
  const baseUrl = blob.getDirectURL();
  
  // Always use the provided updatedAt for stable, version-based cache-busting
  return addVersionToUrl(baseUrl, updatedAt);
}
