import { Card, CardContent, CardHeader, Button, TextInput, Badge } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';

const withdrawalSummary = {
  available: 12450,
  pending: 2750,
  lastPayout: {
    amount: 5200,
    processedAt: new Date('2025-01-06T15:30:00')
  }
};

const payoutHistory = [
  {
    id: 'wd-1',
    amount: 5200,
    status: 'Completed',
    destination: 'HDFC ••8290',
    requestedAt: new Date('2024-12-30T13:05:00'),
    processedAt: new Date('2025-01-06T15:30:00')
  },
  {
    id: 'wd-2',
    amount: 3100,
    status: 'In review',
    destination: 'HDFC ••8290',
    requestedAt: new Date('2024-12-07T11:45:00'),
    processedAt: undefined
  }
];

const statusVariantMap: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  Completed: 'success',
  'In review': 'warning',
  Failed: 'danger'
};

export function CreatorWithdrawals() {
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
            <div className="rounded-[16px] bg-[#FFE5D9]/60 p-6">
              <span className="text-sm text-[#6C757D]">Ready to withdraw</span>
              <p className="text-4xl font-bold text-[#FF6B35]">{formatCurrency(withdrawalSummary.available)}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                <span className="text-sm text-[#6C757D]">Pending clearance</span>
                <p className="text-xl font-semibold text-[#212529]">{formatCurrency(withdrawalSummary.pending)}</p>
                <p className="text-xs text-[#6C757D]">Will move to available after events conclude.</p>
              </div>
              <div className="rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                <span className="text-sm text-[#6C757D]">Last payout</span>
                <p className="text-xl font-semibold text-[#212529]">{formatCurrency(withdrawalSummary.lastPayout.amount)}</p>
                <p className="text-xs text-[#6C757D]">Processed {formatDateTime(withdrawalSummary.lastPayout.processedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Request Withdrawal" subtitle="Transfers typically arrive in 2-3 business days." />
          <CardContent className="gap-5">
            <div className="grid gap-4">
              <TextInput label="Amount" placeholder="₹5,000" type="number" min={0} step={100} />
              <TextInput label="Destination account" placeholder="HDFC Bank ••8290" />
            </div>
            <div className="rounded-[12px] bg-[#F8F9FA] p-4 text-sm text-[#6C757D]">
              Note: We process withdrawals above ₹500. Ensure your KYC details are up to date for smoother payouts.
            </div>
            <Button size="lg">Submit request</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Payout History" subtitle="A log of all recent withdrawal activity." className="border-b border-[#E9ECEF] pb-4" />
        <CardContent className="gap-4">
          {payoutHistory.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariantMap[entry.status] ?? 'default'}>{entry.status}</Badge>
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
          ))}
          <Button variant="ghost" className="self-start">
            View full history →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
