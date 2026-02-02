import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface WheelSpinGameProps {
  onBack: () => void;
}

const segments = [
  { value: 0, color: 'bg-red-600', multiplier: 0 },
  { value: 1, color: 'bg-yellow-500', multiplier: 1.5 },
  { value: 2, color: 'bg-blue-500', multiplier: 2 },
  { value: 3, color: 'bg-green-500', multiplier: 3 },
  { value: 5, color: 'bg-purple-500', multiplier: 5 },
  { value: 10, color: 'bg-pink-500', multiplier: 10 },
];

export function WheelSpinGame({ onBack }: WheelSpinGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [result, setResult] = useState<number | null>(null);
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
    setResult(null);

    setTimeout(async () => {
      const random = Math.random();
      let selectedSegment;
      if (random < 0.4) selectedSegment = segments[0]; // 40% chance of 0
      else if (random < 0.65) selectedSegment = segments[1]; // 25% chance of 1.5x
      else if (random < 0.85) selectedSegment = segments[2]; // 20% chance of 2x
      else if (random < 0.95) selectedSegment = segments[3]; // 10% chance of 3x
      else if (random < 0.99) selectedSegment = segments[4]; // 4% chance of 5x
      else selectedSegment = segments[5]; // 1% chance of 10x

      setResult(selectedSegment.value);

      const winAmount = Math.floor(bet * selectedSegment.multiplier);
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
      });

      if (winAmount > bet) {
        toast.success(`${selectedSegment.multiplier}x! You won ${winAmount} diamonds!`);
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
        <h2 className="text-3xl font-bold text-white text-center mb-6">Fortune Wheel</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center mb-8">
            <div className={`w-64 h-64 rounded-full border-8 border-yellow-500 flex items-center justify-center ${isSpinning ? 'animate-spin' : ''}`}>
              <div className="grid grid-cols-3 gap-2 w-full h-full p-4">
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className={`${seg.color} rounded flex items-center justify-center text-white font-bold text-xl ${result === seg.value ? 'ring-4 ring-white' : ''}`}
                  >
                    {seg.value}x
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result !== null && (
            <div className="text-center text-3xl font-bold text-yellow-400 mb-6">
              Result: {result}x
            </div>
          )}

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
          <p>0x (40%) | 1.5x (25%) | 2x (20%) | 3x (10%) | 5x (4%) | 10x (1%)</p>
        </div>
      </div>
    </div>
  );
}
