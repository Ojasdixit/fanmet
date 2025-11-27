import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface TransactionRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: string;
}

const statusVariantMap: Record<string, 'success' | 'primary' | 'danger' | 'warning'> = {
  completed: 'success',
  pending: 'primary',
  refunded: 'success',
  failed: 'danger',
  in_review: 'warning',
};

const typeDisplayMap: Record<string, string> = {
  manual_adjustment: 'Credit Added',
  bid_authorization: 'Bid Placed',
  bid_refund: 'Bid Refunded',
  withdrawal: 'Withdrawal',
};

export function FanWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) {
        setBalance(0);
        setWalletId(null);
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletError) {
          console.error('Error fetching wallet:', walletError);
          setIsLoading(false);
          return;
        }

        if (!walletData) {
          // No wallet yet - that's ok for fans who haven't added credits
          setBalance(0);
          setWalletId(null);
          setTransactions([]);
          setIsLoading(false);
          return;
        }

        setBalance(walletData.balance || 0);
        setWalletId(walletData.id);

        // Fetch transaction history
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('id, type, direction, amount, description, created_at')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const txRows: TransactionRow[] = (txData ?? []).map((tx: any) => ({
          id: tx.id,
          date: new Date(tx.created_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: '2-digit',
          }),
          description: tx.description || typeDisplayMap[tx.type] || tx.type,
          amount: tx.amount,
          type: tx.direction as 'credit' | 'debit',
          status: tx.direction === 'credit' ? 'completed' : 'completed',
        }));

        setTransactions(txRows);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWalletData();
  }, [user]);

  const handleAddCredits = async () => {
    if (!user || !creditAmount) return;

    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      let currentWalletId = walletId;

      // Create wallet if it doesn't exist
      if (!currentWalletId) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            currency: 'INR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (createError || !newWallet) {
          console.error('Error creating wallet:', createError);
          alert('Failed to create wallet. Please try again.');
          return;
        }
        currentWalletId = newWallet.id;
        setWalletId(currentWalletId);
      }

      // Update wallet balance
      const { error } = await supabase
        .from('wallets')
        .update({ balance: balance + amount, updated_at: new Date().toISOString() })
        .eq('id', currentWalletId);

      if (error) {
        console.error('Error adding credits:', error);
        alert('Failed to add credits. Please try again.');
        return;
      }

      // Insert transaction record
      await supabase.from('wallet_transactions').insert({
        wallet_id: currentWalletId,
        type: 'manual_adjustment',
        direction: 'credit',
        amount: amount,
        description: 'Manual credit addition',
        created_at: new Date().toISOString(),
      });

      setBalance(balance + amount);
      setTransactions((prev) => [
        {
          id: `temp-${Date.now()}`,
          date: new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
          description: 'Manual credit addition',
          amount,
          type: 'credit',
          status: 'completed',
        },
        ...prev,
      ]);
      setCreditAmount('');
      setShowAddCredits(false);
      alert(`Successfully added ${formatCurrency(amount)} to your wallet!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !walletId) {
      alert('Please add credits first to create a wallet.');
      return;
    }

    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount < 100) {
      alert('Minimum withdrawal amount is ₹100.');
      return;
    }

    if (amount > balance) {
      alert(`You can only withdraw up to ${formatCurrency(balance)}.`);
      return;
    }

    if (!withdrawDestination.trim()) {
      alert('Please enter a destination account.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Deduct from wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: balance - amount, updated_at: new Date().toISOString() })
        .eq('id', walletId);

      if (walletError) {
        console.error('Error updating wallet:', walletError);
        alert('Failed to process withdrawal. Please try again.');
        return;
      }

      // Insert transaction record
      await supabase.from('wallet_transactions').insert({
        wallet_id: walletId,
        type: 'withdrawal',
        direction: 'debit',
        amount: amount,
        description: `Withdrawal to ${withdrawDestination.trim()}`,
        created_at: new Date().toISOString(),
      });

      setBalance(balance - amount);
      setTransactions((prev) => [
        {
          id: `temp-${Date.now()}`,
          date: new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
          description: `Withdrawal to ${withdrawDestination.trim()}`,
          amount,
          type: 'debit',
          status: 'pending',
        },
        ...prev,
      ]);
      setWithdrawAmount('');
      setWithdrawDestination('');
      setShowWithdraw(false);
      alert(`Withdrawal request of ${formatCurrency(amount)} submitted successfully!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Wallet & Refunds</h1>
        <p className="text-sm text-[#6C757D]">Track your credits, withdrawals, and refund status.</p>
      </div>

      <Card elevated className="max-w-md">
        <CardHeader title="Wallet Balance" subtitle="All refunds are auto-processed" />
        <CardContent className="gap-3">
          <div className="text-4xl font-bold text-[#212529]">
            {isLoading ? '…' : formatCurrency(balance)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowAddCredits(!showAddCredits);
                setShowWithdraw(false);
              }}
              disabled={isSubmitting}
            >
              {showAddCredits ? 'Cancel' : '+ Add Credits'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowWithdraw(!showWithdraw);
                setShowAddCredits(false);
              }}
              disabled={isSubmitting || balance < 100}
            >
              {showWithdraw ? 'Cancel' : 'Request Withdrawal'}
            </Button>
          </div>

          {showAddCredits && (
            <div className="mt-4 rounded-lg border border-[#E9ECEF] bg-[#F8F9FA] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#212529]">Add Credits</h3>
              <div className="flex flex-col gap-3">
                <TextInput
                  type="number"
                  label="Amount (₹)"
                  placeholder="Enter amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCreditAmount('500')}
                  >
                    +500
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCreditAmount('1000')}
                  >
                    +1000
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCreditAmount('5000')}
                  >
                    +5000
                  </Button>
                </div>
                <Button onClick={handleAddCredits} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : `Add ${creditAmount ? formatCurrency(parseInt(creditAmount)) : 'Credits'}`}
                </Button>
              </div>
            </div>
          )}

          {showWithdraw && (
            <div className="mt-4 rounded-lg border border-[#E9ECEF] bg-[#F8F9FA] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#212529]">Request Withdrawal</h3>
              <div className="flex flex-col gap-3">
                <TextInput
                  type="number"
                  label="Amount (₹)"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <TextInput
                  label="Destination account"
                  placeholder="HDFC Bank ••8290"
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                />
                <div className="text-xs text-[#6C757D]">
                  Minimum withdrawal: ₹100. Available balance: {formatCurrency(balance)}
                </div>
                <Button onClick={handleWithdraw} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit Withdrawal'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Transaction History" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Description</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Type</th>
              </tr>
            </thead>
            <tbody className="text-[#212529]">
              {isLoading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-[#6C757D]">
                    Loading transactions…
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-[#6C757D]">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="border-b border-[#E9ECEF]">
                    <td className="py-3">{item.date}</td>
                    <td className="py-3">{item.description}</td>
                    <td className="py-3">
                      <span className={item.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={item.type === 'credit' ? 'success' : 'danger'}>
                        {item.type === 'credit' ? 'Credit' : 'Debit'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
