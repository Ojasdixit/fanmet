import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Badge, TextInput } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface Transaction {
  id: string;
  date: string;
  time: string;
  userId: string;
  userName: string;
  eventId: string | null;
  eventTitle: string;
  amount: number;
  type: string;
  direction: string;
  status: string;
}

interface PaymentStats {
  totalProcessed: number;
  totalRefunded: number;
  pendingPayouts: number;
  totalCommission: number;
}

const typeLabels: Record<string, string> = {
  bid_authorization: 'Bid',
  bid_refund: 'Refund',
  bid_capture: 'Capture',
  creator_earning: 'Earning',
  creator_payout: 'Payout',
  manual_adjustment: 'Adjustment',
};

export function AdminPayments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalProcessed: 0,
    totalRefunded: 0,
    pendingPayouts: 0,
    totalCommission: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'bids' | 'refunds' | 'payouts'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch wallet transactions
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('id, wallet_id, type, direction, amount, reference_table, reference_id, description, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        // Fetch wallets to get user IDs
        const walletIds = Array.from(new Set((txData ?? []).map((t: any) => t.wallet_id)));
        const { data: walletsData } = walletIds.length
          ? await supabase.from('wallets').select('id, user_id').in('id', walletIds)
          : { data: [] };

        const walletToUser = new Map<string, string>();
        for (const w of (walletsData ?? []) as any[]) {
          walletToUser.set(w.id, w.user_id);
        }

        // Fetch user names
        const userIds = Array.from(new Set(Array.from(walletToUser.values())));
        const { data: usersData } = userIds.length
          ? await supabase.from('users').select('id, display_name, email').in('id', userIds)
          : { data: [] };

        const userMap = new Map<string, string>();
        for (const u of (usersData ?? []) as any[]) {
          userMap.set(u.id, u.display_name || u.email?.split('@')[0] || 'User');
        }

        // Fetch events for reference
        const eventIds = (txData ?? [])
          .filter((t: any) => t.reference_table === 'events' || t.reference_table === 'bids')
          .map((t: any) => t.reference_id)
          .filter(Boolean);

        const { data: eventsData } = eventIds.length
          ? await supabase.from('events').select('id, title').in('id', eventIds)
          : { data: [] };

        const eventMap = new Map<string, string>();
        for (const e of (eventsData ?? []) as any[]) {
          eventMap.set(e.id, e.title);
        }

        // Map transactions
        const mapped: Transaction[] = (txData ?? []).map((t: any) => {
          const userId = walletToUser.get(t.wallet_id) ?? '';
          const d = new Date(t.created_at);
          return {
            id: t.id,
            date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
            userId,
            userName: userMap.get(userId) ?? 'Unknown',
            eventId: t.reference_id,
            eventTitle: eventMap.get(t.reference_id) ?? t.description ?? '-',
            amount: t.amount ?? 0,
            type: t.type,
            direction: t.direction,
            status: 'Processed',
          };
        });

        setTransactions(mapped);

        // Calculate stats from bids and wallet transactions
        const { data: bidsData } = await supabase
          .from('bids')
          .select('amount, status');

        const wonBids = (bidsData ?? []).filter((b: any) => b.status === 'won');
        const lostBids = (bidsData ?? []).filter((b: any) => b.status === 'lost');

        const totalProcessed = wonBids.reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0);
        const totalRefunded = lostBids.reduce((sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.9), 0);
        const totalCommission = wonBids.reduce((sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.1), 0)
          + lostBids.reduce((sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.1), 0);

        // Pending payouts from withdrawal requests
        const { data: pendingWithdrawals } = await supabase
          .from('withdrawal_requests')
          .select('amount')
          .eq('status', 'pending');

        const pendingPayouts = (pendingWithdrawals ?? []).reduce((sum: number, w: any) => sum + (w.amount ?? 0), 0);

        setStats({
          totalProcessed,
          totalRefunded,
          pendingPayouts,
          totalCommission,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'bids') return t.type === 'bid_authorization' || t.type === 'bid_capture';
    if (filter === 'refunds') return t.type === 'bid_refund';
    if (filter === 'payouts') return t.type === 'creator_payout' || t.type === 'creator_earning';
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Payments</h1>
          <p className="text-sm text-[#6C757D]">Review platform transactions, refunds, and commissions.</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'bids', 'refunds', 'payouts'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'secondary' : 'ghost'}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Total Processed" />
          <CardContent>
            <div className="text-3xl font-bold text-[#212529]">{formatCurrency(stats.totalProcessed)}</div>
            <p className="text-xs text-[#6C757D]">From winning bids</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Amount Returned to Fans" />
          <CardContent>
            <div className="text-3xl font-bold text-[#212529]">{formatCurrency(stats.totalRefunded)}</div>
            <p className="text-xs text-[#6C757D]">90% of lost bids (non-winners)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Pending Payouts" />
          <CardContent>
            <div className="text-3xl font-bold text-[#212529]">{formatCurrency(stats.pendingPayouts)}</div>
            <p className="text-xs text-[#6C757D]">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Platform Commission" />
          <CardContent>
            <div className="text-3xl font-bold text-[#28A745]">{formatCurrency(stats.totalCommission)}</div>
            <p className="text-xs text-[#6C757D]">10% from all bids</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Transactions" subtitle={`${filteredTransactions.length} transactions`} />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Time</th>
                <th className="border-b border-[#E9ECEF] py-3">User</th>
                <th className="border-b border-[#E9ECEF] py-3">Description</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Type</th>
                <th className="border-b border-[#E9ECEF] py-3">Direction</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{txn.date}</td>
                  <td className="py-3 text-[#6C757D]">{txn.time}</td>
                  <td className="py-3 text-[#212529]">{txn.userName}</td>
                  <td className="py-3 text-[#212529]">{txn.eventTitle}</td>
                  <td className="py-3 text-[#212529]">{formatCurrency(txn.amount)}</td>
                  <td className="py-3">
                    <Badge variant="primary">{typeLabels[txn.type] ?? txn.type}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={txn.direction === 'credit' ? 'success' : 'danger'}>
                      {txn.direction === 'credit' ? '↑ Credit' : '↓ Debit'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading transactions...' : 'No transactions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
