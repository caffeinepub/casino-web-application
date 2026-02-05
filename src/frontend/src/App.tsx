import React, { useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useRegisterUser, useGetBranding, useGetAllAssets } from './hooks/useQueries';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { GameLobby } from './pages/GameLobby';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { ThemeApplier } from './components/ThemeApplier';
import { BottomBanner } from './components/BottomBanner';
import { getAssetSrc } from './lib/appAssets';
import { getCacheBustedUrl } from './utils/cacheBusting';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: branding } = useGetBranding();
  const { data: allAssets = [] } = useGetAllAssets();
  const registerUser = useRegisterUser();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const siteName = branding?.displayName || 'Casino';
  
  // Get loading logo with cache-busting
  const loadingLogoAsset = allAssets.find(a => a.assetId === 'loading-logo');
  const loadingLogoSrc = loadingLogoAsset
    ? getCacheBustedUrl(loadingLogoAsset.blob, loadingLogoAsset.updatedAt)
    : getAssetSrc('loading-logo');

  // Update document title based on branding
  useEffect(() => {
    document.title = siteName;
  }, [siteName]);

  const handleProfileSetup = async (username: string) => {
    await registerUser.mutateAsync(username);
  };

  if (loginStatus === 'initializing' || (isAuthenticated && profileLoading)) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div 
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--theme-bg-gradient, linear-gradient(135deg, #000000 0%, #1a0033 50%, #0a0015 100%))' }}
        >
          <div className="text-center">
            <div className="w-24 h-24 mb-6 mx-auto">
              <img
                src={loadingLogoSrc}
                alt={siteName}
                className="w-full h-full object-contain animate-pulse"
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallback = '/assets/generated/loading-logo-fallback.dim_256x256.png';
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            </div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading {siteName}...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ThemeApplier />
      <div 
        className="min-h-screen flex flex-col"
        style={{ background: 'var(--theme-bg-gradient, linear-gradient(135deg, #000000 0%, #1a0033 50%, #0a0015 100%))' }}
      >
        <Header />
        <main className="flex-1">
          <GameLobby />
        </main>
        <Footer />
        <BottomBanner />
        <ProfileSetupModal
          open={showProfileSetup}
          onSubmit={handleProfileSetup}
          isLoading={registerUser.isPending}
        />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
