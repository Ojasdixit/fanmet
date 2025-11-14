import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const ticketFilters = {
  status: ['Open', 'In Progress', 'Escalated', 'Resolved'],
  priority: ['Critical', 'High', 'Medium', 'Low'],
};

const openTickets = [
  {
    id: '#TCK-982',
    subject: 'Payment failed but money debited',
    user: 'Rahul Kumar · Fan',
    created: 'Jan 12 · 10:05 AM',
    priority: 'High',
    channel: 'Email',
    assigned: 'Nisha',
  },
  {
    id: '#TCK-981',
    subject: 'Creator no show during live meet',
    user: 'Payal Singh · Fan',
    created: 'Jan 12 · 9:58 AM',
    priority: 'Critical',
    channel: 'In-app',
    assigned: 'Karan',
  },
  {
    id: '#TCK-980',
    subject: 'Need invoice for corporate booking',
    user: 'Suriya · Fan',
    created: 'Jan 12 · 9:15 AM',
    priority: 'Medium',
    channel: 'Email',
    assigned: 'Shreya',
  },
];

const sampleTicket = {
  id: '#TCK-981',
  subject: 'Creator no show during live meet',
  timeline: [
    { time: '9:58 AM', actor: 'System', detail: 'Ticket created via in-app form' },
    { time: '10:00 AM', actor: 'Karan (Support)', detail: 'Acknowledged and asked for event ID' },
    { time: '10:04 AM', actor: 'Fan · Payal', detail: 'Shared screenshots and event details' },
  ],
  details: {
    customer: 'Payal Singh',
    email: 'payal@email.com',
    phone: '+91 99876 54321',
    role: 'Fan',
    event: '#342 · Priya AMA',
    lastStatus: 'Creator offline, support investigating',
  },
};

export function AdminSupportTickets() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Support Tickets</h1>
          <p className="text-sm text-[#6C757D]">Track customer issues, assign owners, and maintain SLAs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">View SLA Dashboard</Button>
          <Button>Assign to Me</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Focus on critical tickets or specific owners." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Search" placeholder="Ticket ID, subject, user" />
          <TextInput label="Date Range" placeholder="From - To" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {ticketFilters.status.map((status) => (
                <Badge key={status} variant="primary">
                  {status}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Priority</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {ticketFilters.priority.map((priority) => (
                <Badge key={priority} variant={priority === 'Critical' ? 'danger' : 'warning'}>
                  {priority}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Open Tickets" subtitle="Most recent issues needing attention." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Ticket</th>
                <th className="border-b border-[#E9ECEF] py-3">User</th>
                <th className="border-b border-[#E9ECEF] py-3">Channel</th>
                <th className="border-b border-[#E9ECEF] py-3">Priority</th>
                <th className="border-b border-[#E9ECEF] py-3">Created</th>
                <th className="border-b border-[#E9ECEF] py-3">Owner</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {openTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">
                    <div className="flex flex-col">
                      <span className="font-semibold">{ticket.subject}</span>
                      <span className="text-xs text-[#6C757D]">{ticket.id}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#6C757D]">{ticket.user}</td>
                  <td className="py-3 text-[#6C757D]">{ticket.channel}</td>
                  <td className="py-3">
                    <Badge variant={ticket.priority === 'Critical' ? 'danger' : ticket.priority === 'High' ? 'warning' : 'primary'}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{ticket.created}</td>
                  <td className="py-3 text-[#212529]">{ticket.assigned}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        View
                      </Button>
                      <Button size="sm" variant="ghost">
                        Reassign
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
        <CardHeader title="Ticket Detail" subtitle="Peek into the full conversation." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{sampleTicket.subject}</h2>
              <Badge variant="danger">Critical</Badge>
            </div>
            <div className="space-y-3 text-[#6C757D]">
              {sampleTicket.timeline.map((entry) => (
                <div key={`${entry.time}-${entry.actor}`} className="rounded-[12px] bg-white p-4">
                  <p className="text-xs text-[#ADB5BD]">{entry.time}</p>
                  <p className="font-medium text-[#212529]">{entry.actor}</p>
                  <p>{entry.detail}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary">
                Reply to Customer
              </Button>
              <Button size="sm" variant="ghost">
                Add Internal Note
              </Button>
            </div>
          </div>
          <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Ticket Info</p>
              <p className="mt-2">Ticket ID: {sampleTicket.id}</p>
              <p>User: {sampleTicket.details.customer}</p>
              <p>Email: {sampleTicket.details.email}</p>
              <p>Phone: {sampleTicket.details.phone}</p>
              <p>Role: {sampleTicket.details.role}</p>
              <p>Event: {sampleTicket.details.event}</p>
            </div>
            <TextArea label="Update status" rows={3} placeholder="Add resolution details" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Resolve</Button>
              <Button variant="ghost">Escalate</Button>
              <Button variant="danger">Close without resolution</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
