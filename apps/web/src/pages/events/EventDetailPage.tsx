import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { events, placeBid } = useEvents();

  let event = events.find((item) => item.id === eventId);

  // If this is a synthetic demo event (from profile pages), reconstruct it from the ID
  if (!event && eventId && eventId.startsWith('synthetic-')) {
    const withoutPrefix = eventId.replace(/^synthetic-/, '');
    const lastDashIndex = withoutPrefix.lastIndexOf('-');

    if (lastDashIndex > 0) {
      const usernameSlug = withoutPrefix.slice(0, lastDashIndex);
      const indexRaw = withoutPrefix.slice(lastDashIndex + 1);
      const index = Number(indexRaw);

      if (usernameSlug && Number.isFinite(index)) {
        const prettyName =
          usernameSlug
            .split(/[-_]/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') || 'Creator';

        const basePrice = 100 + index * 25;
        const currentBid = index % 2 === 0 ? basePrice + 120 : 0;
        const participants = index % 2 === 0 ? 5 + index * 2 : 0;

        event = {
          id: eventId,
          creatorUsername: usernameSlug,
          creatorDisplayName: prettyName,
          title:
            index === 0
              ? 'Meet & Greet – 1:1 Fan Session'
              : index === 1
              ? 'Premium AMA – Ask Me Anything'
              : index === 2
              ? 'Deep Dive – Strategy Session'
              : index === 3
              ? 'Behind the Scenes Chat'
              : 'Quick Catch-up Call',
          description:
            'A quick 1:1 session to say hi, ask a couple of questions, and take a virtual selfie together.',
          status: index === 0 ? ('LIVE' as const) : ('Upcoming' as const),
          date: index === 0 ? 'Today • 8:00 PM IST' : 'This week • 8:00 PM IST',
          duration: index % 2 === 0 ? '10 minutes' : '5 minutes',
          basePrice,
          currentBid,
          participants,
          endsIn: index === 0 ? '00:35:12 left' : 'Starts soon',
        } as (typeof events)[number];
      }
    }
  }

  const [bidAmount, setBidAmount] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (!event) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <Card elevated>
          <CardHeader title="Event not found" subtitle="This event may have expired or been removed." />
          <CardContent className="gap-4">
            <p className="text-sm text-[#6C757D]">
              If you followed an older link, ask the creator for their latest event or visit their profile for current
              sessions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Go back
              </Button>
              <Button onClick={() => navigate('/')}>Go to homepage</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleShare = () => {
    const url = `${window.location.origin}/events/${event.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          window.alert('Event link copied. Share it with your fans to start receiving bids.');
        },
        () => {
          window.prompt('Share this event link with your fans:', url);
        },
      );
    } else {
      window.prompt('Share this event link with your fans:', url);
    }
  };

  const handlePlaceBid = () => {
    const amount = Number(bidAmount);

    if (!amount || Number.isNaN(amount)) {
      window.alert('Enter a valid bid amount to continue.');
      return;
    }

    if (!isAuthenticated || user?.role !== 'fan') {
      setShowAuthDialog(true);
      return;
    }

    placeBid(event.id, amount);
    window.alert('Your bid has been placed in this demo environment.');
    setBidAmount('');
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-70px)] max-w-3xl flex-col bg-white pb-6">
      {/* Cover + compact header */}
      <div className="relative">
        <div className="h-40 w-full bg-gradient-to-br from-[#FFE5D9] via-white to-[#F4E6FF] md:h-48" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent px-4 py-3 text-xs font-medium text-white">
          <button
            type="button"
            className="rounded-full bg-black/30 px-3 py-1"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-[11px] uppercase tracking-wide text-white/80">Bidding event</span>
            <span className="text-sm font-semibold">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
        {/* Host + quick facts */}
        <Card elevated className="border-none">
          <CardContent className="gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Hosted by</span>
                <span className="text-sm font-semibold text-[#212529]">{event.creatorDisplayName}</span>
                <span className="text-xs text-[#6C757D]">@{event.creatorUsername}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-[#6C757D]">
                <span className="rounded-full bg-[#F8F9FA] px-3 py-1">👥 {event.participants} participants</span>
                <span className="rounded-full bg-[#F8F9FA] px-3 py-1">⏱️ {event.duration}</span>
              </div>
            </div>

            <div className="grid gap-3 text-xs text-[#6C757D] md:grid-cols-2">
              <div className="rounded-[12px] bg-[#F8F9FA] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide">Schedule</div>
                <div className="mt-1 text-sm text-[#212529]">{event.date}</div>
              </div>
              <div className="rounded-[12px] bg-[#F8F9FA] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide">Status</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-[#212529]">
                  <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                    {event.status === 'LIVE' ? '🔴 LIVE' : event.status}
                  </Badge>
                  <span className="text-xs text-[#6C757D]">{event.endsIn}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {event.description ? (
          <Card>
            <CardHeader title="About this event" />
            <CardContent className="gap-3">
              <p className="text-sm text-[#495057]">{event.description}</p>
              <p className="text-xs text-[#6C757D]">
                This is a demo environment. In a real product, this section would outline the exact flow of the
                experience, how long the interaction lasts, and any preparation required before joining.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* What you'll get - dummy content */}
        <Card>
          <CardHeader title="What you'll get" />
          <CardContent className="gap-3 text-sm text-[#495057]">
            <ul className="space-y-1 text-xs text-[#495057]">
              <li>• A 1:1 micro-meet with the creator with room for your questions.</li>
              <li>• Optional screenshot / selfie moment at the end of the call.</li>
              <li>• Priority chat placement during the live session.</li>
            </ul>
            <p className="text-[11px] text-[#6C757D]">
              Exact perks are for demo only and can be customised per creator event.
            </p>
          </CardContent>
        </Card>

        {/* Small print - dummy terms */}
        <Card>
          <CardHeader title="Small print" />
          <CardContent className="gap-2 text-[11px] text-[#6C757D]">
            <p>
              Bids placed in this sandbox are not real payments. In production, only the top bidders would be charged
              after the auction window ends.
            </p>
            <p>
              By placing a bid you agree to follow community guidelines and respect the creator&apos;s time and
              boundaries.
            </p>
          </CardContent>
        </Card>

        {/* Bidding card */}
        <Card elevated className="sticky bottom-0 border-none shadow-[0_-8px_24px_rgba(15,23,42,0.12)] md:static md:shadow-none">
          <CardContent className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6C757D]">
                  Current highest bid
                </span>
                <span className="text-xl font-semibold text-[#C045FF]">
                  {event.currentBid ? formatCurrency(event.currentBid) : formatCurrency(event.basePrice)}
                </span>
                <span className="text-[11px] text-[#6C757D]">
                  Base price {formatCurrency(event.basePrice)} • {event.participants} participants
                </span>
              </div>
              <Button variant="secondary" size="sm" className="rounded-full text-xs" onClick={handleShare}>
                Share event link
              </Button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <TextInput
                  type="number"
                  label="Your bid amount"
                  placeholder={String(event.basePrice)}
                  value={bidAmount}
                  onChange={(inputEvent) => setBidAmount(inputEvent.target.value)}
                />
              </div>
              <Button className="md:w-40" onClick={handlePlaceBid}>
                Place Bid →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auth dialog for unauthenticated fans */}
      {showAuthDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-sm flex-1 rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[#212529]">Login to place your bid</h2>
            <p className="mt-2 text-sm text-[#6C757D]">
              You&apos;ll need a fan account to place bids and join this meet. We&apos;ll take you to the login page
              and bring you back here after you&apos;re done.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={() => navigate(`/auth?redirect=/events/${event.id}`)}
                className="w-full"
              >
                Continue to login / signup
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowAuthDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
