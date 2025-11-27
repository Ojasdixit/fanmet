import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, Button, Badge } from '@fanmeet/ui';

const mockEvents = [
  {
    id: '1',
    creator: 'Priya Sharma',
    category: 'Gaming',
    status: 'LIVE',
    bids: 18,
    currentBid: 450,
    basePrice: 100,
    duration: '10 minutes',
  },
  {
    id: '2',
    creator: 'Rohan Gupta',
    category: 'Cooking',
    status: 'UPCOMING',
    bids: 8,
    currentBid: 220,
    basePrice: 80,
    duration: '5 minutes',
  },
  {
    id: '3',
    creator: 'Amit Singh',
    category: 'Art & Design',
    status: 'UPCOMING',
    bids: 4,
    currentBid: 150,
    basePrice: 60,
    duration: '10 minutes',
  },
];

export function BrowseEventsPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return mockEvents;
    const lowerQuery = searchQuery.toLowerCase();
    return mockEvents.filter(
      (event) =>
        event.creator.toLowerCase().includes(lowerQuery) ||
        event.category.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Browse Events</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
          Explore live and upcoming FanMeet events.
        </h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          This is a public browse page so fans can get a feel for the experience before creating an account.
          When you are ready to bid or join, you can sign up in a single step.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <Card key={event.id} elevated className="flex h-full flex-col overflow-hidden p-0">
              <div className="relative h-36 w-full flex-shrink-0 bg-gradient-to-br from-[#FCE7FF] via-white to-[#E5DEFF]" />
              <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge
                      variant={event.status === 'LIVE' ? 'danger' : 'primary'}
                      className="mb-1 text-[11px] uppercase tracking-wide"
                    >
                      {event.status === 'LIVE' ? '🔴 Live Now' : '⏰ Upcoming'}
                    </Badge>
                    <div className="text-lg font-semibold text-[#212529]">{event.creator}</div>
                    <div className="text-xs text-[#6C757D]">{event.category}</div>
                  </div>
                  <div className="text-right text-xs text-[#6C757D]">
                    <div>{event.duration}</div>
                    <div className="mt-1">Base price: ₹{event.basePrice}</div>
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#F4E6FF] bg-[#F8F9FA] p-4 text-sm text-[#343A40]">
                  <div className="flex items-center justify-between">
                    <span>Current highest bid</span>
                    <span className="text-base font-semibold text-[#C045FF]">₹{event.currentBid}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#6C757D]">{event.bids} fans bidding</div>
                </div>

                <Button className="mt-auto w-full bg-[#050014] text-white hover:bg-[#140423]" size="sm">
                  View event details
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-[#6C757D]">
            No events found matching "{searchQuery}"
          </div>
        )}
      </section>

      <section>
        <Card elevated className="border-dashed border-[#E9ECEF] bg-[#F8F9FA]">
          <CardHeader
            title="Ready to bid or join a free event?"
            subtitle="Create a fan account in less than 30 seconds and keep track of all your bids and meetings."
          />
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-sm text-[#6C757D]">
              Login or sign up from the top-right corner when you are ready. You can browse this page without an
              account.
            </p>
            <Button size="sm">Go to login / sign up</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
