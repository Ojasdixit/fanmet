import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';

export function CreatorEvents() {
  const { user } = useAuth();
  const { events } = useEvents();

  const creatorUsername = user?.role === 'creator' ? user.username : null;
  const creatorEvents = creatorUsername
    ? events.filter((event) => event.creatorUsername === creatorUsername)
    : [];

  const handleShareLink = () => {
    if (!creatorUsername) {
      window.alert('Please login as a creator to share your event link.');
      return;
    }

    const url = `${window.location.origin}/${creatorUsername}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          window.alert('Share link copied to clipboard. Send it to your fans to start receiving bids.');
        },
        () => {
          window.prompt('Share this link with your fans:', url);
        },
      );
    } else {
      window.prompt('Share this link with your fans:', url);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">My Events</h1>
          <p className="text-sm text-[#6C757D]">Manage and monitor all of your scheduled sessions.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Upcoming', 'Live', 'Completed'].map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={filter === 'All' ? 'primary' : 'secondary'}
              className="rounded-full px-4"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {creatorUsername && creatorEvents.length > 0 ? (
          creatorEvents.map((event) => (
            <Card
              key={event.id}
              elevated
              className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                    {event.status === 'LIVE' ? '🔴 LIVE' : event.status}
                  </Badge>
                  <span className="text-sm text-[#6C757D]">{event.date}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#212529]">{event.title}</h3>
                <div className="text-sm text-[#6C757D]">
                  Duration: {event.duration} • Base Price: {formatCurrency(event.basePrice)}
                </div>
                <div className="grid gap-2 rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 text-sm">
                  <span>
                    💰 Current Bid:{' '}
                    <strong className="text-[#212529]">{formatCurrency(event.currentBid)}</strong>
                  </span>
                  <span>🔥 {event.participants} participants</span>
                  <span>⏱️ {event.endsIn}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Edit</Button>
                <Button variant="danger">Delete</Button>
                <Button onClick={handleShareLink}>Copy Link</Button>
                <Button variant="ghost">View Details →</Button>
              </div>
            </Card>
          ))
        ) : (
          <Card elevated className="grid min-h-[220px] place-items-center text-center">
            <CardContent className="flex flex-col items-center gap-3">
              <span className="text-4xl">🎫</span>
              <h3 className="text-lg font-semibold text-[#212529]">No events yet</h3>
              <p className="max-w-md text-sm text-[#6C757D]">
                Create your first FanMeet event to start receiving bids. Once created, you’ll see it listed here and
                can share your public link with fans.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
