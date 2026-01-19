import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import { useCreatorProfiles } from '../../contexts/CreatorProfileContext';
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment, openRazorpayCheckout } from '../../utils/razorpayHelpers';

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { events, placeBid, isLoading, getBidHistory, bidHistory, getUserCurrentBidForEvent, getWinningBid } = useEvents();
  const { getProfile } = useCreatorProfiles();

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [winner, setWinner] = useState<{ username: string; amount: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get creator profile for the event
  const creatorProfile = event ? getProfile(event.creatorUsername) : undefined;

  // Get user's current bid for this event
  const userCurrentBid = event ? getUserCurrentBidForEvent(event.id) : 0;
  const bidIncrement = Number(bidAmount) || 0;
  const cumulativeTotal = userCurrentBid + bidIncrement;

  const BID_STEP = 50;
  const isFirstBid = Boolean(event && event.currentBid === 0);
  const isEventCompleted = Boolean(event && String(event.status).toLowerCase() === 'completed');
  const displayedHighestBid = event ? (event.currentBid > 0 ? event.currentBid : event.basePrice) : 0;
  const nextSuggestedBid = event
    ? isFirstBid
      ? event.basePrice
      : displayedHighestBid + BID_STEP
    : 0;

  useEffect(() => {
    if (!event) return;
    if (isFirstBid) {
      setBidAmount(String(event.basePrice));
    }
  }, [event?.id, event?.currentBid, event?.basePrice]);

  useEffect(() => {
    const fetchWinner = async () => {
      if (!event || !isEventCompleted || event.id.startsWith('synthetic-')) return;
      const res = await getWinningBid(event.id);
      if (res) {
        setWinner({ username: res.fanUsername, amount: res.amount });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    };

    void fetchWinner();
  }, [event?.id, isEventCompleted]);

  const confettiPieces = useMemo(() =>
    Array.from({ length: 36 }).map((_, idx) => ({
      id: idx,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
    })), []);

  // Fetch bid history when event loads
  useEffect(() => {
    if (event?.id && !event.id.startsWith('synthetic-')) {
      getBidHistory(event.id);
    }
  }, [event?.id]);

  // Show loading state while events are being fetched
  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <Card elevated>
          <CardContent className="gap-4 p-8 text-center">
            <div className="text-lg font-semibold text-[#212529]">Loading event...</div>
            <p className="text-sm text-[#6C757D]">Please wait while we fetch the event details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handlePlaceBid = async () => {
    if (isEventCompleted) {
      window.alert('This event has been completed. Bidding is closed.');
      return;
    }

    const rawAmount = Number(bidAmount);
    const actualBidAmount = userCurrentBid > 0 ? cumulativeTotal : rawAmount;

    // Validate bid amounts
    if (userCurrentBid > 0) {
      // For additional bids, increment must be multiple of 50
      if (rawAmount % BID_STEP !== 0) {
        window.alert(`Bid increments must be in multiples of ${BID_STEP}.`);
        return;
      }
    } else {
      // For first bid, must be exactly the base price
      if (rawAmount !== event.basePrice) {
        window.alert(`The first bid must be exactly ₹${event.basePrice}.`);
        return;
      }
    }

    if (!actualBidAmount || Number.isNaN(actualBidAmount)) {
      window.alert('Enter a valid bid amount to continue.');
      return;
    }

    if (actualBidAmount < event.currentBid) {
      window.alert(`Your bid must be at least the current bid of ${formatCurrency(event.currentBid)}.`);
      return;
    }

    if (!isAuthenticated || user?.role !== 'fan') {
      setShowAuthDialog(true);
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Always pay directly via Razorpay (auto-refund system handles unsuccessful bids)
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load payment gateway');
      }

      const { orderId, keyId } = await createRazorpayOrder({
        amount: actualBidAmount,
        userId: user!.id,
        userEmail: user!.email,
      });

      openRazorpayCheckout({
        amount: actualBidAmount,
        orderId,
        keyId,
        userEmail: user!.email,
        description: `Bid of ${formatCurrency(actualBidAmount)} for ${event.title}`,
        onSuccess: async (response: any) => {
          try {
            // Verify payment
            await verifyRazorpayPayment(response);
            
            // Place the bid after successful payment
            await placeBid(event.id, actualBidAmount);
            window.alert(`✅ Payment successful! Bid of ${formatCurrency(actualBidAmount)} placed!\n\nYou'll be notified if someone outbids you.\n\n💡 If you don't win, 90% will be auto-refunded.`);
            setBidAmount('');
          } catch (err) {
            console.error('Error after payment:', err);
            window.alert('Payment received but bid placement failed. Please contact support.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        onDismiss: () => {
          setIsProcessingPayment(false);
        },
      });
    } catch (err) {
      console.error('Bid error:', err);
      window.alert('Failed to initiate payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-70px)] max-w-3xl flex-col bg-white pb-6">
      {isEventCompleted && winner && (
        <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-[#FF8FB1] via-[#C045FF] to-[#7B2CBF] px-4 py-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-white/80">Auction winner</span>
              <span className="text-2xl font-semibold">@{winner.username}</span>
              <span className="text-sm text-white/90">Winning bid {formatCurrency(winner.amount)}</span>
              <span className="text-xs text-white/80">🎉 Congrats! Meeting link has been created for the winner.</span>
            </div>
            <span className="text-4xl">🥳</span>
          </div>

          {showConfetti && (
            <div className="pointer-events-none absolute inset-0">
              {confettiPieces.map((piece) => (
                <span
                  key={piece.id}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    left: `${piece.left}%`,
                    top: '-10%',
                    background: ['#FFE5D9', '#FFD166', '#9B8CFF', '#7AE7C7'][piece.id % 4],
                    animation: `confetti-fall 2.8s ease-out ${piece.delay}s`,
                  }}
                />
              ))}
              <style>
                {`
                  @keyframes confetti-fall {
                    0% { transform: translate3d(0,-10px,0) rotate(0deg); opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translate3d(0,120vh,0) rotate(340deg); opacity: 0; }
                  }
                `}
              </style>
            </div>
          )}
        </div>
      )}

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
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/${event.creatorUsername}`)}
              >
                {/* Creator Avatar */}
                <div className="relative flex-shrink-0">
                  {creatorProfile?.profilePhotoUrl ? (
                    <img
                      src={creatorProfile.profilePhotoUrl}
                      alt={event.creatorDisplayName}
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-[#C045FF]/20 group-hover:ring-[#C045FF]/40 transition-all"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#C045FF] to-[#7B2CBF] flex items-center justify-center text-white font-bold text-xl ring-2 ring-[#C045FF]/20 group-hover:ring-[#C045FF]/40 transition-all">
                      {event.creatorDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Creator Info */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Hosted by</span>
                  <span className="text-sm font-semibold text-[#212529] group-hover:text-[#C045FF] transition-colors">
                    {event.creatorDisplayName}
                  </span>
                  <span className="text-xs text-[#C045FF] underline decoration-dotted group-hover:decoration-solid transition-all">
                    @{event.creatorUsername}
                  </span>
                  <span className="text-[10px] text-[#6C757D] mt-0.5 group-hover:text-[#C045FF] transition-colors">
                    👆 Click to view profile
                  </span>
                </div>
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
                  {event.status === 'Accepting Bids' ? (
                    <div className="rounded-[8px] bg-[#1E4620] px-3 py-1.5">
                      <span className="text-sm font-semibold text-[#4ADE80]">✓ Accepting Bids</span>
                    </div>
                  ) : (
                    <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                      {event.status === 'LIVE' ? '🔴 LIVE' : event.status}
                    </Badge>
                  )}
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

        {/* Bidding History */}
        {bidHistory.length > 0 && (
          <Card>
            <CardHeader title="Recent Bids" subtitle="Live bidding activity" />
            <CardContent className="gap-3">
              {bidHistory.map((bid) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between p-3 rounded-[12px] ${
                    bid.isCurrentLeader ? 'bg-[#C045FF]/10 border border-[#C045FF]/30' : 'bg-[#F8F9FA]'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#212529]">@{bid.fanUsername}</span>
                    <span className="text-xs text-[#6C757D]">
                      {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-semibold text-[#C045FF]">{formatCurrency(bid.amount)}</span>
                    {bid.isCurrentLeader && (
                      <span className="text-[10px] font-semibold text-[#C045FF] bg-white px-2 py-0.5 rounded-full">
                        👑 Leading
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
                  {displayedHighestBid ? formatCurrency(displayedHighestBid) : formatCurrency(event.basePrice)}
                </span>
                <span className="text-[11px] text-[#6C757D]">
                  Base price {formatCurrency(event.basePrice)} • {event.participants} participants
                </span>
                <span className="mt-1 text-[11px] text-[#6C757D]">
                  Next bid: <strong className="text-[#212529]">{formatCurrency(nextSuggestedBid)}</strong> (step {formatCurrency(BID_STEP)})
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
                  label={userCurrentBid > 0 ? "Add to your bid" : "Your bid amount"}
                  placeholder={String(event.basePrice)}
                  value={bidAmount}
                  onChange={(inputEvent) => setBidAmount(inputEvent.target.value)}
                  disabled={isFirstBid || isEventCompleted}
                />
                {isFirstBid && (
                  <div className="mt-2 text-[11px] text-[#6C757D]">
                    First bid is fixed to the creator&apos;s base price.
                  </div>
                )}
                {isEventCompleted && (
                  <div className="mt-2 text-[11px] text-[#DC3545]">
                    This event is completed. Bidding is no longer available.
                  </div>
                )}
                {bidIncrement > 0 && (
                  <div className="mt-2 text-sm">
                    {userCurrentBid > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[#6C757D]">
                          Your current bid: <strong className="text-[#212529]">{formatCurrency(userCurrentBid)}</strong>
                        </span>
                        <span className="text-[#C045FF] font-semibold">
                          Adding {formatCurrency(bidIncrement)} → New total: {formatCurrency(cumulativeTotal)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#C045FF] font-semibold">
                        Your bid: {formatCurrency(bidIncrement)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button 
                className="md:w-40" 
                onClick={handlePlaceBid}
                disabled={isProcessingPayment || isEventCompleted}
              >
                {isEventCompleted ? 'Event Completed' : isProcessingPayment ? 'Processing...' : 'Place Bid →'}
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
