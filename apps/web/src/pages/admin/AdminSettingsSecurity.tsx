import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const roles = [
  {
    name: 'Super Admin',
    permissions: ['Manage billing', 'Modify platform settings', 'Approve payouts', 'View audit logs'],
    members: ['megha@fanmeet.com', 'rahul@fanmeet.com'],
  },
  {
    name: 'Operations',
    permissions: ['Approve withdrawals', 'Process refunds', 'Manage disputes'],
    members: ['ops-team@fanmeet.com'],
  },
  {
    name: 'Support',
    permissions: ['Respond to tickets', 'Issue coupons', 'View user profiles'],
    members: ['support@fanmeet.com'],
  },
];

const securityAlerts = [
  { id: 'sec-1', message: 'Enable SSO for all admins', severity: 'High' },
  { id: 'sec-2', message: '2 pending device approvals', severity: 'Medium' },
  { id: 'sec-3', message: 'Password rotation due in 12 days', severity: 'Low' },
];

export function AdminSettingsSecurity() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Security &amp; Access</h1>
          <p className="text-sm text-[#6C757D]">Control admin roles, device approvals, and authentication policies.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Invite Admin</Button>
          <Button>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Access Policies" subtitle="Baseline requirements for all admin accounts." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Password Policy" defaultValue="Min 12 chars · Uppercase · Number · Symbol" />
          <TextInput label="Session Timeout" defaultValue="45 minutes" />
          <TextInput label="Allowed IP Ranges" placeholder="e.g. 13.232.0.0/16" />
          <TextInput label="Device Approval Window" defaultValue="7 days" />
          <div className="md:col-span-2">
            <TextArea label="Admin Terms Acknowledgement" rows={3} placeholder="Provide compliance terms here." />
          </div>
          <label className="flex items-center justify-between rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
            <div>
              <p className="text-sm font-semibold text-[#212529]">Require 2FA for all admins</p>
              <p className="text-xs text-[#6C757D]">Mandatory via authenticator app or SMS backup.</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CED4DA]" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Roles &amp; Permissions" subtitle="High-level summary of access tiers." />
        <CardContent className="space-y-4">
          {roles.map((role) => (
            <div key={role.name} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{role.name}</h2>
                <Badge variant="primary">{role.members.length} members</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Permissions</p>
                  <ul className="mt-2 space-y-1 text-[#6C757D]">
                    {role.permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Members</p>
                  <ul className="mt-2 space-y-1 text-[#6C757D]">
                    {role.members.map((member) => (
                      <li key={member}>{member}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Edit Role
                </Button>
                <Button size="sm" variant="ghost">
                  View Activity
                </Button>
                <Button size="sm" variant="ghost">
                  Remove Members
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Security Alerts" subtitle="Items requiring immediate follow up." />
        <CardContent className="grid gap-3 md:grid-cols-3">
          {securityAlerts.map((alert) => (
            <div key={alert.id} className="rounded-[16px] border border-[#FFE5D9] bg-[#FFE5D9]/60 p-4 text-sm text-[#D9480F]">
              <p className="font-semibold">{alert.message}</p>
              <p className="text-xs uppercase tracking-wide">Severity: {alert.severity}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
