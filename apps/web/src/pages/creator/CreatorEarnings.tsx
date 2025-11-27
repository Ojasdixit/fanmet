import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface EarningsRow {
  id: string;
  date: string;
  event: string;
  bids: number;
  winner: string;
  earned: number;
  status: string;
}

interface ChartPoint {
  dateKey: string;
  label: string;
  total: number;
}

export function CreatorEarnings() {
  const { user } = useAuth();

  const [rows, setRows] = useState<EarningsRow[]>([]);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [thisMonthEarned, setThisMonthEarned] = useState(0);
  const [avgPerEvent, setAvgPerEvent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) {
        setRows([]);
        setChartPoints([]);
        setTotalEarned(0);
        setThisMonthEarned(0);
        setAvgPerEvent(0);
        return;
      }

      setIsLoading(true);

      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, status, starts_at')
          .eq('creator_id', user.id);

        if (eventsError || !eventsData || eventsData.length === 0) {
          setRows([]);
          setChartPoints([]);
          setTotalEarned(0);
          setThisMonthEarned(0);
          setAvgPerEvent(0);
          return;
        }

        const eventIds = (eventsData as any[]).map((e) => e.id);

        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, event_id, fan_id, amount, status, created_at')
          .in('event_id', eventIds);

        const { data: meetsData } = await supabase
          .from('meets')
          .select('event_id, status')
          .in('event_id', eventIds);

        const fanIds = Array.from(
          new Set((bidsData ?? []).map((b: any) => b.fan_id).filter(Boolean)),
        );

        let profilesData: any[] | null = null;
        if (fanIds.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('user_id, display_name, username')
            .in('user_id', fanIds);
          profilesData = data ?? [];
        }

        const profileMap = new Map<string, any>(
          (profilesData ?? []).map((p: any) => [p.user_id, p]),
        );

        const bidsByEvent = new Map<string, any[]>();
        for (const bid of (bidsData ?? []) as any[]) {
          const list = bidsByEvent.get(bid.event_id) ?? [];
          list.push(bid);
          bidsByEvent.set(bid.event_id, list);
        }

        const meetsByEvent = new Map<string, any[]>();
        for (const meet of (meetsData ?? []) as any[]) {
          const list = meetsByEvent.get(meet.event_id) ?? [];
          list.push(meet);
          meetsByEvent.set(meet.event_id, list);
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const last30Start = new Date(now);
        last30Start.setDate(now.getDate() - 29);

        let total = 0;
        let thisMonthTotal = 0;

        const chartTotals = new Map<string, number>();

        const nextRows: EarningsRow[] = [];

        for (const event of eventsData as any[]) {
          const eventBids = bidsByEvent.get(event.id) ?? [];
          const bidsCount = eventBids.length;

          const wonBids = eventBids.filter((b: any) => b.status === 'won');
          const winningBid =
            wonBids.length > 0
              ? wonBids.reduce((max: any, b: any) => (b.amount > max.amount ? b : max), wonBids[0])
              : null;

          const earned = winningBid?.amount ?? 0;

          let winnerName = '-';
          let referenceDate: Date | null = null;

          if (winningBid) {
            const profile = profileMap.get(winningBid.fan_id);
            winnerName =
              profile?.display_name || profile?.username || 'Winner';
            referenceDate = new Date(winningBid.created_at);
          } else if (event.starts_at) {
            referenceDate = new Date(event.starts_at);
          }

          if (earned > 0 && referenceDate) {
            total += earned;

            if (referenceDate >= monthStart) {
              thisMonthTotal += earned;
            }

            if (referenceDate >= last30Start) {
              const dayKey = referenceDate.toISOString().slice(0, 10);
              const prev = chartTotals.get(dayKey) ?? 0;
              chartTotals.set(dayKey, prev + earned);
            }
          }

          const eventMeets = meetsByEvent.get(event.id) ?? [];
          const hasCompletedMeet = eventMeets.some(
            (m: any) => m.status === 'completed',
          );
          const status = hasCompletedMeet ? 'Cleared' : 'Upcoming';

          const dateLabel = referenceDate
            ? referenceDate.toLocaleDateString('en-IN', {
                month: 'short',
                day: '2-digit',
              })
            : '-';

          nextRows.push({
            id: event.id,
            date: dateLabel,
            event: event.title,
            bids: bidsCount,
            winner: winnerName,
            earned,
            status,
          });
        }

        const eventsWithEarnings = nextRows.filter((r) => r.earned > 0).length;
        const avg = eventsWithEarnings > 0 ? total / eventsWithEarnings : 0;

        const points: ChartPoint[] = [];
        for (let i = 0; i < 30; i += 1) {
          const d = new Date(last30Start);
          d.setDate(last30Start.getDate() + i);
          const key = d.toISOString().slice(0, 10);
          const totalForDay = chartTotals.get(key) ?? 0;
          points.push({
            dateKey: key,
            label: d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
            total: totalForDay,
          });
        }

        nextRows.sort((a, b) => (a.date < b.date ? 1 : -1));

        setRows(nextRows);
        setChartPoints(points);
        setTotalEarned(total);
        setThisMonthEarned(thisMonthTotal);
        setAvgPerEvent(avg);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchEarnings();
  }, [user]);

  const handleExportCsv = () => {
    if (!rows.length) {
      // eslint-disable-next-line no-alert
      alert('No earnings to export yet.');
      return;
    }

    const header = ['Date', 'Event', 'Bids', 'Winner', 'Earned', 'Status'];
    const lines = [
      header.join(','),
      ...rows.map((row) => {
        const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;
        return [
          esc(row.date),
          esc(row.event),
          row.bids.toString(),
          esc(row.winner),
          row.earned.toString(),
          esc(row.status),
        ].join(',');
      }),
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'earnings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { id: 'sum-1', title: 'Total Earned', value: totalEarned },
    { id: 'sum-2', title: 'This Month', value: thisMonthEarned },
    { id: 'sum-3', title: 'Average/Event', value: avgPerEvent },
  ];

  const maxChartValue = chartPoints.reduce(
    (max, point) => (point.total > max ? point.total : max),
    0,
  );

  const statusVariantMap: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'default'> = {
    Cleared: 'success',
    Upcoming: 'primary',
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">Earnings</h1>
          <p className="text-sm text-[#6C757D]">Track revenue trends and payment history.</p>
        </div>
        <Button variant="secondary" onClick={handleExportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {summaryCards.map((item) => (
          <Card key={item.id} elevated>
            <CardHeader title={item.title} />
            <CardContent>
              <div className="text-3xl font-bold text-[#212529]">
                {isLoading ? '…' : formatCurrency(item.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Revenue (Last 30 days)"
          subtitle="Visualize how your earnings have changed over time"
        />
        <CardContent>
          <div className="flex h-64 items-end gap-1 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] px-4 py-4">
            {chartPoints.every((p) => p.total === 0) ? (
              <div className="m-auto text-sm text-[#6C757D]">
                No earnings in the last 30 days.
              </div>
            ) : (
              <div className="flex h-full w-full items-end gap-1">
                {chartPoints.map((point) => (
                  <div
                    key={point.dateKey}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-[#FF6B35]"
                        style={{
                          height:
                            maxChartValue > 0
                              ? `${Math.max(6, (point.total / maxChartValue) * 100)}%`
                              : '6px',
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-[#6C757D]">
                      {point.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Earnings Breakdown" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Event</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Winner</th>
                <th className="border-b border-[#E9ECEF] py-3">Earned</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#212529]">
              {isLoading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-sm text-[#6C757D]"
                  >
                    Loading earnings…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-sm text-[#6C757D]"
                  >
                    No earnings yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#E9ECEF]">
                    <td className="py-3">{row.date}</td>
                    <td className="py-3">{row.event}</td>
                    <td className="py-3">{row.bids}</td>
                    <td className="py-3">{row.winner}</td>
                    <td className="py-3">{formatCurrency(row.earned)}</td>
                    <td className="py-3">
                      <Badge variant={statusVariantMap[row.status] ?? 'primary'}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
