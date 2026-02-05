/**
 * Gradient parsing and serialization utilities
 */

export interface GradientStop {
  color: string;
  position?: number;
}

export interface ParsedGradient {
  type: 'linear' | 'radial';
  direction?: string;
  stops: GradientStop[];
}

/**
 * Parse a CSS gradient string into structured data (best-effort)
 * Supports basic linear-gradient syntax
 */
export function parseGradient(gradientString: string): ParsedGradient | null {
  if (!gradientString) return null;

  const linearMatch = gradientString.match(/linear-gradient\((.*)\)/);
  if (!linearMatch) return null;

  const parts = linearMatch[1].split(',').map(s => s.trim());
  
  let direction = 'to bottom';
  let colorParts = parts;

  // Check if first part is a direction
  if (parts[0] && (parts[0].includes('deg') || parts[0].startsWith('to '))) {
    direction = parts[0];
    colorParts = parts.slice(1);
  }

  const stops: GradientStop[] = colorParts.map(part => {
    // Extract color (everything before optional percentage/position)
    const match = part.match(/^(.*?)(\s+\d+%)?$/);
    if (match) {
      return {
        color: match[1].trim(),
        position: match[2] ? parseInt(match[2]) : undefined,
      };
    }
    return { color: part.trim() };
  });

  return {
    type: 'linear',
    direction,
    stops,
  };
}

/**
 * Serialize gradient data back to CSS string
 */
export function serializeGradient(gradient: ParsedGradient): string {
  if (gradient.type === 'linear') {
    const direction = gradient.direction || 'to bottom';
    const stops = gradient.stops
      .map(stop => {
        if (stop.position !== undefined) {
          return `${stop.color} ${stop.position}%`;
        }
        return stop.color;
      })
      .join(', ');
    
    return `linear-gradient(${direction}, ${stops})`;
  }

  return '';
}

/**
 * Extract colors from a gradient string (simple extraction)
 */
export function extractColorsFromGradient(gradientString: string): string[] {
  const parsed = parseGradient(gradientString);
  if (!parsed) return [];
  return parsed.stops.map(stop => stop.color);
}

/**
 * Create a simple two-color gradient
 */
export function createSimpleGradient(
  color1: string,
  color2: string,
  direction: string = 'to bottom right'
): string {
  return `linear-gradient(${direction}, ${color1}, ${color2})`;
}
