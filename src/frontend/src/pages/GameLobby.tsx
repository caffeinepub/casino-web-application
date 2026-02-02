import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Play, Lock } from 'lucide-react';
import { SlotsGame } from './games/SlotsGame';
import { RouletteGame } from './games/RouletteGame';
import { BlackjackGame } from './games/BlackjackGame';
import { CoinFlipGame } from './games/CoinFlipGame';
import { DiceRollGame } from './games/DiceRollGame';
import { WheelSpinGame } from './games/WheelSpinGame';
import { NumberGuessGame } from './games/NumberGuessGame';
import { CardDrawGame } from './games/CardDrawGame';
import { JackpotGame } from './games/JackpotGame';
import { MinesGame } from './games/MinesGame';

const games = [
  { id: 'slots', name: 'Slots', description: 'Classic slot machine', image: '/assets/generated/slot-reels.dim_400x300.png', component: SlotsGame },
  { id: 'roulette', name: 'Roulette', description: 'European roulette wheel', image: '/assets/generated/roulette-wheel.dim_300x300.png', component: RouletteGame },
  { id: 'blackjack', name: 'Blackjack', description: 'Beat the dealer', image: '/assets/generated/blackjack-cards.dim_400x250.png', component: BlackjackGame },
  { id: 'coinflip', name: 'Coin Flip', description: 'Heads or tails', image: '/assets/generated/coin-flip.dim_200x200.png', component: CoinFlipGame },
  { id: 'dice', name: 'Dice Roll', description: 'Roll the dice', image: '/assets/generated/dice-pair.dim_200x200.png', component: DiceRollGame },
  { id: 'wheel', name: 'Wheel Spin', description: 'Fortune wheel', image: '/assets/generated/fortune-wheel.dim_300x300.png', component: WheelSpinGame },
  { id: 'number', name: 'Number Guess', description: 'Guess the number', image: '/assets/generated/number-display.dim_250x100.png', component: NumberGuessGame },
  { id: 'cards', name: 'Card Draw', description: 'Draw lucky cards', image: '/assets/generated/card-deck.dim_300x200.png', component: CardDrawGame },
  { id: 'jackpot', name: 'Jackpot', description: 'Progressive jackpot', image: '/assets/generated/jackpot-coins.dim_400x300.png', component: JackpotGame },
  { id: 'mines', name: 'Mines', description: 'Avoid the mines', image: '/assets/generated/mines-grid.dim_300x300.png', component: MinesGame },
];

export function GameLobby() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  if (selectedGame) {
    const game = games.find((g) => g.id === selectedGame);
    if (game) {
      const GameComponent = game.component;
      return <GameComponent onBack={() => setSelectedGame(null)} />;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-2">Game Lobby</h2>
        <p className="text-gray-300">Choose your game and start winning!</p>
        {isAuthenticated && userProfile && (
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500/30">
            <img src="/assets/generated/diamond-icon-transparent.dim_64x64.png" alt="Diamond" className="w-6 h-6" />
            <span className="text-yellow-400 font-bold text-xl">{Number(userProfile.balance).toLocaleString()} Diamonds</span>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 mb-8 text-center">
          <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
          <p className="text-gray-300">Please login to start playing and win diamonds!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="overflow-hidden hover:shadow-xl transition-shadow bg-card/50 backdrop-blur border-white/10">
            <div className="aspect-video overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50">
              <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl">{game.name}</CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setSelectedGame(game.id)}
                disabled={!isAuthenticated}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
