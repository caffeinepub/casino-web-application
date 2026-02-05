import type { ThemeConfig } from '../backend';

/**
 * Predefined theme presets for quick application
 */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  config: ThemeConfig;
}

export const themePresets: ThemePreset[] = [
  {
    id: 'dark-purple-pink',
    name: 'Dark Black/Purple + Pink',
    description: 'Deep black background with purple accents and vibrant pink buttons',
    config: {
      primaryColor: '#ec4899',
      accentColor: '#f472b6',
      bgGradient: 'linear-gradient(135deg, #000000 0%, #1a0033 50%, #0a0015 100%)',
      surfaceGradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.2), rgba(139, 92, 246, 0.15))',
      navigationGradient: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8), rgba(26, 0, 51, 0.6))',
      cardGradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.25), rgba(139, 92, 246, 0.2))',
    },
  },
  {
    id: 'purple-gold',
    name: 'Purple & Gold Casino',
    description: 'Classic casino theme with purple and gold gradients',
    config: {
      primaryColor: '#fbbf24',
      accentColor: '#f97316',
      bgGradient: 'linear-gradient(to bottom right, #581c87, #3730a3, #1e3a8a)',
      surfaceGradient: 'linear-gradient(to bottom right, rgba(88, 28, 135, 0.5), rgba(55, 48, 163, 0.5))',
      navigationGradient: 'linear-gradient(to right, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3))',
      cardGradient: 'linear-gradient(to bottom right, rgba(88, 28, 135, 0.3), rgba(30, 58, 138, 0.3))',
    },
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Futuristic neon theme with cyan and magenta',
    config: {
      primaryColor: '#06b6d4',
      accentColor: '#ec4899',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      surfaceGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(236, 72, 153, 0.1))',
      navigationGradient: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9), rgba(30, 27, 75, 0.8))',
      cardGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(236, 72, 153, 0.15))',
    },
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald Luxury',
    description: 'Sophisticated emerald green with gold accents',
    config: {
      primaryColor: '#10b981',
      accentColor: '#fbbf24',
      bgGradient: 'linear-gradient(135deg, #064e3b 0%, #1e3a8a 50%, #064e3b 100%)',
      surfaceGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.15))',
      navigationGradient: 'linear-gradient(90deg, rgba(6, 78, 59, 0.8), rgba(30, 58, 138, 0.6))',
      cardGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(59, 130, 246, 0.2))',
    },
  },
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): ThemePreset | undefined {
  return themePresets.find(preset => preset.id === id);
}
