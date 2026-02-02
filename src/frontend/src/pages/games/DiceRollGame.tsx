import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface DiceRollGameProps {
  onBack: () => void;
}

export function DiceRollGame({ onBack }: DiceRollGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [prediction, setPrediction] = useState<'over' | 'under'>('over');
  const [targetNumber, setTargetNumber] = useState('7');
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);

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
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsRolling(true);

    const rollInterval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
    }, 100);

    setTimeout(async () => {
      clearInterval(rollInterval);

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2;
      setDice([die1, die2]);

      let won = false;
      if (prediction === 'over' && total > target) won = true;
      if (prediction === 'under' && total < target) won = true;

      const winAmount = won ? bet * 2 : 0;
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
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

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Dice Roll</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center gap-4 mb-8">
            {dice.map((die, i) => (
              <div
                key={i}
                className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-5xl font-bold shadow-lg"
              >
                {die}
              </div>
            ))}
          </div>

          <div className="text-center text-3xl font-bold text-yellow-400 mb-6">
            Total: {dice[0] + dice[1]}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Prediction</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  onClick={() => setPrediction('over')}
                  variant={prediction === 'over' ? 'default' : 'outline'}
                  disabled={isRolling}
                >
                  Over
                </Button>
                <Button
                  onClick={() => setPrediction('under')}
                  variant={prediction === 'under' ? 'default' : 'outline'}
                  disabled={isRolling}
                >
                  Under
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="target">Target Number (2-12)</Label>
              <Input
                id="target"
                type="number"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                disabled={isRolling}
                min="2"
                max="12"
              />
            </div>

            <div>
              <Label htmlFor="bet">Bet Amount</Label>
              <Input
                id="bet"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isRolling}
                min="1"
              />
            </div>

            <Button
              onClick={roll}
              disabled={isRolling}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
            >
              {isRolling ? 'Rolling...' : 'ROLL'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Predict if the total will be over or under your target number. Win 2x!</p>
        </div>
      </div>
    </div>
  );
}
