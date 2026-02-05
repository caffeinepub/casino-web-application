import { useEffect } from 'react';
import { useGetThemeConfig } from '../hooks/useQueries';
import { applyTheme } from '../lib/theme';

/**
 * ThemeApplier component
 * Fetches theme configuration and applies it to the document root
 * Should be mounted once at the app root level
 */
export function ThemeApplier() {
  const { data: themeConfig } = useGetThemeConfig();

  useEffect(() => {
    applyTheme(themeConfig || null);
  }, [themeConfig]);

  return null;
}
