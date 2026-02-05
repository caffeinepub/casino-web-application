import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2, Plus, MoveUp, MoveDown, Upload, Link as LinkIcon } from 'lucide-react';
import { useGetSymbolSet, useUpdateSymbolSet } from '../../hooks/useQueries';
import type { Symbol, GameSymbolSet } from '../../backend';
import { ExternalBlob } from '../../backend';
import { toast } from 'sonner';
import { getCacheBustedUrl } from '../../utils/cacheBusting';
import { importImageFromUrl } from '../../utils/imageUrlImport';

type GameType = 'slots' | 'dice' | 'cards' | 'wheel';

interface SymbolWithPreview extends Omit<Symbol, 'image'> {
  image: ExternalBlob | string;
  previewUrl?: string;
}

export function SymbolSetEditor() {
  const [selectedGame, setSelectedGame] = useState<GameType>('slots');
  const { data: symbolSet, isLoading, refetch } = useGetSymbolSet(selectedGame);
  const updateSymbolSet = useUpdateSymbolSet();
  
  const [symbols, setSymbols] = useState<SymbolWithPreview[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (symbolSet) {
      const gameSymbols = symbolSet[selectedGame] || [];
      const symbolsWithPreview: SymbolWithPreview[] = gameSymbols.map(s => ({
        id: s.id,
        name: s.name,
        image: s.image,
        updatedAt: s.updatedAt,
        previewUrl: getCacheBustedUrl(s.image, s.updatedAt),
      }));
      setSymbols(symbolsWithPreview);
    }
  }, [symbolSet, selectedGame]);

  const handleAddSymbol = () => {
    const newSymbol: SymbolWithPreview = {
      id: `symbol_${Date.now()}`,
      name: 'New Symbol',
      image: '',
      updatedAt: BigInt(Date.now()),
      previewUrl: undefined,
    };
    setSymbols([...symbols, newSymbol]);
    setEditingIndex(symbols.length);
  };

  const handleRemoveSymbol = (index: number) => {
    if (symbols.length <= 1) {
      toast.error('Cannot remove the last symbol');
      return;
    }
    setSymbols(symbols.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSymbols = [...symbols];
    [newSymbols[index - 1], newSymbols[index]] = [newSymbols[index], newSymbols[index - 1]];
    setSymbols(newSymbols);
    if (editingIndex === index) {
      setEditingIndex(index - 1);
    } else if (editingIndex === index - 1) {
      setEditingIndex(index);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === symbols.length - 1) return;
    const newSymbols = [...symbols];
    [newSymbols[index], newSymbols[index + 1]] = [newSymbols[index + 1], newSymbols[index]];
    setSymbols(newSymbols);
    if (editingIndex === index) {
      setEditingIndex(index + 1);
    } else if (editingIndex === index + 1) {
      setEditingIndex(index);
    }
  };

  const handleUpdateSymbol = (index: number, field: 'id' | 'name', value: string) => {
    const newSymbols = [...symbols];
    newSymbols[index] = { ...newSymbols[index], [field]: value };
    setSymbols(newSymbols);
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);
      
      const previewUrl = URL.createObjectURL(file);
      
      const newSymbols = [...symbols];
      newSymbols[index] = {
        ...newSymbols[index],
        image: blob,
        previewUrl,
        updatedAt: BigInt(Date.now()),
      };
      setSymbols(newSymbols);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to read image file');
      console.error('Image upload error:', error);
    }
  };

  const handleImageUrlImport = async (index: number) => {
    const url = urlInputs[index]?.trim();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    const blob = await importImageFromUrl(url);
    if (blob) {
      const newSymbols = [...symbols];
      newSymbols[index] = {
        ...newSymbols[index],
        image: blob,
        previewUrl: url, // Use URL as preview temporarily
        updatedAt: BigInt(Date.now()),
      };
      setSymbols(newSymbols);
      
      // Clear URL input
      setUrlInputs(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  const validateAndSave = async () => {
    // Validate all symbols
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      if (!symbol.id.trim()) {
        toast.error(`Symbol ${i + 1}: ID cannot be empty`);
        return;
      }
      
      if (!symbol.name.trim()) {
        toast.error(`Symbol ${i + 1}: Name cannot be empty`);
        return;
      }
      
      if (!symbol.image || symbol.image === '') {
        toast.error(`Symbol ${i + 1}: Image is required`);
        return;
      }
    }

    if (symbols.length === 0) {
      toast.error('At least one symbol is required');
      return;
    }

    if (symbols.length > 100) {
      toast.error('Maximum 100 symbols allowed');
      return;
    }

    // Convert to backend format
    const backendSymbols: Symbol[] = symbols.map(s => ({
      id: s.id,
      name: s.name,
      image: s.image instanceof ExternalBlob ? s.image : ExternalBlob.fromBytes(new Uint8Array()),
      updatedAt: s.updatedAt || BigInt(Date.now()),
    }));

    // Build the full symbol set
    const fullSymbolSet: GameSymbolSet = {
      slots: selectedGame === 'slots' ? backendSymbols : (symbolSet?.slots || []),
      dice: selectedGame === 'dice' ? backendSymbols : (symbolSet?.dice || []),
      cards: selectedGame === 'cards' ? backendSymbols : (symbolSet?.cards || []),
      wheel: selectedGame === 'wheel' ? backendSymbols : (symbolSet?.wheel || []),
    };

    try {
      await updateSymbolSet.mutateAsync({
        gameType: selectedGame,
        symbolSet: fullSymbolSet,
      });
      // Refetch to get the latest data with new blob references
      await refetch();
      setEditingIndex(null);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  if (isLoading) {
    return <div className="text-white text-center py-8">Loading symbols...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="gameSelect" className="text-white">Select Game</Label>
        <Select value={selectedGame} onValueChange={(value) => setSelectedGame(value as GameType)}>
          <SelectTrigger id="gameSelect" className="bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slots">Slot Machine</SelectItem>
            <SelectItem value="dice">Dice Roll</SelectItem>
            <SelectItem value="cards">Cards (Blackjack)</SelectItem>
            <SelectItem value="wheel">Wheel Spin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {symbols.map((symbol, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center overflow-hidden">
                  {symbol.previewUrl ? (
                    <img src={symbol.previewUrl} alt={symbol.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-xs">No image</span>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{symbol.name}</div>
                  <div className="text-gray-400 text-xs">ID: {symbol.id}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-white"
                >
                  <MoveUp className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === symbols.length - 1}
                  className="text-white"
                >
                  <MoveDown className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="text-white"
                >
                  {editingIndex === index ? 'Close' : 'Edit'}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveSymbol(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {editingIndex === index && (
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div>
                  <Label className="text-white text-xs">ID</Label>
                  <Input
                    value={symbol.id}
                    onChange={(e) => handleUpdateSymbol(index, 'id', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white text-xs">Name</Label>
                  <Input
                    value={symbol.name}
                    onChange={(e) => handleUpdateSymbol(index, 'name', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white text-xs">Image from File</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(index, file);
                        }
                      }}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => document.querySelector<HTMLInputElement>(`input[type="file"]`)?.click()}
                      className="shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-white text-xs">Or Paste Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={urlInputs[index] || ''}
                      onChange={(e) => setUrlInputs(prev => ({ ...prev, [index]: e.target.value }))}
                      placeholder="https://example.com/image.png"
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleImageUrlImport(index)}
                      className="shrink-0"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {symbol.previewUrl && (
                  <div className="mt-2 p-2 bg-white rounded">
                    <img src={symbol.previewUrl} alt="Preview" className="w-full h-32 object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleAddSymbol}
          variant="outline"
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Symbol
        </Button>
        <Button
          onClick={validateAndSave}
          disabled={updateSymbolSet.isPending}
          className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
        >
          {updateSymbolSet.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <p>• Upload images from your device or paste image URLs</p>
        <p>• Supported formats: JPG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 5MB per image</p>
        <p>• Maximum 100 symbols per game</p>
        <p>• Changes apply immediately after saving</p>
      </div>
    </div>
  );
}
