import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';

const stats = [
  {
    id: 'stat-1',
    icon: '💰',
    title: 'Total Earnings',
    value: 12450,
    change: '+23% this month',
  },
  {
    id: 'stat-2',
    icon: '🎫',
    title: 'Active Events',
    value: 3,
    caption: '2 ending today',
  },
  {
    id: 'stat-3',
    icon: '⏳',
    title: 'Pending Balance',
    value: 2340,
    action: 'Withdraw →',
  },
  {
    id: 'stat-4',
    icon: '🎥',
    title: 'Completed Meets',
    value: 47,
    caption: '5.0★ avg rating',
  },
];

const recentActivity = [
  {
    id: 'activity-1',
    time: '2 hours ago',
    description: 'Priya Sharma placed a bid of ₹450 on “Q&A Session”.',
  },
  {
    id: 'activity-2',
    time: '5 hours ago',
    description: 'Event “Cooking Live” went live and has 12 bids.',
  },
  {
    id: 'activity-3',
    time: '1 day ago',
    description: 'Withdrawal request of ₹2,340 created.',
  },
];

export function CreatorOverview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">Overview</h1>
          <p className="text-sm text-[#6C757D]">High-level snapshot of your performance.</p>
        </div>
        <Button
          variant="primary"
          className="bg-[#050014] text-white hover:bg-[#140423]"
        >
          Create Event →
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.id} elevated>
            <CardHeader
              title={
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
              }
            />
            <CardContent className="gap-2">
              <div className="text-3xl font-bold text-[#212529]">
                {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
              </div>
              {item.change ? (
                <Badge variant="success" className="w-fit">
                  {item.change}
                </Badge>
              ) : null}
              {item.caption ? <p className="text-sm text-[#6C757D]">{item.caption}</p> : null}
              {item.action ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2 w-fit bg-[#050014] text-white hover:bg-[#140423]"
                >
                  {item.action}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Recent Activity" subtitle="Latest updates from your events and fans" />
        <CardContent className="gap-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 text-sm text-[#212529]"
            >
              <div>{activity.description}</div>
              <div className="text-xs text-[#6C757D]">{activity.time}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
