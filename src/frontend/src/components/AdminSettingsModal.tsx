import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useGetCasinoSettings, useUpdateCasinoSettings } from '../hooks/useQueries';
import type { CasinoSettings } from '../backend';
import { Settings, Palette, Gamepad2 } from 'lucide-react';
import { SymbolSetEditor } from './admin/SymbolSetEditor';
import { GameCatalogEditor } from './admin/GameCatalogEditor';

interface AdminSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSettingsModal({ open, onOpenChange }: AdminSettingsModalProps) {
  const { data: settings } = useGetCasinoSettings();
  const updateSettings = useUpdateCasinoSettings();

  const [formData, setFormData] = useState<CasinoSettings>({
    minDeposit: BigInt(100),
    minWithdrawal: BigInt(100),
    houseEdgePercentage: BigInt(5),
    dealerUsername: 'House',
    currencyName: 'Diamonds',
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Settings
          </DialogTitle>
          <DialogDescription>
            Configure casino settings, game symbols, and game catalog
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="symbols">
              <Palette className="w-4 h-4 mr-2" />
              Symbols
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Game Catalog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
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
                <Label htmlFor="dealerUsername">Dealer Username</Label>
                <Input
                  id="dealerUsername"
                  value={formData.dealerUsername}
                  onChange={(e) => setFormData({ ...formData, dealerUsername: e.target.value })}
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
                <Label htmlFor="houseEdge">House Edge (%)</Label>
                <Input
                  id="houseEdge"
                  type="number"
                  value={Number(formData.houseEdgePercentage)}
                  onChange={(e) => setFormData({ ...formData, houseEdgePercentage: BigInt(e.target.value) })}
                  max="100"
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="symbols" className="mt-4">
            <SymbolSetEditor />
          </TabsContent>

          <TabsContent value="catalog" className="mt-4">
            <GameCatalogEditor />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
