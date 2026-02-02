import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Bomb, Gem } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface MinesGameProps {
  onBack: () => void;
}

export function MinesGame({ onBack }: MinesGameProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [betAmount, setBetAmount] = useState('10');
  const [mineCount, setMineCount] = useState('3');
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [grid, setGrid] = useState<Array<'hidden' | 'safe' | 'mine'>>(Array(25).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);

  const startGame = () => {
    const bet = parseInt(betAmount);
    const mines = parseInt(mineCount);
    if (!bet || bet < 1) {
      toast.error('Invalid bet amount');
      return;
    }
    if (!mines || mines < 1 || mines > 20) {
      toast.error('Mines must be between 1 and 20');
      return;
    }
    if (!userProfile || userProfile.balance < BigInt(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    // Generate mine positions
    const positions: number[] = [];
    while (positions.length < mines) {
      const pos = Math.floor(Math.random() * 25);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }

    setMinePositions(positions);
    setGrid(Array(25).fill('hidden'));
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameState('playing');
  };

  const revealTile = (index: number) => {
    if (grid[index] !== 'hidden' || gameState !== 'playing') return;

    const newGrid = [...grid];
    if (minePositions.includes(index)) {
      newGrid[index] = 'mine';
      setGrid(newGrid);
      endGame(false);
    } else {
      newGrid[index] = 'safe';
      setGrid(newGrid);
      const newRevealed = revealedCount + 1;
      setRevealedCount(newRevealed);
      const safeSpots = 25 - minePositions.length;
      const multiplier = 1 + (newRevealed / safeSpots) * 2;
      setCurrentMultiplier(multiplier);
    }
  };

  const cashOut = async () => {
    await endGame(true);
  };

  const endGame = async (won: boolean) => {
    const bet = parseInt(betAmount);
    const winAmount = won ? Math.floor(bet * currentMultiplier) : 0;
    const newBalance = userProfile!.balance - BigInt(bet) + BigInt(winAmount);

    await updateProfile.mutateAsync({
      ...userProfile!,
      balance: newBalance,
      totalWagered: userProfile!.totalWagered + BigInt(bet),
    });

    // Reveal all mines
    const newGrid = [...grid];
    minePositions.forEach((pos) => {
      if (newGrid[pos] === 'hidden') newGrid[pos] = 'mine';
    });
    setGrid(newGrid);

    if (won) {
      toast.success(`Cashed out! You won ${winAmount} diamonds! (${currentMultiplier.toFixed(2)}x)`);
    } else {
      toast.error(`Hit a mine! You lost ${bet} diamonds`);
    }

    setGameState('finished');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lobby
      </Button>

      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur rounded-lg p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Mines</h2>

        <div className="bg-black/30 rounded-lg p-8 mb-6">
          {gameState === 'betting' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mines">Number of Mines (1-20)</Label>
                <Input
                  id="mines"
                  type="number"
                  value={mineCount}
                  onChange={(e) => setMineCount(e.target.value)}
                  min="1"
                  max="20"
                />
              </div>
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
                Start Game
              </Button>
            </div>
          )}

          {gameState !== 'betting' && (
            <>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-yellow-400">
                  Multiplier: {currentMultiplier.toFixed(2)}x
                </div>
                <div className="text-sm text-gray-300">
                  Revealed: {revealedCount} / {25 - minePositions.length}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {grid.map((tile, i) => (
                  <button
                    key={i}
                    onClick={() => revealTile(i)}
                    disabled={tile !== 'hidden' || gameState !== 'playing'}
                    className={`aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-all ${
                      tile === 'hidden'
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : tile === 'safe'
                        ? 'bg-green-600'
                        : 'bg-red-600'
                    }`}
                  >
                    {tile === 'safe' && <Gem className="w-6 h-6 text-white" />}
                    {tile === 'mine' && <Bomb className="w-6 h-6 text-white" />}
                  </button>
                ))}
              </div>

              {gameState === 'playing' && revealedCount > 0 && (
                <Button
                  onClick={cashOut}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold text-lg py-6"
                >
                  Cash Out ({Math.floor(parseInt(betAmount) * currentMultiplier)} diamonds)
                </Button>
              )}

              {gameState === 'finished' && (
                <Button
                  onClick={() => setGameState('betting')}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
                >
                  Play Again
                </Button>
              )}
            </>
          )}
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Reveal safe tiles to increase multiplier. Cash out before hitting a mine!</p>
        </div>
      </div>
    </div>
  );
}
