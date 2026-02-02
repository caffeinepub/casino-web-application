import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface CardDrawGameProps {
  onBack: () => void;
}

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function CardDrawGame({ onBack }: CardDrawGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [betType, setBetType] = useState<'red' | 'black' | 'high' | 'low'>('red');
  const [drawnCard, setDrawnCard] = useState<{ suit: string; value: string } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const draw = async () => {
    const bet = parseInt(betAmount);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsDrawing(true);
    setDrawnCard(null);

    setTimeout(async () => {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const value = values[Math.floor(Math.random() * values.length)];
      const card = { suit, value };
      setDrawnCard(card);

      const isRed = suit === '♥' || suit === '♦';
      const valueIndex = values.indexOf(value);
      const isHigh = valueIndex >= 7; // 8 and above

      let won = false;
      if (betType === 'red' && isRed) won = true;
      if (betType === 'black' && !isRed) won = true;
      if (betType === 'high' && isHigh) won = true;
      if (betType === 'low' && !isHigh) won = true;

      const winAmount = won ? bet * 2 : 0;
      const newBalance = userProfile.balance - BigInt(bet) + BigInt(winAmount);

      await updateProfile.mutateAsync({
        ...userProfile,
        balance: newBalance,
        totalWagered: userProfile.totalWagered + BigInt(bet),
      });

      if (won) {
        toast.success(`${value}${suit}! You won ${winAmount} diamonds!`);
      } else {
        toast.error(`${value}${suit}! You lost ${bet} diamonds`);
      }

      setIsDrawing(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lobby
      </Button>

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Card Draw</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-48 bg-white rounded-lg flex items-center justify-center shadow-lg">
              {drawnCard ? (
                <div className="text-center">
                  <div className={`text-6xl ${drawnCard.suit === '♥' || drawnCard.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                    {drawnCard.suit}
                  </div>
                  <div className="text-3xl font-bold text-black">{drawnCard.value}</div>
                </div>
              ) : (
                <div className="text-4xl text-gray-400">?</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Bet On</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  onClick={() => setBetType('red')}
                  variant={betType === 'red' ? 'default' : 'outline'}
                  className={betType === 'red' ? 'bg-red-600' : ''}
                  disabled={isDrawing}
                >
                  Red
                </Button>
                <Button
                  onClick={() => setBetType('black')}
                  variant={betType === 'black' ? 'default' : 'outline'}
                  className={betType === 'black' ? 'bg-black' : ''}
                  disabled={isDrawing}
                >
                  Black
                </Button>
                <Button
                  onClick={() => setBetType('high')}
                  variant={betType === 'high' ? 'default' : 'outline'}
                  disabled={isDrawing}
                >
                  High (8-K)
                </Button>
                <Button
                  onClick={() => setBetType('low')}
                  variant={betType === 'low' ? 'default' : 'outline'}
                  disabled={isDrawing}
                >
                  Low (A-7)
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
                disabled={isDrawing}
                min="1"
              />
            </div>

            <Button
              onClick={draw}
              disabled={isDrawing}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
            >
              {isDrawing ? 'Drawing...' : 'DRAW'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Win 2x on Red, Black, High, or Low</p>
        </div>
      </div>
    </div>
  );
}
