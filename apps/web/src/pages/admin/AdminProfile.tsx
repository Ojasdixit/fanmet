import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const profile = {
  name: 'Megha Sharma',
  title: 'Head of Operations',
  email: 'megha@fanmeet.com',
  phone: '+91 98765 43210',
  role: 'Super Admin',
  avatar: 'MS',
  lastLogin: 'Jan 12, 2025 · 10:15 AM IST',
  timezone: 'Asia/Kolkata',
};

const delegatedAccess = [
  { team: 'Support Desk', scope: 'Tickets, Reports', status: 'Active', expires: 'Feb 01, 2025' },
  { team: 'Finance Ops', scope: 'Withdrawals, Refunds', status: 'Active', expires: 'Mar 15, 2025' },
];

const recentActivity = [
  'Jan 12 · Approved withdrawal batch WR-BATCH-24',
  'Jan 12 · Updated pricing tier ₹100 Base',
  'Jan 11 · Resolved dispute DSP-311',
  'Jan 10 · Published announcement ANN-210',
];

export function AdminProfile() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">My Profile</h1>
          <p className="text-sm text-[#6C757D]">Manage your contact info, access, and delegated permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Download Activity Log</Button>
          <Button>Update Security</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Personal Information" subtitle="Visible to other admins." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Full Name" defaultValue={profile.name} />
          <TextInput label="Title" defaultValue={profile.title} />
          <TextInput label="Email" defaultValue={profile.email} />
          <TextInput label="Phone" defaultValue={profile.phone} />
          <TextInput label="Timezone" defaultValue={profile.timezone} />
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Role</p>
            <Badge variant="primary" className="mt-3 w-fit">{profile.role}</Badge>
            <p className="mt-3 text-xs text-[#6C757D]">Last login: {profile.lastLogin}</p>
          </div>
          <div className="md:col-span-2">
            <TextArea label="Out of Office Message" rows={3} placeholder="Optional note for delegating responsibilities." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Delegated Access" subtitle="Teams that can act on your behalf." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          {delegatedAccess.map((entry) => (
            <div key={entry.team} className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
              <p className="text-lg font-semibold">{entry.team}</p>
              <p className="mt-2 text-[#6C757D]">Scope: {entry.scope}</p>
              <p className="text-xs text-[#ADB5BD]">Expires: {entry.expires}</p>
              <Badge variant="success" className="mt-3 w-fit">{entry.status}</Badge>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary">
                  Modify
                </Button>
                <Button size="sm" variant="ghost">
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Recent Activity" subtitle="Latest actions performed under this account." />
        <CardContent>
          <ul className="space-y-2 text-sm text-[#212529]">
            {recentActivity.map((item) => (
              <li key={item} className="flex items-center gap-2 rounded-[12px] bg-[#F8F9FA] px-4 py-3">
                <span className="text-[#C045FF]">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary">Save Changes</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Deactivate Account</Button>
      </div>
    </div>
  );
}
