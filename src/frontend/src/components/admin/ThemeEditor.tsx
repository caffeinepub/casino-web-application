import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Palette, Loader2, Sparkles } from 'lucide-react';
import { useGetThemeConfig, useSetThemeConfig } from '../../hooks/useQueries';
import type { ThemeConfig } from '../../backend';
import { toast } from 'sonner';
import { themePresets } from '../../lib/themePresets';
import { GradientEditorField } from './GradientEditorField';

export function ThemeEditor() {
  const { data: themeConfig, isLoading } = useGetThemeConfig();
  const setThemeConfig = useSetThemeConfig();

  const [formData, setFormData] = useState<ThemeConfig>({
    primaryColor: '#ec4899',
    accentColor: '#f472b6',
    bgGradient: 'linear-gradient(135deg, #000000 0%, #1a0033 50%, #0a0015 100%)',
    surfaceGradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.2), rgba(139, 92, 246, 0.15))',
    navigationGradient: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8), rgba(26, 0, 51, 0.6))',
    cardGradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.25), rgba(139, 92, 246, 0.2))',
  });

  useEffect(() => {
    if (themeConfig) {
      setFormData(themeConfig);
    }
  }, [themeConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.primaryColor || !formData.accentColor || !formData.bgGradient) {
      toast.error('All theme fields are required');
      return;
    }

    try {
      await setThemeConfig.mutateAsync(formData);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      setFormData(preset.config);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading theme...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Customization
        </h3>
        <p className="text-sm text-muted-foreground">
          Customize the global color scheme and gradients for your site. Changes apply immediately to all users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Quick Presets
          </CardTitle>
          <CardDescription>Apply a preset theme with one click, then customize further</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {themePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="text-left p-4 rounded-lg border-2 border-border hover:border-primary transition-colors bg-card/50 hover:bg-card"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-md border flex-shrink-0"
                    style={{ background: preset.config.bgGradient }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{preset.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colors</CardTitle>
            <CardDescription>Primary and accent colors for buttons and highlights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#ec4899"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    placeholder="#f472b6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gradients</CardTitle>
            <CardDescription>Visual gradient editor with live preview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <GradientEditorField
              label="Background Gradient"
              value={formData.bgGradient}
              onChange={(value) => setFormData({ ...formData, bgGradient: value })}
              description="Main application background"
            />

            <GradientEditorField
              label="Surface Gradient"
              value={formData.surfaceGradient}
              onChange={(value) => setFormData({ ...formData, surfaceGradient: value })}
              description="Cards and elevated surfaces"
            />

            <GradientEditorField
              label="Navigation Gradient"
              value={formData.navigationGradient}
              onChange={(value) => setFormData({ ...formData, navigationGradient: value })}
              description="Header and navigation bar"
            />

            <GradientEditorField
              label="Card Gradient"
              value={formData.cardGradient}
              onChange={(value) => setFormData({ ...formData, cardGradient: value })}
              description="Game cards and content cards"
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={setThemeConfig.isPending}
          className="w-full"
        >
          {setThemeConfig.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Theme'
          )}
        </Button>
      </form>

      <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted/50 rounded-lg">
        <p className="font-semibold">Tips:</p>
        <p>• Start with a preset and customize from there</p>
        <p>• Use the visual editor for easy color selection</p>
        <p>• Switch to raw CSS mode for advanced gradient control</p>
        <p>• Changes apply immediately after saving</p>
      </div>
    </div>
  );
}
