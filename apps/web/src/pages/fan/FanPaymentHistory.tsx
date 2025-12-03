import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'completed' | 'pending' | 'refunded' | 'failed';
}

export function FanPaymentHistory() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [stats, setStats] = useState({ totalPaid: 0, totalRefunded: 0 });

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user) {
        setPayments([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch payment records from the payments table
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('id, amount, status, type, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
        }

        // Also fetch bids to show bid payments
        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, amount, status, created_at, event_id')
          .eq('fan_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        // Get event titles for bids
        const eventIds = bidsData?.map(b => b.event_id) || [];
        const { data: eventsData } = eventIds.length > 0
          ? await supabase.from('events').select('id, title').in('id', eventIds)
          : { data: [] };
        
        const eventsMap = new Map(eventsData?.map(e => [e.id, e.title]) || []);

        // Combine payments and bids into a unified history
        const paymentRows: PaymentRow[] = [];

        // Add regular payments
        if (paymentsData) {
          for (const p of paymentsData) {
            paymentRows.push({
              id: p.id,
              date: new Date(p.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              }),
              description: p.description || (p.type === 'refund' ? 'Refund' : 'Payment'),
              amount: p.amount,
              type: p.type === 'refund' ? 'credit' : 'debit',
              status: p.status as PaymentRow['status'],
            });
          }
        }

        // Add bid payments
        if (bidsData) {
          for (const b of bidsData) {
            const eventTitle = eventsMap.get(b.event_id) || 'Event';
            const isRefunded = b.status === 'refunded' || b.status === 'lost';
            
            // Add the bid payment
            paymentRows.push({
              id: `bid-${b.id}`,
              date: new Date(b.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              }),
              description: `Bid on "${eventTitle}"`,
              amount: b.amount,
              type: 'debit',
              status: b.status === 'won' ? 'completed' : b.status === 'active' ? 'pending' : 'completed',
            });

            // If bid was refunded, show the refund too
            if (isRefunded) {
              paymentRows.push({
                id: `refund-${b.id}`,
                date: new Date(b.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                }),
                description: `Refund for "${eventTitle}" (Auto-refund)`,
                amount: Math.floor(b.amount * 0.9), // 90% refund
                type: 'credit',
                status: 'refunded',
              });
            }
          }
        }

        // Sort by date descending
        paymentRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate stats
        const totalPaid = paymentRows
          .filter(p => p.type === 'debit' && p.status !== 'failed')
          .reduce((sum, p) => sum + p.amount, 0);
        const totalRefunded = paymentRows
          .filter(p => p.type === 'credit')
          .reduce((sum, p) => sum + p.amount, 0);

        setPayments(paymentRows);
        setStats({ totalPaid, totalRefunded });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPaymentHistory();
  }, [user]);

  const getStatusBadge = (status: PaymentRow['status'], type: PaymentRow['type']) => {
    if (type === 'credit') {
      return <Badge variant="success">Refunded</Badge>;
    }
    
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="primary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Payment History</h1>
        <p className="text-sm text-[#6C757D]">View all your payments and refunds. Auto-refunds are processed for unsuccessful bids.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
        <Card elevated>
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Paid</div>
            <div className="mt-1 text-2xl font-bold text-[#212529]">
              {isLoading ? '...' : formatCurrency(stats.totalPaid)}
            </div>
            <div className="text-xs text-[#6C757D]">All-time bid payments</div>
          </CardContent>
        </Card>
        <Card elevated>
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Refunded</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {isLoading ? '...' : formatCurrency(stats.totalRefunded)}
            </div>
            <div className="text-xs text-[#6C757D]">Auto-refunds (90% of bid amount)</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="max-w-2xl bg-[#F0FDF4] border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">✅</span>
            <div>
              <div className="font-semibold text-green-800">Auto-Refund System Active</div>
              <div className="text-sm text-green-700">
                If you don't win an event, 90% of your bid amount is automatically refunded to your original payment method within 5-7 business days.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader title="Transaction History" subtitle="All payments and refunds" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3 px-2">Date</th>
                <th className="border-b border-[#E9ECEF] py-3 px-2">Description</th>
                <th className="border-b border-[#E9ECEF] py-3 px-2">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3 px-2">Type</th>
                <th className="border-b border-[#E9ECEF] py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#212529]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-[#6C757D]">
                    Loading payment history...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-[#6C757D]">
                    No payments yet. Place a bid on an event to get started!
                  </td>
                </tr>
              ) : (
                payments.map((item) => (
                  <tr key={item.id} className="border-b border-[#E9ECEF] hover:bg-[#F8F9FA]">
                    <td className="py-3 px-2 whitespace-nowrap">{item.date}</td>
                    <td className="py-3 px-2">{item.description}</td>
                    <td className="py-3 px-2">
                      <span className={item.type === 'credit' ? 'text-green-600 font-semibold' : 'text-[#212529]'}>
                        {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={item.type === 'credit' ? 'success' : 'primary'}>
                        {item.type === 'credit' ? 'Credit' : 'Debit'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(item.status, item.type)}
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
