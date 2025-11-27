import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Badge, TextInput } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface EventRow {
  id: string;
  code: string;
  creatorId: string;
  creatorName: string;
  title: string;
  status: string;
  bidsCount: number;
  highestBid: number;
  basePrice: number;
  startsAt: string;
  category: string;
}

interface EventDetail {
  id: string;
  code: string;
  title: string;
  description: string | null;
  creatorName: string;
  creatorEmail: string;
  status: string;
  category: string;
  basePrice: number;
  highestBid: number;
  bidsCount: number;
  startsAt: string;
  durationMinutes: number;
  meetingLink: string | null;
}

type FilterType = 'all' | 'live' | 'upcoming' | 'completed' | 'cancelled';

const statusConfig: Record<string, { label: string; variant: 'danger' | 'primary' | 'success' | 'warning' }> = {
  live: { label: '🔴 LIVE', variant: 'danger' },
  upcoming: { label: '⏰ Upcoming', variant: 'primary' },
  completed: { label: '✅ Completed', variant: 'success' },
  cancelled: { label: '❌ Cancelled', variant: 'danger' },
  draft: { label: '📝 Draft', variant: 'warning' },
};

export function AdminEvents() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Fetch events with creator info
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, creator_id, title, description, status, base_price, starts_at, duration_minutes, category, meeting_link')
        .order('created_at', { ascending: false });

      if (eventsError || !eventsData) {
        console.error('Error fetching events:', eventsError);
        setEvents([]);
        return;
      }

      // Fetch creator names
      const creatorIds = Array.from(new Set(eventsData.map((e: any) => e.creator_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', creatorIds);

      const profileMap = new Map<string, { displayName: string; username: string }>();
      for (const p of (profilesData ?? []) as any[]) {
        profileMap.set(p.user_id, {
          displayName: p.display_name || p.username || 'Creator',
          username: p.username || 'creator',
        });
      }

      // Fetch bid counts per event
      const { data: bidsData } = await supabase
        .from('bids')
        .select('event_id, amount');

      const bidsByEvent = new Map<string, { count: number; highest: number }>();
      for (const b of (bidsData ?? []) as any[]) {
        const existing = bidsByEvent.get(b.event_id) ?? { count: 0, highest: 0 };
        bidsByEvent.set(b.event_id, {
          count: existing.count + 1,
          highest: Math.max(existing.highest, b.amount ?? 0),
        });
      }

      const eventRows: EventRow[] = eventsData.map((e: any) => {
        const profile = profileMap.get(e.creator_id);
        const bidInfo = bidsByEvent.get(e.id) ?? { count: 0, highest: 0 };
        return {
          id: e.id,
          code: `#E-${e.id.slice(0, 4).toUpperCase()}`,
          creatorId: e.creator_id,
          creatorName: profile?.displayName ?? 'Unknown',
          title: e.title,
          status: e.status,
          bidsCount: bidInfo.count,
          highestBid: bidInfo.highest,
          basePrice: e.base_price ?? 0,
          startsAt: e.starts_at,
          category: e.category ?? 'general',
        };
      });

      setEvents(eventRows);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    let list = [...events];

    // Apply status filter
    if (filter !== 'all') {
      list = list.filter((e) => e.status === filter);
    }

    // Apply search
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.creatorName.toLowerCase().includes(query) ||
          e.code.toLowerCase().includes(query),
      );
    }

    return list;
  }, [events, filter, search]);

  const handleViewEvent = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Fetch full event details
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', event.creatorId)
      .single();

    if (eventData) {
      setSelectedEvent({
        id: eventData.id,
        code: `#E-${eventData.id.slice(0, 4).toUpperCase()}`,
        title: eventData.title,
        description: eventData.description,
        creatorName: event.creatorName,
        creatorEmail: userData?.email ?? 'N/A',
        status: eventData.status,
        category: eventData.category ?? 'general',
        basePrice: eventData.base_price ?? 0,
        highestBid: event.highestBid,
        bidsCount: event.bidsCount,
        startsAt: eventData.starts_at,
        durationMinutes: eventData.duration_minutes,
        meetingLink: eventData.meeting_link,
      });
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this event?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      if (error) {
        console.error('Error cancelling event:', error);
        alert('Failed to cancel event.');
        return;
      }

      // Refresh events
      await fetchEvents();
      setSelectedEvent(null);
      alert('Event cancelled successfully.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = window.confirm('Are you sure you want to DELETE this event? This cannot be undone.');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      // First delete related bids
      await supabase.from('bids').delete().eq('event_id', eventId);
      
      // Then delete the event
      const { error } = await supabase.from('events').delete().eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event.');
        return;
      }

      await fetchEvents();
      setSelectedEvent(null);
      alert('Event deleted successfully.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] ?? { label: status, variant: 'secondary' as const };
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Events Management</h1>
          <p className="text-sm text-[#6C757D]">Track live, upcoming, and completed events.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'live', 'upcoming', 'completed', 'cancelled'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Events" subtitle={`${filteredEvents.length} events found`} />
        <CardContent>
          <div className="mb-4">
            <TextInput
              label="Search Events"
              placeholder="Search by title, creator, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-left text-sm">
              <thead className="text-[#6C757D]">
                <tr>
                  <th className="border-b border-[#E9ECEF] py-3">ID</th>
                  <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                  <th className="border-b border-[#E9ECEF] py-3">Event Title</th>
                  <th className="border-b border-[#E9ECEF] py-3">Status</th>
                  <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                  <th className="border-b border-[#E9ECEF] py-3">Highest Bid</th>
                  <th className="border-b border-[#E9ECEF] py-3">Starts At</th>
                  <th className="border-b border-[#E9ECEF] py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const config = getStatusConfig(event.status);
                  return (
                    <tr key={event.id} className="border-b border-[#E9ECEF]">
                      <td className="py-3 text-[#212529]">{event.code}</td>
                      <td className="py-3 text-[#6C757D]">{event.creatorName}</td>
                      <td className="py-3 text-[#212529]">{event.title}</td>
                      <td className="py-3">
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </td>
                      <td className="py-3 text-[#212529]">{event.bidsCount}</td>
                      <td className="py-3 text-[#212529]">
                        {event.highestBid > 0 ? formatCurrency(event.highestBid) : formatCurrency(event.basePrice)}
                      </td>
                      <td className="py-3 text-[#6C757D]">{formatDateTime(event.startsAt)}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewEvent(event.id)}
                            disabled={isLoading}
                          >
                            View
                          </Button>
                          {event.status !== 'cancelled' && event.status !== 'completed' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCancelEvent(event.id)}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#6C757D]">
                      {isLoading ? 'Loading events...' : 'No events found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <Card>
          <CardHeader title="Event Details" subtitle={selectedEvent.code} />
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
                <h3 className="text-lg font-semibold text-[#212529]">{selectedEvent.title}</h3>
                <p className="text-sm text-[#6C757D]">{selectedEvent.description || 'No description'}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#6C757D]">Creator</p>
                    <p className="font-medium">{selectedEvent.creatorName}</p>
                    <p className="text-xs text-[#6C757D]">{selectedEvent.creatorEmail}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Category</p>
                    <p className="font-medium capitalize">{selectedEvent.category}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Base Price</p>
                    <p className="font-medium">{formatCurrency(selectedEvent.basePrice)}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Highest Bid</p>
                    <p className="font-medium">{formatCurrency(selectedEvent.highestBid)}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Total Bids</p>
                    <p className="font-medium">{selectedEvent.bidsCount}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Duration</p>
                    <p className="font-medium">{selectedEvent.durationMinutes} min</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Status</p>
                    <Badge variant={getStatusConfig(selectedEvent.status).variant}>
                      {getStatusConfig(selectedEvent.status).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Starts At</p>
                    <p className="font-medium">{formatDateTime(selectedEvent.startsAt)}</p>
                  </div>
                </div>
                {selectedEvent.meetingLink && (
                  <div>
                    <p className="text-[#6C757D]">Meeting Link</p>
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      {selectedEvent.meetingLink}
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-[#212529]">Admin Actions</h4>
                <div className="flex flex-col gap-2">
                  {selectedEvent.status !== 'cancelled' && selectedEvent.status !== 'completed' && (
                    <Button
                      variant="danger"
                      onClick={() => handleCancelEvent(selectedEvent.id)}
                      disabled={isLoading}
                    >
                      ❌ Cancel Event
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    disabled={isLoading}
                  >
                    🗑️ Delete Event Permanently
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                    Close Details
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
