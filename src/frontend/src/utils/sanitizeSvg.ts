/**
 * Basic SVG validation and sanitization utility
 * Checks for valid SVG structure and removes potentially unsafe elements
 */

const UNSAFE_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'style'];
const UNSAFE_ATTRS = ['onload', 'onerror', 'onclick', 'onmouseover'];

export function sanitizeSvg(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') {
    return '';
  }

  const trimmed = svgString.trim();
  
  // Basic SVG structure check
  if (!trimmed.toLowerCase().includes('<svg')) {
    return '';
  }

  // Check for unsafe tags
  const lowerSvg = trimmed.toLowerCase();
  for (const tag of UNSAFE_TAGS) {
    if (lowerSvg.includes(`<${tag}`)) {
      console.warn(`Unsafe tag detected: ${tag}`);
      return '';
    }
  }

  // Check for unsafe attributes
  for (const attr of UNSAFE_ATTRS) {
    if (lowerSvg.includes(attr)) {
      console.warn(`Unsafe attribute detected: ${attr}`);
      return '';
    }
  }

  // Basic size limit (500KB)
  if (trimmed.length > 500000) {
    console.warn('SVG too large');
    return '';
  }

  return trimmed;
}

export function isValidSvg(svgString: string): boolean {
  return sanitizeSvg(svgString) !== '';
}

export function renderSafeSvg(svgString: string): string {
  const sanitized = sanitizeSvg(svgString);
  if (!sanitized) {
    return '<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50" fill="#ccc"/><text x="25" y="30" text-anchor="middle" fill="#666" font-size="12">Invalid</text></svg>';
  }
  return sanitized;
}
