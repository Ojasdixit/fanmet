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
    id: 'meets',
    icon: '🎥',
    title: 'Completed Meets',
    value: 47,
    caption: 'Happy fans across sessions',
  },
];

const topCreators = [
  {
    id: 'creator-1',
    name: 'Priya Sharma',
    handle: '@priyasharma',
    category: 'Cooking & vlogs',
    earnings: 45230,
    growth: '+18% this month',
    initials: 'PS',
  },
  {
    id: 'creator-2',
    name: 'Rohan Gupta',
    handle: '@rohanlive',
    category: 'Gaming & livestreams',
    earnings: 38420,
    growth: '+12% this month',
    initials: 'RG',
  },
  {
    id: 'creator-3',
    name: 'Neha Kapoor',
    handle: '@coachneha',
    category: 'Life & career coaching',
    earnings: 29840,
    growth: '+9% this month',
    initials: 'NK',
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
      <Card
        elevated
        className="overflow-hidden border-none bg-gradient-to-r from-[#FCE7FF] via-[#F4E6FF] to-[#E5DEFF] shadow-[0_24px_60px_rgba(160,64,255,0.18)]"
      >
        <div className="relative flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:px-8 md:py-8">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">
              Creator earnings
            </p>
            <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
              See how top creators earn with FanMeet.
            </h1>
            <p className="text-sm text-[#6C757D] md:text-base">
              Track your revenue, learn from other creators, and turn every 1:1 meet into predictable income.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="primary" className="rounded-full bg-[#050014] px-4 py-1 text-xs text-white">
                Top creator last month earned {formatCurrency(45230)}
              </Badge>
              <span className="text-xs text-[#6C757D]">
                Average creators earn between {formatCurrency(8000)}–{formatCurrency(25000)} / month.
              </span>
            </div>
          </div>
          <div className="mt-4 w-full max-w-md rounded-[20px] bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.18)] md:ml-auto md:mt-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6C757D]">
                Top creators this month
              </div>
              <div className="text-xs text-[#6C757D]">Mock data</div>
            </div>
            <div className="mt-3 space-y-3">
              {topCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between rounded-[12px] bg-[#F8F9FA] px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] text-xs font-semibold text-white">
                      {creator.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#212529]">{creator.name}</span>
                      <span className="text-xs text-[#6C757D]">
                        {creator.handle} • {creator.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#050014]">
                      {formatCurrency(creator.earnings)}
                    </div>
                    <div className="text-xs text-[#16A34A]">{creator.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#212529]">Overview</h2>
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
