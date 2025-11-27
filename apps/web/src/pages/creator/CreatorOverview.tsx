import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import { supabase } from '../../lib/supabaseClient';

interface TopCreator {
  id: string;
  displayName: string;
  handle: string;
  category: string;
  earnings: number;
  initials: string;
}

interface ActivityItem {
  id: string;
  description: string;
  time: string;
}

function formatTimeAgo(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - value.getTime();
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function CreatorOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events } = useEvents();

  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [isLoadingTopCreators, setIsLoadingTopCreators] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [completedMeets, setCompletedMeets] = useState(0);
  const [earningsChange, setEarningsChange] = useState<string | undefined>(undefined);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  useEffect(() => {
    const fetchTopCreators = async () => {
      setIsLoadingTopCreators(true);

      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('event_id, amount, status, created_at')
          .eq('status', 'won')
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', nextMonthStart.toISOString());

        if (bidsError || !bidsData || bidsData.length === 0) {
          setTopCreators([]);
          return;
        }

        const eventIds = Array.from(new Set((bidsData as any[]).map((b) => b.event_id)));

        if (eventIds.length === 0) {
          setTopCreators([]);
          return;
        }

        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, creator_id')
          .in('id', eventIds);

        if (eventsError || !eventsData || eventsData.length === 0) {
          setTopCreators([]);
          return;
        }

        const eventToCreator = new Map<string, string>(
          (eventsData as any[]).map((e) => [e.id, e.creator_id]),
        );

        const earningsPerCreator = new Map<string, number>();

        for (const bid of bidsData as any[]) {
          const creatorId = eventToCreator.get(bid.event_id);
          if (!creatorId) continue;
          const previous = earningsPerCreator.get(creatorId) ?? 0;
          earningsPerCreator.set(creatorId, previous + (bid.amount ?? 0));
        }

        if (earningsPerCreator.size === 0) {
          setTopCreators([]);
          return;
        }

        const sortedCreators = Array.from(earningsPerCreator.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        const creatorIds = sortedCreators.map(([creatorId]) => creatorId);

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, category')
          .in('user_id', creatorIds);

        const profileMap = new Map<string, any>(
          (profilesData ?? []).map((p: any) => [p.user_id, p]),
        );

        const top: TopCreator[] = sortedCreators.map(([creatorId, earnings]) => {
          const profile = profileMap.get(creatorId);
          const displayName =
            profile?.display_name || profile?.username || 'Creator';
          const handle = profile?.username ? `@${profile.username}` : '@creator';
          const category = profile?.category || 'general';

          return {
            id: creatorId,
            displayName,
            handle,
            category,
            earnings,
            initials: getInitials(displayName),
          };
        });

        setTopCreators(top);
      } finally {
        setIsLoadingTopCreators(false);
      }
    };

    void fetchTopCreators();
  }, []);

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!user) {
        setTotalEarnings(0);
        setPendingBalance(0);
        setCompletedMeets(0);
        setActivityItems([]);
        setEarningsChange(undefined);
        return;
      }

      setIsLoadingOverview(true);

      try {
        let totalEarningsValue = 0;
        let pendingBalanceValue = 0;
        let earningsChangeValue: string | undefined;

        const { count: meetsCount } = await supabase
          .from('meets')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', user.id)
          .eq('status', 'completed');

        setCompletedMeets(typeof meetsCount === 'number' ? meetsCount : 0);

        const { data: creatorEvents } = await supabase
          .from('events')
          .select('id, title')
          .eq('creator_id', user.id);

        const eventMap = new Map<string, string>(
          (creatorEvents ?? []).map((e: any) => [e.id, e.title]),
        );
        const eventIds = Array.from(eventMap.keys());

        const activitySource: { id: string; description: string; createdAt: string }[] = [];

        if (eventIds.length > 0) {
          const { data: bidsData } = await supabase
            .from('bids')
            .select('id, event_id, amount, status, created_at')
            .in('event_id', eventIds)
            .order('created_at', { ascending: false });

          const earningsBids = (bidsData ?? []).filter(
            (bid: any) => bid.status === 'won',
          );

          if (earningsBids.length > 0) {
            const now = new Date();

            totalEarningsValue = earningsBids.reduce(
              (sum: number, bid: any) => sum + (bid.amount ?? 0),
              0,
            );

            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const previousMonthStart = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              1,
            );

            const currentMonthTotal = earningsBids
              .filter((bid: any) => {
                const created = new Date(bid.created_at);
                return created >= currentMonthStart;
              })
              .reduce((sum: number, bid: any) => sum + (bid.amount ?? 0), 0);

            const previousMonthTotal = earningsBids
              .filter((bid: any) => {
                const created = new Date(bid.created_at);
                return created >= previousMonthStart && created < currentMonthStart;
              })
              .reduce((sum: number, bid: any) => sum + (bid.amount ?? 0), 0);

            if (previousMonthTotal > 0) {
              const changePercent =
                ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
              const rounded = Math.round(changePercent);
              earningsChangeValue = `${rounded >= 0 ? '+' : ''}${rounded}% vs last month`;
            } else if (currentMonthTotal > 0) {
              earningsChangeValue = 'New this month';
            } else {
              earningsChangeValue = undefined;
            }
          }

          (bidsData ?? []).forEach((bid: any) => {
            const title = eventMap.get(bid.event_id) ?? 'Event';
            activitySource.push({
              id: `bid-${bid.id}`,
              description: `New bid of ${formatCurrency(bid.amount)} on “${title}”`,
              createdAt: bid.created_at,
            });
          });
        }

        const { data: withdrawalsData } = await supabase
          .from('withdrawal_requests')
          .select('id, amount, status, requested_at')
          .eq('creator_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(10);

        let withdrawnTotal = 0;

        (withdrawalsData ?? []).forEach((w: any) => {
          if (w.status === 'completed') {
            withdrawnTotal += w.amount ?? 0;
          }
          activitySource.push({
            id: `wd-${w.id}`,
            description: `Withdrawal request of ${formatCurrency(w.amount)} (${w.status})`,
            createdAt: w.requested_at,
          });
        });

        pendingBalanceValue = Math.max(totalEarningsValue - withdrawnTotal, 0);

        setTotalEarnings(totalEarningsValue);
        setPendingBalance(pendingBalanceValue);
        setEarningsChange(earningsChangeValue);

        activitySource.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        const limited = activitySource.slice(0, 10).map((item) => ({
          id: item.id,
          description: item.description,
          time: formatTimeAgo(item.createdAt),
        }));

        setActivityItems(limited);
      } finally {
        setIsLoadingOverview(false);
      }
    };

    void fetchOverviewData();
  }, [user]);

  const myEvents = user ? events.filter((e) => e.creatorUsername === user.username) : [];
  const activeEventsCount = myEvents.filter((e) => e.status === 'LIVE' || e.status === 'Upcoming').length;

  const stats = [
    {
      id: 'stat-1',
      icon: '💰',
      title: 'Total Earnings',
      value: totalEarnings,
      change: earningsChange,
    },
    {
      id: 'stat-2',
      icon: '🎫',
      title: 'Active Events',
      value: activeEventsCount.toString(),
      caption: `${activeEventsCount} upcoming or live`,
    },
    {
      id: 'stat-3',
      icon: '⏳',
      title: 'Pending Balance',
      value: pendingBalance,
      action: 'Withdraw →',
    },
    {
      id: 'meets',
      icon: '🎥',
      title: 'Completed Meets',
      value: completedMeets.toString(),
      caption: 'Happy fans across sessions',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Card
        elevated
        className="overflow-hidden border-none bg-gradient-to-r from-[#FCE7FF] via-[#F4E6FF] to-[#E5DEFF] shadow-[0_24px_60px_rgba(160,64,255,0.18)]"
      >
        <div className="relative flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:px-8 md:py-8">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">
              Creator earnings
            </p>
            <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
              See how top creators earn with FanMeet.
            </h1>
            <p className="text-sm text-[#6C757D] md:text-base">
              Track your revenue, learn from other creators, and turn every 1:1 meet into predictable income.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-[#6C757D]">
                Your personal earnings, events, and activity summary are updated live from your FanMeet account.
              </span>
            </div>
          </div>
          <div className="mt-4 w-full max-w-md rounded-[20px] bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.18)] md:ml-auto md:mt-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6C757D]">
                Top creators this month
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {isLoadingTopCreators ? (
                <div className="text-xs text-[#6C757D]">Loading top creators…</div>
              ) : topCreators.length === 0 ? (
                <div className="text-xs text-[#6C757D]">No earnings data yet this month.</div>
              ) : (
                topCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between rounded-[12px] bg-[#F8F9FA] px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] text-xs font-semibold text-white">
                        {creator.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#212529]">{creator.displayName}</span>
                        <span className="text-xs text-[#6C757D]">
                          {creator.handle} • {creator.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#050014]">
                        {formatCurrency(creator.earnings)}
                      </div>
                      <div className="text-xs text-[#6C757D]">This month</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#212529]">Overview</h2>
          <p className="text-sm text-[#6C757D]">High-level snapshot of your performance.</p>
        </div>
        <Button
          variant="primary"
          className="bg-[#050014] text-white hover:bg-[#140423]"
          onClick={() => navigate('/creator/events/new')}
        >
          Create Event →
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.id} elevated>
            <CardHeader
              title={
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
              }
            />
            <CardContent className="gap-2">
              <div className="text-3xl font-bold text-[#212529]">
                {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
              </div>
              {item.change ? (
                <Badge variant="success" className="w-fit">
                  {item.change}
                </Badge>
              ) : null}
              {item.caption ? <p className="text-sm text-[#6C757D]">{item.caption}</p> : null}
              {item.action ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2 w-fit bg-[#050014] text-white hover:bg-[#140423]"
                >
                  {item.action}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Recent Activity" subtitle="Latest updates from your events and fans" />
        <CardContent className="gap-4">
          {isLoadingOverview && activityItems.length === 0 ? (
            <div className="text-sm text-[#6C757D]">Loading activity…</div>
          ) : activityItems.length === 0 ? (
            <div className="text-sm text-[#6C757D]">No recent activity yet.</div>
          ) : (
            activityItems.map((activity) => (
              <div
                key={activity.id}
                className="rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 text-sm text-[#212529]"
              >
                <div>{activity.description}</div>
                <div className="text-xs text-[#6C757D]">{activity.time}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
