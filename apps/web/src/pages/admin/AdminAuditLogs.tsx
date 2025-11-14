import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';

const filters = {
  actions: ['Login', 'Role Change', 'Payout Approved', 'Refund Processed', 'Settings Updated'],
  actors: ['System', 'Admin', 'Creator', 'Fan'],
};

const logEntries = [
  {
    id: 'log-9821',
    time: 'Jan 12 · 10:32 AM',
    actor: 'Admin · @megha',
    action: 'Approved withdrawal request #WR-456',
    status: 'Success',
    context: 'Marked as paid via Razorpay · ref pay_xyz123',
  },
  {
    id: 'log-9820',
    time: 'Jan 12 · 10:15 AM',
    actor: 'System',
    action: 'Auto-refunded bid #BID-341',
    status: 'Success',
    context: 'Auto 90% refund processed · ₹270 credited',
  },
  {
    id: 'log-9819',
    time: 'Jan 12 · 10:05 AM',
    actor: 'Admin · @rahul',
    action: 'Updated pricing - base ₹100 event fee',
    status: 'Warning',
    context: 'Changed commission tiers · awaiting approval',
  },
];

export function AdminAuditLogs() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Audit Logs</h1>
          <p className="text-sm text-[#6C757D]">Immutable record of every critical action across the platform.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export 30 days</Button>
          <Button>Subscribe to feed</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Slice logs by actor, action, or severity." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Search" placeholder="ID, actor, action" />
          <TextInput label="Date Range" placeholder="From - To" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Action Types</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {filters.actions.map((action) => (
                <Badge key={action} variant="primary">
                  {action}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Actor</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {filters.actors.map((actor) => (
                <Badge key={actor} variant="warning">
                  {actor}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Log Stream" subtitle="Newest events first" />
        <CardContent className="space-y-4">
          {logEntries.map((entry) => (
            <div key={entry.id} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{entry.action}</div>
                <Badge variant={entry.status === 'Success' ? 'success' : 'warning'}>{entry.status}</Badge>
              </div>
              <p className="mt-2 text-[#6C757D]">{entry.time} · {entry.actor}</p>
              <p className="mt-3 text-[#212529]">{entry.context}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="primary">{entry.id}</Badge>
                <Button size="sm" variant="ghost">
                  View JSON
                </Button>
                <Button size="sm" variant="ghost">
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
