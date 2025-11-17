import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

import { CircularGallery } from '../../components/CircularGallery';
import { useEvents } from '../../contexts/EventContext';
import { useCreatorProfiles } from '../../contexts/CreatorProfileContext';

export function InfluencerPage() {
  const { username: rawUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { getEventsForCreator } = useEvents();
  const { getProfile, getPostsForCreator } = useCreatorProfiles();

  const usernameSlug = (rawUsername ?? '').replace(/^@/, '').toLowerCase();
  const storedEvents = usernameSlug ? getEventsForCreator(usernameSlug) : [];
  const syntheticEvents = !storedEvents.length && usernameSlug
    ? Array.from({ length: 5 }).map((_, index) => {
        const prettyName = usernameSlug
          .split(/[-_]/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ') || 'Creator';

        const basePrice = 100 + index * 25;
        const currentBid = index % 2 === 0 ? basePrice + 120 : 0;
        const participants = index % 2 === 0 ? 5 + index * 2 : 0;

        return {
          id: `synthetic-${usernameSlug}-${index}`,
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
        };
      })
    : undefined;

  const effectiveEvents = storedEvents.length > 0 ? storedEvents : syntheticEvents ?? [];
  const primaryEvent = effectiveEvents[0];

  const profile = usernameSlug ? getProfile(usernameSlug) : undefined;

  const displayName = profile?.displayName || primaryEvent?.creatorDisplayName || 'Creator';
  const handle = `@${usernameSlug || 'creator'}`;
  const bio =
    profile?.bio ||
    primaryEvent?.description ||
    'Host of intimate FanMeet sessions. Expect honest stories, practical advice, and space for your questions.';

  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'media'>('events');

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

  const handleShareEvent = (eventId: string) => {
    const url = `${window.location.origin}/events/${eventId}`;

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

  const hasEvent = !!primaryEvent;

  const handleShareProfile = () => {
    if (!usernameSlug) {
      return;
    }

    const url = `${window.location.origin}/${usernameSlug}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          window.alert('Profile link copied. Share it with your fans.');
        },
        () => {
          window.prompt('Share this profile link with your fans:', url);
        },
      );
    } else {
      window.prompt('Share this profile link with your fans:', url);
    }
  };

  const demoPosts = [
    {
      id: 'post-1',
      time: '3 hours ago',
      text: 'Hi cutie pies 🥹 Thanks for subscribing and staying you like the top-tier legends you are.',
    },
    {
      id: 'post-2',
      time: '1 day ago',
      text: 'Planning a new batch of micro-meet sessions this weekend. Drop what you want to talk about 👇',
    },
  ];

  const profilePosts = usernameSlug ? getPostsForCreator(usernameSlug) : [];

  const postsForDisplay =
    profilePosts.length > 0
      ? profilePosts.map((post) => ({ id: post.id, text: post.text, time: post.createdAtLabel }))
      : demoPosts;

  return (
    <div className="flex min-h-[calc(100vh-70px)] flex-col bg-white md:bg-gradient-to-b md:from-[#FDEBFF] md:via-[#FFF] md:to-[#F0F2F5]">
      {/* Cover and top overlay */}
      <div className="relative md:mx-auto md:w-full md:max-w-5xl">
        <div className="h-40 w-full bg-gradient-to-br from-[#FFE5D9] via-white to-[#F4E6FF] md:h-48 md:rounded-b-lg" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent px-4 py-3 text-xs font-medium text-white md:rounded-t-lg">
          <button
            type="button"
            className="rounded-full bg-black/30 px-3 py-1"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              👥 <span>48K</span>
            </span>
            <span className="flex items-center gap-1">
              🎥 <span>120</span>
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-9 left-4 flex items-end gap-3">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-[#050014]">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"
              alt={displayName}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Profile header */}
      <div className="px-4 pt-12 pb-3 md:mx-auto md:w-full md:max-w-5xl md:bg-white md:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-[#212529]">{displayName}</h1>
            <span className="text-xs text-[#6C757D]">{handle} · Seen 9 minutes ago</span>
            <p className="text-xs text-[#6C757D]">{bio}</p>
            {hasEvent ? (
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#C045FF]">
                {effectiveEvents.length} active events
              </span>
            ) : null}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full px-3 py-1 text-xs"
            onClick={handleShareProfile}
          >
            Share profile
          </Button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button className="flex-1 rounded-full" size="sm">
            Subscribe
          </Button>
          <Button className="flex-1 rounded-full" size="sm" variant="secondary">
            Follow
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-b border-[#E9ECEF] bg-white px-4 md:mx-auto md:w-full md:max-w-5xl md:shadow-sm">
        <div className="flex justify-around text-xs font-medium text-[#6C757D]">
          {[
            { id: 'posts' as const, label: 'Posts' },
            { id: 'events' as const, label: 'Events' },
            { id: 'media' as const, label: 'Media' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={
                  'flex flex-1 flex-col items-center gap-1 border-b-2 px-2 py-3' +
                  (isActive ? ' border-[#050014] text-[#050014]' : ' border-transparent')
                }
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-[11px] uppercase tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 py-4 md:mx-auto md:w-full md:max-w-5xl md:bg-[#F6EBFF]/70 md:rounded-b-xl">
        {/* Mobile: original tabbed layout */}
        <div className="space-y-4 md:hidden">
          {activeTab === 'events' && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C757D]">Upcoming events</p>
              {effectiveEvents.map((event) => (
                <Card key={event.id} elevated className="border-none">
                  <CardContent className="gap-3">
                    <div className="flex items-center justify-between text-[11px] text-[#6C757D]">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                          {event.status === 'LIVE' ? '🔴 LIVE' : event.status}
                        </Badge>
                        <span>{event.date}</span>
                        <span>• {event.duration}</span>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#F8F9FA] px-3 py-1 font-medium text-[#C045FF]"
                        onClick={() => handleShareEvent(event.id)}
                      >
                        Share
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h2 className="text-sm font-semibold text-[#212529]">{event.title}</h2>
                      <p className="text-xs text-[#6C757D]">{event.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6C757D]">
                      <span>
                        Base {formatCurrency(event.basePrice)}
                      </span>
                      <span>
                        Highest bid{' '}
                        {event.currentBid ? formatCurrency(event.currentBid) : 'No bids yet'}
                      </span>
                      <span>🔥 {event.participants} participants</span>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-full"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        View & bid
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {effectiveEvents.length === 0 && (
                <Card>
                  <CardContent>
                    <p className="text-sm text-[#6C757D]">
                      This creator has not set up any bidding events yet. Check back soon for upcoming sessions.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C757D]">Recent posts</p>
              {postsForDisplay.map((post) => (
                <Card key={post.id}>
                  <CardContent className="gap-2">
                    <div className="flex items-center justify-between text-[11px] text-[#6C757D]">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#050014] text-center text-xs leading-8 text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#212529]">{displayName}</span>
                          <span className="text-[11px] text-[#6C757D]">{handle} · {post.time}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#212529]">{post.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'media' && (
            <Card>
              <CardHeader
                title="Media"
                subtitle="A rotating peek into this creator's moments, content, and meetups."
              />
              <CardContent className="h-72 overflow-hidden">
                <CircularGallery items={galleryItems} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop: posts + media + events in one connected section */}
        <div className="hidden gap-6 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C757D]">Recent posts</p>
              {postsForDisplay.map((post) => (
                <Card key={post.id}>
                  <CardContent className="gap-2">
                    <div className="flex items-center justify-between text-[11px] text-[#6C757D]">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#050014] text-center text-xs leading-8 text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#212529]">{displayName}</span>
                          <span className="text-[11px] text-[#6C757D]">{handle} · {post.time}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#212529]">{post.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader
                title="Media"
                subtitle="A rotating peek into this creator's moments, content, and meetups."
              />
              <CardContent className="h-72 overflow-hidden">
                <CircularGallery items={galleryItems} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C757D]">Upcoming events</p>
            {effectiveEvents.map((event) => (
              <Card key={event.id} elevated className="border-none">
                <CardContent className="gap-3">
                  <div className="flex items-center justify-between text-[11px] text-[#6C757D]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                        {event.status === 'LIVE' ? '🔴 LIVE' : event.status}
                      </Badge>
                      <span>{event.date}</span>
                      <span>• {event.duration}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[#F8F9FA] px-3 py-1 font-medium text-[#C045FF]"
                      onClick={() => handleShareEvent(event.id)}
                    >
                      Share
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-semibold text-[#212529]">{event.title}</h2>
                    <p className="text-xs text-[#6C757D]">{event.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6C757D]">
                    <span>
                      Base {formatCurrency(event.basePrice)}
                    </span>
                    <span>
                      Highest bid{' '}
                      {event.currentBid ? formatCurrency(event.currentBid) : 'No bids yet'}
                    </span>
                    <span>🔥 {event.participants} participants</span>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      View & bid
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {effectiveEvents.length === 0 && (
              <Card>
                <CardContent>
                  <p className="text-sm text-[#6C757D]">
                    This creator has not set up any bidding events yet. Check back soon for upcoming sessions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
