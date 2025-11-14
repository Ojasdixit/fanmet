import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';

const upcomingSessions = [
  {
    id: 'meet-1',
    title: 'Premium AMA',
    fan: 'Rahul Kumar',
    scheduledFor: new Date('2025-01-15T17:00:00'),
    duration: '15 minutes',
    status: 'Confirmed',
    joinLink: 'https://meet.fanmeet.com/creator/123'
  },
  {
    id: 'meet-2',
    title: 'Backstage Hangout',
    fan: 'Pooja Mehta',
    scheduledFor: new Date('2025-01-18T20:30:00'),
    duration: '10 minutes',
    status: 'Awaiting payment',
    joinLink: 'https://meet.fanmeet.com/creator/987'
  }
];

const preparationChecklist = [
  'Review fan questions in advance to personalize the session.',
  'Test your audio/video setup 15 minutes before the meet.',
  'Keep exclusive content ready to reward high bidders.',
  'Use the built-in timer to stay on schedule.'
];

const statusVariantMap: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  Confirmed: 'success',
  'Awaiting payment': 'warning',
  Completed: 'primary'
};

export function CreatorMeets() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Upcoming Meets</h1>
        <p className="text-sm text-[#6C757D]">Manage your scheduled sessions and turn every meet into a wow moment.</p>
      </div>

      <Card elevated>
        <CardHeader
          title="Session Prep Center"
          subtitle="Best practices to deliver memorable fan experiences."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-3">
          {preparationChecklist.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-[12px] border border-[#E9ECEF] bg-white p-4">
              <span className="mt-1 text-lg">✅</span>
              <p className="text-sm text-[#212529]">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Scheduled sessions"
          subtitle="Direct links and status updates for your upcoming meets."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="flex flex-col gap-4 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariantMap[session.status] ?? 'default'}>{session.status}</Badge>
                  <span className="text-xs text-[#6C757D]">
                    {formatDateTime(session.scheduledFor)} • {session.duration}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#212529]">{session.title}</h3>
                  <p className="text-sm text-[#6C757D]">with {session.fan}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-sm text-[#6C757D]">
                <span>{session.joinLink}</span>
                <Button size="sm">Copy join link</Button>
              </div>
            </div>
          ))}
          <Button variant="ghost" className="self-start">
            View calendar →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
