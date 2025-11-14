import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const mockEvents = [
  {
    id: '1',
    creator: 'Priya Sharma',
    username: '@priyasharma',
    status: 'LIVE',
    bids: 18,
    endsIn: '01:45:32',
    currentBid: 450,
    basePrice: 100,
    duration: '10 minutes',
  },
  {
    id: '2',
    creator: 'Rohan Gupta',
    username: '@rohanlive',
    status: 'UPCOMING',
    bids: 8,
    endsIn: 'Starts in 3h',
    currentBid: 220,
    basePrice: 80,
    duration: '5 minutes',
  },
];

export function FanDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-[#212529]">Browse Events</h1>
        <div className="flex flex-wrap items-center gap-3">
          {['All', 'Paid Events', 'Free Events', 'Live Now'].map((filter) => (
            <Button
              key={filter}
              variant={filter === 'All' ? 'primary' : 'secondary'}
              size="sm"
              className="rounded-full px-5"
            >
              {filter}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-[#6C757D]">Sort by</span>
            <Button variant="secondary" size="sm" className="rounded-[8px]">
              Most Popular ▼
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {mockEvents.map((event) => (
          <Card key={event.id} elevated className="flex h-full flex-col overflow-hidden p-0">
            <div className="relative h-40 w-full flex-shrink-0 bg-gradient-to-br from-[#FFE5D9] via-white to-[#FFE5D9]" />
            <div className="flex flex-1 flex-col gap-6 px-6 pb-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-[160px]">
                  <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'} className="mb-2">
                    {event.status === 'LIVE' ? '🔴 LIVE' : '⏰ Upcoming'}
                  </Badge>
                  <h3 className="text-xl font-semibold text-[#212529]">{event.creator}</h3>
                  <p className="text-sm text-[#6C757D]">{event.username}</p>
                </div>
                <Button variant="secondary" size="sm">
                  Share Link
                </Button>
              </div>

              <div className="rounded-[16px] border border-[#FFE5D9] bg-[#FFE5D9]/70 p-4">
                <div className="text-sm text-[#6C757D]">⏱️ Ends in</div>
                <div className="text-2xl font-bold text-[#FF6B35]">{event.endsIn}</div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[12px] bg-[#F8F9FA] p-4">
                  <div className="text-sm text-[#6C757D]">💰 Current Highest Bid</div>
                  <div className="text-2xl font-bold text-[#212529]">{formatCurrency(event.currentBid)}</div>
                  <div className="text-xs text-[#6C757D]">🔥 {event.bids} participants</div>
                </div>
                <div className="rounded-[12px] bg-[#F8F9FA] p-4">
                  <div className="text-sm text-[#6C757D]">Duration</div>
                  <div className="text-lg font-semibold text-[#212529]">{event.duration}</div>
                  <div className="text-sm text-[#6C757D]">Base Price: {formatCurrency(event.basePrice)}</div>
                </div>
              </div>

              <Button className="w-full">Place Bid →</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
