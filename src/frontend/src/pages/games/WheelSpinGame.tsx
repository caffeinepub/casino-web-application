import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useRecordGameOutcome, useGetSymbolSet } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { useParticleSystem, easeOutCubic } from '../../lib/animations';

interface WheelSpinGameProps {
  onBack: () => void;
}

const segments = [
  { multiplier: 0, color: '#6B7280', probability: 0.3 },
  { multiplier: 1, color: '#2563EB', probability: 0.25 },
  { multiplier: 2, color: '#16A34A', probability: 0.2 },
  { multiplier: 3, color: '#CA8A04', probability: 0.15 },
  { multiplier: 5, color: '#EA580C', probability: 0.08 },
  { multiplier: 10, color: '#DC2626', probability: 0.02 },
];

export function WheelSpinGame({ onBack }: WheelSpinGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const recordOutcome = useRecordGameOutcome();
  const { data: symbolSet, isLoading: symbolsLoading } = useGetSymbolSet('wheel');
  const [betAmount, setBetAmount] = useState('10');
  const [result, setResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem(canvasRef);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const symbols = symbolSet?.wheel && symbolSet.wheel.length >= 3 ? symbolSet.wheel : null;
  const useText = !symbols || symbolsLoading;

  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 384;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    ctx.clearRect(0, 0, size, size);

    const anglePerSegment = (2 * Math.PI) / segments.length;

    segments.forEach((segment, i) => {
      const startAngle = i * anglePerSegment - Math.PI / 2;
      const endAngle = startAngle + anglePerSegment;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 2;
      ctx.stroke();

      const textAngle = startAngle + anglePerSegment / 2;
      const textRadius = radius * 0.7;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${segment.multiplier}x`, 0, 0);
      ctx.restore();
    });
  }, []);

  useEffect(() => {
    if (isSpinning) {
      const startTime = Date.now();
      const duration = 2000;
      const totalRotation = 360 * 6 + Math.random() * 360;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        
        setRotation(eased * totalRotation);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isSpinning]);

  const spin = async () => {
    const bet = parseInt(betAmount);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!userProfile || userProfile.diamondBalance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSpinning(true);
    setResult(null);
    setGlowIntensity(0);

    setTimeout(async () => {
      const random = Math.random();
      let cumulative = 0;
      let selectedSegment = segments[0];

      for (const segment of segments) {
        cumulative += segment.probability;
        if (random <= cumulative) {
          selectedSegment = segment;
          break;
        }
      }

      setResult(selectedSegment.multiplier);

      const winAmount = bet * selectedSegment.multiplier;
      const isWin = winAmount > 0;

      if (isWin && particleSystem.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (selectedSegment.multiplier >= 5) {
          particleSystem.current.createConfetti(rect.width / 2, rect.height / 2, 70);
          setGlowIntensity(1);
          setTimeout(() => setGlowIntensity(0), 1000);
        } else {
          particleSystem.current.createSparkles(rect.width / 2, rect.height / 2, 30);
        }
        particleSystem.current.start();
      }

      await recordOutcome.mutateAsync({
        gameType: 'Wheel Spin',
        betAmount: BigInt(bet),
        winAmount: BigInt(winAmount),
        isWin,
      });

      if (winAmount > bet) {
        toast.success(`${selectedSegment.multiplier}x! You won ${winAmount} diamonds!`);
      } else if (winAmount === bet) {
        toast.info('Break even!');
      } else {
        toast.error(`${selectedSegment.multiplier}x! You lost ${bet} diamonds`);
      }

      setIsSpinning(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lobby
      </Button>

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        />
        
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: glowIntensity,
            background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
          }}
        />

        <h2 className="text-3xl font-bold text-white text-center mb-6 relative z-10">Wheel Spin</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div
                className="w-96 h-96 rounded-full border-8 border-yellow-500 shadow-2xl relative overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'none' : 'transform 0.5s ease-out',
                  boxShadow: '0 0 50px rgba(255, 215, 0, 0.6)',
                }}
              >
                <canvas
                  ref={wheelCanvasRef}
                  className="w-full h-full"
                />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-yellow-400 z-20" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bet" className="text-white">Bet Amount</Label>
              <Input
                id="bet"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isSpinning}
                min="1"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <Button
              onClick={spin}
              disabled={isSpinning || recordOutcome.isPending}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {isSpinning ? 'Spinning...' : 'SPIN'}
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-6 gap-2">
            {segments.map((segment, i) => (
              <div
                key={i}
                className="p-2 rounded text-center text-white font-bold transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: segment.color }}
              >
                {segment.multiplier}x
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-300 relative z-10">
          <p>Spin the wheel for a chance to win up to 10x your bet!</p>
        </div>
      </div>
    </div>
  );
}
