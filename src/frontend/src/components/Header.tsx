import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin, useGetAllAssets, useGetBranding } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Coins, Settings, Wallet, LogOut, LogIn, User, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { WalletModal } from './WalletModal';
import { AdminSettingsModal } from './AdminSettingsModal';
import { AdminUnlockDialog } from './admin/AdminUnlockDialog';
import { getAssetSrc, SITE_LOGO_FALLBACK } from '../lib/appAssets';
import { getCacheBustedUrl } from '../utils/cacheBusting';
import { useAdminUnlock } from '../hooks/useAdminUnlock';

export function Header() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: allAssets = [] } = useGetAllAssets();
  const { data: branding } = useGetBranding();
  const queryClient = useQueryClient();
  const { isUnlocked, unlock, lock } = useAdminUnlock();
  const [walletOpen, setWalletOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = React.useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  // Admin settings should only be accessible when both admin AND unlocked
  const canAccessAdminSettings = isAdmin && isUnlocked;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      lock(); // Clear admin unlock on logout
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleLogoClick = () => {
    // Only show unlock dialog if user is authenticated and is an admin
    if (isAuthenticated && isAdmin) {
      setUnlockDialogOpen(true);
    }
  };

  const handleUnlock = (password: string): boolean => {
    return unlock(password);
  };

  const handleLockAdmin = () => {
    lock();
  };

  // Get assets with cache-busting
  const diamondIconAsset = allAssets.find(a => a.assetId === 'diamond-icon');
  const diamondIconSrc = diamondIconAsset
    ? getCacheBustedUrl(diamondIconAsset.blob, diamondIconAsset.updatedAt)
    : getAssetSrc('diamond-icon');

  const siteLogoAsset = allAssets.find(a => a.assetId === 'site-logo');
  const siteLogoSrc = siteLogoAsset
    ? getCacheBustedUrl(siteLogoAsset.blob, siteLogoAsset.updatedAt)
    : getAssetSrc('site-logo');

  const siteName = branding?.displayName || 'Casino';

  return (
    <>
      <header 
        className="backdrop-blur-md border-b border-white/10 sticky top-0 z-50"
        style={{ background: 'var(--theme-navigation-gradient, rgba(0, 0, 0, 0.8))' }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: 'var(--theme-button-gradient, linear-gradient(135deg, #ec4899, #f472b6))' }}
                onClick={handleLogoClick}
                title={isAuthenticated && isAdmin ? 'Click to unlock admin' : ''}
              >
                <img
                  src={siteLogoSrc}
                  alt={siteName}
                  className="w-full h-full object-contain"
                  decoding="async"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== SITE_LOGO_FALLBACK) {
                      target.src = SITE_LOGO_FALLBACK;
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{siteName}</h1>
                <p className="text-xs text-gray-300">Play. Win. Repeat.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated && userProfile && (
                <div 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border"
                  style={{ 
                    background: 'var(--theme-surface-gradient, rgba(88, 28, 135, 0.2))',
                    borderColor: 'var(--theme-primary-color, #ec4899)'
                  }}
                >
                  <img
                    src={diamondIconSrc}
                    alt="Diamond"
                    className="w-5 h-5"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = '/assets/generated/diamond-icon-transparent.dim_64x64.png';
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <span className="font-bold" style={{ color: 'var(--theme-primary-color, #ec4899)' }}>
                    {Number(userProfile.diamondBalance).toLocaleString()}
                  </span>
                </div>
              )}

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <User className="w-4 h-4 mr-2" />
                      {userProfile?.username || 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setWalletOpen(true)}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet
                    </DropdownMenuItem>
                    {canAccessAdminSettings && (
                      <>
                        <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLockAdmin}>
                          <Lock className="w-4 h-4 mr-2" />
                          Lock Admin
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAuth}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleAuth}
                  disabled={isLoggingIn}
                  className="font-bold text-white"
                  style={{ background: 'var(--theme-button-gradient, linear-gradient(135deg, #ec4899, #f472b6))' }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <WalletModal open={walletOpen} onOpenChange={setWalletOpen} />
      {canAccessAdminSettings && <AdminSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />}
      <AdminUnlockDialog 
        open={unlockDialogOpen} 
        onOpenChange={setUnlockDialogOpen}
        onUnlock={handleUnlock}
        isAdmin={!!isAdmin}
      />
    </>
  );
}
