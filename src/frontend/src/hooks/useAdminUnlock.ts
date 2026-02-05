import { useState, useEffect } from 'react';

const ADMIN_UNLOCK_KEY = 'admin_session_unlocked';
const CORRECT_PASSWORD = 'DexGod';

export function useAdminUnlock() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    // Check sessionStorage on mount
    return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === 'true';
  });

  const unlock = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, 'true');
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => {
    sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
    setIsUnlocked(false);
  };

  // Listen for storage changes (e.g., logout in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const unlocked = sessionStorage.getItem(ADMIN_UNLOCK_KEY) === 'true';
      setIsUnlocked(unlocked);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    isUnlocked,
    unlock,
    lock,
  };
}
