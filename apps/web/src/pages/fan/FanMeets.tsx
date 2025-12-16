import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { useEvents } from '../../contexts/EventContext';

function getStartsIn(scheduledAt: string) {
  const start = new Date(scheduledAt);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();

  if (diffMs <= 0) return 'Starting soon';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const remHours = hours % 24;
    return `${days} day${days > 1 ? 's' : ''}${remHours > 0 ? ` ${remHours} hr${remHours > 1 ? 's' : ''}` : ''}`;
  }

  if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`;
  }

  return `${minutes} min`;
}

export function FanMeets() {
  const { myMeets } = useEvents();

  // Filter for scheduled, live, and completed meets
  const upcomingMeets = myMeets
    .filter((meet) => meet.status === 'scheduled' || meet.status === 'live' || meet.status === 'completed')
    .sort((a, b) => {
      // Sort: live first, then scheduled, then completed
      const statusOrder = { live: 0, scheduled: 1, completed: 2 };
      const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 3) - (statusOrder[b.status as keyof typeof statusOrder] || 3);
      if (statusDiff !== 0) return statusDiff;
      // For same status, sort by scheduledAt descending (recent on top)
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    });

  // Categorize meets by status
  const liveMeets = upcomingMeets.filter((meet) => meet.status === 'live');
  const scheduledMeets = upcomingMeets.filter((meet) => meet.status === 'scheduled');
  const completedMeets = upcomingMeets.filter((meet) => meet.status === 'completed');

  const handleCopy = (link?: string) => {
    if (!link) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link);
    }
  };

  const handleJoin = (link?: string) => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

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
                <Badge 
                  variant={meet.status === 'live' ? 'success' : meet.status === 'completed' ? 'default' : 'primary'} 
                  className={`w-fit px-4 py-2 text-sm ${meet.status === 'live' ? 'animate-pulse' : ''}`}
                >
                  {meet.status === 'live' ? '🔴 LIVE - Creator is waiting!' : meet.status === 'completed' ? '✅ Completed' : 'Scheduled'}
                </Badge>
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#212529]">
                      Meeting with {meet.creatorDisplayName || meet.creatorUsername}
                    </h3>
                    <p className="text-sm text-[#6C757D]">
                      {formatDateTime(meet.scheduledAt)} • Duration {meet.durationMinutes} minutes
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">
                        Meeting Link
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="break-all text-sm text-[#212529]">
                          {meet.meetingLink || 'Link not available yet'}
                        </span>
                        {meet.meetingLink && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopy(meet.meetingLink)}
                          >
                            Copy
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {meet.status !== 'completed' && (
                        <Button variant="secondary">Add to Calendar</Button>
                      )}
                      <Button
                        disabled={!meet.meetingLink || meet.status === 'completed'}
                        onClick={() => handleJoin(meet.meetingLink)}
                      >
                        {meet.status === 'completed' ? 'Meeting Ended' : 'Join Meeting →'}
                      </Button>
                    </div>
                    {meet.status !== 'completed' ? (
                      <span className="text-sm text-[#6C757D]">
                        ⏰ Starts in:{' '}
                        <strong className="text-[#C045FF]">
                          {getStartsIn(meet.scheduledAt)}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-sm text-[#6C757D]">
                        ✅ This meeting has been completed
                      </span>
                    )}
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
