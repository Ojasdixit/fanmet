import { Card, CardHeader, CardContent, Button, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const activeBids = [
  {
    id: 'bid-1',
    creator: 'Priya Sharma',
    event: 'Meet & Greet - Q&A Session',
    yourBid: 300,
    currentBid: 450,
    timeLeft: '2h left',
  },
  {
    id: 'bid-2',
    creator: 'Amit Singh',
    event: 'Cooking Masterclass',
    yourBid: 180,
    currentBid: 220,
    timeLeft: '45m left',
  },
];

const pastResults = [
  {
    id: 'win-1',
    creator: 'Rohan Gupta',
    event: 'Build a YouTube Channel',
    result: 'Won',
    winningBid: 360,
  },
  {
    id: 'win-2',
    creator: 'Maya Kapoor',
    event: 'Creative Writing Circle',
    result: 'Lost',
    winningBid: 420,
  },
];

export function FanBids() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">My Bids</h1>
        <p className="text-sm text-[#6C757D]">Track your bidding activity and results.</p>
      </div>

      <Card elevated>
        <CardHeader
          title="Active Bids"
          subtitle="Stay on top of the events you are currently bidding on"
        />
        <CardContent className="gap-6">
          {activeBids.map((bid) => (
            <div
              key={bid.id}
              className="grid gap-3 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 md:grid-cols-[1.5fr_1fr_auto] md:items-center"
            >
              <div>
                <div className="text-sm text-[#6C757D]">{bid.creator}</div>
                <div className="text-base font-semibold text-[#212529]">{bid.event}</div>
              </div>
              <div className="grid gap-1 text-sm text-[#6C757D] md:justify-items-end">
                <span>
                  Your Bid: <strong className="text-[#212529]">{formatCurrency(bid.yourBid)}</strong>
                </span>
                <span>
                  Current: <strong className="text-[#C045FF]">{formatCurrency(bid.currentBid)}</strong>
                </span>
                <span>⏱️ {bid.timeLeft}</span>
              </div>
              <div className="flex gap-2 md:justify-end">
                <Button size="sm">Increase Bid</Button>
                <Button size="sm" variant="secondary">
                  Details →
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Bid Results" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] pb-3">Creator</th>
                <th className="border-b border-[#E9ECEF] pb-3">Event</th>
                <th className="border-b border-[#E9ECEF] pb-3">Result</th>
                <th className="border-b border-[#E9ECEF] pb-3">Winning Bid</th>
              </tr>
            </thead>
            <tbody className="text-[#212529]">
              {pastResults.map((row) => (
                <tr key={row.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3">{row.creator}</td>
                  <td className="py-3">{row.event}</td>
                  <td className="py-3">
                    <Badge variant={row.result === 'Won' ? 'success' : 'danger'}>{row.result}</Badge>
                  </td>
                  <td className="py-3">{formatCurrency(row.winningBid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
