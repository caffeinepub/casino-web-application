import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface SlotsGameProps {
  onBack: () => void;
}

const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];

export function SlotsGame({ onBack }: SlotsGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = async () => {
    const bet = parseInt(betAmount);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSpinning(true);

    // Animate spinning
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 100);

    setTimeout(async () => {
      clearInterval(spinInterval);

      // Final result
      const finalReels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];
      setReels(finalReels);

      // Calculate win
      let winMultiplier = 0;
      if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        if (finalReels[0] === '💎') winMultiplier = 10;
        else if (finalReels[0] === '7️⃣') winMultiplier = 5;
        else winMultiplier = 3;
      } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2]) {
        winMultiplier = 1.5;
      }

      const winAmount = Math.floor(bet * winMultiplier);
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
      });

      if (winAmount > bet) {
        toast.success(`You won ${winAmount} diamonds! (${winMultiplier}x)`);
      } else if (winAmount === bet) {
        toast.info('Break even!');
      } else {
        toast.error(`You lost ${bet} diamonds`);
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

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Slot Machine</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center gap-4 mb-8">
            {reels.map((symbol, i) => (
              <div
                key={i}
                className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-5xl shadow-lg"
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
                disabled={isSpinning}
                min="1"
              />
            </div>

            <Button
              onClick={spin}
              disabled={isSpinning}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
            >
              {isSpinning ? 'Spinning...' : 'SPIN'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>💎💎💎 = 10x | 7️⃣7️⃣7️⃣ = 5x | Any 3 = 3x | Any 2 = 1.5x</p>
        </div>
      </div>
    </div>
  );
}
