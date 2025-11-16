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

const recentWins = [
  {
    id: 'rw-1',
    fanName: 'Ananya · 21 · Pune',
    creator: 'Priya Sharma',
    amount: 320,
    timeAgo: '2 min ago',
  },
  {
    id: 'rw-2',
    fanName: 'Mohit · 19 · Delhi',
    creator: 'Rohan Gupta',
    amount: 260,
    timeAgo: '8 min ago',
  },
  {
    id: 'rw-3',
    fanName: 'Sara · 24 · Mumbai',
    creator: 'Neha Kapoor',
    amount: 180,
    timeAgo: '14 min ago',
  },
  {
    id: 'rw-4',
    fanName: 'Kunal · 22 · Bangalore',
    creator: 'Amit Singh',
    amount: 410,
    timeAgo: '23 min ago',
  },
];

const fanAnalytics = [
  {
    id: 'stat-1',
    label: 'Bids placed',
    value: '24',
    hint: '4 this week',
  },
  {
    id: 'stat-2',
    label: 'Win rate',
    value: '37%',
    hint: 'Based on last 30 days',
  },
  {
    id: 'stat-3',
    label: 'Refunds received',
    value: '₹1,820',
    hint: '90% back on lost bids',
  },
  {
    id: 'stat-4',
    label: 'Meets completed',
    value: '5',
    hint: 'Across 3 different creators',
  },
];

export function FanDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <Card
        elevated
        className="overflow-hidden border-none bg-gradient-to-r from-[#FCE7FF] via-[#F4E6FF] to-[#E5DEFF] shadow-[0_24px_60px_rgba(160,64,255,0.18)]"
      >
        <div className="relative flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:px-8 md:py-8">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">
              Browse Events
            </p>
            <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
              Find a live FanMeet that matches your vibe.
            </h1>
            <p className="text-sm text-[#6C757D] md:text-base">
              Explore live and upcoming auctions, bid in seconds, and win 1:1 video calls with creators you love.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['All', 'Paid Events', 'Free Events', 'Live Now'].map((filter) => (
                <Button
                  key={filter}
                  variant="primary"
                  size="sm"
                  className="rounded-full bg-[#050014] px-5 text-white hover:bg-[#140423]"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:ml-auto md:mt-0 md:text-right">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-[#6C757D]">
              Quick filters
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span className="text-sm text-[#6C757D]">Sort by</span>
              <Button
                variant="primary"
                size="sm"
                className="rounded-[10px] bg-white/80 px-4 text-sm font-medium text-[#050014] shadow-sm hover:bg-white"
              >
                Most Popular ▼
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-[#6C757D] md:justify-end">
              <span>
                
                
                {`🔴 ${mockEvents.filter((event) => event.status === 'LIVE').length} live now`}
              </span>
              <span>{`🎫 ${mockEvents.length} events today`}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {mockEvents.map((event) => (
          <Card key={event.id} elevated className="flex h-full flex-col overflow-hidden p-0">
            <div className="relative h-40 w-full flex-shrink-0 bg-gradient-to-br from-[#F4E6FF] via-white to-[#F4E6FF]" />
            <div className="flex flex-1 flex-col gap-6 px-6 pb-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-[160px]">
                  <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'} className="mb-2">
                    {event.status === 'LIVE' ? '🔴 LIVE' : '⏰ Upcoming'}
                  </Badge>
                  <h3 className="text-xl font-semibold text-[#212529]">{event.creator}</h3>
                  <p className="text-sm text-[#6C757D]">{event.username}</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#050014] text-white hover:bg-[#140423]"
                >
                  Share Link
                </Button>
              </div>

              <div className="rounded-[16px] border border-[#F4E6FF] bg-[#F4E6FF]/70 p-4">
                <div className="text-sm text-[#6C757D]">⏱️ Ends in</div>
                <div className="text-2xl font-bold text-[#C045FF]">{event.endsIn}</div>
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

              <Button
                variant="primary"
                className="w-full bg-[#050014] text-white hover:bg-[#140423]"
              >
                Place Bid →
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1.3fr]">
        <Card elevated className="h-full">
          <CardHeader
            title="Recent bid wins by other fans"
            subtitle="See what people are winning right now and get a feel for typical winning bids."
            className="border-b border-[#E9ECEF] pb-3"
          />
          <CardContent className="gap-3">
            {recentWins.map((win) => (
              <div
                key={win.id}
                className="flex items-center justify-between rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] px-4 py-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-[#212529]">{win.fanName}</span>
                  <span className="text-xs text-[#6C757D]">Won a meet with {win.creator}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[#C045FF]">{formatCurrency(win.amount)}</div>
                  <div className="text-xs text-[#6C757D]">{win.timeAgo}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card elevated>
            <CardHeader
              title="Your bidding insights"
              subtitle="Simple stats from your recent activity."
              className="border-b border-[#E9ECEF] pb-3"
            />
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {fanAnalytics.map((stat) => (
                <div
                  key={stat.id}
                  className="rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6C757D]">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-[#212529]">{stat.value}</div>
                  <div className="mt-1 text-xs text-[#6C757D]">{stat.hint}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card elevated className="bg-[#050014] text-white">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Tips to win more bids
              </div>
              <div className="text-sm text-white/90">
                Place your bid in the last few minutes, watch how fast prices move, and set a maximum amount you
                are comfortable with.
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-white/80">
                <li>Look at recent winning bids to guess a smart range.</li>
                <li>Start with smaller events to build your win streak.</li>
                <li>Remember you get 90% back if you do not win the bid.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
