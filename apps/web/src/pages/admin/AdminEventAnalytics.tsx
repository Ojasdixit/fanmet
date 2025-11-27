import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface EventMetrics {
  liveNow: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  completionRate: number;
  avgBidAmount: number;
  avgBidsPerEvent: number;
  totalRevenue: number;
}

interface EventsByStatus {
  status: string;
  count: number;
  percentage: number;
}

interface EventsByCategory {
  category: string;
  count: number;
  revenue: number;
}

interface TopEvent {
  id: string;
  title: string;
  creatorName: string;
  bidsCount: number;
  highestBid: number;
  status: string;
}

export function AdminEventAnalytics() {
  const [metrics, setMetrics] = useState<EventMetrics>({
    liveNow: 0,
    eventsToday: 0,
    eventsThisWeek: 0,
    eventsThisMonth: 0,
    completionRate: 0,
    avgBidAmount: 0,
    avgBidsPerEvent: 0,
    totalRevenue: 0,
  });
  const [eventsByStatus, setEventsByStatus] = useState<EventsByStatus[]>([]);
  const [eventsByCategory, setEventsByCategory] = useState<EventsByCategory[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [recentEvents, setRecentEvents] = useState<TopEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all events
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, creator_id, title, status, category, base_price, starts_at, created_at');

        const totalEvents = eventsData?.length ?? 0;
        const liveNow = (eventsData ?? []).filter((e: any) => e.status === 'live').length;
        const eventsToday = (eventsData ?? []).filter((e: any) => new Date(e.created_at) >= today).length;
        const eventsThisWeek = (eventsData ?? []).filter((e: any) => new Date(e.created_at) >= weekAgo).length;
        const eventsThisMonth = (eventsData ?? []).filter((e: any) => new Date(e.created_at) >= monthStart).length;
        const completedEvents = (eventsData ?? []).filter((e: any) => e.status === 'completed').length;
        const completionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

        // Fetch bids
        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, event_id, amount, status');

        const totalBids = bidsData?.length ?? 0;
        const avgBidAmount = totalBids > 0
          ? (bidsData ?? []).reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0) / totalBids
          : 0;
        const avgBidsPerEvent = totalEvents > 0 ? totalBids / totalEvents : 0;

        const wonBids = (bidsData ?? []).filter((b: any) => b.status === 'won');
        const totalRevenue = wonBids.reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0);

        setMetrics({
          liveNow,
          eventsToday,
          eventsThisWeek,
          eventsThisMonth,
          completionRate,
          avgBidAmount,
          avgBidsPerEvent,
          totalRevenue,
        });

        // Events by status
        const statusCounts = new Map<string, number>();
        for (const e of (eventsData ?? []) as any[]) {
          statusCounts.set(e.status, (statusCounts.get(e.status) ?? 0) + 1);
        }

        const statusList: EventsByStatus[] = Array.from(statusCounts.entries())
          .map(([status, count]) => ({
            status,
            count,
            percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count);

        setEventsByStatus(statusList);

        // Events by category
        const categoryCounts = new Map<string, { count: number; eventIds: string[] }>();
        for (const e of (eventsData ?? []) as any[]) {
          const cat = e.category || 'general';
          const current = categoryCounts.get(cat) ?? { count: 0, eventIds: [] };
          current.count++;
          current.eventIds.push(e.id);
          categoryCounts.set(cat, current);
        }

        const categoryList: EventsByCategory[] = Array.from(categoryCounts.entries())
          .map(([category, data]) => {
            const catBids = wonBids.filter((b: any) => data.eventIds.includes(b.event_id));
            const revenue = catBids.reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0);
            return { category, count: data.count, revenue };
          })
          .sort((a, b) => b.count - a.count);

        setEventsByCategory(categoryList);

        // Fetch creator profiles
        const creatorIds = Array.from(new Set((eventsData ?? []).map((e: any) => e.creator_id)));
        const { data: profilesData } = creatorIds.length
          ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
          : { data: [] };

        const profileMap = new Map<string, string>();
        for (const p of (profilesData ?? []) as any[]) {
          profileMap.set(p.user_id, p.display_name || p.username || 'Creator');
        }

        // Calculate bids per event
        const bidsPerEvent = new Map<string, { count: number; highest: number }>();
        for (const b of (bidsData ?? []) as any[]) {
          const current = bidsPerEvent.get(b.event_id) ?? { count: 0, highest: 0 };
          current.count++;
          current.highest = Math.max(current.highest, b.amount ?? 0);
          bidsPerEvent.set(b.event_id, current);
        }

        // Top events by bid count
        const eventsList = (eventsData ?? []).map((e: any) => ({
          id: e.id,
          title: e.title,
          creatorName: profileMap.get(e.creator_id) ?? 'Unknown',
          bidsCount: bidsPerEvent.get(e.id)?.count ?? 0,
          highestBid: bidsPerEvent.get(e.id)?.highest ?? 0,
          status: e.status,
        }));

        const topEventsList = [...eventsList]
          .sort((a, b) => b.bidsCount - a.bidsCount)
          .slice(0, 5);

        setTopEvents(topEventsList);

        // Recent events
        const recentEventsList = [...eventsList]
          .sort((a, b) => {
            const eventA = (eventsData ?? []).find((e: any) => e.id === a.id);
            const eventB = (eventsData ?? []).find((e: any) => e.id === b.id);
            return new Date(eventB?.created_at ?? 0).getTime() - new Date(eventA?.created_at ?? 0).getTime();
          })
          .slice(0, 5);

        setRecentEvents(recentEventsList);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const statusVariant: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
    live: 'danger',
    upcoming: 'primary',
    completed: 'success',
    cancelled: 'warning',
    draft: 'warning',
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Event Analytics</h1>
          <p className="text-sm text-[#6C757D]">Deep dive into event performance and engagement metrics.</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Key Metrics" subtitle="Real-time event snapshot" />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Events Live Now</p>
            <p className="mt-2 text-lg font-semibold text-[#DC3545]">{metrics.liveNow}</p>
            <p className="text-xs text-[#6C757D]">Currently active</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Events Today</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{metrics.eventsToday}</p>
            <p className="text-xs text-[#6C757D]">{metrics.eventsThisWeek} this week</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Completion Rate</p>
            <p className="mt-2 text-lg font-semibold text-[#28A745]">{metrics.completionRate.toFixed(1)}%</p>
            <p className="text-xs text-[#6C757D]">Events successfully completed</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Avg Bid Amount</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{formatCurrency(metrics.avgBidAmount)}</p>
            <p className="text-xs text-[#6C757D]">{metrics.avgBidsPerEvent.toFixed(1)} bids/event avg</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader title="Events by Status" subtitle="Distribution across statuses" />
          <CardContent className="space-y-3">
            {eventsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[item.status] ?? 'primary'}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </div>
                <span className="text-[#6C757D]">{item.percentage.toFixed(1)}%</span>
                <span className="font-semibold text-[#212529]">{item.count}</span>
              </div>
            ))}
            {eventsByStatus.length === 0 && (
              <p className="py-4 text-center text-sm text-[#6C757D]">
                {isLoading ? 'Loading...' : 'No events data'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Events by Category" subtitle="Revenue and count per category" />
          <CardContent className="space-y-3">
            {eventsByCategory.map((item) => (
              <div key={item.category} className="flex items-center justify-between rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm">
                <span className="text-[#212529] capitalize">{item.category}</span>
                <span className="text-[#6C757D]">{item.count} events</span>
                <span className="font-semibold text-[#28A745]">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
            {eventsByCategory.length === 0 && (
              <p className="py-4 text-center text-sm text-[#6C757D]">
                {isLoading ? 'Loading...' : 'No category data'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top Events by Bids" subtitle="Most popular events" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Event</th>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Highest Bid</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.map((event) => (
                <tr key={event.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{event.title}</td>
                  <td className="py-3 text-[#6C757D]">{event.creatorName}</td>
                  <td className="py-3 font-semibold text-[#212529]">{event.bidsCount}</td>
                  <td className="py-3 text-[#28A745]">{formatCurrency(event.highestBid)}</td>
                  <td className="py-3">
                    <Badge variant={statusVariant[event.status] ?? 'primary'}>
                      {event.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {topEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No event data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Recent Events" subtitle="Latest created events" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Event</th>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((event) => (
                <tr key={event.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{event.title}</td>
                  <td className="py-3 text-[#6C757D]">{event.creatorName}</td>
                  <td className="py-3 text-[#212529]">{event.bidsCount}</td>
                  <td className="py-3">
                    <Badge variant={statusVariant[event.status] ?? 'primary'}>
                      {event.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
