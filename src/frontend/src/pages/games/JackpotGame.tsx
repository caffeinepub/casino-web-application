import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface JackpotGameProps {
  onBack: () => void;
}

export function JackpotGame({ onBack }: JackpotGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [symbols, setSymbols] = useState(['💎', '💎', '💎', '💎', '💎']);
  const [isPlaying, setIsPlaying] = useState(false);

  const symbolSet = ['💎', '🔔', '⭐', '🍀', '👑'];

  const play = async () => {
    const bet = parseInt(betAmount);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsPlaying(true);

    const spinInterval = setInterval(() => {
      setSymbols(Array(5).fill(0).map(() => symbolSet[Math.floor(Math.random() * symbolSet.length)]));
    }, 100);

    setTimeout(async () => {
      clearInterval(spinInterval);

      const finalSymbols = Array(5).fill(0).map(() => symbolSet[Math.floor(Math.random() * symbolSet.length)]);
      setSymbols(finalSymbols);

      // Count matching symbols
      const counts = finalSymbols.reduce((acc, sym) => {
        acc[sym] = (acc[sym] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const maxCount = Math.max(...Object.values(counts));
      let multiplier = 0;
      if (maxCount === 5) multiplier = 100; // Jackpot!
      else if (maxCount === 4) multiplier = 20;
      else if (maxCount === 3) multiplier = 5;
      else if (maxCount === 2) multiplier = 1.5;

      const winAmount = Math.floor(bet * multiplier);
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
      });

      if (multiplier === 100) {
        toast.success(`🎉 JACKPOT! You won ${winAmount} diamonds!`);
      } else if (winAmount > bet) {
        toast.success(`${maxCount} match! You won ${winAmount} diamonds! (${multiplier}x)`);
      } else if (winAmount === bet) {
        toast.info('Break even!');
      } else {
        toast.error(`You lost ${bet} diamonds`);
      }

      setIsPlaying(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lobby
      </Button>

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Jackpot</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center gap-2 mb-8">
            {symbols.map((symbol, i) => (
              <div
                key={i}
                className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-4xl shadow-lg"
              >
                {symbol}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bet">Bet Amount</Label>
              <Input
                id="bet"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isPlaying}
                min="1"
              />
            </div>

            <Button
              onClick={play}
              disabled={isPlaying}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
            >
              {isPlaying ? 'Spinning...' : 'PLAY'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>5 match = 100x | 4 match = 20x | 3 match = 5x | 2 match = 1.5x</p>
        </div>
      </div>
    </div>
  );
}
