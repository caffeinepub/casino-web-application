import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface AdminUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: (password: string) => boolean;
  isAdmin: boolean;
}

export function AdminUnlockDialog({ open, onOpenChange, onUnlock, isAdmin }: AdminUnlockDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }

    if (!isAdmin) {
      setError('You do not have admin permissions. Admin access requires both backend authorization and the session password.');
      return;
    }

    const success = onUnlock(password);
    if (success) {
      setPassword('');
      setError('');
      onOpenChange(false);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Admin Access
          </DialogTitle>
          <DialogDescription>
            Enter the admin password to unlock Admin Settings for this session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Admin Settings requires both backend admin permission and the session unlock password.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Unlock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
