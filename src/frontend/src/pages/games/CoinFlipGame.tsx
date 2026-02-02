import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface CoinFlipGameProps {
  onBack: () => void;
}

export function CoinFlipGame({ onBack }: CoinFlipGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const flip = async () => {
    const bet = parseInt(betAmount);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsFlipping(true);
    setResult(null);

    setTimeout(async () => {
      const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
      setResult(coinResult);

      const won = coinResult === choice;
      const winAmount = won ? bet * 2 : 0;
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
      });

      if (won) {
        toast.success(`${coinResult}! You won ${winAmount} diamonds!`);
      } else {
        toast.error(`${coinResult}! You lost ${bet} diamonds`);
      }

      setIsFlipping(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lobby
      </Button>

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Coin Flip</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center mb-8">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg ${isFlipping ? 'animate-spin' : ''}`}>
              {result ? (result === 'heads' ? 'H' : 'T') : '?'}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Choose Side</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  onClick={() => setChoice('heads')}
                  variant={choice === 'heads' ? 'default' : 'outline'}
                  disabled={isFlipping}
                >
                  Heads
                </Button>
                <Button
                  onClick={() => setChoice('tails')}
                  variant={choice === 'tails' ? 'default' : 'outline'}
                  disabled={isFlipping}
                >
                  Tails
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="bet">Bet Amount</Label>
              <Input
                id="bet"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isFlipping}
                min="1"
              />
            </div>

            <Button
              onClick={flip}
              disabled={isFlipping}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
            >
              {isFlipping ? 'Flipping...' : 'FLIP'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Win 2x your bet!</p>
        </div>
      </div>
    </div>
  );
}
