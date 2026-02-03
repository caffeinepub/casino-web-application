import React, { useState, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useGetCallerUserProfile, useRecordGameOutcome, useGetSymbolSet } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { useParticleSystem } from '../../lib/animations';

interface BlackjackGameProps {
  onBack: () => void;
}

type Card = { rank: number; suit: number; display: string; symbolIndex?: number };

export function BlackjackGame({ onBack }: BlackjackGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const recordOutcome = useRecordGameOutcome();
  const { data: symbolSet, isLoading: symbolsLoading } = useGetSymbolSet('cards');
  const [betAmount, setBetAmount] = useState('10');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [result, setResult] = useState('');
  const [cardAnimation, setCardAnimation] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem(canvasRef);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const symbols = symbolSet?.cards && symbolSet.cards.length >= 52 ? symbolSet.cards : null;
  const useText = !symbols || symbolsLoading;

  const drawCard = (): Card => {
    const rank = Math.floor(Math.random() * 13) + 1;
    const suit = Math.floor(Math.random() * 4);
    const suits = ['♠', '♥', '♦', '♣'];
    let display = '';
    if (rank === 1) display = 'A';
    else if (rank === 11) display = 'J';
    else if (rank === 12) display = 'Q';
    else if (rank === 13) display = 'K';
    else display = rank.toString();
    
    const symbolIndex = symbols ? (suit * 13 + (rank - 1)) : undefined;
    
    return { 
      rank,
      suit,
      display: display + suits[suit],
      symbolIndex
    };
  };

  const getCardValue = (card: Card): number => {
    return card.rank > 10 ? 10 : card.rank;
  };

  const calculateScore = (hand: Card[]): number => {
    let score = hand.reduce((sum, card) => sum + getCardValue(card), 0);
    let aces = hand.filter((card) => card.rank === 1).length;
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
    if (!userProfile || userProfile.diamondBalance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    setPlayerHand(player);
    setDealerHand(dealer);
    setGameState('playing');
    setResult('');
    setGlowIntensity(0);
    
    setCardAnimation([0, 1, 2, 3]);
    setTimeout(() => setCardAnimation([]), 600);

    if (calculateScore(player) === 21) {
      endGame(player, dealer, 'blackjack');
    }
  };

  const hit = () => {
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);
    setCardAnimation([newHand.length - 1]);
    setTimeout(() => setCardAnimation([]), 400);
    
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
    let isWin = false;

    if (action === 'blackjack') {
      winAmount = Math.floor(bet * 2.5);
      resultText = 'Blackjack! You win!';
      isWin = true;
    } else if (action === 'bust') {
      winAmount = 0;
      resultText = 'Bust! You lose!';
      isWin = false;
    } else {
      if (dealerScore > 21 || playerScore > dealerScore) {
        winAmount = bet * 2;
        resultText = 'You win!';
        isWin = true;
      } else if (playerScore === dealerScore) {
        winAmount = bet;
        resultText = 'Push!';
        isWin = false;
      } else {
        winAmount = 0;
        resultText = 'Dealer wins!';
        isWin = false;
      }
    }

    if (isWin && particleSystem.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (action === 'blackjack') {
        particleSystem.current.createConfetti(rect.width / 2, rect.height / 2, 80);
        setGlowIntensity(1);
        setTimeout(() => setGlowIntensity(0), 1000);
      } else {
        particleSystem.current.createSparkles(rect.width / 2, rect.height / 2, 40);
      }
      particleSystem.current.start();
    }

    await recordOutcome.mutateAsync({
      gameType: 'Blackjack',
      betAmount: BigInt(bet),
      winAmount: BigInt(winAmount),
      isWin,
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

        <h2 className="text-3xl font-bold text-white text-center mb-6 relative z-10">Blackjack</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6 relative z-10">
          {gameState !== 'betting' && (
            <>
              <div className="mb-6">
                <h3 className="text-white font-bold mb-2">Dealer: {calculateScore(dealerHand)}</h3>
                <div className="flex gap-2 flex-wrap">
                  {dealerHand.map((card, i) => (
                    <div
                      key={i}
                      className="w-16 h-24 bg-gradient-to-br from-white to-gray-100 rounded flex items-center justify-center shadow-lg transition-all duration-400 overflow-hidden"
                      style={{
                        animation: cardAnimation.includes(i) ? 'cardDeal 0.4s ease-out' : 'none',
                        transform: cardAnimation.includes(i) ? 'scale(0)' : 'scale(1)',
                      }}
                    >
                      {useText ? (
                        <span className="text-2xl font-bold text-black">{card.display}</span>
                      ) : (
                        <img
                          src={symbols![card.symbolIndex!].image.getDirectURL()}
                          alt={symbols![card.symbolIndex!].name}
                          className="w-full h-full object-contain p-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-white font-bold mb-2">You: {calculateScore(playerHand)}</h3>
                <div className="flex gap-2 flex-wrap">
                  {playerHand.map((card, i) => (
                    <div
                      key={i}
                      className="w-16 h-24 bg-gradient-to-br from-white to-gray-100 rounded flex items-center justify-center shadow-lg transition-all duration-400 overflow-hidden"
                      style={{
                        animation: cardAnimation.includes(i) ? 'cardDeal 0.4s ease-out' : 'none',
                        transform: cardAnimation.includes(i) ? 'scale(0)' : 'scale(1)',
                      }}
                    >
                      {useText ? (
                        <span className="text-2xl font-bold text-black">{card.display}</span>
                      ) : (
                        <img
                          src={symbols![card.symbolIndex!].image.getDirectURL()}
                          alt={symbols![card.symbolIndex!].name}
                          className="w-full h-full object-contain p-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {result && (
                <div className="text-center text-2xl font-bold text-yellow-400 mb-4 animate-pulse">
                  {result}
                </div>
              )}
            </>
          )}

          {gameState === 'betting' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bet" className="text-white">Bet Amount</Label>
                <Input
                  id="bet"
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="1"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6 transition-all duration-300 hover:scale-105"
              >
                Deal Cards
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={hit} className="py-6 transition-all duration-200 hover:scale-105">
                Hit
              </Button>
              <Button onClick={stand} className="py-6 transition-all duration-200 hover:scale-105">
                Stand
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={() => setGameState('betting')}
              disabled={recordOutcome.isPending}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6 transition-all duration-300 hover:scale-105"
            >
              Play Again
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-gray-300 relative z-10">
          <p>Get 21 or closer than dealer. Blackjack pays 2.5x!</p>
        </div>
      </div>

      <style>{`
        @keyframes cardDeal {
          from {
            transform: translateY(-100px) scale(0) rotate(-180deg);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
