import { Card, CardContent, Button, Badge } from '@fanmeet/ui';

const demoFollowers = [
  {
    id: 'fan-1',
    name: 'Rahul Kumar',
    handle: '@rahulfan',
    tier: 'Premium',
    meets: 3,
    lastMeet: '2 days ago',
  },
  {
    id: 'fan-2',
    name: 'Neha Sharma',
    handle: '@nehalovesyou',
    tier: 'Follower',
    meets: 1,
    lastMeet: 'Last week',
  },
  {
    id: 'fan-3',
    name: 'Aditya Verma',
    handle: '@adityav',
    tier: 'Subscriber',
    meets: 5,
    lastMeet: 'Today',
  },
];

export function CreatorFollowers() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#212529]">Followers & fans</h1>
        <p className="mt-1 text-sm text-[#6C757D]">
          People who follow or subscribe to you on FanMeet. Use this list to understand who shows up for
          your events most often.
        </p>
      </div>

      <div className="space-y-4">
        {demoFollowers.map((fan) => (
          <Card key={fan.id} elevated className="border-none bg-white/95">
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="h-10 w-10 rounded-full bg-[#050014] text-center text-sm font-semibold leading-10 text-white">
                    {fan.name.charAt(0)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#212529]">{fan.name}</span>
                    <span className="text-xs text-[#6C757D]">{fan.handle}</span>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6C757D]">
                  <span>
                    <strong className="font-semibold text-[#212529]">{fan.meets}</strong> meets with you
                  </span>
                  <span>Last joined: {fan.lastMeet}</span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <Badge>{fan.tier}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="rounded-full">
                    Message
                  </Button>
                  <Button size="sm" className="rounded-full">
                    View history
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {demoFollowers.length === 0 && (
          <Card>
            <CardContent>
              <p className="text-sm text-[#6C757D]">
                You don’t have any followers yet. Share your profile link and host a few events to start building
                your fan list.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
