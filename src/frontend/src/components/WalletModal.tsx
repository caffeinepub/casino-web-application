import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useGetCallerUserProfile, useUpdateUserProfile, useGetTransactionLog } from '../hooks/useQueries';
import { TransactionFilter } from '../backend';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown, Coins } from 'lucide-react';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [filter, setFilter] = useState<TransactionFilter>(TransactionFilter.all);

  const { data: transactions = [] } = useGetTransactionLog({
    transactionFilter: filter,
    count: BigInt(50),
    offset: BigInt(0),
    searchText: '',
  });

  const canWithdraw = userProfile && userProfile.totalWagered >= userProfile.signupBonus;

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount < 10) {
      toast.error('Minimum deposit is 10 diamonds');
      return;
    }
    if (!userProfile) return;

    await updateProfile.mutateAsync({
      ...userProfile,
      balance: userProfile.balance + BigInt(amount),
    });
    setDepositAmount('');
    toast.success(`Deposited ${amount} diamonds!`);
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 50) {
      toast.error('Minimum withdrawal is 50 diamonds');
      return;
    }
    if (!userProfile) return;
    if (userProfile.balance < BigInt(amount)) {
      toast.error('Insufficient balance');
      return;
    }
    if (!canWithdraw) {
      toast.error(`You must wager your signup bonus (${Number(userProfile.signupBonus)} diamonds) before withdrawing`);
      return;
    }

    await updateProfile.mutateAsync({
      ...userProfile,
      balance: userProfile.balance - BigInt(amount),
    });
    setWithdrawAmount('');
    toast.success(`Withdrew ${amount} diamonds!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            Your Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-lg border border-yellow-500/30">
            <p className="text-sm text-gray-400">Balance</p>
            <p className="text-2xl font-bold text-yellow-400">{Number(userProfile?.balance || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-500/30">
            <p className="text-sm text-gray-400">Total Wagered</p>
            <p className="text-2xl font-bold text-blue-400">{Number(userProfile?.totalWagered || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-lg border border-green-500/30">
            <p className="text-sm text-gray-400">Signup Bonus</p>
            <p className="text-2xl font-bold text-green-400">{Number(userProfile?.signupBonus || 0).toLocaleString()}</p>
          </div>
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Filter:</Label>
              <Select value={filter} onValueChange={(value) => setFilter(value as TransactionFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionFilter.all}>All</SelectItem>
                  <SelectItem value={TransactionFilter.wins}>Wins</SelectItem>
                  <SelectItem value={TransactionFilter.losses}>Losses</SelectItem>
                  <SelectItem value={TransactionFilter.deposits}>Deposits</SelectItem>
                  <SelectItem value={TransactionFilter.withdrawals}>Withdrawals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No transactions yet</p>
              ) : (
                transactions.map((tx) => (
                  <div key={Number(tx.log.id)} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      {tx.log.transactionType.__kind__ === 'deposit' && <ArrowDownToLine className="w-5 h-5 text-green-500" />}
                      {tx.log.transactionType.__kind__ === 'withdrawal' && <ArrowUpFromLine className="w-5 h-5 text-red-500" />}
                      {tx.log.transactionType.__kind__ === 'spinOutcome' && (
                        tx.log.transactionType.spinOutcome.winAmount > tx.log.transactionType.spinOutcome.betAmount ? (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )
                      )}
                      <div>
                        <p className="font-medium">{tx.log.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(Number(tx.log.timestamp) / 1000000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.log.transactionType.__kind__ === 'deposit' && (
                        <p className="text-green-500 font-bold">+{Number(tx.log.transactionType.deposit)}</p>
                      )}
                      {tx.log.transactionType.__kind__ === 'withdrawal' && (
                        <p className="text-red-500 font-bold">-{Number(tx.log.transactionType.withdrawal)}</p>
                      )}
                      {tx.log.transactionType.__kind__ === 'spinOutcome' && (
                        <p className={tx.log.transactionType.spinOutcome.winAmount > tx.log.transactionType.spinOutcome.betAmount ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                          {tx.log.transactionType.spinOutcome.winAmount > tx.log.transactionType.spinOutcome.betAmount ? '+' : ''}
                          {Number(tx.log.transactionType.spinOutcome.winAmount) - Number(tx.log.transactionType.spinOutcome.betAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit">Amount (min: 10 diamonds)</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="10"
              />
            </div>
            <Button onClick={handleDeposit} className="w-full" disabled={updateProfile.isPending}>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              {updateProfile.isPending ? 'Processing...' : 'Deposit'}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            {!canWithdraw && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  You must wager your signup bonus ({Number(userProfile?.signupBonus || 0)} diamonds) before withdrawing.
                  Current wagered: {Number(userProfile?.totalWagered || 0)} diamonds
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="withdraw">Amount (min: 50 diamonds)</Label>
              <Input
                id="withdraw"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="50"
                disabled={!canWithdraw}
              />
            </div>
            <Button onClick={handleWithdraw} className="w-full" disabled={!canWithdraw || updateProfile.isPending}>
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              {updateProfile.isPending ? 'Processing...' : 'Withdraw'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
