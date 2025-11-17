import { Card, CardContent, CardHeader, Button, Badge } from '@fanmeet/ui';

const demoCreators = [
  {
    id: 'creator-1',
    name: 'Aarav Mehta',
    handle: '@aaravlive',
    status: 'Subscribed',
    events: 3,
    nextEvent: 'Today • 9:00 PM',
  },
  {
    id: 'creator-2',
    name: 'Sana Kapoor',
    handle: '@sanatalks',
    status: 'Following',
    events: 5,
    nextEvent: 'Tomorrow • 7:30 PM',
  },
  {
    id: 'creator-3',
    name: 'Velocity Gaming',
    handle: '@velocitygg',
    status: 'Subscribed',
    events: 2,
    nextEvent: 'This weekend',
  },
];

export function FanFollowing() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#212529]">Following & subscriptions</h1>
        <p className="mt-1 text-sm text-[#6C757D]">
          Creators you follow or subscribe to. Join their upcoming events faster from here.
        </p>
      </div>

      <div className="space-y-4">
        {demoCreators.map((creator) => (
          <Card key={creator.id} elevated className="border-none bg-white/95">
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="h-10 w-10 rounded-full bg-[#050014] text-center text-sm font-semibold leading-10 text-white">
                    {creator.name.charAt(0)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#212529]">{creator.name}</span>
                    <span className="text-xs text-[#6C757D]">{creator.handle}</span>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6C757D]">
                  <span>
                    <strong className="font-semibold text-[#212529]">{creator.events}</strong> active events
                  </span>
                  <span>Next: {creator.nextEvent}</span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <Badge variant={creator.status === 'Subscribed' ? 'success' : 'primary'}>
                  {creator.status}
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full">
                    View profile
                  </Button>
                  <Button size="sm" variant="secondary" className="rounded-full">
                    Browse events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {demoCreators.length === 0 && (
          <Card>
            <CardContent>
              <p className="text-sm text-[#6C757D]">
                You’re not following any creators yet. Start by placing a bid or hitting follow on a creator profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
