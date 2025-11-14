import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';

const eventKPIs = [
  { label: 'Events Live Now', value: '5', helper: 'Avg participants: 42' },
  { label: 'Events Today', value: '28', helper: '18 paid · 10 free' },
  { label: 'Completion Rate', value: '95%', helper: '+2% vs last week' },
  { label: 'Avg Bid Spread', value: '₹420', helper: 'Top bid vs reserve' },
];

const eventChannels = [
  { channel: 'Homepage Spotlight', sessions: 342, conversions: '28%', value: '₹68,500' },
  { channel: 'Email Campaigns', sessions: 210, conversions: '18%', value: '₹32,100' },
  { channel: 'Push Notifications', sessions: 190, conversions: '22%', value: '₹28,450' },
  { channel: 'Organic Search', sessions: 156, conversions: '12%', value: '₹15,600' },
];

const engagementTimeline = ['7AM', '9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM'];

const dropOffReasons = [
  'Bid too expensive',
  'Schedule conflict',
  'Technical issue',
  'Creator switched event',
  'Other',
];

export function AdminEventAnalytics() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Event Analytics</h1>
          <p className="text-sm text-[#6C757D]">Deep dive into performance across paid and free events.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export Chart</Button>
          <Button>Create Comparison</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Key Metrics" subtitle="Real-time snapshot" />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {eventKPIs.map((kpi) => (
            <div key={kpi.label} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">{kpi.label}</p>
              <p className="mt-2 text-lg font-semibold text-[#212529]">{kpi.value}</p>
              <p className="text-xs text-[#6C757D]">{kpi.helper}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Peak Engagement" subtitle="When bids surge during the day" />
        <CardContent>
          <div className="flex h-72 items-center justify-center rounded-[16px] border border-dashed border-[#CED4DA] bg-[#F8F9FA] text-sm text-[#6C757D]">
            Area chart placeholder (concurrent sessions vs bids)
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6C757D]">
            {engagementTimeline.map((slot) => (
              <Badge key={slot} variant="primary">
                {slot}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Acquisition Channels" subtitle="Traffic and conversion per source" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Channel</th>
                <th className="border-b border-[#E9ECEF] py-3">Sessions</th>
                <th className="border-b border-[#E9ECEF] py-3">Conversion</th>
                <th className="border-b border-[#E9ECEF] py-3">Event Revenue</th>
              </tr>
            </thead>
            <tbody>
              {eventChannels.map((row) => (
                <tr key={row.channel} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{row.channel}</td>
                  <td className="py-3 text-[#6C757D]">{row.sessions}</td>
                  <td className="py-3 text-[#6C757D]">{row.conversions}</td>
                  <td className="py-3 text-[#212529]">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Drop-off Insights" subtitle="Survey reasons for abandonment" />
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <h2 className="text-sm font-semibold">Top Reasons</h2>
            <ul className="mt-3 space-y-2 text-[#6C757D]">
              {dropOffReasons.map((reason) => (
                <li key={reason} className="flex items-center justify-between">
                  <span>{reason}</span>
                  <Badge variant="warning">{(Math.random() * 30 + 10).toFixed(0)}%</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <h2 className="text-sm font-semibold">Capture Feedback</h2>
            <TextInput label="Event ID" placeholder="#342" />
            <TextInput label="User" placeholder="Email or phone" />
            <TextInput label="Issue" placeholder="Pricing / Scheduling / Experience" />
            <Button variant="secondary">Log Insight</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
