import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const backupHistory = [
  { id: 'backup-905', created: 'Jan 12 · 02:00 AM', type: 'Full snapshot', size: '2.4 GB', status: 'Success', retainedUntil: 'Feb 12, 2025' },
  { id: 'backup-904', created: 'Jan 11 · 02:00 AM', type: 'Incremental', size: '650 MB', status: 'Success', retainedUntil: 'Feb 11, 2025' },
  { id: 'backup-903', created: 'Jan 10 · 02:00 AM', type: 'Incremental', size: '612 MB', status: 'Success', retainedUntil: 'Feb 10, 2025' },
];

const retentionPolicies = [
  { label: 'Full Snapshots', value: 'Every Sunday · retain 6 copies' },
  { label: 'Incremental', value: 'Daily · retain 14 copies' },
  { label: 'Disaster Recovery', value: 'Monthly full export stored in S3' },
];

export function AdminSystemBackup() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Database Backup</h1>
          <p className="text-sm text-[#6C757D]">Manage automated schedules, retention, and manual exports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Download Latest</Button>
          <Button>Trigger Backup</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Backup Schedule" subtitle="Configure automatic backups and retention." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Full Backup Frequency" defaultValue="Weekly on Sunday" />
          <TextInput label="Incremental Backup Frequency" defaultValue="Daily at 02:00 AM" />
          <TextInput label="Retention Duration" defaultValue="30 days" />
          <TextInput label="Storage Location" defaultValue="AWS S3 (ap-south-1)" />
          <TextArea label="Notifications" rows={3} placeholder="Emails or Slack channels for alerts" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Retention Policies" subtitle="Snapshot retention rules." />
        <CardContent className="grid gap-3 md:grid-cols-3">
          {retentionPolicies.map((policy) => (
            <div key={policy.label} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <p className="font-semibold">{policy.label}</p>
              <p className="mt-2 text-[#6C757D]">{policy.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Backup History" subtitle="Recent snapshots and export status." />
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full table-auto border-collapse text-left">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Backup</th>
                <th className="border-b border-[#E9ECEF] py-3">Created</th>
                <th className="border-b border-[#E9ECEF] py-3">Type</th>
                <th className="border-b border-[#E9ECEF] py-3">Size</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Retained Until</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backupHistory.map((backup) => (
                <tr key={backup.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{backup.id}</td>
                  <td className="py-3 text-[#6C757D]">{backup.created}</td>
                  <td className="py-3 text-[#6C757D]">{backup.type}</td>
                  <td className="py-3 text-[#212529]">{backup.size}</td>
                  <td className="py-3">
                    <Badge variant="success">{backup.status}</Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{backup.retainedUntil}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        Restore
                      </Button>
                      <Button size="sm" variant="ghost">
                        Delete
                      </Button>
                    </div>
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
