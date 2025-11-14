import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';

const fanFilters = {
  segments: ['High Spenders', 'Active Bidders', 'Inactive', 'Multiple Wins', 'Never Won', 'Refund Issues'],
  sortOptions: ['Total Spent', 'Number of Bids', 'Wins Count', 'Join Date', 'Last Activity'],
};

const fanRows = [
  {
    id: '#F-982',
    name: 'Neha Kapoor',
    email: 'neha@email.com',
    totalSpent: '₹6,850',
    bids: 58,
    wins: 12,
    lastBid: '1h ago',
    status: 'Active',
  },
  {
    id: '#F-871',
    name: 'Rohan Mehta',
    email: 'rohan@email.com',
    totalSpent: '₹820',
    bids: 9,
    wins: 1,
    lastBid: '4d ago',
    status: 'Inactive',
  },
  {
    id: '#F-765',
    name: 'Aisha Khan',
    email: 'aisha@email.com',
    totalSpent: '₹3,120',
    bids: 26,
    wins: 4,
    lastBid: '12h ago',
    status: 'At risk',
  },
];

const fanDetail = {
  profile: {
    name: 'Neha Kapoor',
    id: '#F-982',
    email: 'neha@email.com',
    phone: '+91 99876 54321',
    joinDate: 'Aug 19, 2024',
    preferredEvents: 'Paid, Lifestyle, Live Music',
    status: 'Active',
  },
  bidHistory: [
    { date: 'Jan 12', event: 'Priya AMA', amount: '₹450', result: '🏆 Won' },
    { date: 'Jan 12', event: 'Amit Cooking Demo', amount: '₹270', result: '❌ Lost' },
    { date: 'Jan 10', event: 'Rohan Acoustic Night', amount: '₹180', result: '🏆 Won' },
  ],
  spending: {
    averageBid: '₹320',
    highestBid: '₹680',
    winRate: '22%',
    refundsTotal: '₹1,260',
  },
};

export function AdminFans() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Fans Management</h1>
          <p className="text-sm text-[#6C757D]">Surface high-value fans, address churn risk, and track spending patterns.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Create Segment</Button>
          <Button>Send Campaign</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Mix and match segments to focus on specific fan cohorts." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Search Fans" placeholder="Name, email, or ID" />
            <TextInput label="Date Range" placeholder="Last activity" />
            <TextInput label="Total Spent" placeholder="> ₹5,000" />
            <TextInput label="Win Rate" placeholder="> 20%" />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Segments</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {fanFilters.segments.map((segment) => (
                  <Badge key={segment} variant="primary">
                    {segment}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Sort By</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {fanFilters.sortOptions.map((option) => (
                  <Badge key={option} variant="warning">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Fan Leaderboard" subtitle="Compare engagement, wins, and spend at a glance." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Fan</th>
                <th className="border-b border-[#E9ECEF] py-3">Email</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Spent</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Wins</th>
                <th className="border-b border-[#E9ECEF] py-3">Last Bid</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fanRows.map((fan) => (
                <tr key={fan.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">
                    <div className="flex flex-col">
                      <span className="font-medium">{fan.name}</span>
                      <span className="text-xs text-[#6C757D]">{fan.id}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#6C757D]">{fan.email}</td>
                  <td className="py-3 text-[#212529]">{fan.totalSpent}</td>
                  <td className="py-3 text-[#212529]">{fan.bids}</td>
                  <td className="py-3 text-[#212529]">{fan.wins}</td>
                  <td className="py-3 text-[#6C757D]">{fan.lastBid}</td>
                  <td className="py-3">
                    <Badge
                      variant={fan.status === 'Active' ? 'success' : fan.status === 'At risk' ? 'warning' : 'danger'}
                    >
                      {fan.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        View Profile
                      </Button>
                      <Button size="sm" variant="ghost">
                        Send Offer
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
        <CardHeader title="Fan Detail" subtitle="Deep dive into engagement and outcomes for a specific fan." />
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-[#6C757D]">Name / ID</p>
                <p>{fanDetail.profile.name}</p>
                <p className="text-xs text-[#6C757D]">{fanDetail.profile.id}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Email</p>
                <p>{fanDetail.profile.email}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Phone</p>
                <p>{fanDetail.profile.phone}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Joined</p>
                <p>{fanDetail.profile.joinDate}</p>
              </div>
              <div>
                <p className="text-[#6C757D]">Status</p>
                <Badge variant="success">{fanDetail.profile.status}</Badge>
              </div>
              <div>
                <p className="text-[#6C757D]">Preferences</p>
                <p>{fanDetail.profile.preferredEvents}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[#6C757D]">Spending Pattern</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-[12px] bg-white p-4">
                  <p className="text-xs text-[#6C757D]">Average Bid</p>
                  <p className="text-lg font-semibold">{fanDetail.spending.averageBid}</p>
                </div>
                <div className="rounded-[12px] bg-white p-4">
                  <p className="text-xs text-[#6C757D]">Highest Bid</p>
                  <p className="text-lg font-semibold">{fanDetail.spending.highestBid}</p>
                </div>
                <div className="rounded-[12px] bg-white p-4">
                  <p className="text-xs text-[#6C757D]">Win Rate</p>
                  <p className="text-lg font-semibold">{fanDetail.spending.winRate}</p>
                </div>
                <div className="rounded-[12px] bg-white p-4">
                  <p className="text-xs text-[#6C757D]">Refunds</p>
                  <p className="text-lg font-semibold">{fanDetail.spending.refundsTotal}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <div>
              <p className="text-[#6C757D]">Recent Bid History</p>
              <ul className="mt-2 space-y-2">
                {fanDetail.bidHistory.map((entry) => (
                  <li key={`${entry.date}-${entry.event}`} className="flex items-center justify-between rounded-[10px] bg-[#F8F9FA] px-3 py-2">
                    <span>
                      <strong>{entry.date}</strong> · {entry.event}
                    </span>
                    <span>{entry.amount} {entry.result}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="secondary">Send Loyalty Reward</Button>
              <Button variant="ghost">Mark as VIP</Button>
              <Button variant="danger">Flag for Review</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
