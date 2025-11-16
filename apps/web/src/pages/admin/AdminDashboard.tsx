import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const headlineStatsRowOne = [
  { id: 'total-users', title: 'Total Users', value: '1,247', delta: '+12% ↑' },
  { id: 'active-events', title: 'Active Events', value: '23', helper: '5 Live Now' },
  { id: 'revenue', title: 'Revenue (This Month)', value: formatCurrency(452300) },
  { id: 'commission', title: 'Commission (10%)', value: formatCurrency(45230) },
];

const headlineStatsRowTwo = [
  { id: 'creators', title: 'Creators', value: '89', helper: '5 Pending' },
  { id: 'withdrawals', title: 'Pending Withdrawals', value: '8', helper: formatCurrency(12340) },
  { id: 'total-bids', title: 'Total Bids', value: '1,234', helper: 'Today: 45' },
  { id: 'refunds', title: 'Refunds (This Month)', value: formatCurrency(123400) },
];

const quickStats = [
  'New signups today: 23 fans, 2 creators',
  'Active meets right now: 3',
  'Events ending today: 7',
  'Pending creator approvals: 5',
  'Unresolved support tickets: 12',
  'Failed payments needing attention: 3',
];

const chartsConfig = [
  { id: 'revenue-trend', title: 'Revenue Trend', description: 'Total Revenue vs Platform Commission · Last 30 days' },
  { id: 'user-growth', title: 'User Growth', description: 'Fans vs Creators over time' },
  { id: 'event-performance', title: 'Event Performance', description: 'Paid vs Free events · Completion rate' },
  { id: 'top-creators', title: 'Top Creators by Revenue', description: 'Top 10 creators this month' },
];

const activityFeed = [
  '🎫 New event created by @priyasharma (2 mins ago)',
  '👤 New fan signup: Rahul Kumar (5 mins ago)',
  '💰 Withdrawal request: ₹2,340 by @amit (8 mins ago)',
  '🎉 Event completed: "Meet Priya" – Winner: Raj',
  '⚠️ Payment failed: Retry needed for bid #1234',
];

const alertFeed = [
  '⚠️ 5 creator applications pending approval',
  '🔴 3 events ending in the next 1 hour',
  '💳 8 withdrawal requests awaiting review',
  '🚫 2 disputed transactions need attention',
];

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <Badge variant="primary" pill={false} className="mb-2 w-fit">
          👑 Admin Control Center
        </Badge>
        <h1 className="text-3xl font-semibold text-[#1B1C1F]">Platform Overview</h1>
        <p className="text-sm text-[#6C757D]">
          Real-time glance at health, revenue, and moderation signals across FanMeet.
        </p>
      </div>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {headlineStatsRowOne.map((stat) => (
            <Card key={stat.id} className="border-[#F0F1F3] bg-white">
              <CardHeader
                title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">{stat.title}</span>}
                className="pb-2"
              />
              <CardContent className="gap-2">
                <span className="text-3xl font-bold text-[#212529]">{stat.value}</span>
                {stat.delta ? <span className="text-sm text-[#28A745]">{stat.delta}</span> : null}
                {stat.helper ? <span className="text-xs text-[#6C757D]">{stat.helper}</span> : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {headlineStatsRowTwo.map((stat) => (
            <Card key={stat.id} className="border-[#F0F1F3] bg-white">
              <CardHeader
                title={<span className="text-sm font-medium text-[#6C757D] uppercase tracking-wide">{stat.title}</span>}
                className="pb-2"
              />
              <CardContent className="gap-2">
                <span className="text-3xl font-bold text-[#212529]">{stat.value}</span>
                {stat.helper ? <span className="text-xs text-[#6C757D]">{stat.helper}</span> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Quick Stats" subtitle="Operational health snapshots" />
          <CardContent className="gap-3">
            <ul className="flex flex-col gap-2 text-sm text-[#212529]">
              {quickStats.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 text-[#C045FF]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="primary"
              className="self-start bg-[#050014] text-white hover:bg-[#140423]"
              size="sm"
            >
              View detailed reports →
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Alerts & Notifications" subtitle="Attention-required items" />
          <CardContent className="gap-3">
            <div className="flex flex-col gap-3">
              {alertFeed.map((alert) => (
                <div
                  key={alert}
                  className="rounded-[12px] border border-[#F4E6FF] bg-[#F4E6FF]/60 px-4 py-3 text-sm text-[#C045FF]"
                >
                  {alert}
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="sm"
              className="self-start bg-[#050014] text-white hover:bg-[#140423]"
            >
              Open moderation queue
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {chartsConfig.map((chart) => (
          <Card key={chart.id} className="border-[#F0F1F3] bg-white">
            <CardHeader title={chart.title} subtitle={chart.description} />
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-[16px] border border-dashed border-[#CED4DA] bg-[#F8F9FA] text-sm text-[#6C757D]">
                Chart placeholder
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Recent Activity" subtitle="Latest admin, user, and system events" />
          <CardContent className="divide-y divide-[#F0F1F3]">
            {activityFeed.map((item) => (
              <div key={item} className="flex items-center justify-between py-3 text-sm text-[#212529]">
                <span>{item}</span>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#050014] text-white hover:bg-[#140423]"
                >
                  Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#F0F1F3] bg-white">
          <CardHeader title="Quick Actions" subtitle="Jump to critical modules" />
          <CardContent className="gap-3">
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
            >
              🔍 Review audit logs
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
            >
              🎧 Open support queue
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
            >
              💳 Monitor failed payments
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="justify-start gap-2 bg-[#050014] text-white hover:bg-[#140423]"
            >
              🧾 Export revenue summary
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
