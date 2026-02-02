import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useGetCasinoSettings, useUpdateCasinoSettings } from '../hooks/useQueries';
import type { CasinoSettings } from '../backend';

interface AdminSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSettingsModal({ open, onOpenChange }: AdminSettingsModalProps) {
  const { data: settings } = useGetCasinoSettings();
  const updateSettings = useUpdateCasinoSettings();

  const [formData, setFormData] = useState<CasinoSettings>({
    minDeposit: BigInt(10),
    minWithdrawal: BigInt(50),
    ownerPercentage: 2.0,
    dealerUserName: 'CasinoOwner',
    currencyName: 'Diamond',
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currencyName">Currency Name</Label>
            <Input
              id="currencyName"
              value={formData.currencyName}
              onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minDeposit">Minimum Deposit</Label>
            <Input
              id="minDeposit"
              type="number"
              value={Number(formData.minDeposit)}
              onChange={(e) => setFormData({ ...formData, minDeposit: BigInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minWithdrawal">Minimum Withdrawal</Label>
            <Input
              id="minWithdrawal"
              type="number"
              value={Number(formData.minWithdrawal)}
              onChange={(e) => setFormData({ ...formData, minWithdrawal: BigInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerPercentage">House Edge (%)</Label>
            <Input
              id="ownerPercentage"
              type="number"
              step="0.1"
              value={formData.ownerPercentage}
              onChange={(e) => setFormData({ ...formData, ownerPercentage: parseFloat(e.target.value) })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
