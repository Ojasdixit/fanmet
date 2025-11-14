import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const refunds = [
  {
    id: '#RF-789',
    user: 'Rahul Kumar',
    email: 'rahul@email.com',
    event: '#342 · Meet & Greet with Priya',
    amount: '₹270',
    type: 'Auto 90%',
    status: 'Processed',
    processedOn: 'Jan 12, 2025',
  },
  {
    id: '#RF-788',
    user: 'Priya Singh',
    email: 'priya@email.com',
    event: '#341 · Cooking Demo',
    amount: '₹180',
    type: 'Auto 90%',
    status: 'Processed',
    processedOn: 'Jan 12, 2025',
  },
  {
    id: '#RF-787',
    user: 'Amit Gupta',
    email: 'amit@email.com',
    event: '#340 · Productivity Masterclass',
    amount: '₹450',
    type: 'Manual',
    status: 'Pending Retry',
    processedOn: 'Jan 11, 2025',
  },
  {
    id: '#RF-786',
    user: 'Neha Kapoor',
    email: 'neha@email.com',
    event: '#339 · Cooking with Chef Rohan',
    amount: '₹320',
    type: 'Auto 90%',
    status: 'Failed',
    processedOn: 'Jan 11, 2025',
  },
];

const failedRefund = {
  id: '#RF-786',
  reason: 'Payment method expired / Bank account closed',
  gatewayError: 'BAD_REQUEST_ERROR · Invalid account details',
  attempts: 3,
  amount: '₹288 (90%)',
  originalBid: '₹320',
  user: 'Neha Kumar (neha@email.com)',
};

export function AdminRefundsManagement() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Refunds Management</h1>
          <p className="text-sm text-[#6C757D]">
            Track automatic and manual refunds, investigate failures, and trigger overrides.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export Report</Button>
          <Button>Process Manual Refund</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Overview" subtitle="Quick insight into refund volume and outcomes." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Refunds Today', value: '₹23,450 · 89 refunds' },
            { label: 'This Week', value: '₹1,45,200 · 456 refunds' },
            { label: 'This Month', value: '₹4,52,300 · 1,234 refunds' },
            { label: 'Failed Pending', value: '12 · ₹3,400' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-[#212529]">{metric.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Refunds" subtitle="Filter by status, type, or amount to focus investigation." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">ID</th>
                <th className="border-b border-[#E9ECEF] py-3">User</th>
                <th className="border-b border-[#E9ECEF] py-3">Event</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Type</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Processed</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#6C757D]">{refund.id}</td>
                  <td className="py-3 text-[#212529]">
                    <div className="flex flex-col">
                      <span className="font-medium">{refund.user}</span>
                      <span className="text-xs text-[#6C757D]">{refund.email}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#6C757D]">{refund.event}</td>
                  <td className="py-3 text-[#212529]">{refund.amount}</td>
                  <td className="py-3 text-[#6C757D]">{refund.type}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        refund.status === 'Processed' ? 'success' : refund.status === 'Pending Retry' ? 'warning' : 'danger'
                      }
                    >
                      {refund.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{refund.processedOn}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        View Details
                      </Button>
                      <Button size="sm" variant="ghost">
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Failed Refunds Requiring Action"
          subtitle="Resolve gateway failures with manual interventions."
        />
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <p className="font-semibold">Refund {failedRefund.id}</p>
            <p className="mt-1 text-[#6C757D]">{failedRefund.user}</p>
            <p className="mt-4">Original Bid: {failedRefund.originalBid}</p>
            <p>Refund Amount: {failedRefund.amount}</p>
            <p>Attempts: {failedRefund.attempts}</p>
            <p className="mt-3 text-[#D9480F]">Failure Reason: {failedRefund.reason}</p>
            <p className="text-[#6C757D]">Gateway Error: {failedRefund.gatewayError}</p>
          </div>
          <div className="space-y-3 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <TextInput label="Next Step" placeholder="Retry via gateway / Manual transfer" />
            <TextArea label="Notes" rows={3} placeholder="Add context for audit trail" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary">Retry Refund</Button>
              <Button variant="ghost">Contact User</Button>
            </div>
            <Button variant="danger">Mark as Resolved</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Manual Refund" subtitle="Issue full or partial refunds outside the automatic flow." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="User" placeholder="Search by email / phone / ID" />
          <TextInput label="Event (optional)" placeholder="Search event" />
          <TextInput label="Refund Amount" placeholder="₹" />
          <TextInput label="Reason" placeholder="Event cancelled / Technical issue / Gesture" />
          <TextArea label="Additional Notes" rows={3} placeholder="Context for support team" />
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Preview Email</Button>
              <Button>Process Refund</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
