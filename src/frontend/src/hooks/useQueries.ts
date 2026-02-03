import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Transaction, CasinoSettings, GameOutcome, GameSymbolSet, GameCatalogEntry } from '../backend';
import { toast } from 'sonner';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerUser(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Welcome! You received 1000 diamonds as a signup bonus!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create profile: ${error.message}`);
    },
  });
}

export function useGetBalance() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['balance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getBalance();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetGameHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GameOutcome[]>({
    queryKey: ['gameHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGameHistory();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deposit(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Deposit successful!');
    },
    onError: (error: Error) => {
      toast.error(`Deposit failed: ${error.message}`);
    },
  });
}

export function useWithdraw() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.withdraw(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Withdrawal successful!');
    },
    onError: (error: Error) => {
      toast.error(`Withdrawal failed: ${error.message}`);
    },
  });
}

export function useRecordGameOutcome() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameType,
      betAmount,
      winAmount,
      isWin,
    }: {
      gameType: string;
      betAmount: bigint;
      winAmount: bigint;
      isWin: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.recordGameOutcome(gameType, betAmount, winAmount, isWin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['gameHistory'] });
      queryClient.invalidateQueries({ queryKey: ['topPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['topPlayersByWins'] });
      queryClient.invalidateQueries({ queryKey: ['topPlayersByStreak'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to record game outcome: ${error.message}`);
    },
  });
}

export function useIsUserEligibleForWithdrawal() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isEligibleForWithdrawal'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isUserEligibleForWithdrawal();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCasinoSettings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CasinoSettings>({
    queryKey: ['casinoSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCasinoSettings();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateCasinoSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: CasinoSettings) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateCasinoSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casinoSettings'] });
      toast.success('Casino settings updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
}

export function useGetTopPlayers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['topPlayers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopPlayers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTopPlayersByWins() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['topPlayersByWins'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopPlayersByWins();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTopPlayersByStreak() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['topPlayersByStreak'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopPlayersByStreak();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetSymbolSet(gameType: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GameSymbolSet>({
    queryKey: ['symbolSet', gameType],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSymbolSet(gameType);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateSymbolSet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameType, symbolSet }: { gameType: string; symbolSet: GameSymbolSet }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateSymbolSet(gameType, symbolSet);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['symbolSet'] });
      toast.success('Symbols updated successfully!');
    },
    onError: (error: Error) => {
      const message = error.message;
      if (message.includes('Unauthorized')) {
        toast.error('Only admins can update symbols');
      } else if (message.includes('empty')) {
        toast.error('All symbol fields must be filled and images must be uploaded');
      } else if (message.includes('required')) {
        toast.error('Image is required for each symbol');
      } else {
        toast.error(`Failed to update symbols: ${message}`);
      }
    },
  });
}

export function useGetAllGameCatalogEntries() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GameCatalogEntry[]>({
    queryKey: ['gameCatalog'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGameCatalogEntries();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateGameCatalogEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, entry }: { gameId: string; entry: GameCatalogEntry }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateGameCatalogEntry(gameId, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameCatalog'] });
      toast.success('Game catalog updated successfully!');
    },
    onError: (error: Error) => {
      const message = error.message;
      if (message.includes('Unauthorized')) {
        toast.error('Only admins can update game catalog');
      } else {
        toast.error(`Failed to update game catalog: ${message}`);
      }
    },
  });
}

export function useAddGameCatalogEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: GameCatalogEntry) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addGameCatalogEntry(entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameCatalog'] });
      toast.success('Game added to catalog successfully!');
    },
    onError: (error: Error) => {
      const message = error.message;
      if (message.includes('Unauthorized')) {
        toast.error('Only admins can add games to catalog');
      } else {
        toast.error(`Failed to add game: ${message}`);
      }
    },
  });
}
