import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const summary = [
  { id: 'sum-1', title: 'Total Earned', value: 12450 },
  { id: 'sum-2', title: 'This Month', value: 3200 },
  { id: 'sum-3', title: 'Average/Event', value: 265 },
];

const earningsBreakdown = [
  { id: 'earn-1', date: 'Jan 12', event: 'Meet & Greet', bids: 23, winner: 'Rahul', earned: 405 },
  { id: 'earn-2', date: 'Jan 10', event: 'Cooking Demo', bids: 18, winner: 'Priya', earned: 270 },
  { id: 'earn-3', date: 'Jan 03', event: 'Creator AMA', bids: 12, winner: 'Amit', earned: 180 },
];

export function CreatorEarnings() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">Earnings</h1>
          <p className="text-sm text-[#6C757D]">Track revenue trends and payment history.</p>
        </div>
        <Button variant="secondary">Export CSV</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.id} elevated>
            <CardHeader title={item.title} />
            <CardContent>
              <div className="text-3xl font-bold text-[#212529]">{formatCurrency(item.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Revenue (Last 30 days)"
          subtitle="Visualize how your earnings have changed over time"
        />
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] text-[#6C757D]">
            Line chart placeholder
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Earnings Breakdown" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Event</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Winner</th>
                <th className="border-b border-[#E9ECEF] py-3">Earned</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#212529]">
              {earningsBreakdown.map((row) => (
                <tr key={row.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3">{row.date}</td>
                  <td className="py-3">{row.event}</td>
                  <td className="py-3">{row.bids}</td>
                  <td className="py-3">{row.winner}</td>
                  <td className="py-3">{formatCurrency(row.earned)}</td>
                  <td className="py-3">
                    <Badge variant="success">Paid</Badge>
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
