import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useGetCallerUserProfile, useDeposit, useWithdraw, useGetTransactionHistory, useIsUserEligibleForWithdrawal, useGetCasinoSettings } from '../hooks/useQueries';
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown, Coins, Trophy, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: transactions = [] } = useGetTransactionHistory();
  const { data: isEligible } = useIsUserEligibleForWithdrawal();
  const { data: settings } = useGetCasinoSettings();
  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const minDeposit = settings ? Number(settings.minDeposit) : 100;
  const minWithdrawal = settings ? Number(settings.minWithdrawal) : 100;

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return tx.transactionType === 'deposit';
    if (filter === 'withdrawals') return tx.transactionType === 'withdrawal';
    if (filter === 'wins') return tx.transactionType === 'game_win';
    if (filter === 'losses') return tx.transactionType === 'game_loss';
    return true;
  });

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount < minDeposit) {
      return;
    }
    await deposit.mutateAsync(BigInt(amount));
    setDepositAmount('');
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < minWithdrawal) {
      return;
    }
    await withdraw.mutateAsync(BigInt(amount));
    setWithdrawAmount('');
  };

  const wageringProgress = userProfile
    ? Math.min((Number(userProfile.diamondsWagered) / 1000) * 100, 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            Your Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-lg border border-yellow-500/30">
            <p className="text-sm text-gray-400">Balance</p>
            <p className="text-2xl font-bold text-yellow-400">{Number(userProfile?.diamondBalance || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-500/30">
            <p className="text-sm text-gray-400">Total Wagered</p>
            <p className="text-2xl font-bold text-blue-400">{Number(userProfile?.diamondsWagered || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-lg border border-green-500/30">
            <p className="text-sm text-gray-400">Total Won</p>
            <p className="text-2xl font-bold text-green-400">{Number(userProfile?.totalDiamondsWon || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 p-4 rounded-lg border border-red-500/30">
            <p className="text-sm text-gray-400">Win Streak</p>
            <p className="text-2xl font-bold text-red-400 flex items-center gap-1">
              <Trophy className="w-5 h-5" />
              {Number(userProfile?.currentStreak || 0)}
            </p>
          </div>
        </div>

        {!userProfile?.hasCompletedWageringRequirement && (
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-400">
              <div className="space-y-2">
                <p className="font-medium">Wagering Requirement: {wageringProgress.toFixed(0)}% Complete</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${wageringProgress}%` }}
                  />
                </div>
                <p className="text-sm">
                  Wager {Number(userProfile?.diamondsWagered || 0)} / 1000 diamonds to unlock withdrawals
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Filter:</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="wins">Wins</SelectItem>
                  <SelectItem value="losses">Losses</SelectItem>
                  <SelectItem value="deposits">Deposits</SelectItem>
                  <SelectItem value="withdrawals">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No transactions yet</p>
              ) : (
                filteredTransactions.map((tx, index) => {
                  const isWin = tx.transactionType === 'game_win' || tx.transactionType === 'deposit' || tx.transactionType === 'signup_bonus';
                  const isLoss = tx.transactionType === 'game_loss' || tx.transactionType === 'withdrawal';
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-3">
                        {tx.transactionType === 'deposit' && <ArrowDownToLine className="w-5 h-5 text-green-500" />}
                        {tx.transactionType === 'withdrawal' && <ArrowUpFromLine className="w-5 h-5 text-red-500" />}
                        {tx.transactionType === 'game_win' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {tx.transactionType === 'game_loss' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {tx.transactionType === 'signup_bonus' && <Trophy className="w-5 h-5 text-yellow-500" />}
                        <div>
                          <p className="font-medium capitalize">
                            {tx.transactionType.replace('_', ' ')}
                            {tx.gameType && ` - ${tx.gameType}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(Number(tx.timestamp) / 1000000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isWin ? 'text-green-500' : isLoss ? 'text-red-500' : 'text-gray-400'}`}>
                          {isWin ? '+' : isLoss ? '-' : ''}{Number(tx.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Balance: {Number(tx.balanceAfter).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit">Amount (min: {minDeposit} diamonds)</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min={minDeposit}
              />
            </div>
            <Button onClick={handleDeposit} className="w-full" disabled={deposit.isPending || !depositAmount || parseInt(depositAmount) < minDeposit}>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              {deposit.isPending ? 'Processing...' : 'Deposit'}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            {!isEligible && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-400">
                  You must complete the wagering requirement before withdrawing.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="withdraw">Amount (min: {minWithdrawal} diamonds)</Label>
              <Input
                id="withdraw"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={minWithdrawal}
                disabled={!isEligible}
              />
            </div>
            <Button 
              onClick={handleWithdraw} 
              className="w-full" 
              disabled={!isEligible || withdraw.isPending || !withdrawAmount || parseInt(withdrawAmount) < minWithdrawal}
            >
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              {withdraw.isPending ? 'Processing...' : 'Withdraw'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
