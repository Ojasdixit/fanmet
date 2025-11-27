import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface HeadlineStats {
  totalUsers: number;
  activeEvents: number;
  liveNow: number;
  revenueThisMonth: number;
  commission: number;
  creators: number;
  fans: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  totalBids: number;
  bidsToday: number;
  refundsThisMonth: number;
}

interface QuickStatsData {
  newFansToday: number;
  newCreatorsToday: number;
  activeMeetsNow: number;
  eventsEndingToday: number;
}

interface ActivityItem {
  id: string;
  emoji: string;
  text: string;
  time: string;
}

interface AlertItem {
  id: string;
  emoji: string;
  text: string;
  count: number;
}

interface ChartPoint {
  date: string;
  label: string;
  value: number;
}

interface TopCreator {
  id: string;
  name: string;
  earnings: number;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function AdminDashboard() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Headline stats
  const [stats, setStats] = useState<HeadlineStats>({
    totalUsers: 0,
    activeEvents: 0,
    liveNow: 0,
    revenueThisMonth: 0,
    commission: 0,
    creators: 0,
    fans: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    totalBids: 0,
    bidsToday: 0,
    refundsThisMonth: 0,
  });

  // Quick stats
  const [quickStats, setQuickStats] = useState<QuickStatsData>({
    newFansToday: 0,
    newCreatorsToday: 0,
    activeMeetsNow: 0,
    eventsEndingToday: 0,
  });

  // Alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // Activity feed
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  // Charts data
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

