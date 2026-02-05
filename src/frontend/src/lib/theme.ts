/**
 * Theme utilities for applying admin-configured themes
 */

import type { ThemeConfig } from '../backend';

/**
 * Applies theme configuration to the document root as CSS variables
 * @param theme - Theme configuration from backend
 */
export function applyTheme(theme: ThemeConfig | null) {
  if (!theme) {
    // Clear custom theme variables if no theme is set
    document.documentElement.style.removeProperty('--theme-bg-gradient');
    document.documentElement.style.removeProperty('--theme-surface-gradient');
    document.documentElement.style.removeProperty('--theme-navigation-gradient');
    document.documentElement.style.removeProperty('--theme-card-gradient');
    document.documentElement.style.removeProperty('--theme-primary-color');
    document.documentElement.style.removeProperty('--theme-accent-color');
    document.documentElement.style.removeProperty('--theme-button-gradient');
    return;
  }

  // Apply theme as CSS custom properties
  document.documentElement.style.setProperty('--theme-bg-gradient', theme.bgGradient);
  document.documentElement.style.setProperty('--theme-surface-gradient', theme.surfaceGradient);
  document.documentElement.style.setProperty('--theme-navigation-gradient', theme.navigationGradient);
  document.documentElement.style.setProperty('--theme-card-gradient', theme.cardGradient);
  document.documentElement.style.setProperty('--theme-primary-color', theme.primaryColor);
  document.documentElement.style.setProperty('--theme-accent-color', theme.accentColor);
  
  // Create button gradient from primary and accent colors
  const buttonGradient = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`;
  document.documentElement.style.setProperty('--theme-button-gradient', buttonGradient);
}

/**
 * Gets the effective theme for the current context
 * For now, only global theme is supported (per-game overrides can be added later)
 * @param globalTheme - Global theme configuration
 * @param gameId - Optional game ID for per-game overrides (future)
 * @returns Effective theme configuration
 */
export function getEffectiveTheme(
  globalTheme: ThemeConfig | null,
  gameId?: string
): ThemeConfig | null {
  // Future: Add per-game theme override logic here
  return globalTheme;
}
