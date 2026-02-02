import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface NumberGuessGameProps {
  onBack: () => void;
}

export function NumberGuessGame({ onBack }: NumberGuessGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [guess, setGuess] = useState('50');
  const [result, setResult] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = async () => {
    const bet = parseInt(betAmount);
    const guessNum = parseInt(guess);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!guessNum || guessNum < 1 || guessNum > 100) {
      toast.error('Guess must be between 1 and 100');
      return;
    }
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsPlaying(true);

    setTimeout(async () => {
      const randomNumber = Math.floor(Math.random() * 100) + 1;
      setResult(randomNumber);

      const difference = Math.abs(randomNumber - guessNum);
      let multiplier = 0;
      if (difference === 0) multiplier = 10;
      else if (difference <= 5) multiplier = 5;
      else if (difference <= 10) multiplier = 3;
      else if (difference <= 20) multiplier = 1.5;

      const winAmount = Math.floor(bet * multiplier);
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
      });

      if (winAmount > bet) {
        toast.success(`Number was ${randomNumber}! You won ${winAmount} diamonds! (${multiplier}x)`);
      } else {
        toast.error(`Number was ${randomNumber}! You lost ${bet} diamonds`);
      }

      setIsPlaying(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lobby
      </Button>

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Number Guess</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center mb-8">
            <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-white">{result !== null ? result : '?'}</div>
                <div className="text-sm text-gray-200 mt-2">1-100</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="guess">Your Guess (1-100)</Label>
              <Input
                id="guess"
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={isPlaying}
                min="1"
                max="100"
              />
            </div>

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
              {isPlaying ? 'Revealing...' : 'GUESS'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Exact = 10x | ±5 = 5x | ±10 = 3x | ±20 = 1.5x</p>
        </div>
      </div>
    </div>
  );
}
