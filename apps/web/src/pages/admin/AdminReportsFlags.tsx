import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const reportFilters = {
  categories: ['Harassment', 'Spam', 'Payment Fraud', 'Inappropriate Content', 'Impersonation'],
  status: ['New', 'Investigating', 'Resolved', 'Escalated'],
};

const flaggedItems = [
  {
    id: '#REP-234',
    type: 'Event',
    title: 'Meet & Greet with Priya',
    reporter: 'Rahul Kumar',
    accused: 'Creator · Priya Sharma',
    reason: 'Creator cancelled without notice',
    submitted: 'Jan 12 · 9:45 AM',
    status: 'Investigating',
    severity: 'High',
  },
  {
    id: '#REP-233',
    type: 'Chat',
    title: 'Fan chat room - Event #341',
    reporter: 'Support bot',
    accused: 'Fan · @rohank',
    reason: 'Reported for spam links',
    submitted: 'Jan 12 · 9:10 AM',
    status: 'New',
    severity: 'Medium',
  },
  {
    id: '#REP-232',
    type: 'Profile',
    title: 'Creator profile @fakeamit',
    reporter: 'Manual review',
    accused: 'Creator · @fakeamit',
    reason: 'Impersonation risk',
    submitted: 'Jan 11 · 4:15 PM',
    status: 'Escalated',
    severity: 'Critical',
  },
];

export function AdminReportsFlags() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Reports &amp; Flags</h1>
          <p className="text-sm text-[#6C757D]">Investigate community reports and moderate platform safety.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Download Report CSV</Button>
          <Button>Escalation Rules</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Narrow down by category, severity, or current status." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Search" placeholder="Report ID, reporter, accused" />
          <TextInput label="Date Range" placeholder="From - To" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Categories</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {reportFilters.categories.map((category) => (
                <Badge key={category} variant="primary">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {reportFilters.status.map((status) => (
                <Badge key={status} variant={status === 'Escalated' ? 'danger' : status === 'Investigating' ? 'warning' : 'primary'}>
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Flagged Items" subtitle="Newest moderation alerts." />
        <CardContent className="space-y-4">
          {flaggedItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-[#6C757D]">{item.type} · ID {item.id}</p>
                </div>
                <Badge
                  variant={item.status === 'Escalated' ? 'danger' : item.status === 'Investigating' ? 'warning' : 'primary'}
                >
                  {item.status}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-[#6C757D]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Reporter</p>
                  <p>{item.reporter}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Accused</p>
                  <p>{item.accused}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Submitted</p>
                  <p>{item.submitted}</p>
                </div>
              </div>
              <p className="text-[#212529]">Reason: {item.reason}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={item.severity === 'Critical' ? 'danger' : item.severity === 'High' ? 'warning' : 'primary'}>
                  Severity: {item.severity}
                </Badge>
                <Button size="sm" variant="secondary">
                  Open Case
                </Button>
                <Button size="sm" variant="ghost">
                  Request Evidence
                </Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Resolution Notes" subtitle="Document outcomes for audit history." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Report ID" placeholder="#REP-234" />
          <TextInput label="Status" placeholder="Resolved / Escalated" />
          <TextArea label="Resolution Summary" rows={3} placeholder="Explain action taken, time to resolve, evidence." />
          <div className="flex gap-2 md:col-span-2">
            <Button variant="secondary">Attach Evidence</Button>
            <Button>Save Notes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
