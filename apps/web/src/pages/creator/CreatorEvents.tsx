import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';

export function CreatorEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, finalizeEvent } = useEvents();

  const creatorUsername = user?.role === 'creator' ? user.username : null;
  const creatorEvents = creatorUsername
    ? events.filter((event) => event.creatorUsername === creatorUsername)
    : [];

  const handleShareEventLink = (eventId: string) => {
    const url = `${window.location.origin}/events/${eventId}`;

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

  if (user?.creatorProfileStatus === 'pending') {
    return (
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <h3 className="text-lg font-semibold">Pending Approval</h3>
          <p>Your creator account is currently pending approval. Please wait for approval from an admin.</p>
        </div>
      </div>
    );
  }

  if (user?.creatorProfileStatus === 'rejected') {
    return (
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <h3 className="text-lg font-semibold">Application Rejected</h3>
          <p>Your creator account application was rejected by an admin.</p>
        </div>
      </div>
    );
  }

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
                <Button onClick={() => handleShareEventLink(event.id)}>Copy Link</Button>
                {/* Show End Bidding button for active events */}
                {(event.status === 'Accepting Bids' || event.status === 'Upcoming') && (
                  <Button
                    variant="primary"
                    className="bg-green-600 hover:bg-green-700 text-white border-none"
                    onClick={async () => {
                      if (window.confirm('Close bidding and generate meeting link for the highest bidder?')) {
                        try {
                          await finalizeEvent(event.id);
                          window.alert('Success! Meeting created. Check "My Meets" tab.');
                        } catch (err) {
                          window.alert('Error finalizing event. Please try again.');
                        }
                      }
                    }}
                  >
                    End Bidding & Create Meet
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate(`/events/${event.id}`)}>
                  View Details →
                </Button>
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
