import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';

const upcomingMeets = [
  {
    id: 'meet-1',
    creator: 'Priya Sharma',
    date: new Date('2025-01-15T16:00:00'),
    duration: '10 minutes',
    meetingLink: 'https://meet.fanmeet.com/xyz123',
    status: 'Scheduled',
    startsIn: '2 days 3 hours',
  },
];

export function FanMeets() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Upcoming Meets</h1>
        <p className="text-sm text-[#6C757D]">Access your confirmed sessions and join on time.</p>
      </div>

      {upcomingMeets.length === 0 ? (
        <Card elevated className="grid min-h-[320px] place-items-center text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-5xl">🎫</span>
            <h3 className="text-xl font-semibold text-[#212529]">No meets yet</h3>
            <p className="text-sm text-[#6C757D]">
              Win an event to see your meeting details right here.
            </p>
            <Button>Browse Events →</Button>
          </div>
        </Card>
      ) : (
        <Card elevated className="border-l-4 border-[#28A745]">
          <CardHeader
            title="🎉 You Won!"
            subtitle="Get ready for your upcoming 1-on-1 session"
            className="border-b border-[#E9ECEF] pb-4"
          />
          <CardContent className="gap-6">
            {upcomingMeets.map((meet) => (
              <div key={meet.id} className="grid gap-4 md:grid-cols-[auto_1fr] md:gap-6">
                <Badge variant="primary" className="w-fit px-4 py-2 text-sm">
                  {meet.status}
                </Badge>
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#212529]">Meeting with {meet.creator}</h3>
                    <p className="text-sm text-[#6C757D]">
                      {formatDateTime(meet.date)} • Duration {meet.duration}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">
                        Meeting Link
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-[#212529]">{meet.meetingLink}</span>
                        <Button size="sm" variant="secondary">
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary">Add to Calendar</Button>
                      <Button disabled>Join Meeting →</Button>
                    </div>
                    <span className="text-sm text-[#6C757D]">
                      ⏰ Starts in: <strong className="text-[#C045FF]">{meet.startsIn}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
