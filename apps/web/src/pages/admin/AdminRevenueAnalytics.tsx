import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

type Period = 'today' | '7days' | '30days' | 'month' | 'all';

interface RevenueMetrics {
  grossRevenue: number;
  netRevenue: number;
  platformCommission: number;
  creatorPayouts: number;
  avgEventRevenue: number;
  paidEventsCount: number;
  freeEventsCount: number;
  totalRefunds: number;
}

interface DailyRevenue {
  date: string;
  eventsCount: number;
  bidsCount: number;
  revenue: number;
  commission: number;
  refunds: number;
}

interface TopCreator {
  creatorId: string;
  name: string;
  revenue: number;
}

interface EventTypeRevenue {
  type: string;
  revenue: number;
  percent: number;
}

interface DurationRevenue {
  duration: string;
  revenue: number;
  percent: number;
}

export function AdminRevenueAnalytics() {
  const [period, setPeriod] = useState<Period>('month');
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    grossRevenue: 0,
    netRevenue: 0,
    platformCommission: 0,
    creatorPayouts: 0,
    avgEventRevenue: 0,
    paidEventsCount: 0,
    freeEventsCount: 0,
    totalRefunds: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [eventTypeRevenue, setEventTypeRevenue] = useState<EventTypeRevenue[]>([]);
  const [durationRevenue, setDurationRevenue] = useState<DurationRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getDateRange = (p: Period): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch (p) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        start = new Date(2020, 0, 1);
        break;
    }

    return { start, end };
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { start, end } = getDateRange(period);

        // Fetch bids in date range
        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, event_id, amount, status, created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        // Fetch events
        const eventIds = Array.from(new Set((bidsData ?? []).map((b: any) => b.event_id)));
        const { data: eventsData } = eventIds.length
          ? await supabase.from('events').select('id, creator_id, base_price, duration_minutes, is_paid, created_at').in('id', eventIds)
          : { data: [] };

        const eventMap = new Map<string, any>();
        for (const e of (eventsData ?? []) as any[]) {
          eventMap.set(e.id, e);
        }

        // Fetch all events for count
        const { data: allEventsData } = await supabase
          .from('events')
          .select('id, is_paid, created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        const paidEventsCount = (allEventsData ?? []).filter((e: any) => e.is_paid !== false).length;
        const freeEventsCount = (allEventsData ?? []).filter((e: any) => e.is_paid === false).length;

        // Fetch creator profiles
        const creatorIds = Array.from(new Set((eventsData ?? []).map((e: any) => e.creator_id)));
        const { data: profilesData } = creatorIds.length
          ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
          : { data: [] };

        const creatorNameMap = new Map<string, string>();
        for (const p of (profilesData ?? []) as any[]) {
          creatorNameMap.set(p.user_id, p.display_name || p.username || 'Creator');
        }

        // Calculate metrics
        const wonBids = (bidsData ?? []).filter((b: any) => b.status === 'won');
        const lostBids = (bidsData ?? []).filter((b: any) => b.status === 'lost');

        // Total bid volume (finalized bids only: won + lost)
        const totalBidVolume = [...wonBids, ...lostBids].reduce(
          (sum: number, b: any) => sum + (b.amount ?? 0),
          0,
        );

        // Platform revenue is 10% commission on all finalized bids
        const platformCommission = Math.floor(totalBidVolume * 0.1);

        // 90% back to non-winners is a pass-through refund, not negative revenue
        const totalRefunds = lostBids.reduce(
          (sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.9),
          0,
        );

        // 90% of winning bids goes to creators as payouts (pass-through as well)
        const creatorPayouts = wonBids.reduce(
          (sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.9),
          0,
        );

        // For analytics, treat "net" revenue as the commission the platform actually keeps
        const grossRevenue = totalBidVolume;
        const netRevenue = platformCommission;
        const avgEventRevenue = eventIds.length > 0 ? grossRevenue / eventIds.length : 0;

        setMetrics({
          grossRevenue,
          netRevenue,
          platformCommission,
          creatorPayouts,
          avgEventRevenue,
          paidEventsCount,
          freeEventsCount,
          totalRefunds,
        });

        // Calculate daily revenue
        const dailyMap = new Map<string, DailyRevenue>();
        for (const bid of (bidsData ?? []) as any[]) {
          const dateStr = new Date(bid.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          const current = dailyMap.get(dateStr) ?? { date: dateStr, eventsCount: 0, bidsCount: 0, revenue: 0, commission: 0, refunds: 0 };
          current.bidsCount++;

          if (bid.status === 'won') {
            current.revenue += bid.amount ?? 0;
            current.commission += Math.floor((bid.amount ?? 0) * 0.1);
          } else if (bid.status === 'lost') {
            current.refunds += Math.floor((bid.amount ?? 0) * 0.9);
            current.commission += Math.floor((bid.amount ?? 0) * 0.1);
          }

          dailyMap.set(dateStr, current);
        }

        // Count events per day
        for (const event of (allEventsData ?? []) as any[]) {
          const dateStr = new Date(event.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          const current = dailyMap.get(dateStr);
          if (current) current.eventsCount++;
        }

        setDailyRevenue(Array.from(dailyMap.values()).slice(0, 10));

        // Calculate top creators by revenue
        const creatorRevenue = new Map<string, number>();
        for (const bid of wonBids as any[]) {
          const event = eventMap.get(bid.event_id);
          if (!event) continue;
          const current = creatorRevenue.get(event.creator_id) ?? 0;
          creatorRevenue.set(event.creator_id, current + (bid.amount ?? 0));
        }

        const topCreatorsList: TopCreator[] = Array.from(creatorRevenue.entries())
          .map(([creatorId, revenue]) => ({
            creatorId,
            name: creatorNameMap.get(creatorId) ?? 'Unknown',
            revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopCreators(topCreatorsList);

        // Calculate revenue by event type (base price tier)
        const tierRevenue = new Map<string, number>();
        for (const bid of wonBids as any[]) {
          const event = eventMap.get(bid.event_id);
          if (!event) continue;
          const tier = (event.base_price ?? 0) <= 50 ? 'Paid Events · ₹50 Base' : (event.base_price ?? 0) <= 100 ? 'Paid Events · ₹100 Base' : 'Paid Events · ₹100+ Base';
          tierRevenue.set(tier, (tierRevenue.get(tier) ?? 0) + (bid.amount ?? 0));
        }

        const tierList: EventTypeRevenue[] = Array.from(tierRevenue.entries())
          .map(([type, revenue]) => ({
            type,
            revenue,
            percent: grossRevenue > 0 ? (revenue / grossRevenue) * 100 : 0,
          }))
          .sort((a, b) => b.revenue - a.revenue);

        setEventTypeRevenue(tierList);

        // Calculate revenue by duration
        const durationRevenueMap = new Map<string, number>();
        for (const bid of wonBids as any[]) {
          const event = eventMap.get(bid.event_id);
          if (!event) continue;
          const dur = (event.duration_minutes ?? 5) <= 5 ? '5-minute events' : (event.duration_minutes ?? 5) <= 10 ? '10-minute events' : '15+ minute events';
          durationRevenueMap.set(dur, (durationRevenueMap.get(dur) ?? 0) + (bid.amount ?? 0));
        }

        const durationList: DurationRevenue[] = Array.from(durationRevenueMap.entries())
          .map(([duration, revenue]) => ({
            duration,
            revenue,
            percent: grossRevenue > 0 ? (revenue / grossRevenue) * 100 : 0,
          }))
          .sort((a, b) => b.revenue - a.revenue);

        setDurationRevenue(durationList);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [period]);

  const totalEvents = metrics.paidEventsCount + metrics.freeEventsCount;
  const paidPercent = totalEvents > 0 ? Math.round((metrics.paidEventsCount / totalEvents) * 100) : 0;
  const freePercent = totalEvents > 0 ? Math.round((metrics.freeEventsCount / totalEvents) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Revenue Analytics</h1>
          <p className="text-sm text-[#6C757D]">
            Monitor revenue flows, commission, and payouts with configurable time ranges.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'today', label: 'Today' },
            { key: '7days', label: 'Last 7 Days' },
            { key: '30days', label: 'Last 30 Days' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All Time' },
          ] as { key: Period; label: string }[]).map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              variant={period === opt.key ? 'secondary' : 'ghost'}
              onClick={() => setPeriod(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Summary" subtitle="Key financial metrics for the selected range." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Gross Revenue</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{formatCurrency(metrics.grossRevenue)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Net Revenue</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{formatCurrency(metrics.netRevenue)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Platform Commission</p>
            <p className="mt-2 text-lg font-semibold text-[#28A745]">{formatCurrency(metrics.platformCommission)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Creator Payouts</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{formatCurrency(metrics.creatorPayouts)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Avg Event Revenue</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{formatCurrency(metrics.avgEventRevenue)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Paid Events</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{metrics.paidEventsCount} ({paidPercent}%)</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Free Events</p>
            <p className="mt-2 text-lg font-semibold text-[#212529]">{metrics.freeEventsCount} ({freePercent}%)</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Refunds</p>
            <p className="mt-2 text-lg font-semibold text-[#DC3545]">{formatCurrency(metrics.totalRefunds)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Revenue Breakdown" subtitle="Analyze by event type, duration, and top creators." />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#212529]">Revenue by Event Type</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#6C757D]">
              {eventTypeRevenue.length === 0 && <li>No data</li>}
              {eventTypeRevenue.map((item) => (
                <li key={item.type}>
                  {item.type} — {item.percent.toFixed(0)}% ({formatCurrency(item.revenue)})
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#212529]">Top Revenue Creators</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#6C757D]">
              {topCreators.length === 0 && <li>No data</li>}
              {topCreators.map((creator) => (
                <li key={creator.creatorId}>
                  {creator.name} — {formatCurrency(creator.revenue)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#212529]">Revenue by Duration</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#6C757D]">
              {durationRevenue.length === 0 && <li>No data</li>}
              {durationRevenue.map((item) => (
                <li key={item.duration}>
                  {item.duration} — {item.percent.toFixed(0)}% ({formatCurrency(item.revenue)})
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Revenue by Date" subtitle="Daily breakdown for reporting." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Events</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Revenue</th>
                <th className="border-b border-[#E9ECEF] py-3">Commission</th>
                <th className="border-b border-[#E9ECEF] py-3">Refunds</th>
              </tr>
            </thead>
            <tbody>
              {dailyRevenue.map((row) => (
                <tr key={row.date} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{row.date}</td>
                  <td className="py-3 text-[#6C757D]">{row.eventsCount}</td>
                  <td className="py-3 text-[#6C757D]">{row.bidsCount}</td>
                  <td className="py-3 text-[#212529]">{formatCurrency(row.revenue)}</td>
                  <td className="py-3 text-[#28A745]">{formatCurrency(row.commission)}</td>
                  <td className="py-3 text-[#DC3545]">{formatCurrency(row.refunds)}</td>
                </tr>
              ))}
              {dailyRevenue.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No revenue data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
