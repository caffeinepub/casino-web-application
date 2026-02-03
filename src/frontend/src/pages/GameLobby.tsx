import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetTopPlayers, useGetTopPlayersByWins, useGetTopPlayersByStreak, useGetAllGameCatalogEntries } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Play, Lock, Trophy, TrendingUp, Zap } from 'lucide-react';
import { SlotsGame } from './games/SlotsGame';
import { BlackjackGame } from './games/BlackjackGame';
import { DiceRollGame } from './games/DiceRollGame';
import { WheelSpinGame } from './games/WheelSpinGame';
import { JackpotGame } from './games/JackpotGame';

const defaultGames = [
  { id: 'slots', name: 'Slots', description: 'Classic slot machine', image: '/assets/generated/slot-reels.dim_400x300.png', component: SlotsGame },
  { id: 'blackjack', name: 'Blackjack', description: 'Beat the dealer', image: '/assets/generated/blackjack-cards.dim_400x250.png', component: BlackjackGame },
  { id: 'dice', name: 'Dice Roll', description: 'Roll the dice', image: '/assets/generated/dice-pair.dim_200x200.png', component: DiceRollGame },
  { id: 'wheel', name: 'Wheel Spin', description: 'Fortune wheel', image: '/assets/generated/fortune-wheel.dim_300x300.png', component: WheelSpinGame },
  { id: 'jackpot', name: 'Jackpot', description: 'Progressive jackpot', image: '/assets/generated/jackpot-coins.dim_400x300.png', component: JackpotGame },
];

const gameComponents: Record<string, React.ComponentType<{ onBack: () => void }>> = {
  slots: SlotsGame,
  blackjack: BlackjackGame,
  dice: DiceRollGame,
  wheel: WheelSpinGame,
  jackpot: JackpotGame,
};

export function GameLobby() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: topPlayersByBalance = [] } = useGetTopPlayers();
  const { data: topPlayersByWins = [] } = useGetTopPlayersByWins();
  const { data: topPlayersByStreak = [] } = useGetTopPlayersByStreak();
  const { data: catalogEntries = [] } = useGetAllGameCatalogEntries();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  const games = catalogEntries.length > 0
    ? catalogEntries.map(entry => {
        const defaultGame = defaultGames.find(g => g.id === entry.gameId);
        return {
          id: entry.gameId,
          name: entry.title,
          description: entry.description,
          image: entry.icon.getDirectURL(),
          component: defaultGame?.component || SlotsGame,
        };
      })
    : defaultGames;

  if (selectedGame) {
    const GameComponent = gameComponents[selectedGame];
    if (GameComponent) {
      return <GameComponent onBack={() => setSelectedGame(null)} />;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-2">Game Lobby</h2>
        <p className="text-gray-300">Choose your game and start winning!</p>
        {isAuthenticated && userProfile && (
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500/30">
            <img src="/assets/generated/diamond-icon-transparent.dim_64x64.png" alt="Diamond" className="w-6 h-6" />
            <span className="text-yellow-400 font-bold text-xl">{Number(userProfile.diamondBalance).toLocaleString()} Diamonds</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-bold text-white mb-4">Available Games</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

        <div className="lg:col-span-1">
          <h3 className="text-2xl font-bold text-white mb-4">Top Players</h3>
          <Card className="bg-card/50 backdrop-blur border-white/10">
            <CardContent className="p-4">
              <Tabs defaultValue="balance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="balance" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    Balance
                  </TabsTrigger>
                  <TabsTrigger value="wins" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Wins
                  </TabsTrigger>
                  <TabsTrigger value="streak" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Streak
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="balance" className="space-y-2 mt-4">
                  {topPlayersByBalance.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">No players yet</p>
                  ) : (
                    topPlayersByBalance.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm">{player.username}</span>
                        </div>
                        <span className="text-yellow-400 font-bold text-sm">{Number(player.diamondBalance).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="wins" className="space-y-2 mt-4">
                  {topPlayersByWins.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">No players yet</p>
                  ) : (
                    topPlayersByWins.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm">{player.username}</span>
                        </div>
                        <span className="text-green-400 font-bold text-sm">{Number(player.totalWins)} wins</span>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="streak" className="space-y-2 mt-4">
                  {topPlayersByStreak.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">No players yet</p>
                  ) : (
                    topPlayersByStreak.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm">{player.username}</span>
                        </div>
                        <span className="text-purple-400 font-bold text-sm flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {Number(player.maxStreak)}
                        </span>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {isAuthenticated && userProfile && (
            <Card className="bg-card/50 backdrop-blur border-white/10 mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Games Played:</span>
                  <span className="font-bold">{Number(userProfile.totalGamesPlayed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Wins:</span>
                  <span className="font-bold text-green-400">{Number(userProfile.totalWins)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Losses:</span>
                  <span className="font-bold text-red-400">{Number(userProfile.totalLosses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Streak:</span>
                  <span className="font-bold text-purple-400">{Number(userProfile.currentStreak)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Streak:</span>
                  <span className="font-bold text-yellow-400">{Number(userProfile.maxStreak)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-blue-900 border-t border-yellow-500/30 py-4 px-4 z-40">
        <div className="container mx-auto text-center">
          <p className="text-yellow-400 font-bold text-lg">🎰 Play Now and Win Big! 🎰</p>
          <p className="text-white text-sm">Join thousands of players winning diamonds every day</p>
        </div>
      </div>
    </div>
  );
}
