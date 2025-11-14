import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const bulkActions = [
  {
    id: 'bulk-123',
    title: 'Suspend 12 spam accounts',
    createdBy: 'Megha (Admin)',
    createdOn: 'Jan 12 · 8:00 AM',
    status: 'Pending Approval',
    notes: 'Accounts flagged by automated fraud detection.',
  },
  {
    id: 'bulk-122',
    title: 'Approve 25 withdrawal payouts',
    createdBy: 'Rahul (Ops)',
    createdOn: 'Jan 11 · 6:45 PM',
    status: 'Completed',
    notes: 'Manual payout processed with reference pay_890x',
  },
];

const queueItems = [
  { type: 'Creator KYC reminders', count: 32, lastRun: 'Jan 12 · 7:30 AM', nextRun: 'Jan 13 · 7:30 AM' },
  { type: 'Fan verification nudge', count: 58, lastRun: 'Jan 11 · 9:00 PM', nextRun: 'Jan 12 · 9:00 PM' },
  { type: 'Outstanding disputes follow-up', count: 12, lastRun: 'Jan 10 · 4:00 PM', nextRun: 'Jan 13 · 4:00 PM' },
];

export function AdminSystemBulkActions() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Bulk Actions</h1>
          <p className="text-sm text-[#6C757D]">Execute large-scale updates safely with approval trails.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">View Audit Log</Button>
          <Button>Create Bulk Action</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Active Actions" subtitle="Items awaiting review or execution." />
        <CardContent className="space-y-4">
          {bulkActions.map((action) => (
            <div key={action.id} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{action.title}</h2>
                  <p className="text-xs text-[#6C757D]">{action.createdBy} · {action.createdOn}</p>
                </div>
                <Badge variant={action.status === 'Completed' ? 'success' : 'warning'}>{action.status}</Badge>
              </div>
              <p className="mt-3 text-[#6C757D]">{action.notes}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Review Details
                </Button>
                <Button size="sm" variant="ghost">
                  Approve
                </Button>
                <Button size="sm" variant="ghost">
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Automation Queue" subtitle="Recurring jobs and mass tasks." />
        <CardContent className="grid gap-4 md:grid-cols-3">
          {queueItems.map((item) => (
            <div key={item.type} className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
              <p className="font-semibold">{item.type}</p>
              <p className="mt-2 text-[#6C757D]">Pending: {item.count}</p>
              <p className="text-xs text-[#ADB5BD]">Last run: {item.lastRun}</p>
              <p className="text-xs text-[#ADB5BD]">Next run: {item.nextRun}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="New Bulk Action" subtitle="Design and schedule batch operations." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Action Name" placeholder="e.g. Suspend flagged accounts" />
          <TextInput label="Approval Owner" placeholder="Select admin" />
          <TextArea label="Target Criteria" rows={4} placeholder="Describe which users/events are impacted" />
          <TextArea label="Execution Steps" rows={4} placeholder="Outline the steps taken during execution" />
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Save Draft</Button>
              <Button>Submit for Approval</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
