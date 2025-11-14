import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';

const filters = {
  roles: ['Fan', 'Creator', 'Admin'],
  statuses: ['Active', 'Suspended', 'Banned'],
};

const users = [
  {
    id: '#1247',
    name: 'Rahul Kumar',
    email: 'rahul@email.com',
    role: 'Fan',
    status: 'Active',
    joined: 'Jan 10, 2025',
    lastActive: '2h ago',
    spent: '₹3,450',
  },
  {
    id: '#1246',
    name: 'Priya Sharma',
    email: 'priya@email.com',
    role: 'Creator',
    status: 'Active',
    joined: 'Dec 18, 2024',
    lastActive: '35m ago',
    spent: '₹0',
  },
  {
    id: '#1245',
    name: 'Amit Gupta',
    email: 'amit@email.com',
    role: 'Fan',
    status: 'Suspended',
    joined: 'Nov 05, 2024',
    lastActive: '3d ago',
    spent: '₹980',
  },
];

const userDetail = {
  id: '#1247',
  name: 'Rahul Kumar',
  role: 'Fan',
  email: 'rahul@email.com',
  phone: '+91 98765 43210',
  joined: 'Jan 10, 2025',
  lastActive: '2 hours ago',
  status: 'Active',
  stats: {
    bids: 23,
    spent: '₹3,450',
    wins: 5,
    meetsUpcoming: 2,
    meetsCompleted: 3,
  },
  payments: {
    walletBalance: '₹0',
    refunds: '₹1,620',
    failedPayments: 0,
  },
  activity: [
    'Jan 12 • Placed bid on Event #342 (₹450)',
    'Jan 12 • Refund processed (₹270)',
    'Jan 10 • Won bid on Event #338',
  ],
};

export function AdminUsers() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">All Users</h1>
          <p className="text-sm text-[#6C757D]">
            Search, filter, and take bulk actions across the entire user base.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export CSV</Button>
          <Button>Send Notification</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Refine the user list by role, status, or activity." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Search" placeholder="Name, email, phone, or ID" />
            <TextInput label="Registration Date" placeholder="From - To" />
            <TextInput label="Last Active" placeholder="From - To" />
            <TextInput label="Verification" placeholder="Verified / Pending" />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Roles</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {filters.roles.map((role) => (
                  <Badge key={role} variant="primary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {filters.statuses.map((status) => (
                  <Badge key={status} variant="warning">
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Users" subtitle="Bulk manage accounts and view key metrics." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Select</th>
                <th className="border-b border-[#E9ECEF] py-3">ID</th>
                <th className="border-b border-[#E9ECEF] py-3">Name</th>
                <th className="border-b border-[#E9ECEF] py-3">Email</th>
                <th className="border-b border-[#E9ECEF] py-3">Role</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Joined</th>
                <th className="border-b border-[#E9ECEF] py-3">Last Active</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Spent / Earned</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#CED4DA]" />
                  </td>
                  <td className="py-3 text-[#6C757D]">{user.id}</td>
                  <td className="py-3 text-[#212529]">{user.name}</td>
                  <td className="py-3 text-[#6C757D]">{user.email}</td>
                  <td className="py-3 text-[#212529]">{user.role}</td>
                  <td className="py-3">
                    <Badge variant={user.status === 'Active' ? 'success' : user.status === 'Suspended' ? 'warning' : 'danger'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{user.joined}</td>
                  <td className="py-3 text-[#6C757D]">{user.lastActive}</td>
                  <td className="py-3 text-[#212529]">{user.spent}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        View
                      </Button>
                      <Button size="sm" variant="ghost">
                        Suspend
                      </Button>
                      <Button size="sm" variant="ghost">
                        Email
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
        <CardHeader title={`User Detail — ${userDetail.name}`} subtitle="Full profile view for context and actions." />
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
            <div className="grid gap-2 text-sm text-[#212529] md:grid-cols-2">
              <div>
                <p className="text-[#6C757D]">Email</p>
                <p>{userDetail.email}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Phone</p>
                <p>{userDetail.phone}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Joined</p>
                <p>{userDetail.joined}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Last Active</p>
                <p>{userDetail.lastActive}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Status</p>
                <Badge variant="success">{userDetail.status}</Badge>
              </div>
              <div>
                <p className="text-[#6C757D]">Role</p>
                <Badge variant="primary">{userDetail.role}</Badge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                <p className="text-[#6C757D]">Total Bids Placed</p>
                <p className="text-xl font-semibold">{userDetail.stats.bids}</p>
              </div>
              <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                <p className="text-[#6C757D]">Total Spent</p>
                <p className="text-xl font-semibold">{userDetail.stats.spent}</p>
              </div>
              <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                <p className="text-[#6C757D]">Wins / Losses</p>
                <p className="text-xl font-semibold">
                  {userDetail.stats.wins} / {userDetail.stats.bids - userDetail.stats.wins}
                </p>
              </div>
              <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                <p className="text-[#6C757D]">Upcoming Meets</p>
                <p className="text-xl font-semibold">{userDetail.stats.meetsUpcoming}</p>
              </div>
            </div>
            <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
              <p className="text-[#6C757D]">Recent Activity</p>
              <ul className="mt-2 space-y-2">
                {userDetail.activity.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <div>
              <p className="text-[#6C757D]">Wallet Balance</p>
              <p className="text-xl font-semibold">{userDetail.payments.walletBalance}</p>
            </div>
            <div>
              <p className="text-[#6C757D]">Total Refunds Received</p>
              <p className="text-xl font-semibold">{userDetail.payments.refunds}</p>
            </div>
            <div>
              <p className="text-[#6C757D]">Failed Payments</p>
              <p className="text-xl font-semibold">{userDetail.payments.failedPayments}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button>Edit User</Button>
              <Button variant="secondary">Send Email</Button>
              <Button variant="ghost">View Activity Log</Button>
              <Button variant="danger">Suspend Account</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
