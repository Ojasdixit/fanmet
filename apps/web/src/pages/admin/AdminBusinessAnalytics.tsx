import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';

const kpis = [
  { label: 'Monthly Growth Rate', value: '23% ↑', variant: 'success' },
  { label: 'Active Rate (DAU/MAU)', value: '45%', variant: 'primary' },
  { label: 'Conversion Rate', value: '12%', variant: 'warning' },
  { label: 'Retention Rate', value: '68%', variant: 'success' },
  { label: 'Avg Bid Amount', value: '₹320' },
  { label: 'Win Rate', value: '22%' },
  { label: 'Event Completion', value: '95%' },
  { label: 'ARPU', value: '₹366' },
];

const funnel = [
  { stage: 'Total Users', value: '1,247', percentage: '100%' },
  { stage: 'Viewed Events', value: '890', percentage: '71.4%' },
  { stage: 'Started Bid', value: '634', percentage: '50.8%' },
  { stage: 'Completed Bid', value: '512', percentage: '41.1%' },
  { stage: 'Won Event', value: '156', percentage: '12.5%' },
  { stage: 'Completed Meet', value: '142', percentage: '11.4%' },
];

const cohorts = [
  { month: 'Jan 2025', week1: '78%', week2: '65%', week3: '58%', week4: '52%' },
  { month: 'Dec 2024', week1: '75%', week2: '62%', week3: '54%', week4: '48%' },
  { month: 'Nov 2024', week1: '72%', week2: '60%', week3: '52%', week4: '45%' },
  { month: 'Oct 2024', week1: '70%', week2: '58%', week3: '50%', week4: '42%' },
];

const eventPerformance = [
  {
    label: 'Paid Events (₹50 Base)',
    metrics: ['Total Created: 90', 'Avg Participants: 18', 'Avg Final Bid: ₹280', 'Completion: 96%', 'Avg Creator Revenue: ₹252'],
  },
  {
    label: 'Paid Events (₹100 Base)',
    metrics: ['Total Created: 66', 'Avg Participants: 23', 'Avg Final Bid: ₹520', 'Completion: 94%', 'Avg Creator Revenue: ₹468'],
  },
  {
    label: 'Free Events',
    metrics: ['Total Created: 44', 'Avg Participants: 156', 'Completion: 92%', 'Engagement: 3.2x paid events'],
  },
];

const geoBreakdown = [
  { region: 'Maharashtra', users: 312, revenue: '₹1,24,560', share: '27.5%' },
  { region: 'Delhi NCR', users: 234, revenue: '₹98,340', share: '21.7%' },
  { region: 'Karnataka', users: 189, revenue: '₹76,230', share: '16.8%' },
  { region: 'Tamil Nadu', users: 156, revenue: '₹62,450', share: '13.8%' },
  { region: 'Gujarat', users: 123, revenue: '₹45,230', share: '10.0%' },
];

export function AdminBusinessAnalytics() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Business Analytics</h1>
          <p className="text-sm text-[#6C757D]">
            High-level KPIs, funnel health, cohorts, and engagement by geography.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export Dashboard</Button>
          <Button>Share Snapshot</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Key Performance Indicators" subtitle="Trending metrics for the current month." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">{kpi.label}</p>
              <p className="mt-2 text-lg font-semibold text-[#212529]">{kpi.value}</p>
              {kpi.variant ? <Badge variant={kpi.variant as 'success' | 'primary' | 'warning'}>vs last month</Badge> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Conversion Funnel" subtitle="Where users fall off in the journey." />
        <CardContent className="space-y-3">
          {funnel.map((step) => (
            <div key={step.stage} className="flex items-center justify-between rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-[#212529]">
              <span>{step.stage}</span>
              <span className="text-[#6C757D]">{step.percentage}</span>
              <span className="font-semibold">{step.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Cohort Retention" subtitle="Week-over-week retention by signup month." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Month</th>
                <th className="border-b border-[#E9ECEF] py-3">Week 1</th>
                <th className="border-b border-[#E9ECEF] py-3">Week 2</th>
                <th className="border-b border-[#E9ECEF] py-3">Week 3</th>
                <th className="border-b border-[#E9ECEF] py-3">Week 4</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.month} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{cohort.month}</td>
                  <td className="py-3 text-[#6C757D]">{cohort.week1}</td>
                  <td className="py-3 text-[#6C757D]">{cohort.week2}</td>
                  <td className="py-3 text-[#6C757D]">{cohort.week3}</td>
                  <td className="py-3 text-[#6C757D]">{cohort.week4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Event Performance" subtitle="Compare paid vs free categories." />
        <CardContent className="grid gap-4 md:grid-cols-3">
          {eventPerformance.map((block) => (
            <div key={block.label} className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
              <h2 className="font-semibold">{block.label}</h2>
              <ul className="mt-3 space-y-2 text-[#6C757D]">
                {block.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Geographic Distribution" subtitle="Regional user base and revenue." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="overflow-x-auto rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <table className="min-w-full table-auto border-collapse">
              <thead className="text-[#6C757D]">
                <tr>
                  <th className="border-b border-[#E9ECEF] py-3 text-left">Region</th>
                  <th className="border-b border-[#E9ECEF] py-3 text-left">Users</th>
                  <th className="border-b border-[#E9ECEF] py-3 text-left">Revenue</th>
                  <th className="border-b border-[#E9ECEF] py-3 text-left">Share</th>
                </tr>
              </thead>
              <tbody>
                {geoBreakdown.map((row) => (
                  <tr key={row.region} className="border-b border-[#E9ECEF]">
                    <td className="py-3">{row.region}</td>
                    <td className="py-3 text-[#6C757D]">{row.users}</td>
                    <td className="py-3 text-[#212529]">{row.revenue}</td>
                    <td className="py-3 text-[#6C757D]">{row.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-[#CED4DA] bg-[#F8F9FA] text-sm text-[#6C757D]">
            Heatmap placeholder (India regions)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
