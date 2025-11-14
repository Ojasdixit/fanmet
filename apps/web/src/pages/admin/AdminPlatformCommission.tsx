import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';

const commissionSummary = {
  total: '₹45,230',
  winners: '₹22,615 (50%)',
  nonWinners: '₹22,615 (50%)',
  eventsProcessed: 200,
  avgPerEvent: '₹226',
  projection: '₹5,42,760 / year',
};

const commissionByEventType = [
  { type: '₹50 Base', amount: '₹18,092', share: '40%' },
  { type: '₹100 Base', amount: '₹27,138', share: '60%' },
];

const commissionByCreator = [
  { creator: 'Priya Sharma', events: 47, revenue: '₹45,600', commission: '₹4,560', share: '10.1%' },
  { creator: 'Rohan Verma', events: 42, revenue: '₹38,200', commission: '₹3,820', share: '8.4%' },
  { creator: 'Amit Gupta', events: 38, revenue: '₹32,100', commission: '₹3,210', share: '7.1%' },
  { creator: 'Neha Kapoor', events: 35, revenue: '₹28,900', commission: '₹2,890', share: '6.4%' },
];

const commissionTrend = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export function AdminPlatformCommission() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Platform Commission</h1>
          <p className="text-sm text-[#6C757D]">
            Breakdown of commission collected across winners and non-winners plus projection insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export CSV</Button>
          <Button>Schedule Email Report</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Summary" subtitle="Current month overview" />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Total Commission</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{commissionSummary.total}</p>
            <p className="text-xs text-[#6C757D]">All event revenue combined</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">From Winners</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{commissionSummary.winners}</p>
            <p className="text-xs text-[#6C757D]">Cut from winning bids</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">From Non-winners</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{commissionSummary.nonWinners}</p>
            <p className="text-xs text-[#6C757D]">Retained from 90% refunds</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Events Processed</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{commissionSummary.eventsProcessed}</p>
            <p className="text-xs text-[#6C757D]">Average per event {commissionSummary.avgPerEvent}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Projection</p>
            <p className="mt-2 text-xl font-semibold text-[#212529]">{commissionSummary.projection}</p>
            <p className="text-xs text-[#6C757D]">Based on current run rate</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Commission Trend" subtitle="Compare monthly growth over the past year." />
        <CardContent>
          <div className="flex h-72 items-center justify-center rounded-[16px] border border-dashed border-[#CED4DA] bg-[#F8F9FA] text-sm text-[#6C757D]">
            Line chart placeholder (monthly commission)
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6C757D]">
            {commissionTrend.map((month) => (
              <Badge key={month} variant="primary">
                {month}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Event Type Breakdown" subtitle="How much commission comes from each pricing tier." />
        <CardContent className="space-y-3">
          {commissionByEventType.map((item) => (
            <div key={item.type} className="flex items-center justify-between rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-[#212529]">
              <span>{item.type}</span>
              <span className="text-[#6C757D]">{item.share}</span>
              <span className="font-semibold">{item.amount}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Commission by Creator" subtitle="Top contributors to platform revenue." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Events</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Revenue</th>
                <th className="border-b border-[#E9ECEF] py-3">Commission</th>
                <th className="border-b border-[#E9ECEF] py-3">Share</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissionByCreator.map((row) => (
                <tr key={row.creator} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{row.creator}</td>
                  <td className="py-3 text-[#6C757D]">{row.events}</td>
                  <td className="py-3 text-[#212529]">{row.revenue}</td>
                  <td className="py-3 text-[#212529]">{row.commission}</td>
                  <td className="py-3 text-[#6C757D]">{row.share}</td>
                  <td className="py-3">
                    <Button size="sm" variant="ghost">
                      View Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
