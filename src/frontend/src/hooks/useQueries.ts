import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, TransactionLog, TransactionLogSearchModifier, CasinoSettings, CasinoStats } from '../backend';
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

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create profile: ${error.message}`);
    },
  });
}

export function useUpdateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });
}

export function useGetTransactionLog(filter: TransactionLogSearchModifier) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TransactionLog[]>({
    queryKey: ['transactionLog', filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterTransactionLog(filter);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCasinoSettings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CasinoSettings | null>({
    queryKey: ['casinoSettings'],
    queryFn: async () => {
      if (!actor) return null;
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

export function useGetCasinoStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CasinoStats>({
    queryKey: ['casinoStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCasinoStats();
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
