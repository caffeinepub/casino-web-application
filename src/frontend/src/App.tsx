import React from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useRegisterUser } from './hooks/useQueries';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { GameLobby } from './pages/GameLobby';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const registerUser = useRegisterUser();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleProfileSetup = async (username: string) => {
    await registerUser.mutateAsync(username);
  };

  if (loginStatus === 'initializing' || (isAuthenticated && profileLoading)) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading Casino...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <Header />
        <main className="flex-1">
          <GameLobby />
        </main>
        <Footer />
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
