import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const creatorEvents = [
  {
    id: 'event-1',
    title: 'Meet & Greet - Q&A Session',
    status: 'LIVE',
    date: 'Jan 15, 2025 • 4:00 PM',
    duration: '10 mins',
    basePrice: 100,
    currentBid: 450,
    participants: 18,
    endsIn: '01:23:45',
  },
  {
    id: 'event-2',
    title: 'Productivity Masterclass',
    status: 'Upcoming',
    date: 'Jan 18, 2025 • 6:00 PM',
    duration: '10 mins',
    basePrice: 120,
    currentBid: 0,
    participants: 0,
    endsIn: 'Starts in 2 days',
  },
];

export function CreatorEvents() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">My Events</h1>
          <p className="text-sm text-[#6C757D]">Manage and monitor all of your scheduled sessions.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Upcoming', 'Live', 'Completed'].map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={filter === 'All' ? 'primary' : 'secondary'}
              className="rounded-full px-4"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {creatorEvents.map((event) => (
          <Card key={event.id} elevated className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                  {event.status === 'LIVE' ? '🔴 LIVE' : event.status}
                </Badge>
                <span className="text-sm text-[#6C757D]">{event.date}</span>
              </div>
              <h3 className="text-xl font-semibold text-[#212529]">{event.title}</h3>
              <div className="text-sm text-[#6C757D]">
                Duration: {event.duration} • Base Price: {formatCurrency(event.basePrice)}
              </div>
              <div className="grid gap-2 rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 text-sm">
                <span>
                  💰 Current Bid: <strong className="text-[#212529]">{formatCurrency(event.currentBid)}</strong>
                </span>
                <span>🔥 {event.participants} participants</span>
                <span>⏱️ {event.endsIn}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">Edit</Button>
              <Button variant="danger">Delete</Button>
              <Button>Share Link</Button>
              <Button variant="ghost">View Details →</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
