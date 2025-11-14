import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const refundHistory = [
  { id: 'ref-1', date: 'Jan 12', event: 'Priya Event', amount: 270, status: 'Processed' },
  { id: 'ref-2', date: 'Jan 10', event: 'Rohan Event', amount: 180, status: 'Pending' },
  { id: 'ref-3', date: 'Jan 05', event: 'Amit Event', amount: 140, status: 'Failed' },
];

const statusVariantMap: Record<string, 'success' | 'primary' | 'danger'> = {
  Processed: 'success',
  Pending: 'primary',
  Failed: 'danger',
};

export function FanWallet() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Wallet & Refunds</h1>
        <p className="text-sm text-[#6C757D]">Track your credits, withdrawals, and refund status.</p>
      </div>

      <Card elevated className="max-w-md">
        <CardHeader title="Wallet Balance" subtitle="All refunds are auto-processed" />
        <CardContent className="gap-3">
          <div className="text-4xl font-bold text-[#212529]">{formatCurrency(0)}</div>
          <Button variant="secondary" size="sm" disabled>
            Request Withdrawal (Coming soon)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Refund History" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Event</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#212529]">
              {refundHistory.map((item) => (
                <tr key={item.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3">{item.date}</td>
                  <td className="py-3">{item.event}</td>
                  <td className="py-3">{formatCurrency(item.amount)}</td>
                  <td className="py-3">
                    <Badge variant={statusVariantMap[item.status] ?? 'primary'}>{item.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
