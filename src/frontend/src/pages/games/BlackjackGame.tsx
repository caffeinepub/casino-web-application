import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface BlackjackGameProps {
  onBack: () => void;
}

type Card = { value: number; display: string };

export function BlackjackGame({ onBack }: BlackjackGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [result, setResult] = useState('');

  const drawCard = (): Card => {
    const value = Math.floor(Math.random() * 13) + 1;
    const suits = ['♠', '♥', '♦', '♣'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    let display = '';
    if (value === 1) display = 'A';
    else if (value === 11) display = 'J';
    else if (value === 12) display = 'Q';
    else if (value === 13) display = 'K';
    else display = value.toString();
    return { value: value > 10 ? 10 : value, display: display + suit };
  };

  const calculateScore = (hand: Card[]): number => {
    let score = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter((card) => card.value === 1).length;
    while (score <= 11 && aces > 0) {
      score += 10;
      aces--;
    }
    return score;
  };

  const startGame = () => {
    const bet = parseInt(betAmount);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    setPlayerHand(player);
    setDealerHand(dealer);
    setGameState('playing');
    setResult('');

    if (calculateScore(player) === 21) {
      endGame(player, dealer, 'blackjack');
    }
  };

  const hit = () => {
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);
    if (calculateScore(newHand) > 21) {
      endGame(newHand, dealerHand, 'bust');
    }
  };

  const stand = () => {
    let newDealerHand = [...dealerHand];
    while (calculateScore(newDealerHand) < 17) {
      newDealerHand.push(drawCard());
    }
    setDealerHand(newDealerHand);
    endGame(playerHand, newDealerHand, 'stand');
  };

  const endGame = async (player: Card[], dealer: Card[], action: string) => {
    const playerScore = calculateScore(player);
    const dealerScore = calculateScore(dealer);
    const bet = parseInt(betAmount);

    let winAmount = 0;
    let resultText = '';

    if (action === 'blackjack') {
      winAmount = Math.floor(bet * 2.5);
      resultText = 'Blackjack! You win!';
    } else if (action === 'bust') {
      winAmount = 0;
      resultText = 'Bust! You lose!';
    } else {
      if (dealerScore > 21 || playerScore > dealerScore) {
        winAmount = bet * 2;
        resultText = 'You win!';
      } else if (playerScore === dealerScore) {
        winAmount = bet;
        resultText = 'Push!';
      } else {
        winAmount = 0;
        resultText = 'Dealer wins!';
      }
    }

    const newBalance = userProfile!.balance - BigInt(bet) + BigInt(winAmount);
    await updateProfile.mutateAsync({
      ...userProfile!,
      balance: newBalance,
      totalWagered: userProfile!.totalWagered + BigInt(bet),
    });

    setResult(resultText);
    setGameState('finished');

    if (winAmount > bet) {
      toast.success(`${resultText} Won ${winAmount} diamonds!`);
    } else if (winAmount === bet) {
      toast.info(resultText);
    } else {
      toast.error(`${resultText} Lost ${bet} diamonds`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lobby
      </Button>

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Blackjack</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          {gameState !== 'betting' && (
            <>
              <div className="mb-6">
                <h3 className="text-white font-bold mb-2">Dealer: {calculateScore(dealerHand)}</h3>
                <div className="flex gap-2">
                  {dealerHand.map((card, i) => (
                    <div key={i} className="w-16 h-24 bg-white rounded flex items-center justify-center text-2xl font-bold">
                      {card.display}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-white font-bold mb-2">You: {calculateScore(playerHand)}</h3>
                <div className="flex gap-2">
                  {playerHand.map((card, i) => (
                    <div key={i} className="w-16 h-24 bg-white rounded flex items-center justify-center text-2xl font-bold">
                      {card.display}
                    </div>
                  ))}
                </div>
              </div>

              {result && <div className="text-center text-2xl font-bold text-yellow-400 mb-4">{result}</div>}
            </>
          )}

          {gameState === 'betting' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bet">Bet Amount</Label>
                <Input
                  id="bet"
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="1"
                />
              </div>
              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
              >
                Deal Cards
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={hit} className="py-6">
                Hit
              </Button>
              <Button onClick={stand} className="py-6">
                Stand
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={() => setGameState('betting')}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
            >
              Play Again
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Get 21 or closer than dealer. Blackjack pays 2.5x!</p>
        </div>
      </div>
    </div>
  );
}
