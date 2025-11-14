import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const transactions = [
  {
    id: 'txn-1',
    date: 'Jan 12',
    time: '4:23 PM',
    user: 'Rahul K.',
    event: 'Event #342',
    amount: 450,
    type: 'Bid',
    status: 'Processed',
  },
  {
    id: 'txn-2',
    date: 'Jan 12',
    time: '4:20 PM',
    user: 'Priya S.',
    event: 'Event #342',
    amount: 270,
    type: 'Refund',
    status: 'Processed',
  },
  {
    id: 'txn-3',
    date: 'Jan 11',
    time: '3:15 PM',
    user: 'Amit G.',
    event: 'Event #341',
    amount: 120,
    type: 'Commission',
    status: 'Pending',
  },
];

const statusVariant: Record<string, 'success' | 'primary' | 'danger'> = {
  Processed: 'success',
  Pending: 'primary',
  Failed: 'danger',
};

export function AdminPayments() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payments</h1>
          <p className="text-sm text-[#ADB5BD]">Review platform transactions, refunds, and commissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export CSV</Button>
          <Button>Manual Adjustment</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-[#2C2F33] text-white">
          <CardHeader title="Total Processed" />
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(452300)}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#2C2F33] text-white">
          <CardHeader title="Total Refunded" />
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(123400)}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#2C2F33] text-white">
          <CardHeader title="Pending Payouts" />
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(23400)}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#2C2F33] text-white">
          <CardHeader title="Disputes" />
          <CardContent>
            <div className="text-3xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader title="Transactions" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#ADB5BD]">
              <tr>
                <th className="border-b border-[#3A3D42] py-3">Date</th>
                <th className="border-b border-[#3A3D42] py-3">Time</th>
                <th className="border-b border-[#3A3D42] py-3">User</th>
                <th className="border-b border-[#3A3D42] py-3">Event</th>
                <th className="border-b border-[#3A3D42] py-3">Amount</th>
                <th className="border-b border-[#3A3D42] py-3">Type</th>
                <th className="border-b border-[#3A3D42] py-3">Status</th>
                <th className="border-b border-[#3A3D42] py-3" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-[#3A3D42]">
                  <td className="py-3 text-white">{txn.date}</td>
                  <td className="py-3 text-[#ADB5BD]">{txn.time}</td>
                  <td className="py-3 text-white">{txn.user}</td>
                  <td className="py-3 text-white">{txn.event}</td>
                  <td className="py-3 text-white">{formatCurrency(txn.amount)}</td>
                  <td className="py-3 text-white">{txn.type}</td>
                  <td className="py-3 text-white">
                    <Badge variant={statusVariant[txn.status] ?? 'primary'}>{txn.status}</Badge>
                  </td>
                  <td className="py-3">
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
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
