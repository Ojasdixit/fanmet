import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface KPI {
  label: string;
  value: string;
  variant?: 'success' | 'primary' | 'warning' | 'danger';
  helper?: string;
}

interface FunnelStep {
  stage: string;
  value: number;
  percentage: string;
}

interface EventPerformance {
  label: string;
  totalCreated: number;
  avgParticipants: number;
  avgFinalBid: number;
  completionRate: number;
  avgCreatorRevenue: number;
}

interface CreatorStats {
  creatorId: string;
  name: string;
  eventsCount: number;
  revenue: number;
}

export function AdminBusinessAnalytics() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [eventPerformance, setEventPerformance] = useState<EventPerformance[]>([]);
  const [topCreators, setTopCreators] = useState<CreatorStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all users
        const { data: usersData } = await supabase.from('users').select('id, role, created_at');
        const totalUsers = usersData?.length ?? 0;
        const fansCount = (usersData ?? []).filter((u: any) => u.role === 'fan').length;
        const creatorsCount = (usersData ?? []).filter((u: any) => u.role === 'creator').length;

        // Fetch bids
        const { data: bidsData } = await supabase.from('bids').select('id, event_id, fan_id, amount, status, created_at');
        const totalBids = bidsData?.length ?? 0;
        const wonBids = (bidsData ?? []).filter((b: any) => b.status === 'won');
        const uniqueBidders = new Set((bidsData ?? []).map((b: any) => b.fan_id)).size;
        const avgBidAmount = totalBids > 0
          ? (bidsData ?? []).reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0) / totalBids
          : 0;
        const winRate = totalBids > 0 ? (wonBids.length / totalBids) * 100 : 0;

        // Fetch events
        const { data: eventsData } = await supabase.from('events').select('id, creator_id, status, base_price, is_paid, created_at');
        const totalEvents = eventsData?.length ?? 0;
        const completedEvents = (eventsData ?? []).filter((e: any) => e.status === 'completed').length;
        const eventCompletionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

        // Fetch meets
        const { data: meetsData } = await supabase.from('meets').select('id, status');
        const completedMeets = (meetsData ?? []).filter((m: any) => m.status === 'completed').length;

        // Calculate revenue
        const totalRevenue = wonBids.reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0);
        const arpu = fansCount > 0 ? totalRevenue / fansCount : 0;

        // Calculate conversion rate (users who placed at least one bid)
        const conversionRate = totalUsers > 0 ? (uniqueBidders / totalUsers) * 100 : 0;

        // Calculate month-over-month growth
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonthUsers = (usersData ?? []).filter((u: any) => new Date(u.created_at) >= thisMonthStart).length;
        const lastMonthUsers = (usersData ?? []).filter((u: any) => {
          const d = new Date(u.created_at);
          return d >= lastMonthStart && d <= lastMonthEnd;
        }).length;
        const growthRate = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

        setKpis([
          { label: 'Monthly Growth Rate', value: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`, variant: growthRate >= 0 ? 'success' : 'danger' },
          { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, variant: conversionRate > 10 ? 'success' : 'warning' },
          { label: 'Avg Bid Amount', value: formatCurrency(avgBidAmount) },
          { label: 'Win Rate', value: `${winRate.toFixed(1)}%` },
          { label: 'Event Completion', value: `${eventCompletionRate.toFixed(1)}%`, variant: eventCompletionRate > 90 ? 'success' : 'warning' },
          { label: 'ARPU', value: formatCurrency(arpu) },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), variant: 'success' },
          { label: 'Active Creators', value: creatorsCount.toString() },
        ]);

        // Build funnel
        setFunnel([
          { stage: 'Total Users', value: totalUsers, percentage: '100%' },
          { stage: 'Fans (Potential Bidders)', value: fansCount, percentage: totalUsers > 0 ? `${((fansCount / totalUsers) * 100).toFixed(1)}%` : '0%' },
          { stage: 'Placed a Bid', value: uniqueBidders, percentage: totalUsers > 0 ? `${((uniqueBidders / totalUsers) * 100).toFixed(1)}%` : '0%' },
          { stage: 'Won an Event', value: wonBids.length, percentage: totalUsers > 0 ? `${((wonBids.length / totalUsers) * 100).toFixed(1)}%` : '0%' },
          { stage: 'Completed Meet', value: completedMeets, percentage: totalUsers > 0 ? `${((completedMeets / totalUsers) * 100).toFixed(1)}%` : '0%' },
        ]);

        // Event performance by pricing tier
        const lowPriceEvents = (eventsData ?? []).filter((e: any) => (e.base_price ?? 0) <= 50 && e.is_paid !== false);
        const midPriceEvents = (eventsData ?? []).filter((e: any) => (e.base_price ?? 0) > 50 && (e.base_price ?? 0) <= 100);
        const freeEvents = (eventsData ?? []).filter((e: any) => e.is_paid === false);

        const calcEventPerf = (events: any[], label: string): EventPerformance => {
          const eventIds = events.map((e: any) => e.id);
          const eventBids = (bidsData ?? []).filter((b: any) => eventIds.includes(b.event_id));
          const eventWonBids = eventBids.filter((b: any) => b.status === 'won');
          const completedCount = events.filter((e: any) => e.status === 'completed').length;

          return {
            label,
            totalCreated: events.length,
            avgParticipants: events.length > 0 ? eventBids.length / events.length : 0,
            avgFinalBid: eventWonBids.length > 0
              ? eventWonBids.reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0) / eventWonBids.length
              : 0,
            completionRate: events.length > 0 ? (completedCount / events.length) * 100 : 0,
            avgCreatorRevenue: eventWonBids.length > 0
              ? (eventWonBids.reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0) * 0.9) / eventWonBids.length
              : 0,
          };
        };

        setEventPerformance([
          calcEventPerf(lowPriceEvents, 'Paid Events (₹50 Base)'),
          calcEventPerf(midPriceEvents, 'Paid Events (₹100 Base)'),
          calcEventPerf(freeEvents, 'Free Events'),
        ]);

        // Top creators by revenue
        const { data: profilesData } = await supabase.from('profiles').select('user_id, display_name, username');
        const profileMap = new Map<string, string>();
        for (const p of (profilesData ?? []) as any[]) {
          profileMap.set(p.user_id, p.display_name || p.username || 'Creator');
        }

        const eventCreatorMap = new Map<string, string>();
        for (const e of (eventsData ?? []) as any[]) {
          eventCreatorMap.set(e.id, e.creator_id);
        }

        const creatorRevenue = new Map<string, { events: Set<string>; revenue: number }>();
        for (const bid of wonBids as any[]) {
          const creatorId = eventCreatorMap.get(bid.event_id);
          if (!creatorId) continue;
          const current = creatorRevenue.get(creatorId) ?? { events: new Set(), revenue: 0 };
          current.events.add(bid.event_id);
          current.revenue += (bid.amount ?? 0) * 0.9;
          creatorRevenue.set(creatorId, current);
        }

        const topCreatorsList: CreatorStats[] = Array.from(creatorRevenue.entries())
          .map(([creatorId, stats]) => ({
            creatorId,
            name: profileMap.get(creatorId) ?? 'Unknown',
            eventsCount: stats.events.size,
            revenue: stats.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopCreators(topCreatorsList);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Business Analytics</h1>
          <p className="text-sm text-[#6C757D]">
            High-level KPIs, funnel health, and performance metrics.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Key Performance Indicators" subtitle="Current metrics overview" />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">{kpi.label}</p>
              <p className="mt-2 text-lg font-semibold text-[#212529]">{kpi.value}</p>
              {kpi.variant && <Badge variant={kpi.variant}>Current</Badge>}
            </div>
          ))}
          {kpis.length === 0 && isLoading && (
            <p className="col-span-4 py-4 text-center text-sm text-[#6C757D]">Loading...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Conversion Funnel" subtitle="User journey from signup to completed meet" />
        <CardContent className="space-y-3">
          {funnel.map((step, idx) => (
            <div key={step.stage} className="flex items-center justify-between rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-[#212529]">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C757D] text-xs text-white">{idx + 1}</span>
                {step.stage}
              </span>
              <span className="text-[#6C757D]">{step.percentage}</span>
              <span className="font-semibold">{step.value.toLocaleString()}</span>
            </div>
          ))}
          {funnel.length === 0 && !isLoading && (
            <p className="py-4 text-center text-sm text-[#6C757D]">No data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Event Performance" subtitle="Compare paid vs free categories" />
        <CardContent className="grid gap-4 md:grid-cols-3">
          {eventPerformance.map((block) => (
            <div key={block.label} className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
              <h2 className="font-semibold">{block.label}</h2>
              <ul className="mt-3 space-y-2 text-[#6C757D]">
                <li>Total Created: <strong>{block.totalCreated}</strong></li>
                <li>Avg Participants: <strong>{block.avgParticipants.toFixed(1)}</strong></li>
                <li>Avg Final Bid: <strong>{formatCurrency(block.avgFinalBid)}</strong></li>
                <li>Completion: <strong>{block.completionRate.toFixed(0)}%</strong></li>
                <li>Avg Creator Revenue: <strong>{formatCurrency(block.avgCreatorRevenue)}</strong></li>
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Top Creators by Revenue" subtitle="Highest earning creators" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Rank</th>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Events</th>
                <th className="border-b border-[#E9ECEF] py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCreators.map((creator, idx) => (
                <tr key={creator.creatorId} className="border-b border-[#E9ECEF]">
                  <td className="py-3">
                    <Badge variant={idx === 0 ? 'success' : idx === 1 ? 'primary' : 'warning'}>#{idx + 1}</Badge>
                  </td>
                  <td className="py-3 text-[#212529]">{creator.name}</td>
                  <td className="py-3 text-[#6C757D]">{creator.eventsCount}</td>
                  <td className="py-3 font-semibold text-[#28A745]">{formatCurrency(creator.revenue)}</td>
                </tr>
              ))}
              {topCreators.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No creator data available'}
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
