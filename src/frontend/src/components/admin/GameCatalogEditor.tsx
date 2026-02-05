import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useGetAllGameCatalogEntries, useUpdateGameCatalogEntry, useAddGameCatalogEntry } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getCacheBustedUrl } from '../../utils/cacheBusting';
import { importImageFromUrl } from '../../utils/imageUrlImport';

const DEFAULT_GAMES = [
  { gameId: 'slots', title: 'Slots', description: 'Classic slot machine', defaultImage: '/assets/generated/slot-reels.dim_400x300.png' },
  { gameId: 'blackjack', title: 'Blackjack', description: 'Beat the dealer', defaultImage: '/assets/generated/blackjack-cards.dim_400x250.png' },
  { gameId: 'dice', title: 'Dice Roll', description: 'Roll the dice', defaultImage: '/assets/generated/dice-pair.dim_200x200.png' },
  { gameId: 'wheel', title: 'Wheel Spin', description: 'Fortune wheel', defaultImage: '/assets/generated/fortune-wheel.dim_300x300.png' },
  { gameId: 'jackpot', title: 'Jackpot', description: 'Progressive jackpot', defaultImage: '/assets/generated/jackpot-coins.dim_400x300.png' },
];

interface GameFormData {
  gameId: string;
  title: string;
  description: string;
  icon: ExternalBlob | null;
  previewUrl: string;
  hasPersistedEntry: boolean;
}

export function GameCatalogEditor() {
  const { data: catalogEntries = [], isLoading, refetch } = useGetAllGameCatalogEntries();
  const updateEntry = useUpdateGameCatalogEntry();
  const addEntry = useAddGameCatalogEntry();
  const [editingGames, setEditingGames] = useState<Map<string, GameFormData>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialGames = new Map<string, GameFormData>();
    
    DEFAULT_GAMES.forEach(defaultGame => {
      const existingEntry = catalogEntries.find(e => e.gameId === defaultGame.gameId);
      
      if (existingEntry) {
        // Use persisted catalog entry data with cache-busted URL
        initialGames.set(defaultGame.gameId, {
          gameId: existingEntry.gameId,
          title: existingEntry.title,
          description: existingEntry.description,
          icon: existingEntry.icon,
          previewUrl: getCacheBustedUrl(existingEntry.icon, existingEntry.updatedAt),
          hasPersistedEntry: true,
        });
      } else {
        // Use default game data with default image
        initialGames.set(defaultGame.gameId, {
          gameId: defaultGame.gameId,
          title: defaultGame.title,
          description: defaultGame.description,
          icon: null,
          previewUrl: defaultGame.defaultImage,
          hasPersistedEntry: false,
        });
      }
    });
    
    setEditingGames(initialGames);
  }, [catalogEntries]);

  const handleImageUpload = async (gameId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(prev => new Map(prev).set(gameId, percentage));
      });

      const previewUrl = URL.createObjectURL(file);
      
      setEditingGames(prev => {
        const updated = new Map(prev);
        const game = updated.get(gameId);
        if (game) {
          updated.set(gameId, { ...game, icon: blob, previewUrl });
        }
        return updated;
      });

      setUploadProgress(prev => {
        const updated = new Map(prev);
        updated.delete(gameId);
        return updated;
      });
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    }
  };

  const handleImageUrlImport = async (gameId: string) => {
    const url = urlInputs[gameId]?.trim();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    const blob = await importImageFromUrl(url);
    if (blob) {
      setEditingGames(prev => {
        const updated = new Map(prev);
        const game = updated.get(gameId);
        if (game) {
          updated.set(gameId, { ...game, icon: blob, previewUrl: url });
        }
        return updated;
      });
      
      // Clear URL input
      setUrlInputs(prev => {
        const updated = { ...prev };
        delete updated[gameId];
        return updated;
      });
    }
  };

  const handleSave = async (gameId: string) => {
    const game = editingGames.get(gameId);
    if (!game) return;

    if (!game.title.trim() || !game.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    if (!game.icon) {
      toast.error('Please upload a cover image');
      return;
    }

    try {
      const entry = {
        gameId: game.gameId,
        title: game.title,
        description: game.description,
        icon: game.icon,
        updatedAt: BigInt(Date.now()),
      };

      if (game.hasPersistedEntry) {
        await updateEntry.mutateAsync({ gameId, entry });
      } else {
        await addEntry.mutateAsync(entry);
      }
      
      // Refetch to get the latest data with new blob references
      await refetch();
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  };

  const handleFieldChange = (gameId: string, field: 'title' | 'description', value: string) => {
    setEditingGames(prev => {
      const updated = new Map(prev);
      const game = updated.get(gameId);
      if (game) {
        updated.set(gameId, { ...game, [field]: value });
      }
      return updated;
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading game catalog...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-400 mb-4">
        Customize the game catalog by editing titles, descriptions, and cover images for each game. Upload from file or paste image URL.
      </div>

      {Array.from(editingGames.entries()).map(([gameId, game]) => {
        const progress = uploadProgress.get(gameId);
        const isSaving = updateEntry.isPending || addEntry.isPending;

        return (
          <Card key={gameId} className="bg-card/50 backdrop-blur border-white/10">
            <CardHeader>
              <CardTitle className="text-lg capitalize flex items-center justify-between">
                <span>{gameId}</span>
                {game.hasPersistedEntry && (
                  <span className="text-xs font-normal text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    Custom Image Active
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`${gameId}-title`}>Game Title</Label>
                    <Input
                      id={`${gameId}-title`}
                      value={game.title}
                      onChange={(e) => handleFieldChange(gameId, 'title', e.target.value)}
                      placeholder="Enter game title"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${gameId}-description`}>Description</Label>
                    <Textarea
                      id={`${gameId}-description`}
                      value={game.description}
                      onChange={(e) => handleFieldChange(gameId, 'description', e.target.value)}
                      placeholder="Enter game description"
                      className="bg-white/10 border-white/20 text-white resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="relative aspect-video bg-black/30 rounded-lg overflow-hidden border border-white/10">
                    {game.previewUrl ? (
                      <img
                        src={game.previewUrl}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    {progress !== undefined && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-white text-sm">Uploading: {progress}%</div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(gameId, file);
                      }}
                      className="hidden"
                      id={`${gameId}-upload`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById(`${gameId}-upload`)?.click()}
                      disabled={progress !== undefined}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {game.hasPersistedEntry ? 'Replace Image' : 'Upload New Image'}
                    </Button>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={urlInputs[gameId] || ''}
                        onChange={(e) => setUrlInputs(prev => ({ ...prev, [gameId]: e.target.value }))}
                        placeholder="Or paste image URL"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleImageUrlImport(gameId)}
                        disabled={progress !== undefined}
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSave(gameId)}
                disabled={isSaving || !game.icon}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
