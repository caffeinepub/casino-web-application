import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useRecordGameOutcome, useGetSymbolSet } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { useParticleSystem } from '../../lib/animations';

interface JackpotGameProps {
  onBack: () => void;
}

const defaultSymbols = ['💎', '🍒', '🍋', '⭐', '7️⃣'];

export function JackpotGame({ onBack }: JackpotGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const recordOutcome = useRecordGameOutcome();
  const { data: symbolSet, isLoading: symbolsLoading } = useGetSymbolSet('slots');
  const [betAmount, setBetAmount] = useState('10');
  const [reels, setReels] = useState([0, 0, 0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelOffsets, setReelOffsets] = useState([0, 0, 0, 0, 0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem(canvasRef);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const symbols = symbolSet?.slots && symbolSet.slots.length > 0 ? symbolSet.slots : null;
  const useEmoji = !symbols || symbolsLoading;
  const symbolCount = useEmoji ? defaultSymbols.length : symbols!.length;

  useEffect(() => {
    if (isSpinning) {
      const startTime = Date.now();
      const duration = 2000;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setReelOffsets([
          Math.sin(progress * Math.PI * 8) * 30,
          Math.sin(progress * Math.PI * 10) * 30,
          Math.sin(progress * Math.PI * 12) * 30,
          Math.sin(progress * Math.PI * 14) * 30,
          Math.sin(progress * Math.PI * 16) * 30,
        ]);
        
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
    setGlowIntensity(0);

    const spinInterval = setInterval(() => {
      setReels(Array(5).fill(0).map(() => Math.floor(Math.random() * symbolCount)));
    }, 100);

    setTimeout(async () => {
      clearInterval(spinInterval);

      const finalReels = Array(5).fill(0).map(() => Math.floor(Math.random() * symbolCount));
      setReels(finalReels);
      setReelOffsets([0, 0, 0, 0, 0]);

      const counts = finalReels.reduce((acc, symbolIndex) => {
        acc[symbolIndex] = (acc[symbolIndex] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const maxMatch = Math.max(...Object.values(counts));
      let multiplier = 0;
      if (maxMatch === 5) multiplier = 100;
      else if (maxMatch === 4) multiplier = 20;
      else if (maxMatch === 3) multiplier = 5;
      else if (maxMatch === 2) multiplier = 1;

      const winAmount = Math.floor(bet * multiplier);
      const isWin = winAmount > 0;

      if (isWin && particleSystem.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (maxMatch === 5) {
          particleSystem.current.createConfetti(rect.width / 2, rect.height / 2, 120);
          setGlowIntensity(1);
          setTimeout(() => setGlowIntensity(0), 1500);
        } else if (maxMatch >= 3) {
          particleSystem.current.createSparkles(rect.width / 2, rect.height / 2, 60);
        }
        particleSystem.current.start();
      }

      await recordOutcome.mutateAsync({
        gameType: 'Jackpot',
        betAmount: BigInt(bet),
        winAmount: BigInt(winAmount),
        isWin,
      });

      if (winAmount > bet) {
        toast.success(`${maxMatch} matching! You won ${winAmount} diamonds! (${multiplier}x)`);
      } else if (winAmount === bet) {
        toast.info('Break even!');
      } else {
        toast.error(`No match! You lost ${bet} diamonds`);
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
            background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
          }}
        />

        <h2 className="text-3xl font-bold text-white text-center mb-6 relative z-10">Jackpot</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6 relative z-10">
          <div className="flex justify-center gap-2 mb-8">
            {reels.map((symbolIndex, i) => (
              <div
                key={i}
                className="w-20 h-20 bg-gradient-to-br from-white to-gray-100 rounded-lg flex items-center justify-center shadow-2xl transition-all duration-200 overflow-hidden"
                style={{
                  transform: `translateY(${reelOffsets[i]}px) scale(${isSpinning ? 0.95 : 1})`,
                  boxShadow: isSpinning
                    ? '0 0 30px rgba(255, 215, 0, 0.5)'
                    : '0 10px 25px rgba(0, 0, 0, 0.5)',
                }}
              >
                {useEmoji ? (
                  <span className="text-4xl">{defaultSymbols[symbolIndex]}</span>
                ) : (
                  <img
                    src={symbols![symbolIndex].image.getDirectURL()}
                    alt={symbols![symbolIndex].name}
                    className="w-full h-full object-contain p-2"
                  />
                )}
              </div>
            ))}
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
        </div>

        <div className="text-center text-sm text-gray-300 relative z-10">
          <p>5 match = 100x | 4 match = 20x | 3 match = 5x | 2 match = 1x</p>
        </div>
      </div>
    </div>
  );
}
