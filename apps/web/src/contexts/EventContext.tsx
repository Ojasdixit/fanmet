import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth, buildUsername } from './AuthContext';

export interface CreatorEvent {
  id: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorProfilePhoto?: string;
  title: string;
  description?: string;
  category?: string;
  status: 'LIVE' | 'Upcoming' | 'Accepting Bids' | 'Completed';
  date: string;
  duration: string;
  basePrice: number;
  currentBid: number;
  participants: number;
  endsIn: string;
  startsAt: string;
  biddingClosesAt?: string;
}

export interface Bid {
  id: string;
  eventId: string;
  amount: number;
  status: 'active' | 'outbid' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
  eventTitle?: string;
  creatorUsername?: string;
}

export interface BidHistoryItem {
  id: string;
  fanId: string;
  fanUsername: string;
  amount: number;
  createdAt: string;
  isCurrentLeader: boolean;
}

export interface WinningBid {
  id: string;
  fanId: string;
  fanUsername: string;
  amount: number;
}

export interface Meet {
  id: string;
  eventId: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'cancelled_no_show_creator' | 'no_show';
  amount?: number;
  creatorStartedAt?: string;
  creatorJoinedAt?: string;
  fanJoinedAt?: string;
  recordingStartedAt?: string;
  recordingStoppedAt?: string;
}

interface CreateEventInput {
  creatorUsername: string;
  creatorDisplayName: string;
  title: string;
  description?: string;
  basePrice: number;
  duration: string;
  date: string;
  time: string;
  biddingDeadlineDate: string;
  biddingDeadlineTime: string;
  meetingLink: string;
}

