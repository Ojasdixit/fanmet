import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';

const periodOptions = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom Range'];

const summaryMetrics = [
  { label: 'Gross Revenue', value: '₹4,52,300', delta: '+23%' },
  { label: 'Net Revenue', value: '₹4,07,070', delta: '+21%' },
  { label: 'Platform Commission', value: '₹45,230', delta: '+25%' },
  { label: 'Creator Payouts', value: '₹4,06,840', delta: '+22%' },
  { label: 'Avg Event Revenue', value: '₹2,262' },
  { label: 'Paid Events', value: '156 (78%)' },
  { label: 'Free Events', value: '44 (22%)' },
  { label: 'Payment Gateway Fees', value: '₹9,046' },
];

const revenueByDate = [
  { date: 'Jan 12', events: 23, bids: 156, revenue: '₹45,200', commission: '₹4,520', refunds: '₹12,340' },
  { date: 'Jan 11', events: 19, bids: 134, revenue: '₹38,900', commission: '₹3,890', refunds: '₹10,230' },
  { date: 'Jan 10', events: 25, bids: 189, revenue: '₹52,100', commission: '₹5,210', refunds: '₹14,560' },
  { date: 'Jan 9', events: 18, bids: 123, revenue: '₹34,200', commission: '₹3,420', refunds: '₹9,450' },
];

export function AdminRevenueAnalytics() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Revenue Analytics</h1>
          <p className="text-sm text-[#6C757D]">
            Monitor revenue flows, commission, and payouts with configurable time ranges.
          </p>
        </div>
        <div className="flex gap-2">
          {periodOptions.map((option) => (
            <Button key={option} size="sm" variant={option === 'This Month' ? 'secondary' : 'ghost'}>
              {option}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Summary" subtitle="Key financial metrics for the selected range." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <div key={metric.label} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-[#212529]">{metric.value}</p>
              {metric.delta ? <p className="text-xs text-[#28A745]">{metric.delta} vs prior period</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Revenue Trend" subtitle="Visualize total revenue, commission, and creator payouts." />
        <CardContent>
          <div className="flex h-72 items-center justify-center rounded-[16px] border border-dashed border-[#CED4DA] bg-[#F8F9FA] text-sm text-[#6C757D]">
            Line chart placeholder (Total vs Commission vs Payouts)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Revenue Breakdown" subtitle="Analyze by event type, duration, and top creators." />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#212529]">Revenue by Event Type</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#6C757D]">
              <li>Paid Events · ₹50 Base — 45% (₹2,03,535)</li>
              <li>Paid Events · ₹100 Base — 33% (₹1,49,259)</li>
              <li>Free Events (Ads) — 22% (₹99,506)</li>
            </ul>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#212529]">Top Revenue Creators</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#6C757D]">
              <li>Priya Sharma — ₹45,600</li>
              <li>Rohan Verma — ₹38,200</li>
              <li>Amit Gupta — ₹32,100</li>
              <li>Neha Kapoor — ₹28,900</li>
              <li>Raj Malhotra — ₹24,500</li>
            </ul>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#212529]">Revenue by Duration</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#6C757D]">
              <li>5-minute events — 58% (₹2,62,334)</li>
              <li>10-minute events — 42% (₹1,89,966)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Revenue by Date" subtitle="Export-friendly breakdown for reporting." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Events</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Revenue</th>
                <th className="border-b border-[#E9ECEF] py-3">Commission</th>
                <th className="border-b border-[#E9ECEF] py-3">Refunds</th>
              </tr>
            </thead>
            <tbody>
              {revenueByDate.map((row) => (
                <tr key={row.date} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{row.date}</td>
                  <td className="py-3 text-[#6C757D]">{row.events}</td>
                  <td className="py-3 text-[#6C757D]">{row.bids}</td>
                  <td className="py-3 text-[#212529]">{row.revenue}</td>
                  <td className="py-3 text-[#212529]">{row.commission}</td>
                  <td className="py-3 text-[#212529]">{row.refunds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Custom Report" subtitle="Generate financial exports with custom grouping." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Date Range" placeholder="Select range" />
          <TextInput label="Group By" placeholder="Daily / Weekly / Monthly" />
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2 text-sm">
              {['Revenue Summary', 'Event Breakdown', 'Top Creators', 'Transactions', 'Refunds'].map((item) => (
                <Badge key={item} variant="primary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button variant="secondary">Export CSV</Button>
            <Button>Generate PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
