import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface RouletteGameProps {
  onBack: () => void;
}

export function RouletteGame({ onBack }: RouletteGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [betType, setBetType] = useState<'red' | 'black' | 'even' | 'odd'>('red');
  const [result, setResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

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
    setResult(null);

    setTimeout(async () => {
      const number = Math.floor(Math.random() * 37); // 0-36
      setResult(number);

      const isRed = redNumbers.includes(number);
      const isEven = number !== 0 && number % 2 === 0;

      let won = false;
      if (betType === 'red' && isRed) won = true;
      if (betType === 'black' && !isRed && number !== 0) won = true;
      if (betType === 'even' && isEven) won = true;
      if (betType === 'odd' && !isEven && number !== 0) won = true;

      const winAmount = won ? bet * 2 : 0;
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
      });

      if (won) {
        toast.success(`Number ${number}! You won ${winAmount} diamonds!`);
      } else {
        toast.error(`Number ${number}! You lost ${bet} diamonds`);
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
        <h2 className="text-3xl font-bold text-white text-center mb-6">Roulette</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center mb-8">
            <div className="w-48 h-48 rounded-full border-8 border-yellow-500 flex items-center justify-center bg-gradient-to-br from-red-900 to-black">
              {result !== null ? (
                <div className="text-center">
                  <div className="text-6xl font-bold text-white">{result}</div>
                  <div className="text-sm text-gray-300">
                    {result === 0 ? 'Green' : redNumbers.includes(result) ? 'Red' : 'Black'}
                  </div>
                </div>
              ) : (
                <div className="text-white text-xl">{isSpinning ? 'Spinning...' : 'Place Bet'}</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Bet On</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Button
                  onClick={() => setBetType('red')}
                  variant={betType === 'red' ? 'default' : 'outline'}
                  className={betType === 'red' ? 'bg-red-600' : ''}
                  disabled={isSpinning}
                >
                  Red
                </Button>
                <Button
                  onClick={() => setBetType('black')}
                  variant={betType === 'black' ? 'default' : 'outline'}
                  className={betType === 'black' ? 'bg-black' : ''}
                  disabled={isSpinning}
                >
                  Black
                </Button>
                <Button
                  onClick={() => setBetType('even')}
                  variant={betType === 'even' ? 'default' : 'outline'}
                  disabled={isSpinning}
                >
                  Even
                </Button>
                <Button
                  onClick={() => setBetType('odd')}
                  variant={betType === 'odd' ? 'default' : 'outline'}
                  disabled={isSpinning}
                >
                  Odd
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
          <p>Win 2x on Red, Black, Even, or Odd</p>
        </div>
      </div>
    </div>
  );
}
