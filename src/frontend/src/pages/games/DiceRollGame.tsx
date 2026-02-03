import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useRecordGameOutcome, useGetSymbolSet } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { useParticleSystem, easeOutBounce } from '../../lib/animations';

interface DiceRollGameProps {
  onBack: () => void;
}

export function DiceRollGame({ onBack }: DiceRollGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const recordOutcome = useRecordGameOutcome();
  const { data: symbolSet, isLoading: symbolsLoading } = useGetSymbolSet('dice');
  const [betAmount, setBetAmount] = useState('10');
  const [prediction, setPrediction] = useState<'over' | 'under'>('over');
  const [targetNumber, setTargetNumber] = useState('7');
  const [dice, setDice] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [diceRotations, setDiceRotations] = useState([0, 0]);
  const [diceOffsets, setDiceOffsets] = useState([0, 0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem(canvasRef);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const symbols = symbolSet?.dice && symbolSet.dice.length >= 6 ? symbolSet.dice : null;
  const useNumbers = !symbols || symbolsLoading;

  useEffect(() => {
    if (isRolling) {
      const startTime = Date.now();
      const duration = 1500;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const bounced = easeOutBounce(progress);
        
        setDiceRotations([
          progress * 720 + Math.sin(progress * 10) * 45,
          progress * 900 + Math.cos(progress * 12) * 45,
        ]);
        
        setDiceOffsets([
          Math.sin(progress * Math.PI) * -50,
          Math.sin(progress * Math.PI) * -50,
        ]);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDiceRotations([0, 0]);
          setDiceOffsets([0, 0]);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isRolling]);

  const roll = async () => {
    const bet = parseInt(betAmount);
    const target = parseInt(targetNumber);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!target || target < 2 || target > 12) {
      toast.error('Target must be between 2 and 12');
      return;
    }
    if (!userProfile || userProfile.diamondBalance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsRolling(true);
    setGlowIntensity(0);

    const rollInterval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
    }, 100);

    setTimeout(async () => {
      clearInterval(rollInterval);

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2;
      setDice([die1, die2]);

      const won = (prediction === 'over' && total > target) || (prediction === 'under' && total < target);
      const winAmount = won ? bet * 2 : 0;

      if (won && particleSystem.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        particleSystem.current.createExplosion(rect.width / 2, rect.height / 3, '#FFD700', 40);
        particleSystem.current.start();
        setGlowIntensity(1);
        setTimeout(() => setGlowIntensity(0), 1000);
      }

      await recordOutcome.mutateAsync({
        gameType: 'Dice Roll',
        betAmount: BigInt(bet),
        winAmount: BigInt(winAmount),
        isWin: won,
      });

      if (won) {
        toast.success(`Rolled ${total}! You won ${winAmount} diamonds!`);
      } else {
        toast.error(`Rolled ${total}! You lost ${bet} diamonds`);
      }

      setIsRolling(false);
    }, 1500);
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

        <h2 className="text-3xl font-bold text-white text-center mb-6 relative z-10">Dice Roll</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6 relative z-10">
          <div className="flex justify-center gap-4 mb-8">
            {dice.map((die, i) => (
              <div
                key={i}
                className="w-24 h-24 bg-gradient-to-br from-white to-gray-100 rounded-lg flex items-center justify-center shadow-2xl overflow-hidden"
                style={{
                  transform: `translateY(${diceOffsets[i]}px) rotate(${diceRotations[i]}deg) scale(${isRolling ? 0.9 : 1})`,
                  transition: isRolling ? 'none' : 'transform 0.3s ease-out',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                {useNumbers ? (
                  <span className="text-5xl font-bold">{die}</span>
                ) : (
                  <img
                    src={symbols![die - 1].image.getDirectURL()}
                    alt={symbols![die - 1].name}
                    className="w-full h-full object-contain p-2"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-white">Prediction</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  onClick={() => setPrediction('over')}
                  variant={prediction === 'over' ? 'default' : 'outline'}
                  disabled={isRolling}
                  className={`transition-all duration-200 ${prediction === 'over' ? 'scale-105' : ''}`}
                >
                  Over
                </Button>
                <Button
                  onClick={() => setPrediction('under')}
                  variant={prediction === 'under' ? 'default' : 'outline'}
                  disabled={isRolling}
                  className={`transition-all duration-200 ${prediction === 'under' ? 'scale-105' : ''}`}
                >
                  Under
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="target" className="text-white">Target Number (2-12)</Label>
              <Input
                id="target"
                type="number"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                disabled={isRolling}
                min="2"
                max="12"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <Label htmlFor="bet" className="text-white">Bet Amount</Label>
              <Input
                id="bet"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isRolling}
                min="1"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <Button
              onClick={roll}
              disabled={isRolling || recordOutcome.isPending}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {isRolling ? 'Rolling...' : 'ROLL'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300 relative z-10">
          <p>Predict if the total will be over or under your target number. Win 2x!</p>
        </div>
      </div>
    </div>
  );
}
