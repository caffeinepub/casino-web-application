import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Upload, Image as ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import { APP_ASSETS, getAssetById, type AppAsset as AppAssetDef } from '../../lib/appAssets';
import { useGetAllAssets, useStoreAsset, useUpdateAsset } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import type { AppAsset } from '../../backend';
import { toast } from 'sonner';
import { getCacheBustedUrl } from '../../utils/cacheBusting';
import { importImageFromUrl } from '../../utils/imageUrlImport';

export function AppAssetsEditor() {
  const { data: allAssets = [], isLoading, refetch } = useGetAllAssets();
  const storeAsset = useStoreAsset();
  const updateAsset = useUpdateAsset();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

  const handleFileUpload = async (assetId: string, file: File) => {
    // Validate file type - explicitly allow GIF
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Create ExternalBlob with upload progress tracking
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress((prev) => ({ ...prev, [assetId]: percentage }));
      });

      const assetDef = getAssetById(assetId);
      const now = Date.now();
      
      const asset: AppAsset = {
        assetId,
        blob,
        name: assetDef?.label || assetId,
        description: `${assetDef?.label || assetId} image`,
        assetCategory: assetDef?.category || 'icon',
        updatedAt: BigInt(now),
      };

      // Check if asset exists
      const existingAsset = allAssets.find(a => a.assetId === assetId);
      
      if (existingAsset) {
        await updateAsset.mutateAsync({ assetId, asset });
      } else {
        await storeAsset.mutateAsync(asset);
      }
      
      // Clear progress
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[assetId];
        return newProgress;
      });
      
      // Refetch to get the latest data with new blob references
      await refetch();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[assetId];
        return newProgress;
      });
    }
  };

  const handleUrlImport = async (assetId: string) => {
    const url = urlInputs[assetId]?.trim();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    const blob = await importImageFromUrl(url);
    if (blob) {
      const assetDef = getAssetById(assetId);
      const now = Date.now();
      
      const asset: AppAsset = {
        assetId,
        blob,
        name: assetDef?.label || assetId,
        description: `${assetDef?.label || assetId} image`,
        assetCategory: assetDef?.category || 'icon',
        updatedAt: BigInt(now),
      };

      // Check if asset exists
      const existingAsset = allAssets.find(a => a.assetId === assetId);
      
      try {
        if (existingAsset) {
          await updateAsset.mutateAsync({ assetId, asset });
        } else {
          await storeAsset.mutateAsync(asset);
        }
        
        // Clear URL input
        setUrlInputs(prev => {
          const updated = { ...prev };
          delete updated[assetId];
          return updated;
        });
        
        // Refetch to get the latest data
        await refetch();
      } catch (error: any) {
        console.error('Asset save error:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading assets...</span>
      </div>
    );
  }

  // Group assets by category
  const brandingAssets = APP_ASSETS.filter(a => a.category === 'branding');
  const gameAssets = APP_ASSETS.filter(a => a.category === 'game-cover');
  const iconAssets = APP_ASSETS.filter(a => a.category === 'icon');

  const renderAssetCard = (asset: AppAssetDef) => {
    const persistedAsset = allAssets.find(a => a.assetId === asset.id);
    const currentSrc = persistedAsset 
      ? getCacheBustedUrl(persistedAsset.blob, persistedAsset.updatedAt)
      : asset.fallbackPath;
    const isUploading = uploadProgress[asset.id] !== undefined;
    const progress = uploadProgress[asset.id] || 0;

    return (
      <Card key={asset.id} className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {asset.label}
          </CardTitle>
          <CardDescription className="text-xs">
            {asset.category === 'branding' && 'Site branding image'}
            {asset.category === 'game-cover' && 'Game lobby cover image'}
            {asset.category === 'icon' && 'UI icon'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={currentSrc}
              alt={asset.label}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== asset.fallbackPath) {
                  target.src = asset.fallbackPath;
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`upload-${asset.id}`} className="text-xs">
              {persistedAsset ? 'Replace Image' : 'Upload Custom Image'}
            </Label>
            <div className="flex gap-2">
              <input
                id={`upload-${asset.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(asset.id, file);
                  }
                  e.target.value = '';
                }}
                disabled={isUploading}
              />
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => document.getElementById(`upload-${asset.id}`)?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {progress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="url"
                value={urlInputs[asset.id] || ''}
                onChange={(e) => setUrlInputs(prev => ({ ...prev, [asset.id]: e.target.value }))}
                placeholder="Or paste image URL"
                className="flex-1 text-xs"
                disabled={isUploading}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUrlImport(asset.id)}
                disabled={isUploading}
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>
            {persistedAsset && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Custom image active
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">App Images & Art</h3>
        <p className="text-sm text-muted-foreground">
          Replace default images with your own. Upload from file or paste image URL. Supports GIF animations.
        </p>
      </div>

      {brandingAssets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold">Site Branding</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brandingAssets.map(renderAssetCard)}
          </div>
        </div>
      )}

      {gameAssets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold">Game Covers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameAssets.map(renderAssetCard)}
          </div>
        </div>
      )}

      {iconAssets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold">Icons</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {iconAssets.map(renderAssetCard)}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted/50 rounded-lg">
        <p className="font-semibold">Tips:</p>
        <p>• Upload from file or paste image URL (http/https only)</p>
        <p>• Supported formats: JPG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 5MB per image</p>
        <p>• Changes are visible immediately after upload</p>
      </div>
    </div>
  );
}
