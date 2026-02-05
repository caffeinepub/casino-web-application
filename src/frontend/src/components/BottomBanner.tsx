import React from 'react';
import { useGetBannerConfig } from '../hooks/useQueries';
import { getCacheBustedUrl } from '../utils/cacheBusting';

/**
 * BottomBanner component
 * Renders a site-wide clickable banner at the bottom of the page
 * Driven by admin-configured banner settings
 */
export function BottomBanner() {
  const { data: bannerConfig } = useGetBannerConfig();

  if (!bannerConfig || !bannerConfig.enabled || !bannerConfig.bannerImage) {
    return null;
  }

  const imageUrl = getCacheBustedUrl(bannerConfig.bannerImage, bannerConfig.updatedAt);

  const handleClick = () => {
    if (bannerConfig.destinationUrl) {
      window.open(bannerConfig.destinationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const objectFit = bannerConfig.objectFit || 'cover';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 cursor-pointer transition-transform hover:scale-[1.01]"
      style={{
        height: `${Number(bannerConfig.height)}px`,
        padding: `${Number(bannerConfig.padding)}px`,
        backgroundColor: bannerConfig.backgroundColor,
      }}
      onClick={handleClick}
    >
      <div className="container mx-auto h-full">
        <img
          src={imageUrl}
          alt="Promotional banner"
          className="w-full h-full"
          style={{ objectFit: objectFit as any }}
          onError={(e) => {
            console.error('Banner image failed to load');
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}