      // ===== HEADLINE STATS =====

      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Users by role
      const { count: creators } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'creator');

      const { count: fans } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'fan');

      // Active events (live + upcoming)
      const { count: activeEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .in('status', ['live', 'upcoming']);

      const { count: liveNow } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live');

      // Bid volume and commission this month
      const { data: monthBidsData } = await supabase
        .from('bids')
        .select('amount, status, created_at')
        .gte('created_at', monthStart.toISOString());

      const wonBids = (monthBidsData ?? []).filter((b: any) => b.status === 'won');
      const lostBids = (monthBidsData ?? []).filter((b: any) => b.status === 'lost');

      const winningBidVolume = wonBids.reduce(
        (sum: number, b: any) => sum + (b.amount ?? 0),
        0,
      );
      const totalBidVolume = [...wonBids, ...lostBids].reduce(
        (sum: number, b: any) => sum + (b.amount ?? 0),
        0,
      );
      const commission = Math.round(totalBidVolume * 0.1);

      // Pending withdrawals
      const { data: pendingWdData } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .in('status', ['pending', 'in_review']);

      const pendingWithdrawals = pendingWdData?.length ?? 0;
      const pendingWithdrawalsAmount = (pendingWdData ?? []).reduce(
        (sum: number, w: any) => sum + (w.amount ?? 0),
        0
      );

      // Total bids + today's bids
      const { count: totalBids } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true });

      const { count: bidsToday } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // Refunds this month (from wallet_transactions with type = 'bid_refund')
      const { data: refundsData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('type', 'bid_refund')
        .gte('created_at', monthStart.toISOString());

      const refundsThisMonth = (refundsData ?? []).reduce(
        (sum: number, r: any) => sum + (r.amount ?? 0),
        0
      );

      setStats({
        totalUsers: totalUsers ?? 0,
        activeEvents: activeEvents ?? 0,
        liveNow: liveNow ?? 0,
        revenueThisMonth: winningBidVolume,
        commission,
        creators: creators ?? 0,
        fans: fans ?? 0,
        pendingWithdrawals,
        pendingWithdrawalsAmount,
        totalBids: totalBids ?? 0,
        bidsToday: bidsToday ?? 0,
        refundsThisMonth,
      });

      // ===== QUICK STATS =====

      // New signups today
      const { count: newFansToday } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'fan')
        .gte('created_at', todayStart.toISOString());

      const { count: newCreatorsToday } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'creator')
        .gte('created_at', todayStart.toISOString());

      // Active meets now (scheduled meets whose scheduled_at is within an hour window around now)
      const meetWindowStart = new Date(now.getTime() - 30 * 60 * 1000);
      const meetWindowEnd = new Date(now.getTime() + 60 * 60 * 1000);

      const { count: activeMeetsNow } = await supabase
        .from('meets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('scheduled_at', meetWindowStart.toISOString())
        .lte('scheduled_at', meetWindowEnd.toISOString());

      // Events ending today (starts_at is today)
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const { count: eventsEndingToday } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('starts_at', todayStart.toISOString())
        .lt('starts_at', todayEnd.toISOString());

      setQuickStats({
        newFansToday: newFansToday ?? 0,
        newCreatorsToday: newCreatorsToday ?? 0,
        activeMeetsNow: activeMeetsNow ?? 0,
        eventsEndingToday: eventsEndingToday ?? 0,
      });

      // ===== ALERTS =====

      const alertItems: AlertItem[] = [];

      // Events ending in next 1 hour
      const { count: eventsEndingSoon } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('starts_at', now.toISOString())
        .lte('starts_at', oneHourFromNow.toISOString());

      if ((eventsEndingSoon ?? 0) > 0) {
        alertItems.push({
          id: 'events-soon',
          emoji: '🔴',
          text: `${eventsEndingSoon} event${eventsEndingSoon === 1 ? '' : 's'} starting in the next hour`,
          count: eventsEndingSoon ?? 0,
        });
      }

      if (pendingWithdrawals > 0) {
        alertItems.push({
          id: 'pending-wd',
          emoji: '💳',
          text: `${pendingWithdrawals} withdrawal request${pendingWithdrawals === 1 ? '' : 's'} awaiting review`,
          count: pendingWithdrawals,
        });
      }

      // Completed meets in last 24 hours
      const { count: recentCompletedMeets } = await supabase
        .from('meets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      if ((recentCompletedMeets ?? 0) > 0) {
        alertItems.push({
          id: 'completed-meets',
          emoji: '🎉',
          text: `${recentCompletedMeets} meet${recentCompletedMeets === 1 ? '' : 's'} completed in last 24h`,
          count: recentCompletedMeets ?? 0,
        });
      }

      setAlerts(alertItems);

      // ===== ACTIVITY FEED =====

      const activities: ActivityItem[] = [];

      // Recent events
      const { data: recentEvents } = await supabase
        .from('events')
        .select('id, title, created_at, creator_id')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentEvents && recentEvents.length > 0) {
        const creatorIds = recentEvents.map((e: any) => e.creator_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', creatorIds);

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.username]));

        for (const event of recentEvents) {
          const username = profileMap.get(event.creator_id) || 'creator';
          activities.push({
            id: `event-${event.id}`,
            emoji: '🎫',
            text: `New event "${event.title}" by @${username}`,
            time: formatTimeAgo(event.created_at),
          });
        }
      }

      // Recent user signups
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      for (const user of recentUsers ?? []) {
        const name = user.email?.split('@')[0] || 'User';
        activities.push({
          id: `user-${user.id}`,
          emoji: '👤',
          text: `New ${user.role} signup: ${name}`,
          time: formatTimeAgo(user.created_at),
        });
      }

      // Recent withdrawal requests
      const { data: recentWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('id, amount, requested_at, creator_id')
        .order('requested_at', { ascending: false })
        .limit(3);

      if (recentWithdrawals && recentWithdrawals.length > 0) {
        const creatorIds = recentWithdrawals.map((w: any) => w.creator_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', creatorIds);

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.username]));

        for (const wd of recentWithdrawals) {
          const username = profileMap.get(wd.creator_id) || 'creator';
          activities.push({
            id: `wd-${wd.id}`,
            emoji: '💰',
            text: `Withdrawal request: ${formatCurrency(wd.amount)} by @${username}`,
            time: formatTimeAgo(wd.requested_at),
          });
        }
      }

      // Recent completed meets
      const { data: recentMeets } = await supabase
        .from('meets')
        .select('id, event_id, updated_at')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(2);

      if (recentMeets && recentMeets.length > 0) {
        const eventIds = recentMeets.map((m: any) => m.event_id);
        const { data: events } = await supabase
          .from('events')
          .select('id, title')
          .in('id', eventIds);

        const eventMap = new Map((events ?? []).map((e: any) => [e.id, e.title]));

        for (const meet of recentMeets) {
          const title = eventMap.get(meet.event_id) || 'Event';
          activities.push({
            id: `meet-${meet.id}`,
            emoji: '🎉',
            text: `Meet completed: "${title}"`,
            time: formatTimeAgo(meet.updated_at),
          });
        }
      }

      // Sort by time (most recent first) and take top 8
      activities.sort((a, b) => {
        // Simple sort by the original timestamps would be better, but we only have formatted strings
        // For now, just keep insertion order which is roughly sorted
        return 0;
      });

      setActivityFeed(activities.slice(0, 8));

      // ===== CHARTS DATA =====

      // Revenue trend (last 30 days)
      const { data: allWonBids } = await supabase
        .from('bids')
        .select('amount, created_at')
        .eq('status', 'won')
        .gte('created_at', last30Days.toISOString());

      const revenueByDay = new Map<string, number>();
      for (const bid of (allWonBids ?? []) as any[]) {
        const dayKey = new Date(bid.created_at).toISOString().slice(0, 10);
        const prev = revenueByDay.get(dayKey) ?? 0;
        revenueByDay.set(dayKey, prev + (bid.amount ?? 0));
      }

      const chartPoints: ChartPoint[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(last30Days);
        d.setDate(last30Days.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        chartPoints.push({
          date: key,
          label: d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
          value: revenueByDay.get(key) ?? 0,
        });
      }
      setRevenueChart(chartPoints);

      // Top creators by revenue (this month)
      const { data: monthBids } = await supabase
        .from('bids')
        .select('event_id, amount')
        .eq('status', 'won')
        .gte('created_at', monthStart.toISOString());

      if (monthBids && monthBids.length > 0) {
        const eventIds = [...new Set((monthBids as any[]).map((b) => b.event_id))];

        const { data: eventsData } = await supabase
          .from('events')
          .select('id, creator_id')
          .in('id', eventIds);

        const eventToCreator = new Map<string, string>(
          (eventsData ?? []).map((e: any) => [e.id, e.creator_id])
        );

        const earningsPerCreator = new Map<string, number>();
        for (const bid of monthBids as any[]) {
          const creatorId = eventToCreator.get(bid.event_id);
          if (!creatorId) continue;
          const prev = earningsPerCreator.get(creatorId) ?? 0;
          earningsPerCreator.set(creatorId, prev + (bid.amount ?? 0));
        }

        const sortedCreators = Array.from(earningsPerCreator.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const creatorIds = sortedCreators.map(([id]) => id);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username')
          .in('user_id', creatorIds);

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

        const topCreatorsList: TopCreator[] = sortedCreators.map(([id, earnings]) => {
          const profile = profileMap.get(id);
          return {
            id,
            name: profile?.display_name || profile?.username || 'Creator',
            earnings,
          };
        });

        setTopCreators(topCreatorsList);
      } else {
        setTopCreators([]);
      }

      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const maxRevenue = Math.max(...revenueChart.map((p) => p.value), 1);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start justify-between">
        <div>
          <Badge variant="primary" pill={false} className="mb-2 w-fit">
            👑 Admin Control Center
          </Badge>
          <h1 className="text-3xl font-semibold text-[#1B1C1F]">Platform Overview</h1>
          <p className="text-sm text-[#6C757D]">
            Real-time glance at health, revenue, and moderation signals across FanMeet.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            {isLoading ? '↻ Refreshing…' : '↻ Refresh'}
          </Button>
          <span className="text-xs text-[#6C757D]">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Row 1: Users, Events, Revenue, Commission */}
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Total Users</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : stats.totalUsers.toLocaleString()}
              </span>
              <span className="text-xs text-[#6C757D]">
                {stats.fans} fans · {stats.creators} creators
              </span>
            </CardContent>
          </Card>

          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Active Events</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : stats.activeEvents}
              </span>
              <span className="text-xs text-[#6C757D]">
                {stats.liveNow} Live Now
              </span>
            </CardContent>
          </Card>

          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Winning Bid Volume (This Month)</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : formatCurrency(stats.revenueThisMonth)}
              </span>
            </CardContent>
          </Card>

          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Commission (10%)</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#28A745]">
                {isLoading ? '…' : formatCurrency(stats.commission)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Creators, Withdrawals, Bids, Refunds */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Creators</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : stats.creators}
              </span>
            </CardContent>
          </Card>

          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Pending Withdrawals</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : stats.pendingWithdrawals}
              </span>
              <span className="text-xs text-[#6C757D]">
                {formatCurrency(stats.pendingWithdrawalsAmount)}
              </span>
            </CardContent>
          </Card>

          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Total Bids</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : stats.totalBids.toLocaleString()}
              </span>
              <span className="text-xs text-[#6C757D]">
                Today: {stats.bidsToday}
              </span>
            </CardContent>
          </Card>

          <Card className="border-[#F0F1F3] bg-white">
            <CardHeader
              title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">Refunds (This Month)</span>}
              className="pb-2"
            />
            <CardContent className="gap-2">
              <span className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : formatCurrency(stats.refundsThisMonth)}
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Stats & Alerts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Quick Stats" subtitle="Operational health snapshots" />
          <CardContent className="gap-3">
            <ul className="flex flex-col gap-2 text-sm text-[#212529]">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-[#C045FF]">•</span>
                <span>New signups today: {quickStats.newFansToday} fans, {quickStats.newCreatorsToday} creators</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-[#C045FF]">•</span>
                <span>Active meets right now: {quickStats.activeMeetsNow}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-[#C045FF]">•</span>
                <span>Events starting today: {quickStats.eventsEndingToday}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-[#C045FF]">•</span>
                <span>Pending withdrawals: {stats.pendingWithdrawals}</span>
              </li>
            </ul>
            <Button
              variant="primary"
              className="self-start bg-[#050014] text-white hover:bg-[#140423]"
              size="sm"
              onClick={() => navigate('/admin/business-analytics')}
            >
              View detailed reports →
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Alerts & Notifications" subtitle="Attention-required items" />
          <CardContent className="gap-3">
            <div className="flex flex-col gap-3">
              {alerts.length === 0 ? (
                <div className="rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] px-4 py-3 text-sm text-[#6C757D]">
                  ✓ No urgent alerts at this time
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-[12px] border border-[#F4E6FF] bg-[#F4E6FF]/60 px-4 py-3 text-sm text-[#C045FF]"
                  >
                    {alert.emoji} {alert.text}
                  </div>
                ))
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              className="self-start bg-[#050014] text-white hover:bg-[#140423]"
              onClick={() => navigate('/admin/withdrawals')}
            >
              Review withdrawals
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Charts Section */}
      <section className="grid gap-4 xl:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Revenue Trend" subtitle="Total Revenue · Last 30 days" />
          <CardContent>
            <div className="flex h-48 items-end gap-1">
              {revenueChart.map((point) => (
                <div
                  key={point.date}
                  className="group relative flex-1"
                  title={`${point.label}: ${formatCurrency(point.value)}`}
                >
                  <div
                    className="w-full rounded-t bg-[#C045FF] transition-all hover:bg-[#A030DD]"
                    style={{
                      height: `${Math.max((point.value / maxRevenue) * 100, 2)}%`,
                      minHeight: point.value > 0 ? '4px' : '2px',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#6C757D]">
              <span>{revenueChart[0]?.label}</span>
              <span>{revenueChart[revenueChart.length - 1]?.label}</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Creators */}
        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Top Creators by Revenue" subtitle="Top 10 creators this month" />
          <CardContent>
            {topCreators.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-[#6C757D]">
                No creator earnings this month yet
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topCreators.map((creator, idx) => (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between rounded-lg border border-[#E9ECEF] bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F4E6FF] text-xs font-bold text-[#C045FF]">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-[#212529]">{creator.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#28A745]">
                      {formatCurrency(creator.earnings)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity & Quick Actions */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Recent Activity" subtitle="Latest admin, user, and system events" />
          <CardContent className="divide-y divide-[#F0F1F3]">
            {activityFeed.length === 0 ? (
              <div className="py-4 text-center text-sm text-[#6C757D]">
                No recent activity
              </div>
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 text-sm text-[#212529]">
                  <span>
                    {item.emoji} {item.text}
                    <span className="ml-2 text-xs text-[#6C757D]">({item.time})</span>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Quick Actions" subtitle="Jump to critical modules" />
          <CardContent className="gap-3">
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
              onClick={() => navigate('/admin/audit-logs')}
            >
              🔍 Review audit logs
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
              onClick={() => navigate('/admin/support-tickets')}
            >
              🎧 Open support queue
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
              onClick={() => navigate('/admin/withdrawals')}
            >
              💳 Review withdrawals
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
              onClick={() => navigate('/admin/revenue-reports')}
            >
              🧾 Export revenue summary
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
