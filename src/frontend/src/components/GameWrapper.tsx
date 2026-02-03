import React from 'react';
import { useGetCallerUserProfile, useRecordGameOutcome } from '../hooks/useQueries';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface GameWrapperProps {
  children: React.ReactNode;
  onBack: () => void;
  title: string;
}

export function GameWrapper({ children, onBack, title }: GameWrapperProps) {
  const { data: userProfile } = useGetCallerUserProfile();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
          <img src="/assets/generated/diamond-icon-transparent.dim_64x64.png" alt="Diamond" className="w-5 h-5" />
          <span className="text-yellow-400 font-bold">{Number(userProfile?.diamondBalance || 0).toLocaleString()}</span>
        </div>
      </div>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function useGameLogic(gameName: string) {
  const recordOutcome = useRecordGameOutcome();
  const { data: userProfile } = useGetCallerUserProfile();

  const recordGame = async (betAmount: number, winAmount: number, isWin: boolean) => {
    await recordOutcome.mutateAsync({
      gameType: gameName,
      betAmount: BigInt(betAmount),
      winAmount: BigInt(winAmount),
      isWin,
    });
  };

  return {
    recordGame,
    balance: Number(userProfile?.diamondBalance || 0),
    isRecording: recordOutcome.isPending,
  };
}
