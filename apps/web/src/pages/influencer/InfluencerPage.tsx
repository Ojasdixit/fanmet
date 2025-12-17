import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardContent } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

import { useEvents } from '../../contexts/EventContext';
import { useCreatorProfiles } from '../../contexts/CreatorProfileContext';
import { useAuth } from '../../contexts/AuthContext';

export function InfluencerPage() {
  const { username: rawUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { getEventsForCreator } = useEvents();
  const { getProfile, followCreator, unfollowCreator, following } = useCreatorProfiles();
  const { isAuthenticated, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [meetsCount, setMeetsCount] = useState(0);

  const usernameSlug = (rawUsername ?? '').replace(/^@/, '').toLowerCase();
  const profile = usernameSlug ? getProfile(usernameSlug) : undefined;

  // Check if user is following this creator
  useEffect(() => {
    if (usernameSlug) {
      setIsFollowing(following.includes(usernameSlug));
    }
  }, [usernameSlug, following]);

  // Fetch real stats from database
  useEffect(() => {
    const fetchStats = async () => {
      if (!usernameSlug) return;

      try {
        // Get creator's user_id from username
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', usernameSlug)
          .single();

        if (!profileData) return;

        // Get follower count
        const { count: followers } = await supabase
          .from('creator_follows')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', profileData.user_id);

        setFollowerCount(followers || 0);

        // Get completed meets count
        const { count: meets } = await supabase
          .from('meets')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', profileData.user_id)
          .eq('status', 'completed');

        setMeetsCount(meets || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [usernameSlug]);
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

  // Sort events: newest first (by id which contains timestamp, or reverse order)
  const sortedEvents = [...effectiveEvents].reverse();

  const primaryEvent = sortedEvents[0];

  const displayName = profile?.displayName || primaryEvent?.creatorDisplayName || 'Creator';
  const handle = `@${usernameSlug || 'creator'}`;
  const bio =
    profile?.bio ||
    primaryEvent?.description ||
    'Host of intimate FanMeet sessions. Expect honest stories, practical advice, and space for your questions.';



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

  const handleFollow = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      const shouldRedirect = window.confirm('Please log in to follow creators.\n\nClick OK to go to login page.');
      if (shouldRedirect) {
        navigate(`/auth?redirect=/${usernameSlug}`);
      }
      return;
    }

    // Check if user is a fan (only fans can follow)
    if (user?.role !== 'fan') {
      window.alert('Only fans can follow creators.\n\nPlease log in with a fan account.');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        await unfollowCreator(usernameSlug);
        setIsFollowing(false);
        window.alert(`Unfollowed ${profile?.displayName || usernameSlug} successfully!`);
      } else {
        // Follow
        await followCreator(usernameSlug);
        setIsFollowing(true);
        window.alert(`Now following ${profile?.displayName || usernameSlug}! 🎉\n\nYou'll see their events in your feed.`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      window.alert('Something went wrong. Please try again.');
    }
  };


  return (
    <div className="flex min-h-[calc(100vh-70px)] flex-col bg-white md:bg-gradient-to-b md:from-[#FDEBFF] md:via-[#FFF] md:to-[#F0F2F5]">
      {/* Cover and top overlay */}
      <div className="relative md:mx-auto md:w-full md:max-w-5xl">
        <div className="h-40 w-full md:h-48 md:rounded-b-lg overflow-hidden">
          {profile?.cover_photo_url ? (
            <img
              src={profile.cover_photo_url}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#FFE5D9] via-white to-[#F4E6FF]" />
          )}
        </div>
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
              👥 <span>{followerCount.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1">
              🎥 <span>{meetsCount}</span>
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-9 left-4 flex items-end gap-3">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-[#050014]">
            {profile?.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#C045FF] to-[#7B2CBF] flex items-center justify-center text-white font-bold text-2xl">
                {displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
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
                {sortedEvents.length} active events
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full px-3 py-1 text-xs"
              onClick={handleShareProfile}
            >
              Share profile
            </Button>
            <Button
              size="sm"
              className="rounded-full px-3 py-1 text-xs"
              variant={isFollowing ? "primary" : "secondary"}
              onClick={handleFollow}
            >
              {isFollowing ? '✓ Following' : 'Follow'}
            </Button>
          </div>
        </div>
      </div>

      {/* Events content */}
      <div className="flex-1 px-4 py-4 md:mx-auto md:w-full md:max-w-5xl md:bg-[#F6EBFF]/70 md:rounded-b-xl">
        {/* Events List */}
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C757D]">Upcoming events</p>
            {sortedEvents.map((event) => (
              <Card key={event.id} elevated className="border-none">
                <CardContent className="gap-3">
                  <div className="flex items-center justify-between text-[11px] text-[#6C757D]">
                    <div className="flex flex-wrap items-center gap-2">
                      {event.status === 'Accepting Bids' ? (
                        <div className="rounded-[8px] bg-[#1E4620] px-2 py-1">
                          <span className="text-xs font-semibold text-[#4ADE80]">✓ Accepting Bids</span>
                        </div>
                      ) : (
                        <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                          {event.status === 'LIVE' ? '🔴 LIVE' : event.status}
                        </Badge>
                      )}
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
                      disabled={
                        String(event.status).toLowerCase() === 'completed' ||
                        String(event.status).toLowerCase() === 'cancelled'
                      }
                    >
                      {String(event.status).toLowerCase() === 'completed' ? 'Event Ended' :
                        String(event.status).toLowerCase() === 'cancelled' ? 'Event Cancelled' :
                          'View & bid'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sortedEvents.length === 0 && (
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
