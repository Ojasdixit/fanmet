import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

type ReportType = 'revenue' | 'events' | 'creators' | 'withdrawals' | 'bids';
type Period = '7days' | '30days' | 'month' | 'all';

interface ReportSummary {
  totalRevenue: number;
  totalCommission: number;
  totalRefunds: number;
  eventsCount: number;
  bidsCount: number;
  creatorsCount: number;
  withdrawalsCount: number;
}

export function AdminRevenueReports() {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [period, setPeriod] = useState<Period>('month');
  const [summary, setSummary] = useState<ReportSummary>({
    totalRevenue: 0,
    totalCommission: 0,
    totalRefunds: 0,
    eventsCount: 0,
    bidsCount: 0,
    creatorsCount: 0,
    withdrawalsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = (p: Period): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch (p) {
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
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const { start, end } = getDateRange(period);

        // Fetch bids
        const { data: bidsData } = await supabase
          .from('bids')
          .select('amount, status, created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        const wonBids = (bidsData ?? []).filter((b: any) => b.status === 'won');
        const lostBids = (bidsData ?? []).filter((b: any) => b.status === 'lost');

        // Total bid volume from finalized bids (won + lost)
        const totalBidVolume = [...wonBids, ...lostBids].reduce(
          (sum: number, b: any) => sum + (b.amount ?? 0),
          0,
        );

        // Platform revenue is 10% commission on all finalized bids
        const totalCommission = Math.floor(totalBidVolume * 0.1);

        // For reporting, treat "Total Revenue" as the commission the platform actually keeps
        const totalRevenue = totalCommission;

        // 90% back to non-winners is tracked separately as refunds (pass-through)
        const totalRefunds = lostBids.reduce(
          (sum: number, b: any) => sum + Math.floor((b.amount ?? 0) * 0.9),
          0,
        );

        // Fetch events
        const { data: eventsData } = await supabase
          .from('events')
          .select('id')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        // Fetch unique creators
        const { data: creatorsData } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'creator');

        // Fetch withdrawals
        const { data: withdrawalsData } = await supabase
          .from('withdrawal_requests')
          .select('id')
          .gte('requested_at', start.toISOString())
          .lte('requested_at', end.toISOString());

        setSummary({
          totalRevenue,
          totalCommission,
          totalRefunds,
          eventsCount: eventsData?.length ?? 0,
          bidsCount: bidsData?.length ?? 0,
          creatorsCount: creatorsData?.length ?? 0,
          withdrawalsCount: withdrawalsData?.length ?? 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSummary();
  }, [period]);

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const { start, end } = getDateRange(period);
      let csvContent = '';
      let filename = '';

      if (reportType === 'revenue' || reportType === 'bids') {
        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, event_id, fan_id, amount, status, created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false });

        csvContent = 'ID,Event ID,Fan ID,Amount,Status,Date\n';
        for (const b of (bidsData ?? []) as any[]) {
          csvContent += `${b.id},${b.event_id},${b.fan_id},${b.amount},${b.status},"${formatDateTime(b.created_at)}"\n`;
        }
        filename = `bids_report_${period}.csv`;
      } else if (reportType === 'events') {
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, creator_id, title, status, base_price, starts_at, created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false });

        csvContent = 'ID,Creator ID,Title,Status,Base Price,Starts At,Created At\n';
        for (const e of (eventsData ?? []) as any[]) {
          csvContent += `${e.id},${e.creator_id},"${e.title}",${e.status},${e.base_price},"${formatDateTime(e.starts_at)}","${formatDateTime(e.created_at)}"\n`;
        }
        filename = `events_report_${period}.csv`;
      } else if (reportType === 'creators') {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, category, created_at');

        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .eq('role', 'creator');

        const emailMap = new Map<string, string>();
        for (const u of (usersData ?? []) as any[]) {
          emailMap.set(u.id, u.email);
        }

        csvContent = 'User ID,Display Name,Username,Email,Category,Created At\n';
        for (const p of (profilesData ?? []) as any[]) {
          const email = emailMap.get(p.user_id) ?? '';
          if (email) {
            csvContent += `${p.user_id},"${p.display_name ?? ''}",${p.username ?? ''},${email},${p.category ?? ''},"${formatDateTime(p.created_at)}"\n`;
          }
        }
        filename = `creators_report.csv`;
      } else if (reportType === 'withdrawals') {
        const { data: withdrawalsData } = await supabase
          .from('withdrawal_requests')
          .select('id, creator_id, amount, destination, status, requested_at, processed_at')
          .gte('requested_at', start.toISOString())
          .lte('requested_at', end.toISOString())
          .order('requested_at', { ascending: false });

        csvContent = 'ID,Creator ID,Amount,Destination,Status,Requested At,Processed At\n';
        for (const w of (withdrawalsData ?? []) as any[]) {
          csvContent += `${w.id},${w.creator_id},${w.amount},"${w.destination ?? ''}",${w.status},"${formatDateTime(w.requested_at)}","${w.processed_at ? formatDateTime(w.processed_at) : ''}"\n`;
        }
        filename = `withdrawals_report_${period}.csv`;
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Report exported: ${filename}`);
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes: { key: ReportType; label: string; icon: string }[] = [
    { key: 'revenue', label: 'Revenue Summary', icon: '💰' },
    { key: 'bids', label: 'Bids Report', icon: '🎯' },
    { key: 'events', label: 'Events Report', icon: '📅' },
    { key: 'creators', label: 'Creators Report', icon: '🎨' },
    { key: 'withdrawals', label: 'Withdrawals Report', icon: '💸' },
  ];

  const periodLabels: Record<Period, string> = {
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    month: 'This Month',
    all: 'All Time',
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Revenue Reports</h1>
          <p className="text-sm text-[#6C757D]">Generate and export financial reports from your platform data.</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Quick Stats" subtitle={`Overview for ${periodLabels[period]}`} />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Revenue</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Platform Commission</p>
            <p className="mt-2 text-xl font-semibold text-[#28A745]">{formatCurrency(summary.totalCommission)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Refunds</p>
            <p className="mt-2 text-xl font-semibold text-[#DC3545]">{formatCurrency(summary.totalRefunds)}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Totals</p>
            <p className="mt-2 text-sm text-[#212529]">
              {summary.eventsCount} events · {summary.bidsCount} bids · {summary.creatorsCount} creators
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Generate Report" subtitle="Select report type and date range to export." />
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#212529]">Report Type</p>
            <div className="flex flex-wrap gap-2">
              {reportTypes.map((rt) => (
                <Button
                  key={rt.key}
                  size="sm"
                  variant={reportType === rt.key ? 'secondary' : 'ghost'}
                  onClick={() => setReportType(rt.key)}
                >
                  {rt.icon} {rt.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#212529]">Date Range</p>
            <div className="flex flex-wrap gap-2">
              {(['7days', '30days', 'month', 'all'] as Period[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? 'secondary' : 'ghost'}
                  onClick={() => setPeriod(p)}
                >
                  {periodLabels[p]}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Report Configuration</p>
            <ul className="mt-3 space-y-2 text-sm text-[#6C757D]">
              <li className="flex items-center justify-between">
                <span>Report Type</span>
                <span className="font-medium text-[#212529]">
                  {reportTypes.find((rt) => rt.key === reportType)?.label}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Date Range</span>
                <span className="font-medium text-[#212529]">{periodLabels[period]}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Format</span>
                <span className="font-medium text-[#212529]">CSV</span>
              </li>
            </ul>
          </div>

          <Button onClick={exportToCSV} disabled={isExporting || isLoading}>
            {isExporting ? '⏳ Generating...' : '📥 Export CSV Report'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Available Reports" subtitle="Quick export options for common reports." />
        <CardContent className="space-y-3">
          {reportTypes.map((rt) => (
            <div
              key={rt.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3"
            >
              <div>
                <div className="font-medium text-[#212529]">{rt.icon} {rt.label}</div>
                <div className="text-xs text-[#6C757D]">
                  Export {rt.key === 'creators' ? 'all creators' : `${periodLabels[period].toLowerCase()}`} data
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReportType(rt.key);
                  void exportToCSV();
                }}
                disabled={isExporting}
              >
                Export
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
