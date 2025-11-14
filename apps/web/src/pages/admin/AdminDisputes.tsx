import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const disputeFilters = {
  statuses: ['New', 'Under Review', 'Escalated', 'Resolved'],
  disputeTypes: ['Payment', 'Meet Quality', 'No Show', 'Policy Violation'],
};

const disputes = [
  {
    id: '#DSP-312',
    created: 'Jan 12 · 8:45 AM',
    complainant: 'Fan · Rahul Kumar',
    respondent: 'Creator · Priya Sharma',
    issue: 'Creator cancelled after payment',
    amount: '₹2,340',
    status: 'Under Review',
    priority: 'High',
  },
  {
    id: '#DSP-311',
    created: 'Jan 11 · 6:10 PM',
    complainant: 'Creator · Amit Gupta',
    respondent: 'Fan · Payal Singh',
    issue: 'Abusive language during session',
    amount: '₹450',
    status: 'Escalated',
    priority: 'Critical',
  },
  {
    id: '#DSP-310',
    created: 'Jan 11 · 3:28 PM',
    complainant: 'Fan · Neha Kapoor',
    respondent: 'Creator · Rohan Verma',
    issue: 'Partial refund requested for poor experience',
    amount: '₹180',
    status: 'New',
    priority: 'Medium',
  },
];

const disputeDetail = {
  id: '#DSP-311',
  tags: ['Escalated', 'Critical'],
  summary: 'Creator reported fan for abusive language and violating meet guidelines. Seeking ban and dispute resolution.',
  timeline: [
    { time: 'Jan 11 · 6:10 PM', actor: 'Creator · Amit', detail: 'Filed dispute with screenshots attached' },
    { time: 'Jan 11 · 6:35 PM', actor: 'Support · Karan', detail: 'Acknowledged and notified fan' },
    { time: 'Jan 11 · 7:05 PM', actor: 'Fan · Payal', detail: 'Submitted apology and requested reconsideration' },
  ],
  nextSteps: ['Review session recording', 'Check prior offence history', 'Determine ban or strike'],
};

export function AdminDisputes() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Dispute Management</h1>
          <p className="text-sm text-[#6C757D]">Resolve conflicts between fans and creators fairly.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">View SLA Report</Button>
          <Button>Assign Escalations</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Identify disputes based on severity or type." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Search" placeholder="Dispute ID, names" />
          <TextInput label="Date Range" placeholder="From - To" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {disputeFilters.statuses.map((status) => (
                <Badge key={status} variant={status === 'Escalated' ? 'danger' : status === 'Under Review' ? 'warning' : 'primary'}>
                  {status}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Dispute Type</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {disputeFilters.disputeTypes.map((type) => (
                <Badge key={type} variant="primary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Active Disputes" subtitle="Most recent or high priority items." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Dispute</th>
                <th className="border-b border-[#E9ECEF] py-3">Complainant</th>
                <th className="border-b border-[#E9ECEF] py-3">Respondent</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Priority</th>
                <th className="border-b border-[#E9ECEF] py-3">Created</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">
                    <div className="flex flex-col">
                      <span className="font-semibold">{dispute.issue}</span>
                      <span className="text-xs text-[#6C757D]">{dispute.id}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#6C757D]">{dispute.complainant}</td>
                  <td className="py-3 text-[#6C757D]">{dispute.respondent}</td>
                  <td className="py-3 text-[#212529]">{dispute.amount}</td>
                  <td className="py-3">
                    <Badge variant={dispute.status === 'Escalated' ? 'danger' : dispute.status === 'Under Review' ? 'warning' : 'primary'}>
                      {dispute.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={dispute.priority === 'Critical' ? 'danger' : dispute.priority === 'High' ? 'warning' : 'primary'}>
                      {dispute.priority}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{dispute.created}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        Review Case
                      </Button>
                      <Button size="sm" variant="ghost">
                        Escalate
                      </Button>
                      <Button size="sm" variant="ghost">
                        Mark Resolved
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
        <CardHeader title="Dispute Detail" subtitle="Critical case needing decisions." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">{disputeDetail.tags[0]}</Badge>
              <Badge variant="warning">{disputeDetail.tags[1]}</Badge>
              <Badge variant="primary">{disputeDetail.id}</Badge>
            </div>
            <p className="text-lg font-semibold">Summary</p>
            <p className="text-[#6C757D]">{disputeDetail.summary}</p>
            <div className="space-y-3">
              {disputeDetail.timeline.map((entry) => (
                <div key={`${entry.time}-${entry.actor}`} className="rounded-[12px] bg-white p-4">
                  <p className="text-xs text-[#ADB5BD]">{entry.time}</p>
                  <p className="font-medium text-[#212529]">{entry.actor}</p>
                  <p className="text-[#6C757D]">{entry.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Next Steps</p>
            <ul className="space-y-2 text-[#6C757D]">
              {disputeDetail.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <TextArea label="Decision &amp; Outcome" rows={3} placeholder="Describe resolution, compensation, actions" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Issue Refund</Button>
              <Button variant="ghost">Apply Strike</Button>
              <Button variant="danger">Ban User</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