interface EventContextValue {
  events: CreatorEvent[];
  myBids: Bid[];
  myMeets: Meet[];
  bidHistory: BidHistoryItem[];
  isLoading: boolean;
  createEvent: (input: CreateEventInput) => Promise<CreatorEvent>;
  getEventsForCreator: (creatorUsername: string) => CreatorEvent[];
  placeBid: (eventId: string, amount: number, options?: { skipDeadlineCheck?: boolean }) => Promise<void>;
  placeBidWithPayment: (eventId: string, amount: number, userEmail: string) => Promise<void>;
  updateMeetStatus: (meetId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'cancelled_no_show_creator' | 'no_show') => Promise<void>;
  refreshMeets: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  getBidHistory: (eventId: string) => Promise<BidHistoryItem[]>;
  getUserCurrentBidForEvent: (eventId: string) => number;
  finalizeEvent: (eventId: string) => Promise<void>;
  getWinningBid: (eventId: string) => Promise<WinningBid | null>;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

function formatSchedule(date: string, time: string) {
  if (!date && !time) return '';
  if (!date) return time;
  if (!time) return date;
  // Input date is expected in ISO yyyy-mm-dd from the date input; display as dd/mm/yyyy.
  const parsed = new Date(date);
  const displayDate = Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${displayDate}   ${time}`;
}

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<CreatorEvent[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [myMeets, setMyMeets] = useState<Meet[]>([]);
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchEvents = async () => {
      // Fetch events
      const { data, error } = await supabase.from('events').select('*');

      if (error) {
        console.error('Error fetching events:', error);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setIsLoading(false);
        return;
      }

      // Fetch bids for all events
      const { data: allBids } = await supabase.from('bids').select('*');

      // Fetch profiles for all creators
      const creatorIds = data.map((e) => e.creator_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, profile_photo_url')
        .in('user_id', creatorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const mappedEvents: CreatorEvent[] = data.map((e: any) => {
        const eventBids = allBids?.filter((b) => b.event_id === e.id) || [];
        const maxBid = eventBids.length > 0 ? Math.max(...eventBids.map((b) => b.amount)) : 0;
        const uniqueParticipants = new Set(eventBids.map((b) => b.fan_id)).size;

        const startsAt = new Date(e.starts_at);
        const now = new Date();
        const biddingClosesAt = e.bidding_closes_at ? new Date(e.bidding_closes_at) : startsAt;
        const diff = biddingClosesAt.getTime() - now.getTime();
        let endsIn = 'Bidding Closed';
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          if (hours > 24) {
            const days = Math.floor(hours / 24);
            endsIn = `${days} days left to bid`;
          } else if (hours > 0) {
            endsIn = `${hours} hours left to bid`;
          } else {
            const minutes = Math.floor(diff / (1000 * 60));
            endsIn = `${minutes} minutes left to bid`;
          }
        }

        const dateStr = startsAt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const creatorProfile = profileMap.get(e.creator_id);
        const creatorUsername = (creatorProfile?.username || `user${e.creator_id.substring(0, 8)}`).toLowerCase();

        // Determine status based on bidding window
        let eventStatus: 'LIVE' | 'Upcoming' | 'Accepting Bids' | 'Completed';

        if (e.status === 'completed' || e.status === 'cancelled') {
          eventStatus = 'Completed';
        } else if (e.bidding_closes_at && new Date(e.bidding_closes_at) > now) {
          // Bidding is still open
          eventStatus = 'Accepting Bids';
        } else if (e.status === 'live') {
          eventStatus = 'LIVE';
        } else {
          eventStatus = 'Upcoming';
        }

        return {
          id: e.id,
          creatorUsername,
          creatorDisplayName: creatorProfile?.display_name || 'Unknown',
          creatorProfilePhoto: creatorProfile?.profile_photo_url,
          title: e.title,
          description: e.description,
          category: e.category || 'general',
          status: eventStatus,
          date: `${dateStr} @ ${timeStr}`,
          duration: `${e.duration_minutes} minutes`,
          basePrice: e.base_price,
          currentBid: maxBid,
          participants: uniqueParticipants,
          endsIn: endsIn,
          startsAt: e.starts_at,
          biddingClosesAt: e.bidding_closes_at,
        };
      });
      setEvents(mappedEvents);
      setIsLoading(false);
    };

  useEffect(() => {
    fetchEvents();
  }, [user?.id]);

  // Also re-fetch events when auth state changes from unauthenticated to authenticated
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchEvents();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Set up Realtime subscription for bids table (global updates)
  useEffect(() => {
    console.log('🔌 Setting up bids realtime subscription...');
    const bidsChannel = supabase
      .channel('global-bids')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          console.log('📡 Realtime bid update received:', payload);
          // Refresh all events when any bid changes
          fetchEvents();
        }
      )
      .subscribe((status) => {
        console.log('📡 Bids subscription status:', status);
      });

    // Fallback: Poll every 5 seconds to ensure all users see updates
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for bid updates...');
      fetchEvents();
    }, 5000);

    return () => {
      supabase.removeChannel(bidsChannel);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setMyBids([]);
      setMyMeets([]);
      return;
    }

    const fetchUserData = async () => {
      // Fetch user's bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('fan_id', user.id)
        .order('created_at', { ascending: false });

      if (!bidsError && bidsData) {
        const eventIds = bidsData.map((b) => b.event_id);
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, creator_id')
          .in('id', eventIds);

        const eventsMap = new Map(eventsData?.map((e: any) => [e.id, e]) || []);

        const creatorIds = Array.from(
          new Set((eventsData ?? []).map((e: any) => e.creator_id).filter(Boolean)),
        );

        const { data: profilesData } = creatorIds.length
          ? await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', creatorIds)
          : { data: null };

        const profileMap = new Map(
          (profilesData ?? []).map((p: any) => [p.user_id as string, p.username as string]),
        );

        setMyBids(
          bidsData.map((b: any) => {
            const ev = eventsMap.get(b.event_id);
            const creatorUsername = ev ? profileMap.get(ev.creator_id) : undefined;

            return {
              id: b.id,
              eventId: b.event_id,
              amount: b.amount,
              status: b.status,
              createdAt: b.created_at,
              eventTitle: ev?.title,
              creatorUsername,
            };
          }),
        );
      } else if (bidsError) {
        console.error('Error fetching bids:', bidsError);
      }

      // Fetch user's meets - show scheduled, live, and completed meets to fans
      const { data: meetsData, error: meetsError } = await supabase
        .from('meets')
        .select('*')
        .eq('fan_id', user.id)
        .in('status', ['scheduled', 'live', 'completed']); // Include completed meets

      if (!meetsError && meetsData) {
        const creatorIds = meetsData.map((m) => m.creator_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', creatorIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        setMyMeets(
          meetsData.map((m: any) => {
            const profile = profileMap.get(m.creator_id);
            return {
              id: m.id,
              eventId: m.event_id,
              creatorId: m.creator_id,
              creatorUsername: profile?.username || 'unknown',
              creatorDisplayName: profile?.display_name || 'Unknown',
              scheduledAt: m.scheduled_at,
              durationMinutes: m.duration_minutes,
              meetingLink: m.meeting_link,
              status: m.status,
            };
          })
        );
      } else if (meetsError) {
        console.error('Error fetching meets:', meetsError);
      }
    };

    fetchUserData();
  }, [user]);

  const createEvent: EventContextValue['createEvent'] = async (input) => {
    if (!user) throw new Error('User not logged in');

    const startsAt = new Date(`${input.date}T${input.time}`).toISOString();
    const biddingClosesAt = new Date(`${input.biddingDeadlineDate}T${input.biddingDeadlineTime}`).toISOString();
    const durationMinutes = parseInt(input.duration.replace(/\D/g, ''), 10) || 15;

    const { data, error } = await supabase
      .from('events')
      .insert({
        creator_id: user.id,
        title: input.title,
        description: input.description,
        status: 'upcoming',
        starts_at: startsAt,
        bidding_closes_at: biddingClosesAt,
        duration_minutes: durationMinutes,
        base_price: input.basePrice,
        is_paid: input.basePrice > 0,
        meeting_link: input.meetingLink,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    const newEvent: CreatorEvent = {
      id: data.id,
      creatorUsername: user.username.toLowerCase(),
      creatorDisplayName: input.creatorDisplayName,
      title: data.title,
      description: data.description,
      status: 'Upcoming',
      date: formatSchedule(input.date, input.time),
      duration: input.duration,
      basePrice: data.base_price,
      currentBid: 0,
      participants: 0,
      endsIn: 'Bid ding open',
      startsAt,
    };

    await fetchEvents();

    return newEvent;
  };

  const getEventsForCreator: EventContextValue['getEventsForCreator'] = (creatorUsername) => {
    const normalized = creatorUsername.trim().replace(/^@/, '').toLowerCase();
    return events.filter((event) => event.creatorUsername === normalized);
  };

  // Get user's current highest bid for an event
  const getUserCurrentBidForEvent: EventContextValue['getUserCurrentBidForEvent'] = (eventId) => {
    if (!user) return 0;
    const userBids = myBids.filter(b => b.eventId === eventId && b.status === 'active');
    if (userBids.length === 0) return 0;
    return Math.max(...userBids.map(b => b.amount));
  };

  // Get bid history for an event (last 5 bids)
  const getBidHistory: EventContextValue['getBidHistory'] = async (eventId) => {
    console.log('[getBidHistory] Fetching bids for event:', eventId);
    const { data: bidsData, error } = await supabase
      .from('bids')
      .select('id, fan_id, amount, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !bidsData) {
      console.error('Error fetching bid history:', error);
      return [];
    }

    console.log('[getBidHistory] Found', bidsData.length, 'bids for event', eventId, bidsData);

    const fanIds = bidsData.map(b => b.fan_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', fanIds);

    const profileMap = new Map(profilesData?.map(p => [p.user_id, p.username]) || []);
    const maxBid = bidsData.length > 0 ? Math.max(...bidsData.map(b => b.amount)) : 0;

    const history = bidsData.map(b => ({
      id: b.id,
      fanId: b.fan_id,
      fanUsername: profileMap.get(b.fan_id) || 'Anonymous',
      amount: b.amount,
      createdAt: b.created_at,
      isCurrentLeader: b.amount === maxBid,
    }));

    setBidHistory(history);
    return history;
  };

  const getWinningBid: EventContextValue['getWinningBid'] = async (eventId) => {
    const { data: bidsData, error } = await supabase
      .from('bids')
      .select('id, fan_id, amount')
      .eq('event_id', eventId)
      .order('amount', { ascending: false })
      .limit(1);

    if (error || !bidsData || bidsData.length === 0) {
      return null;
    }

    const winner = bidsData[0];
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', winner.fan_id)
      .maybeSingle();

    return {
      id: winner.id,
      fanId: winner.fan_id,
      fanUsername: profile?.username || 'winner',
      amount: winner.amount,
    };
  };

  // Place bid - payment is handled directly via Razorpay before this is called
  const placeBid: EventContextValue['placeBid'] = async (eventId, amount, options) => {
    if (!amount || Number.isNaN(amount)) return;
    if (!user) {
      console.error("User must be logged in to bid");
      throw new Error("Please log in to place a bid");
    }

    const BID_STEP = 50;
    if (amount % BID_STEP !== 0) {
      throw new Error(`Bids must be in multiples of ${BID_STEP}.`);
    }

    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('id, base_price, bidding_closes_at, status')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError || !eventRow) {
      throw new Error('Could not load event for bidding.');
    }

    // Block bids after deadline or if event is already finalized.
    // skipDeadlineCheck is used when the bid is placed AFTER a successful payment:
    // the fan clicked while the button was still open (validated pre-payment), so a
    // payment that confirms slightly after the deadline must still be honored.
    const now = new Date();
    if (eventRow.status === 'completed' || eventRow.status === 'cancelled') {
      throw new Error('Bidding is closed for this event.');
    }
    // Block bidding 1 minute before deadline to prevent ghost payments
    if (!options?.skipDeadlineCheck && eventRow.bidding_closes_at) {
      const deadline = new Date(eventRow.bidding_closes_at);
      const oneMinuteBefore = new Date(deadline.getTime() - 60 * 1000);
      if (now >= oneMinuteBefore) {
        throw new Error('Bidding closes in less than 1 minute. No new bids can be placed to ensure all bids are processed.');
      }
    }

    const { data: topBidRow, error: topBidError } = await supabase
      .from('bids')
      .select('amount')
      .eq('event_id', eventId)
      .order('amount', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topBidError) {
      throw new Error('Could not validate current bid.');
    }

    const currentMaxBid = topBidRow?.amount ?? 0;
    const minimumBid = Math.max(eventRow.base_price || 0, currentMaxBid);

    if (amount < minimumBid) {
      throw new Error(`Your bid must be at least ${minimumBid}.`);
    }

    // Place the bid (payment already completed via Razorpay)
    const { error } = await supabase.from('bids').insert({
      event_id: eventId,
      fan_id: user.id,
      amount: amount,
      status: 'active'
    });

    if (error) {
      console.error("Error placing bid:", error);
      throw new Error("Failed to place bid. Please try again.");
    }

    // Update local events state
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        const nextCurrentBid = amount > event.currentBid ? amount : event.currentBid;
        return {
          ...event,
          currentBid: nextCurrentBid,
          participants: event.participants + 1,
        };
      }),
    );

    // Refresh user's bids
    await refreshUserBids();

    // Refresh bid history for the event
    await getBidHistory(eventId);

    // Refresh all events to update global state
    await fetchEvents();
  };

  // Place bid with direct payment (opens Razorpay)
  const placeBidWithPayment: EventContextValue['placeBidWithPayment'] = async (eventId, amount, userEmail) => {
    if (!amount || Number.isNaN(amount)) return;
    if (!user) {
      throw new Error("Please log in to place a bid");
    }

    // Signal to UI that payment is needed
    throw new Error(`PAYMENT_REQUIRED:${amount}:${eventId}`);
  };

  // Helper to refresh user's bids
  const refreshUserBids = async () => {
    if (!user) return;

    const { data: bidsData } = await supabase
      .from('bids')
      .select('*')
      .eq('fan_id', user.id)
      .order('created_at', { ascending: false });

    if (bidsData) {
      const eventIds = bidsData.map((b) => b.event_id);
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, creator_id')
        .in('id', eventIds);

      const eventsMap = new Map(eventsData?.map((e: any) => [e.id, e]) || []);

      const creatorIds = Array.from(
        new Set((eventsData ?? []).map((e: any) => e.creator_id).filter(Boolean)),
      );

      const { data: profilesData } = creatorIds.length
        ? await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', creatorIds)
        : { data: null };

      const profileMap = new Map(
        (profilesData ?? []).map((p: any) => [p.user_id as string, p.username as string]),
      );

      setMyBids(
        bidsData.map((b: any) => {
          const ev = eventsMap.get(b.event_id);
          const creatorUsername = ev ? profileMap.get(ev.creator_id) : undefined;

          return {
            id: b.id,
            eventId: b.event_id,
            amount: b.amount,
            status: b.status,
            createdAt: b.created_at,
            eventTitle: ev?.title,
            creatorUsername,
          };
        }),
      );
    }
  };

  const updateMeetStatus: EventContextValue['updateMeetStatus'] = async (meetId, status) => {
    const { error } = await supabase
      .from('meets')
      .update({ status })
      .eq('id', meetId);

    if (error) {
      console.error('Error updating meet status:', error);
      throw error;
    }

    // Refresh meets for the current user
    await refreshMeets();
  };

  const refreshMeets: EventContextValue['refreshMeets'] = async () => {
    if (!user) return;

    const { data: meetsData, error: meetsError } = await supabase
      .from('meets')
      .select('*')
      .eq('fan_id', user.id)
      .in('status', ['scheduled', 'live', 'completed']); // Include completed meets

    if (!meetsError && meetsData) {
      const creatorIds = meetsData.map((m) => m.creator_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', creatorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      setMyMeets(
        meetsData.map((m: any) => {
          const profile = profileMap.get(m.creator_id);
          return {
            id: m.id,
            eventId: m.event_id,
            creatorId: m.creator_id,
            creatorUsername: profile?.username || 'unknown',
            creatorDisplayName: profile?.display_name || 'Unknown',
            scheduledAt: m.scheduled_at,
            durationMinutes: m.duration_minutes,
            meetingLink: m.meeting_link,
            status: m.status,
            creatorStartedAt: m.creator_started_at,
            creatorJoinedAt: m.creator_joined_at,
            fanJoinedAt: m.fan_joined_at,
            recordingStartedAt: m.recording_started_at,
            recordingStoppedAt: m.recording_stopped_at,
          };
        })
      );
    }
  };

  // Set up Realtime subscription for meets table (for fans) - must be after refreshMeets is defined
  useEffect(() => {
    if (!user || user.role !== 'fan') return;

    const meetsChannel = supabase
      .channel(`fan-meets-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meets',
          filter: `fan_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Realtime meets update for fan:', payload);
          refreshMeets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetsChannel);
    };
  }, [user]);

  const finalizeEvent: EventContextValue['finalizeEvent'] = async (eventId) => {
    if (!user) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string;
    const response = await fetch(`${supabaseUrl}/functions/v1/finalize-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ eventId }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Error calling finalize-event:', result);
      throw new Error(result.error || 'Failed to finalize event');
    }

    console.log('✅ Event finalized:', result);
    await refreshMeets();
    await fetchEvents();
  };

  const value = useMemo(
    () => ({
      events,
      myBids,
      myMeets,
      bidHistory,
      isLoading,
      createEvent,
      getEventsForCreator,
      placeBid,
      placeBidWithPayment,
      updateMeetStatus,
      refreshMeets,
      refreshEvents: fetchEvents,
      getBidHistory,
      getUserCurrentBidForEvent,
      finalizeEvent,
      getWinningBid,
    }),
    [events, myBids, myMeets, bidHistory, isLoading],
  );

  // Auto-finalize events that have passed their deadline
  useEffect(() => {
    if (!user || user.role !== 'creator') return;

    const checkExpiredEvents = async () => {
      // Find events created by this user that are active but passed deadline
      const { data: expiredEvents } = await supabase
        .from('events')
        .select('id, title')
        .eq('creator_id', user.id)
        .in('status', ['upcoming', 'live'])
        .lt('bidding_closes_at', new Date().toISOString());

      if (expiredEvents && expiredEvents.length > 0) {
        console.log('🔄 Auto-finalizing expired events:', expiredEvents);
        for (const ev of expiredEvents) {
          try {
            await finalizeEvent(ev.id); // This will create the meet and set status to completed
            console.log(`✅ Auto-finalized event: ${ev.title}`);
          } catch (err) {
            console.error(`❌ Failed to auto-finalize event ${ev.id}:`, err);
          }
        }
        // Force refresh events to update UI
        // Since we don't have a public refreshEvents, we can't easily trigger it. 
        // But finalizeEvent calls refreshMeets. 
        // To update the Events list, we might need to reload or add a refreshEvents function.
        // For now, the database is updated, so next fetch/page load will be correct.
      }
    };

    const timer = setInterval(checkExpiredEvents, 30000); // Check every 30 seconds
    checkExpiredEvents(); // Initial check

    return () => clearInterval(timer);
  }, [user]); // user is the main dependency

  // Auto-complete expired live meetings (runs for all users)
  useEffect(() => {
    if (!user) return;

    const autoCompleteExpiredMeetings = async () => {
      // Find live meetings that have passed their scheduled time + duration
      const { data: expiredMeetings, error } = await supabase
        .from('meets')
        .select('id, scheduled_at, duration_minutes')
        .eq('status', 'live');

      if (error || !expiredMeetings) return;

      const now = new Date();
      const meetingsToComplete = expiredMeetings.filter(m => {
        const endTime = new Date(new Date(m.scheduled_at).getTime() + m.duration_minutes * 60 * 1000);
        return now > endTime;
      });

      if (meetingsToComplete.length > 0) {
        console.log('🔄 Auto-completing expired meetings:', meetingsToComplete.length);
        for (const meeting of meetingsToComplete) {
          await supabase
            .from('meets')
            .update({ status: 'completed' })
            .eq('id', meeting.id);
        }
        // Refresh meets to update UI
        refreshMeets();
      }
    };

    const timer = setInterval(autoCompleteExpiredMeetings, 30000); // Check every 30 seconds
    autoCompleteExpiredMeetings(); // Initial check

    return () => clearInterval(timer);
  }, [user]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvents = () => {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }

  return context;
};
