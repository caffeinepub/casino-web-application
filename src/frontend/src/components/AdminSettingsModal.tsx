import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useGetCasinoSettings, useUpdateCasinoSettings, useGetBranding, useUpdateBranding } from '../hooks/useQueries';
import type { CasinoSettings, SiteBranding } from '../backend';
import { Settings, Palette, Gamepad2, Image, Layout } from 'lucide-react';
import { SymbolSetEditor } from './admin/SymbolSetEditor';
import { GameCatalogEditor } from './admin/GameCatalogEditor';
import { AppAssetsEditor } from './admin/AppAssetsEditor';
import { ThemeEditor } from './admin/ThemeEditor';
import { BottomBannerEditor } from './admin/BottomBannerEditor';

interface AdminSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSettingsModal({ open, onOpenChange }: AdminSettingsModalProps) {
  const { data: settings } = useGetCasinoSettings();
  const { data: branding } = useGetBranding();
  const updateSettings = useUpdateCasinoSettings();
  const updateBranding = useUpdateBranding();

  const [formData, setFormData] = useState<CasinoSettings>({
    minDeposit: BigInt(100),
    minWithdrawal: BigInt(100),
    houseEdgePercentage: BigInt(5),
    dealerUsername: 'House',
    currencyName: 'Diamonds',
  });

  const [brandingData, setBrandingData] = useState<SiteBranding>({
    displayName: 'Casino',
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (branding) {
      setBrandingData(branding);
    }
  }, [branding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(formData);
  };

  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBranding.mutateAsync(brandingData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Settings
          </DialogTitle>
          <DialogDescription>
            Configure casino settings, theme, banners, game symbols, catalog, and images
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="theme" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="banner" className="text-xs">
              <Layout className="w-3 h-3 mr-1" />
              Banner
            </TabsTrigger>
            <TabsTrigger value="symbols" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Symbols
            </TabsTrigger>
            <TabsTrigger value="catalog" className="text-xs">
              <Gamepad2 className="w-3 h-3 mr-1" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Images
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <form onSubmit={handleBrandingSubmit} className="space-y-4 pb-4 border-b">
              <div>
                <h3 className="text-lg font-semibold mb-2">Site Branding</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your site name and logos
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={brandingData.displayName}
                  onChange={(e) => setBrandingData({ displayName: e.target.value })}
                  placeholder="Enter site name"
                />
                <p className="text-xs text-muted-foreground">
                  This name appears in the header and browser tab
                </p>
              </div>
              <Button type="submit" disabled={updateBranding.isPending}>
                {updateBranding.isPending ? 'Saving...' : 'Save Site Name'}
              </Button>
            </form>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Casino Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure game rules and currency
                </p>
              </div>
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
                {updateSettings.isPending ? 'Saving...' : 'Save Casino Settings'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="theme" className="mt-4">
            <ThemeEditor />
          </TabsContent>

          <TabsContent value="banner" className="mt-4">
            <BottomBannerEditor />
          </TabsContent>

          <TabsContent value="symbols" className="mt-4">
            <SymbolSetEditor />
          </TabsContent>

          <TabsContent value="catalog" className="mt-4">
            <GameCatalogEditor />
          </TabsContent>

          <TabsContent value="images" className="mt-4">
            <AppAssetsEditor />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
