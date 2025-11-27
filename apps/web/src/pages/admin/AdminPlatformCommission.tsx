import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface CommissionSummary {
  total: number;
  fromWinners: number;
  fromNonWinners: number;
  eventsProcessed: number;
  avgPerEvent: number;
  yearlyProjection: number;
}

interface CreatorCommission {
  creatorId: string;
  creatorName: string;
  eventsCount: number;
  totalRevenue: number;
  commission: number;
  sharePercent: number;
}

interface EventTypeBreakdown {
  basePrice: string;
  commission: number;
  sharePercent: number;
}

export function AdminPlatformCommission() {
  const [summary, setSummary] = useState<CommissionSummary>({
    total: 0,
    fromWinners: 0,
    fromNonWinners: 0,
    eventsProcessed: 0,
    avgPerEvent: 0,
    yearlyProjection: 0,
  });
  const [creatorCommissions, setCreatorCommissions] = useState<CreatorCommission[]>([]);
  const [eventTypeBreakdown, setEventTypeBreakdown] = useState<EventTypeBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all bids with event info
        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, event_id, amount, status, created_at');

        // Fetch events for creator mapping and base prices
        const eventIds = Array.from(new Set((bidsData ?? []).map((b: any) => b.event_id)));
        const { data: eventsData } = eventIds.length
          ? await supabase.from('events').select('id, creator_id, base_price, status').in('id', eventIds)
          : { data: [] };

        const eventMap = new Map<string, { creatorId: string; basePrice: number }>();
        for (const e of (eventsData ?? []) as any[]) {
          eventMap.set(e.id, { creatorId: e.creator_id, basePrice: e.base_price ?? 0 });
        }

        // Fetch creator profiles
        const creatorIds = Array.from(new Set((eventsData ?? []).map((e: any) => e.creator_id)));
        const { data: profilesData } = creatorIds.length
          ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', creatorIds)
          : { data: [] };

        const creatorNameMap = new Map<string, string>();
        for (const p of (profilesData ?? []) as any[]) {
          creatorNameMap.set(p.user_id, p.display_name || p.username || 'Creator');
        }

        // Calculate commission (10% from all bids)
        const wonBids = (bidsData ?? []).filter((b: any) => b.status === 'won');
        const lostBids = (bidsData ?? []).filter((b: any) => b.status === 'lost');

        const fromWinners = wonBids.reduce((sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.1), 0);
        const fromNonWinners = lostBids.reduce((sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.1), 0);
        const total = fromWinners + fromNonWinners;

        // Count unique completed events
        const completedEvents = (eventsData ?? []).filter((e: any) => e.status === 'completed');
        const eventsProcessed = completedEvents.length || eventIds.length;
        const avgPerEvent = eventsProcessed > 0 ? total / eventsProcessed : 0;

        // Calculate yearly projection based on this month's data
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = now.getDate();
        const monthlyProjection = daysPassed > 0 ? (total / daysPassed) * daysInMonth : total;
        const yearlyProjection = monthlyProjection * 12;

        setSummary({
          total,
          fromWinners,
          fromNonWinners,
          eventsProcessed,
          avgPerEvent,
          yearlyProjection,
        });

        // Calculate commission by creator
        const creatorStats = new Map<string, { events: Set<string>; revenue: number; commission: number }>();

        for (const bid of (bidsData ?? []) as any[]) {
          const eventInfo = eventMap.get(bid.event_id);
          if (!eventInfo) continue;

          const { creatorId } = eventInfo;
          const current = creatorStats.get(creatorId) ?? { events: new Set(), revenue: 0, commission: 0 };
          current.events.add(bid.event_id);

          if (bid.status === 'won') {
            current.revenue += bid.amount ?? 0;
            current.commission += Math.floor((bid.amount ?? 0) * 0.1);
          } else if (bid.status === 'lost') {
            current.commission += Math.floor((bid.amount ?? 0) * 0.1);
          }

          creatorStats.set(creatorId, current);
        }

        const creatorList: CreatorCommission[] = Array.from(creatorStats.entries())
          .map(([creatorId, stats]) => ({
            creatorId,
            creatorName: creatorNameMap.get(creatorId) ?? 'Unknown',
            eventsCount: stats.events.size,
            totalRevenue: stats.revenue,
            commission: stats.commission,
            sharePercent: total > 0 ? (stats.commission / total) * 100 : 0,
          }))
          .sort((a, b) => b.commission - a.commission)
          .slice(0, 10);

        setCreatorCommissions(creatorList);

        // Calculate commission by event base price tier
        const tierStats = new Map<string, { commission: number }>();

        for (const bid of (bidsData ?? []) as any[]) {
          if (bid.status !== 'won' && bid.status !== 'lost') continue;

          const eventInfo = eventMap.get(bid.event_id);
          if (!eventInfo) continue;

          const tier = eventInfo.basePrice <= 50 ? '₹50 Base' : eventInfo.basePrice <= 100 ? '₹100 Base' : '₹100+ Base';
          const current = tierStats.get(tier) ?? { commission: 0 };
          current.commission += Math.floor((bid.amount ?? 0) * 0.1);
          tierStats.set(tier, current);
        }

        const tierList: EventTypeBreakdown[] = Array.from(tierStats.entries())
          .map(([basePrice, stats]) => ({
            basePrice,
            commission: stats.commission,
            sharePercent: total > 0 ? (stats.commission / total) * 100 : 0,
          }))
          .sort((a, b) => b.commission - a.commission);

        setEventTypeBreakdown(tierList);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const winnerPercent = summary.total > 0 ? Math.round((summary.fromWinners / summary.total) * 100) : 0;
  const nonWinnerPercent = summary.total > 0 ? Math.round((summary.fromNonWinners / summary.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Platform Commission</h1>
          <p className="text-sm text-[#6C757D]">
            Breakdown of commission collected across winners and non-winners plus projection insights.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Summary" subtitle="Current overview" />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Commission</p>
            <p className="mt-2 text-xl font-semibold text-[#28A745]">{formatCurrency(summary.total)}</p>
            <p className="text-xs text-[#6C757D]">All event revenue combined</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">From Winners</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">
              {formatCurrency(summary.fromWinners)} ({winnerPercent}%)
            </p>
            <p className="text-xs text-[#6C757D]">10% cut from winning bids</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">From Non-winners</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">
              {formatCurrency(summary.fromNonWinners)} ({nonWinnerPercent}%)
            </p>
            <p className="text-xs text-[#6C757D]">Retained from 90% refunds</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Events Processed</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{summary.eventsProcessed}</p>
            <p className="text-xs text-[#6C757D]">Average per event {formatCurrency(summary.avgPerEvent)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Yearly Projection</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{formatCurrency(summary.yearlyProjection)}</p>
            <p className="text-xs text-[#6C757D]">Based on current run rate</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Event Type Breakdown" subtitle="Commission by pricing tier" />
        <CardContent className="space-y-3">
          {eventTypeBreakdown.length === 0 && !isLoading && (
            <p className="py-4 text-center text-sm text-[#6C757D]">No data available</p>
          )}
          {eventTypeBreakdown.map((item) => (
            <div key={item.basePrice} className="flex items-center justify-between rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-[#212529]">
              <span>{item.basePrice}</span>
              <span className="text-[#6C757D]">{item.sharePercent.toFixed(1)}%</span>
              <span className="font-semibold">{formatCurrency(item.commission)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Commission by Creator" subtitle="Top contributors to platform revenue" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Events</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Revenue</th>
                <th className="border-b border-[#E9ECEF] py-3">Commission</th>
                <th className="border-b border-[#E9ECEF] py-3">Share</th>
              </tr>
            </thead>
            <tbody>
              {creatorCommissions.map((row) => (
                <tr key={row.creatorId} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{row.creatorName}</td>
                  <td className="py-3 text-[#6C757D]">{row.eventsCount}</td>
                  <td className="py-3 text-[#212529]">{formatCurrency(row.totalRevenue)}</td>
                  <td className="py-3 font-semibold text-[#28A745]">{formatCurrency(row.commission)}</td>
                  <td className="py-3 text-[#6C757D]">{row.sharePercent.toFixed(1)}%</td>
                </tr>
              ))}
              {creatorCommissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No commission data available'}
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
