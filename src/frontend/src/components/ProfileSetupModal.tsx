import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface ProfileSetupModalProps {
  open: boolean;
  onSubmit: (username: string) => Promise<void>;
  isLoading: boolean;
}

export function ProfileSetupModal({ open, onSubmit, isLoading }: ProfileSetupModalProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await onSubmit(username.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Diamond Casino!</DialogTitle>
          <DialogDescription>
            Choose your username to get started. You'll receive 1000 diamonds as a welcome bonus!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={!username.trim() || isLoading}>
            {isLoading ? 'Creating Profile...' : 'Start Playing'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
