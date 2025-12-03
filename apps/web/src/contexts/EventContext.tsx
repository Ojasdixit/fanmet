import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth, buildUsername } from './AuthContext';

export interface CreatorEvent {
  id: string;
  creatorUsername: string;
  creatorDisplayName: string;
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

export interface Meet {
  id: string;
  eventId: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  amount?: number;
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
  placeBid: (eventId: string, amount: number) => Promise<void>;
  placeBidWithPayment: (eventId: string, amount: number, userEmail: string) => Promise<void>;
  updateMeetStatus: (meetId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no_show') => Promise<void>;
  refreshMeets: () => Promise<void>;
  getBidHistory: (eventId: string) => Promise<BidHistoryItem[]>;
  getUserCurrentBidForEvent: (eventId: string) => number;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

function formatSchedule(date: string, time: string) {
  if (!date && !time) return '';
  if (!date) return time;
  if (!time) return date;
  return `${date}   ${time}`;
}

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<CreatorEvent[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [myMeets, setMyMeets] = useState<Meet[]>([]);
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      // Fetch events
      const { data, error } = await supabase.from('events').select('*');

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      if (!data) return;

      // Fetch bids for all events
      const { data: allBids } = await supabase.from('bids').select('*');

      // Fetch profiles for all creators
      const creatorIds = data.map((e) => e.creator_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
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

        const dateStr = startsAt.toLocaleDateString();
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
          title: e.title,
          description: e.description,
          category: e.category || 'general',
          status: eventStatus,
          date: `${dateStr} @ ${timeStr}`,
          duration: `${e.duration_minutes} minutes`,
          basePrice: e.base_price,
          currentBid: Math.max(e.base_price, maxBid),
          participants: uniqueParticipants,
          endsIn: endsIn,
        };
      });
      setEvents(mappedEvents);
      setIsLoading(false);
    };

    fetchEvents();
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
        .eq('fan_id', user.id);

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

      // Fetch user's meets - only show scheduled meets to fans
      const { data: meetsData, error: meetsError } = await supabase
        .from('meets')
        .select('*')
        .eq('fan_id', user.id)
        .eq('status', 'scheduled'); // Only fetch scheduled meets for fans

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
    };

    setEvents((prev) => [...prev, newEvent]);

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

  // Place bid - payment is handled directly via Razorpay before this is called
  const placeBid: EventContextValue['placeBid'] = async (eventId, amount) => {
    if (!amount || Number.isNaN(amount)) return;
    if (!user) {
      console.error("User must be logged in to bid");
      throw new Error("Please log in to place a bid");
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
        if (amount <= event.currentBid) return event;

        return {
          ...event,
          currentBid: amount,
          participants: event.participants + 1,
        };
      }),
    );

    // Refresh user's bids
    await refreshUserBids();
    
    // Refresh bid history for the event
    await getBidHistory(eventId);
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
      .eq('fan_id', user.id);

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
      .eq('status', 'scheduled'); // Only fetch scheduled meets for fans

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
    }
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
      getBidHistory,
      getUserCurrentBidForEvent,
    }),
    [events, myBids, myMeets, bidHistory, isLoading],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvents = () => {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }

  return context;
};
