import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface ActivityMetrics {
  totalUsers: number;
  totalFans: number;
  totalCreators: number;
  activeLast24h: number;
  activeLast7d: number;
  activeLast30d: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface UserSegment {
  name: string;
  count: number;
  share: string;
  description: string;
  variant: 'success' | 'primary' | 'warning' | 'danger';
}

interface ChurnData {
  inactiveUsers: number;
  inactiveRate: string;
  usersNeverBid: number;
  usersNeverWon: number;
}

interface TopFan {
  fanId: string;
  name: string;
  bidsCount: number;
  totalSpent: number;
  winsCount: number;
}

export function AdminUserAnalytics() {
  const [metrics, setMetrics] = useState<ActivityMetrics>({
    totalUsers: 0,
    totalFans: 0,
    totalCreators: 0,
    activeLast24h: 0,
    activeLast7d: 0,
    activeLast30d: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
  });
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [churnData, setChurnData] = useState<ChurnData>({
    inactiveUsers: 0,
    inactiveRate: '0%',
    usersNeverBid: 0,
    usersNeverWon: 0,
  });
  const [topFans, setTopFans] = useState<TopFan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all users
        const { data: usersData } = await supabase
          .from('users')
          .select('id, role, created_at, account_status');

        const totalUsers = usersData?.length ?? 0;
        const totalFans = (usersData ?? []).filter((u: any) => u.role === 'fan').length;
        const totalCreators = (usersData ?? []).filter((u: any) => u.role === 'creator').length;

        const newUsersToday = (usersData ?? []).filter((u: any) => new Date(u.created_at) >= today).length;
        const newUsersThisWeek = (usersData ?? []).filter((u: any) => new Date(u.created_at) >= weekAgo).length;
        const newUsersThisMonth = (usersData ?? []).filter((u: any) => new Date(u.created_at) >= monthStart).length;

        // Fetch bids to determine active users
        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, fan_id, amount, status, created_at');

        const bidsLast24h = (bidsData ?? []).filter((b: any) => new Date(b.created_at) >= today);
        const bidsLast7d = (bidsData ?? []).filter((b: any) => new Date(b.created_at) >= weekAgo);
        const bidsLast30d = (bidsData ?? []).filter((b: any) => new Date(b.created_at) >= monthAgo);

        const activeLast24h = new Set(bidsLast24h.map((b: any) => b.fan_id)).size;
        const activeLast7d = new Set(bidsLast7d.map((b: any) => b.fan_id)).size;
        const activeLast30d = new Set(bidsLast30d.map((b: any) => b.fan_id)).size;

        setMetrics({
          totalUsers,
          totalFans,
          totalCreators,
          activeLast24h,
          activeLast7d,
          activeLast30d,
          newUsersToday,
          newUsersThisWeek,
          newUsersThisMonth,
        });

        // Calculate user segments based on bidding behavior
        const bidsByUser = new Map<string, { count: number; total: number; wins: number }>();
        for (const bid of (bidsData ?? []) as any[]) {
          const current = bidsByUser.get(bid.fan_id) ?? { count: 0, total: 0, wins: 0 };
          current.count++;
          current.total += bid.amount ?? 0;
          if (bid.status === 'won') current.wins++;
          bidsByUser.set(bid.fan_id, current);
        }

        const fanIds = (usersData ?? []).filter((u: any) => u.role === 'fan').map((u: any) => u.id);
        const usersWithBids = fanIds.filter((id: string) => bidsByUser.has(id));
        const usersNeverBid = fanIds.length - usersWithBids.length;

        // Segments based on bid count
        const highValue = usersWithBids.filter((id: string) => (bidsByUser.get(id)?.count ?? 0) >= 5);
        const regular = usersWithBids.filter((id: string) => {
          const count = bidsByUser.get(id)?.count ?? 0;
          return count >= 2 && count < 5;
        });
        const occasional = usersWithBids.filter((id: string) => {
          const count = bidsByUser.get(id)?.count ?? 0;
          return count === 1;
        });

        // Users who bid but never won
        const usersNeverWon = usersWithBids.filter((id: string) => (bidsByUser.get(id)?.wins ?? 0) === 0).length;

        // Users inactive for 30+ days
        const activeFanIds = new Set(bidsLast30d.map((b: any) => b.fan_id));
        const inactiveFans = fanIds.filter((id: string) => !activeFanIds.has(id));
        const inactiveRate = fanIds.length > 0 ? (inactiveFans.length / fanIds.length) * 100 : 0;

        setSegments([
          {
            name: 'High Value Users',
            count: highValue.length,
            share: totalFans > 0 ? `${((highValue.length / totalFans) * 100).toFixed(1)}%` : '0%',
            description: `5+ bids · Avg spend ${formatCurrency(highValue.reduce((s, id) => s + (bidsByUser.get(id)?.total ?? 0), 0) / Math.max(highValue.length, 1))}`,
            variant: 'success',
          },
          {
            name: 'Regular Users',
            count: regular.length,
            share: totalFans > 0 ? `${((regular.length / totalFans) * 100).toFixed(1)}%` : '0%',
            description: `2-4 bids · Avg spend ${formatCurrency(regular.reduce((s, id) => s + (bidsByUser.get(id)?.total ?? 0), 0) / Math.max(regular.length, 1))}`,
            variant: 'primary',
          },
          {
            name: 'Occasional Users',
            count: occasional.length,
            share: totalFans > 0 ? `${((occasional.length / totalFans) * 100).toFixed(1)}%` : '0%',
            description: `1 bid · Avg spend ${formatCurrency(occasional.reduce((s, id) => s + (bidsByUser.get(id)?.total ?? 0), 0) / Math.max(occasional.length, 1))}`,
            variant: 'warning',
          },
          {
            name: 'Inactive Users',
            count: inactiveFans.length,
            share: totalFans > 0 ? `${((inactiveFans.length / totalFans) * 100).toFixed(1)}%` : '0%',
            description: 'No activity in 30+ days · at-risk',
            variant: 'danger',
          },
        ]);

        setChurnData({
          inactiveUsers: inactiveFans.length,
          inactiveRate: `${inactiveRate.toFixed(1)}%`,
          usersNeverBid,
          usersNeverWon,
        });

        // Top fans by spending
        const { data: profilesData } = await supabase.from('profiles').select('user_id, display_name, username');
        const profileMap = new Map<string, string>();
        for (const p of (profilesData ?? []) as any[]) {
          profileMap.set(p.user_id, p.display_name || p.username || 'Fan');
        }

        const topFansList: TopFan[] = Array.from(bidsByUser.entries())
          .map(([fanId, stats]) => ({
            fanId,
            name: profileMap.get(fanId) ?? 'Unknown',
            bidsCount: stats.count,
            totalSpent: stats.total,
            winsCount: stats.wins,
          }))
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5);

        setTopFans(topFansList);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const dauMauRatio = metrics.activeLast30d > 0 ? ((metrics.activeLast24h / metrics.activeLast30d) * 100).toFixed(1) : '0';
  const wauMauRatio = metrics.activeLast30d > 0 ? ((metrics.activeLast7d / metrics.activeLast30d) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">User Analytics</h1>
          <p className="text-sm text-[#6C757D]">Understand who your users are and how they behave across the platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader title="User Overview" subtitle="Total user counts by role" />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Users</p>
            <p className="mt-2 text-2xl font-semibold text-[#212529]">{metrics.totalUsers.toLocaleString()}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Fans</p>
            <p className="mt-2 text-2xl font-semibold text-[#212529]">{metrics.totalFans.toLocaleString()}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Creators</p>
            <p className="mt-2 text-2xl font-semibold text-[#212529]">{metrics.totalCreators.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Activity Metrics" subtitle="User engagement over different time periods" />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
            <p className="text-[#6C757D]">Active Last 24h (DAU)</p>
            <p className="mt-2 text-lg font-semibold">{metrics.activeLast24h.toLocaleString()}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
            <p className="text-[#6C757D]">Active Last 7 Days (WAU)</p>
            <p className="mt-2 text-lg font-semibold">{metrics.activeLast7d.toLocaleString()}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
            <p className="text-[#6C757D]">Active Last 30 Days (MAU)</p>
            <p className="mt-2 text-lg font-semibold">{metrics.activeLast30d.toLocaleString()}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
            <p className="text-[#6C757D]">DAU/MAU Ratio</p>
            <p className="mt-2 text-lg font-semibold">{dauMauRatio}%</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
            <p className="text-[#6C757D]">WAU/MAU Ratio</p>
            <p className="mt-2 text-lg font-semibold">{wauMauRatio}%</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
            <p className="text-[#6C757D]">New Users This Month</p>
            <p className="mt-2 text-lg font-semibold">{metrics.newUsersThisMonth.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="User Segments" subtitle="Behavior-based clusters" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          {segments.map((segment) => (
            <div key={segment.name} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{segment.name}</h2>
                <Badge variant={segment.variant}>{segment.count} users ({segment.share})</Badge>
              </div>
              <p className="mt-3 text-[#6C757D]">{segment.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Churn & Risk Analysis" subtitle="Keep an eye on at-risk users" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <p className="text-[#6C757D]">Inactive Rate (30+ days)</p>
            <p className="text-3xl font-semibold text-[#DC3545]">{churnData.inactiveRate}</p>
            <p className="mt-3">Inactive Users: <strong>{churnData.inactiveUsers}</strong></p>
            <p>Users Never Bid: <strong>{churnData.usersNeverBid}</strong></p>
            <p>Users Never Won: <strong>{churnData.usersNeverWon}</strong></p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <p className="text-[#6C757D]">New User Growth</p>
            <ul className="mt-3 space-y-2 text-[#6C757D]">
              <li className="flex justify-between">
                <span>Today</span>
                <Badge variant="success">+{metrics.newUsersToday}</Badge>
              </li>
              <li className="flex justify-between">
                <span>This Week</span>
                <Badge variant="primary">+{metrics.newUsersThisWeek}</Badge>
              </li>
              <li className="flex justify-between">
                <span>This Month</span>
                <Badge variant="warning">+{metrics.newUsersThisMonth}</Badge>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Top Fans by Spending" subtitle="Most engaged users" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Rank</th>
                <th className="border-b border-[#E9ECEF] py-3">Fan</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Spent</th>
                <th className="border-b border-[#E9ECEF] py-3">Wins</th>
              </tr>
            </thead>
            <tbody>
              {topFans.map((fan, idx) => (
                <tr key={fan.fanId} className="border-b border-[#E9ECEF]">
                  <td className="py-3">
                    <Badge variant={idx === 0 ? 'success' : idx === 1 ? 'primary' : 'warning'}>#{idx + 1}</Badge>
                  </td>
                  <td className="py-3 text-[#212529]">{fan.name}</td>
                  <td className="py-3 text-[#6C757D]">{fan.bidsCount}</td>
                  <td className="py-3 font-semibold text-[#212529]">{formatCurrency(fan.totalSpent)}</td>
                  <td className="py-3">
                    <Badge variant={fan.winsCount > 0 ? 'success' : 'warning'}>{fan.winsCount} wins</Badge>
                  </td>
                </tr>
              ))}
              {topFans.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No fan data available'}
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
