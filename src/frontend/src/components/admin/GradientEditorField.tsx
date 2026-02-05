import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { parseGradient, serializeGradient, type ParsedGradient } from '../../lib/gradientUtils';

interface GradientEditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export function GradientEditorField({ label, value, onChange, description }: GradientEditorFieldProps) {
  const [mode, setMode] = useState<'visual' | 'raw'>('visual');
  const [rawValue, setRawValue] = useState(value);
  const [parsedGradient, setParsedGradient] = useState<ParsedGradient | null>(null);

  useEffect(() => {
    setRawValue(value);
    const parsed = parseGradient(value);
    setParsedGradient(parsed);
  }, [value]);

  const handleRawChange = (newValue: string) => {
    setRawValue(newValue);
    onChange(newValue);
    const parsed = parseGradient(newValue);
    setParsedGradient(parsed);
  };

  const handleVisualChange = (stopIndex: number, newColor: string) => {
    if (!parsedGradient) return;

    const newStops = [...parsedGradient.stops];
    newStops[stopIndex] = { ...newStops[stopIndex], color: newColor };

    const newGradient = { ...parsedGradient, stops: newStops };
    const serialized = serializeGradient(newGradient);
    
    setRawValue(serialized);
    onChange(serialized);
    setParsedGradient(newGradient);
  };

  const handleDirectionChange = (newDirection: string) => {
    if (!parsedGradient) return;

    const newGradient = { ...parsedGradient, direction: newDirection };
    const serialized = serializeGradient(newGradient);
    
    setRawValue(serialized);
    onChange(serialized);
    setParsedGradient(newGradient);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'visual' | 'raw')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="raw">Raw CSS</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-3">
          {parsedGradient && parsedGradient.stops.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Direction</Label>
                <select
                  value={parsedGradient.direction || 'to bottom'}
                  onChange={(e) => handleDirectionChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="to bottom">Top to Bottom</option>
                  <option value="to top">Bottom to Top</option>
                  <option value="to right">Left to Right</option>
                  <option value="to left">Right to Left</option>
                  <option value="to bottom right">Top-Left to Bottom-Right</option>
                  <option value="to bottom left">Top-Right to Bottom-Left</option>
                  <option value="135deg">Diagonal (135°)</option>
                  <option value="90deg">Horizontal (90°)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Color Stops</Label>
                {parsedGradient.stops.map((stop, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={stop.color.startsWith('#') ? stop.color : '#000000'}
                      onChange={(e) => handleVisualChange(index, e.target.value)}
                      className="w-16 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={stop.color}
                      onChange={(e) => handleVisualChange(index, e.target.value)}
                      className="flex-1"
                      placeholder="Color"
                    />
                    <span className="text-xs text-muted-foreground w-12">Stop {index + 1}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to parse gradient. Use Raw CSS mode to edit.
            </p>
          )}
        </TabsContent>

        <TabsContent value="raw" className="space-y-3">
          <Input
            value={rawValue}
            onChange={(e) => handleRawChange(e.target.value)}
            placeholder="linear-gradient(to bottom, #000, #fff)"
            className="font-mono text-xs"
          />
        </TabsContent>
      </Tabs>

      <div 
        className="h-16 rounded-lg border"
        style={{ background: rawValue }}
      />
    </div>
  );
}
