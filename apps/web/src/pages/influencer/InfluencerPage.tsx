import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

import { CircularGallery } from '../../components/CircularGallery';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';

export function InfluencerPage() {
  const { username: rawUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { getEventsForCreator, placeBid } = useEvents();

  const usernameSlug = (rawUsername ?? '').replace(/^@/, '').toLowerCase();
  const storedEvents = usernameSlug ? getEventsForCreator(usernameSlug) : [];

  const syntheticEvent = !storedEvents.length && usernameSlug
    ? {
        id: `synthetic-${usernameSlug}`,
        creatorUsername: usernameSlug,
        creatorDisplayName:
          usernameSlug
            .split(/[-_]/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') || 'Creator',
        title: 'Meet & Greet – 1:1 Fan Session',
        description:
          'A quick 1:1 session to say hi, ask a couple of questions, and take a virtual selfie together.',
        status: 'Upcoming' as const,
        date: 'This week • 8:00 PM IST',
        duration: '5 minutes',
        basePrice: 150,
        currentBid: 0,
        participants: 0,
        endsIn: 'Starts soon',
      }
    : undefined;

  const effectiveEvents = storedEvents.length > 0 ? storedEvents : syntheticEvent ? [syntheticEvent] : [];
  const primaryEvent = effectiveEvents[0];

  const displayName = primaryEvent?.creatorDisplayName || 'Creator';
  const handle = `@${usernameSlug || 'creator'}`;
  const bio =
    primaryEvent?.description ||
    'Host of intimate FanMeet sessions. Expect honest stories, practical advice, and space for your questions.';

  const [bidAmount, setBidAmount] = useState('');

  const galleryItems = [
    {
      image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80',
      text: 'Behind-the-scenes shoot',
    },
    {
      image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80',
      text: 'Fan meet highlight',
    },
    {
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      text: 'Podcast recording day',
    },
  ];

  const handlePlaceBid = () => {
    if (!primaryEvent) {
      window.alert('No active events to bid on right now.');
      return;
    }

    const amount = Number(bidAmount);

    if (!amount || Number.isNaN(amount)) {
      window.alert('Enter a valid bid amount to continue.');
      return;
    }

    if (!isAuthenticated || user?.role !== 'fan') {
      window.alert('Please login as a fan to place a bid.');
      navigate(`/auth?redirect=/${rawUsername ?? usernameSlug}`);
      return;
    }

    placeBid(primaryEvent.id, amount);
    window.alert('Your bid has been placed in this demo environment.');
    setBidAmount('');
  };

  const hasEvent = !!primaryEvent;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <Card elevated className="overflow-hidden border-none bg-gradient-to-r from-[#FCE7FF] via-[#F4E6FF] to-[#E5DEFF]">
        <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:px-8 md:py-8">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-[#6C757D]">
              <span className="h-6 w-6 rounded-full bg-[#050014] text-center text-sm leading-6 text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-[#212529]">{displayName}</span>
              <span className="text-[#6C757D]">{handle}</span>
            </div>
            <p className="text-sm text-[#6C757D] md:text-base">{bio}</p>
            <div className="flex flex-wrap gap-4 text-xs text-[#6C757D]">
              <span>👥 48K followers</span>
              <span>🎥 120+ live sessions</span>
              <span>⭐ 4.8 rated by fans</span>
            </div>
          </div>
          <div className="mt-4 h-40 w-full rounded-2xl bg-[#050014] text-white shadow-lg md:mt-0 md:w-80">
            <div className="h-full w-full overflow-hidden rounded-2xl">
              <CircularGallery items={galleryItems} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card elevated className="overflow-hidden p-0">
          <div className="h-40 w-full bg-gradient-to-br from-[#FFE5D9] via-white to-[#F4E6FF]" />
          <CardContent className="gap-5 px-6 pb-6 pt-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#6C757D]">
                {hasEvent && (
                  <Badge variant={primaryEvent.status === 'LIVE' ? 'danger' : 'primary'}>
                    {primaryEvent.status === 'LIVE' ? '🔴 LIVE' : primaryEvent.status}
                  </Badge>
                )}
                {hasEvent && <span>{primaryEvent.date}</span>}
                {hasEvent && <span>• Duration: {primaryEvent.duration}</span>}
              </div>
              <h2 className="text-xl font-semibold text-[#212529]">
                {hasEvent ? primaryEvent.title : 'No active events yet'}
              </h2>
              <p className="text-sm text-[#6C757D]">
                {hasEvent
                  ? 'Bid for a chance to join this creator in an exclusive FanMeet session.'
                  : 'This creator has not published an event yet. Check back soon.'}
              </p>
            </div>

            {hasEvent && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[12px] bg-[#F8F9FA] p-4 text-sm text-[#6C757D]">
                  <div>Base Price</div>
                  <div className="text-2xl font-semibold text-[#212529]">
                    {formatCurrency(primaryEvent.basePrice)}
                  </div>
                </div>
                <div className="rounded-[12px] bg-[#F8F9FA] p-4 text-sm text-[#6C757D]">
                  <div>Current Highest Bid</div>
                  <div className="text-2xl font-semibold text-[#C045FF]">
                    {primaryEvent.currentBid ? formatCurrency(primaryEvent.currentBid) : 'No bids yet'}
                  </div>
                  <div className="text-xs text-[#6C757D]">
                    🔥 {primaryEvent.participants} participants
                  </div>
                </div>
              </div>
            )}

            <div className="mt-2 flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">
                    Place your bid
                  </span>
                  <span className="text-xs text-[#6C757D]">
                    You will be asked to login as a fan before your bid is placed.
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <TextInput
                    type="number"
                    label="Your bid amount"
                    placeholder={hasEvent ? String(primaryEvent.basePrice) : 'Enter bid amount'}
                    value={bidAmount}
                    onChange={(event) => setBidAmount(event.target.value)}
                  />
                </div>
                <Button
                  className="md:w-40"
                  disabled={!hasEvent}
                  onClick={handlePlaceBid}
                >
                  Place Bid →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Creator gallery"
            subtitle="A rotating peek into this creator's moments, content, and meetups."
          />
          <CardContent className="h-72 overflow-hidden">
            <CircularGallery items={galleryItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
