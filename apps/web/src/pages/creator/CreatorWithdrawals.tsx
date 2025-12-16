import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button, TextInput, Badge } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface PayoutEntry {
  id: string;
  amount: number;
  status: string;
  destination: string;
  requestedAt: Date;
  processedAt: Date | null;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  completed: 'success',
  in_review: 'warning',
  pending: 'primary',
  failed: 'danger',
};

const statusDisplayMap: Record<string, string> = {
  completed: 'Completed',
  in_review: 'In review',
  pending: 'Pending',
  failed: 'Failed',
};

// Platform fee: 10% deducted from earnings
const PLATFORM_FEE_PERCENT = 10;
const calculateNetEarnings = (grossAmount: number) => Math.floor(grossAmount * (100 - PLATFORM_FEE_PERCENT) / 100);

export function CreatorWithdrawals() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [availableBalance, setAvailableBalance] = useState(0);
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);
  const [pendingClearance, setPendingClearance] = useState(0);
  const [lastPayout, setLastPayout] = useState<{ amount: number; processedAt: Date } | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isWithdrawBlocked, setIsWithdrawBlocked] = useState(false);
  const [withdrawBlockReason, setWithdrawBlockReason] = useState('');

  useEffect(() => {
    const fetchWithdrawalData = async () => {
      if (!user) {
        setAvailableBalance(0);
        setPendingClearance(0);
        setLastPayout(null);
        setPayoutHistory([]);
        return;
      }

      setIsLoading(true);

      try {
        const { data: dbUser, error: dbUserError } = await supabase
          .from('users')
          .select('role, account_status, creator_profile_status')
          .eq('id', user.id)
          .maybeSingle();

        if (dbUserError || !dbUser) {
          setIsWithdrawBlocked(true);
          setWithdrawBlockReason('We could not load your creator profile. Please contact support.');
          setIsLoading(false);
          return;
        }

        if (dbUser.role !== 'creator') {
          setIsWithdrawBlocked(true);
          setWithdrawBlockReason('Withdrawals are only available for creator accounts.');
          setIsLoading(false);
          return;
        }

        if (dbUser.account_status && dbUser.account_status !== 'active') {
          setIsWithdrawBlocked(true);
          setWithdrawBlockReason('Your creator account is not active. Please contact support.');
          setIsLoading(false);
          return;
        }

        if (dbUser.creator_profile_status && dbUser.creator_profile_status !== 'approved') {
          setIsWithdrawBlocked(true);
          setWithdrawBlockReason('Your creator profile is not approved yet. Once an admin approves you, withdrawals will be enabled.');
          setIsLoading(false);
          return;
        }

        // Fetch linked bank account from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('bank_account_number, bank_ifsc, upi_id, razorpay_fund_account_id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const hasLinkedAccount = !!(profile.razorpay_fund_account_id || profile.bank_account_number || profile.upi_id);
          setHasBankAccount(hasLinkedAccount);

          const accountDisplay = profile.razorpay_fund_account_id
            ? 'Linked Payout Account'
            : profile.bank_account_number
              ? `Bank Account ending in ${profile.bank_account_number.slice(-4)}`
              : profile.upi_id
                ? `UPI: ${profile.upi_id}`
                : '';

          if (accountDisplay) setDestination(accountDisplay);
        } else {
          setHasBankAccount(false);
        }

        // Fetch creator's events and won bids to calculate total earnings
        const { data: eventsData } = await supabase
          .from('events')
          .select('id')
          .eq('creator_id', user.id);

        const eventIds = (eventsData ?? []).map((e: any) => e.id);

        let totalEarnings = 0;
        let pendingEarnings = 0;

        if (eventIds.length > 0) {
          const { data: bidsData } = await supabase
            .from('bids')
            .select('event_id, amount, status, created_at')
            .in('event_id', eventIds)
            .eq('status', 'won');

          const { data: meetsData } = await supabase
            .from('meets')
            .select('event_id, status, updated_at')
            .in('event_id', eventIds);

          const meetsByEvent = new Map<string, any[]>();
          for (const meet of (meetsData ?? []) as any[]) {
            const list = meetsByEvent.get(meet.event_id) ?? [];
            list.push(meet);
            meetsByEvent.set(meet.event_id, list);
          }

          const now = new Date();
          const RELEASE_DELAY_MS = 48 * 60 * 60 * 1000; // 48 hours

          for (const bid of (bidsData ?? []) as any[]) {
            // Calculate net earnings (90% after 10% platform fee)
            const netAmount = calculateNetEarnings(bid.amount ?? 0);
            totalEarnings += netAmount;

            // Check if the meet for this event is completed AND > 48h old
            const eventMeets = meetsByEvent.get(bid.event_id) ?? [];
            const completedMeet = eventMeets.find((m: any) => m.status === 'completed');

            const isReleased = completedMeet && completedMeet.updated_at && (now.getTime() - new Date(completedMeet.updated_at).getTime() > RELEASE_DELAY_MS);

            if (!isReleased) {
              pendingEarnings += netAmount;
            }
          }
        }

        // Fetch withdrawal requests
        const { data: withdrawalsData } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('creator_id', user.id)
          .order('requested_at', { ascending: false });

        let completedWithdrawals = 0;
        let pendingWithdrawals = 0;
        let lastCompletedPayout: { amount: number; processedAt: Date } | null = null;

        const history: PayoutEntry[] = [];

        for (const wd of (withdrawalsData ?? []) as any[]) {
          if (wd.status === 'completed') {
            completedWithdrawals += wd.amount ?? 0;
            if (!lastCompletedPayout && wd.processed_at) {
              lastCompletedPayout = {
                amount: wd.amount,
                processedAt: new Date(wd.processed_at),
              };
            }
          } else if (wd.status === 'pending' || wd.status === 'in_review') {
            pendingWithdrawals += wd.amount ?? 0;
          }

          history.push({
            id: wd.id,
            amount: wd.amount,
            status: wd.status,
            destination: wd.destination || 'Not specified',
            requestedAt: new Date(wd.requested_at),
            processedAt: wd.processed_at ? new Date(wd.processed_at) : null,
          });
        }

        // Available = Total earnings from cleared meets - completed withdrawals - pending withdrawals
        const clearedEarnings = totalEarnings - pendingEarnings;
        const available = Math.max(clearedEarnings - completedWithdrawals - pendingWithdrawals, 0);

        setAvailableBalance(available);
        setPendingClearance(pendingEarnings);
        setLastPayout(lastCompletedPayout);
        setPayoutHistory(history);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWithdrawalData();
  }, [user]);

  const handleSubmitWithdrawal = async () => {
    if (!user) {
      alert('Please log in to request a withdrawal.');
      return;
    }

    if (isWithdrawBlocked) {
      alert(
        withdrawBlockReason ||
        'Withdrawals are currently unavailable for your account. Please contact support.',
      );
      return;
    }

    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (amount < 500) {
      alert('Minimum withdrawal amount is ₹500.');
      return;
    }

    if (amount > availableBalance) {
      alert(`You can only withdraw up to ${formatCurrency(availableBalance)}.`);
      return;
    }

    if (!destination.trim()) {
      alert('Please enter a destination account.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: insertedData, error } = await supabase.from('withdrawal_requests').insert({
        creator_id: user.id,
        amount,
        destination: destination.trim(),
        status: 'pending',
        requested_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }).select().single();

      if (error || !insertedData) {
        console.error('Error submitting withdrawal:', error);
        alert('Failed to submit withdrawal request. Please try again.');
        return;
      }

      // Trigger Auto Payout via Razorpay (async)
      // We don't block the UI for this, but we log if it fails.
      supabase.functions.invoke('trigger-payout', {
        body: { withdrawal_request_id: insertedData.id },
      }).then(({ error: payoutError }) => {
        if (payoutError) console.error('Auto-payout trigger failed:', payoutError);
      });

      alert(`Withdrawal request of ${formatCurrency(amount)} submitted successfully!`);
      setWithdrawAmount('');
      setDestination('');

      // Refresh data
      setAvailableBalance((prev) => prev - amount);
      setPayoutHistory((prev) => [
        {
          id: `temp-${Date.now()}`,
          amount,
          status: 'pending',
          destination: destination.trim(),
          requestedAt: new Date(),
          processedAt: null,
        },
        ...prev,
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show bank account setup prompt if no bank account is linked
  if (hasBankAccount === false && !isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#212529]">Withdrawals</h1>
          <p className="text-sm text-[#6C757D]">Track your payout requests, bank destinations, and release timelines.</p>
        </div>

        <Card elevated className="max-w-2xl">
          <CardContent className="gap-6 py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#F4E6FF] to-[#E9D5FF]">
                <span className="text-5xl">🏦</span>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-[#212529]">Add Your Bank Account</h2>
              <p className="mb-6 max-w-md text-[#6C757D]">
                Before you can withdraw your earnings, you need to link a bank account or UPI ID. This ensures your payouts are processed securely and quickly.
              </p>
              
              <div className="mb-6 w-full max-w-sm rounded-xl bg-[#F4E6FF]/60 p-4 text-left">
                <p className="mb-2 text-sm font-semibold text-[#7B2CBF]">Why add bank details?</p>
                <ul className="space-y-2 text-sm text-[#6C757D]">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Receive payouts directly to your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Earnings available 48 hours after event completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Secure & verified payout processing</span>
                  </li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={() => navigate('/creator/settings#payouts')}
                className="w-full max-w-sm"
              >
                🏦 Add Bank Account / UPI
              </Button>
              <p className="mt-3 text-xs text-[#6C757D]">
                You'll be redirected to Settings to add your payout details.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Still show balance info */}
        <Card className="max-w-2xl">
          <CardHeader title="Your Earnings" subtitle="Here's what you've earned so far." />
          <CardContent className="gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                <span className="text-sm text-[#6C757D]">Available to withdraw</span>
                <p className="text-xl font-semibold text-[#C045FF]">
                  {formatCurrency(availableBalance)}
                </p>
              </div>
              <div className="rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                <span className="text-sm text-[#6C757D]">Pending clearance</span>
                <p className="text-xl font-semibold text-[#212529]">
                  {formatCurrency(pendingClearance)}
                </p>
                <p className="text-xs text-[#6C757D]">Available after 48 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Withdrawals</h1>
        <p className="text-sm text-[#6C757D]">Track your payout requests, bank destinations, and release timelines.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card elevated>
          <CardHeader title="Available Balance" subtitle="Withdraw to your linked account any time." />
          <CardContent className="gap-6">
            <div className="rounded-[16px] bg-[#F4E6FF]/60 p-6">
              <span className="text-sm text-[#6C757D]">Ready to withdraw</span>
              <p className="text-4xl font-bold text-[#C045FF]">
                {isLoading ? '…' : formatCurrency(availableBalance)}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                <span className="text-sm text-[#6C757D]">Pending clearance</span>
                <p className="text-xl font-semibold text-[#212529]">
                  {isLoading ? '…' : formatCurrency(pendingClearance)}
                </p>
                <p className="text-xs text-[#6C757D]">Net earnings (90%) after 10% platform fee. Available after 48 hours.</p>
              </div>
              <div className="rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                <span className="text-sm text-[#6C757D]">Last payout</span>
                <p className="text-xl font-semibold text-[#212529]">
                  {isLoading ? '…' : lastPayout ? formatCurrency(lastPayout.amount) : '—'}
                </p>
                <p className="text-xs text-[#6C757D]">
                  {lastPayout ? `Processed ${formatDateTime(lastPayout.processedAt)}` : 'No payouts yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Request Withdrawal" subtitle="Transfers typically arrive in 2-3 business days." />
          <CardContent className="gap-5">
            {isWithdrawBlocked && (
              <div className="rounded-[12px] border border-[#FECACA] bg-[#FFF5F5] p-3 text-xs text-[#B91C1C]">
                {withdrawBlockReason}
              </div>
            )}
            <div className="grid gap-4">
              <TextInput
                label="Amount"
                placeholder="₹5,000"
                type="number"
                min={500}
                step={100}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <TextInput
                  label="Destination account"
                  placeholder="No linked account"
                  value={destination}
                  disabled
                  onChange={() => { }}
                />
                {!destination && (
                  <p className="text-xs text-red-500">
                    Please <Link to="/creator/settings" className="underline">add your bank details</Link> in settings to withdraw.
                  </p>
                )}
                {destination && (
                  <p className="text-xs text-[#6C757D]">
                    To change this, go to <Link to="/creator/settings" className="underline">Settings</Link>.
                  </p>
                )}

              </div>
            </div>
            <div className="rounded-[12px] bg-[#F8F9FA] p-4 text-sm text-[#6C757D]">
              Note: We process withdrawals above ₹500. Ensure your KYC details are up to date for smoother payouts.
              {availableBalance > 0 && (
                <span className="mt-1 block font-medium text-[#212529]">
                  Maximum available: {formatCurrency(availableBalance)}
                </span>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleSubmitWithdrawal}
              disabled={isSubmitting || availableBalance < 500 || isWithdrawBlocked}
            >
              {isSubmitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Payout History" subtitle="A log of all recent withdrawal activity." className="border-b border-[#E9ECEF] pb-4" />
        <CardContent className="gap-4">
          {isLoading && payoutHistory.length === 0 ? (
            <div className="py-4 text-center text-sm text-[#6C757D]">Loading payout history…</div>
          ) : payoutHistory.length === 0 ? (
            <div className="py-4 text-center text-sm text-[#6C757D]">No withdrawal requests yet.</div>
          ) : (
            payoutHistory.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={statusVariantMap[entry.status] ?? 'default'}>
                      {statusDisplayMap[entry.status] ?? entry.status}
                    </Badge>
                    <span className="text-xs text-[#6C757D]">Requested {formatDateTime(entry.requestedAt)}</span>
                  </div>
                  <p className="text-sm text-[#6C757D]">Destination: {entry.destination}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm text-[#6C757D]">Amount</span>
                  <span className="text-xl font-semibold text-[#212529]">{formatCurrency(entry.amount)}</span>
                  <span className="text-xs text-[#6C757D]">
                    {entry.processedAt ? `Processed ${formatDateTime(entry.processedAt)}` : 'Awaiting processing'}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
