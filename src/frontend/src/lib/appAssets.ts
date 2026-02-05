// Canonical list of replaceable app assets with their fallback paths and labels

// Shared fallback paths as constants
export const SITE_LOGO_FALLBACK = '/assets/generated/site-logo-fallback.dim_256x256.png';
export const LOADING_LOGO_FALLBACK = '/assets/generated/loading-logo-fallback.dim_256x256.png';

export interface AppAsset {
  id: string;
  label: string;
  fallbackPath: string;
  category: 'game-cover' | 'icon' | 'branding';
}

export const APP_ASSETS: AppAsset[] = [
  {
    id: 'site-logo',
    label: 'Site Logo',
    fallbackPath: SITE_LOGO_FALLBACK,
    category: 'branding',
  },
  {
    id: 'loading-logo',
    label: 'Loading Logo',
    fallbackPath: LOADING_LOGO_FALLBACK,
    category: 'branding',
  },
  {
    id: 'slots-cover',
    label: 'Slots Game Cover',
    fallbackPath: '/assets/generated/slot-reels.dim_400x300.png',
    category: 'game-cover',
  },
  {
    id: 'blackjack-cover',
    label: 'Blackjack Game Cover',
    fallbackPath: '/assets/generated/blackjack-cards.dim_400x250.png',
    category: 'game-cover',
  },
  {
    id: 'dice-cover',
    label: 'Dice Roll Game Cover',
    fallbackPath: '/assets/generated/dice-pair.dim_200x200.png',
    category: 'game-cover',
  },
  {
    id: 'wheel-cover',
    label: 'Fortune Wheel Game Cover',
    fallbackPath: '/assets/generated/fortune-wheel.dim_300x300.png',
    category: 'game-cover',
  },
  {
    id: 'jackpot-cover',
    label: 'Jackpot Game Cover',
    fallbackPath: '/assets/generated/jackpot-coins.dim_400x300.png',
    category: 'game-cover',
  },
  {
    id: 'diamond-icon',
    label: 'Diamond Balance Icon',
    fallbackPath: '/assets/generated/diamond-icon-transparent.dim_64x64.png',
    category: 'icon',
  },
];

// Map asset ID to its definition
export function getAssetById(assetId: string): AppAsset | undefined {
  return APP_ASSETS.find((asset) => asset.id === assetId);
}

// Get the display source for an asset with cache-busting support
export function getAssetSrc(assetId: string, replacementUrl?: string, version?: number | bigint): string {
  const asset = getAssetById(assetId);
  if (!asset) return '';
  
  const baseUrl = replacementUrl || asset.fallbackPath;
  
  // Add version token if provided
  if (version !== undefined && replacementUrl) {
    const versionStr = typeof version === 'bigint' ? version.toString() : String(version);
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}v=${versionStr}`;
  }
  
  return baseUrl;
}

// Get all asset IDs
export function getAllAssetIds(): string[] {
  return APP_ASSETS.map((asset) => asset.id);
}
