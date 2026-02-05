import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useGetBannerConfig, useSetBannerConfig } from '../../hooks/useQueries';
import type { BannerConfig } from '../../backend';
import { ExternalBlob } from '../../backend';
import { toast } from 'sonner';
import { getCacheBustedUrl } from '../../utils/cacheBusting';
import { importImageFromUrl } from '../../utils/imageUrlImport';

export function BottomBannerEditor() {
  const { data: bannerConfig, isLoading } = useGetBannerConfig();
  const setBannerConfig = useSetBannerConfig();

  const [formData, setFormData] = useState<BannerConfig>({
    enabled: false,
    bannerImage: undefined,
    destinationUrl: '',
    height: BigInt(80),
    padding: BigInt(16),
    backgroundColor: '#1e3a8a',
    objectFit: 'cover',
    updatedAt: BigInt(Date.now()),
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');

  useEffect(() => {
    if (bannerConfig) {
      setFormData(bannerConfig);
      if (bannerConfig.bannerImage) {
        setPreviewUrl(getCacheBustedUrl(bannerConfig.bannerImage, bannerConfig.updatedAt));
      }
    }
  }, [bannerConfig]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setFormData({ ...formData, bannerImage: blob, updatedAt: BigInt(Date.now()) });
      setUploadProgress(null);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadProgress(null);
      toast.error('Failed to upload image');
    }
  };

  const handleImageUrlImport = async () => {
    const url = urlInput.trim();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    const blob = await importImageFromUrl(url);
    if (blob) {
      setPreviewUrl(url);
      setFormData({ ...formData, bannerImage: blob, updatedAt: BigInt(Date.now()) });
      setUrlInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.enabled && !formData.bannerImage) {
      toast.error('Please upload a banner image');
      return;
    }

    if (formData.enabled && !formData.destinationUrl.trim()) {
      toast.error('Please enter a destination URL');
      return;
    }

    try {
      const submitData = { ...formData, updatedAt: BigInt(Date.now()) };
      await setBannerConfig.mutateAsync(submitData);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading banner config...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Bottom Banner Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure a clickable promotional banner that appears at the bottom of all pages.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Banner Status</CardTitle>
            <CardDescription>Enable or disable the bottom banner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="banner-enabled" className="cursor-pointer">
                Banner Enabled
              </Label>
              <Switch
                id="banner-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {formData.enabled && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Banner Image</CardTitle>
                <CardDescription>Upload an image or paste URL (supports GIF animation)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[8/1] bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Banner preview"
                      className="w-full h-full"
                      style={{ objectFit: formData.objectFit as any }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No image uploaded</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="banner-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                      e.target.value = '';
                    }}
                    disabled={uploadProgress !== null}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                    disabled={uploadProgress !== null}
                  >
                    {uploadProgress !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {previewUrl ? 'Replace Image' : 'Upload Image'}
                      </>
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Or paste image URL"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUrlImport}
                      disabled={uploadProgress !== null}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Banner Settings</CardTitle>
                <CardDescription>Configure banner appearance and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destinationUrl">Destination URL</Label>
                  <Input
                    id="destinationUrl"
                    type="url"
                    value={formData.destinationUrl}
                    onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL to open when the banner is clicked
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectFit">Image Fit Mode</Label>
                  <Select
                    value={formData.objectFit}
                    onValueChange={(value) => setFormData({ ...formData, objectFit: value })}
                  >
                    <SelectTrigger id="objectFit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover (Fill Space)</SelectItem>
                      <SelectItem value="contain">Contain (Show Full Image)</SelectItem>
                      <SelectItem value="fill">Fill (Stretch)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How the image should fit within the banner space
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="40"
                      max="200"
                      value={Number(formData.height)}
                      onChange={(e) => setFormData({ ...formData, height: BigInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="padding">Padding (px)</Label>
                    <Input
                      id="padding"
                      type="number"
                      min="0"
                      max="50"
                      value={Number(formData.padding)}
                      onChange={(e) => setFormData({ ...formData, padding: BigInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      id="backgroundColor"
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      placeholder="#1e3a8a"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Button
          type="submit"
          disabled={setBannerConfig.isPending}
          className="w-full"
        >
          {setBannerConfig.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Banner Configuration'
          )}
        </Button>
      </form>

      <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted/50 rounded-lg">
        <p className="font-semibold">Tips:</p>
        <p>• Upload from file or paste image URL (http/https only)</p>
        <p>• Supported formats: JPG, PNG, GIF (animated GIFs will play)</p>
        <p>• Recommended aspect ratio: 8:1 (wide banner)</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Use "Cover" to fill the space or "Contain" to show the full image</p>
      </div>
    </div>
  );
}
