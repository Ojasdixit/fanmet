import { Card, CardHeader, CardContent, Button, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { useEvents } from '../../contexts/EventContext';
import { useNavigate } from 'react-router-dom';

export function FanBids() {
  const { myBids, events } = useEvents();
  const navigate = useNavigate();

  // Filter active bids (active or outbid) vs past results (won, lost, cancelled)
  const activeBids = myBids.filter(bid => bid.status === 'active' || bid.status === 'outbid');
  const pastResults = myBids.filter(bid => bid.status === 'won' || bid.status === 'lost' || bid.status === 'cancelled');

  // Get event details for each bid
  const getEventDetails = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">My Bids</h1>
        <p className="text-sm text-[#6C757D]">Track your bidding activity and results.</p>
      </div>

      <Card elevated>
        <CardHeader
          title="Active Bids"
          subtitle="Stay on top of the events you are currently bidding on"
        />
        <CardContent className="gap-6">
          {activeBids.length === 0 ? (
            <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-8 text-center">
              <p className="text-sm text-[#6C757D]">You don't have any active bids.</p>
              <Button className="mt-4" onClick={() => navigate('/fan')}>
                Browse Events
              </Button>
            </div>
          ) : (
            activeBids.map((bid) => {
              const event = getEventDetails(bid.eventId);
              const isOutbid = bid.status === 'outbid';

              return (
                <div
                  key={bid.id}
                  className={`grid gap-3 rounded-[16px] border p-4 md:grid-cols-[1.5fr_1fr_auto] md:items-center ${isOutbid
                    ? 'border-[#FFC107] bg-[#FFF9E6]'
                    : 'border-[#E9ECEF] bg-[#F8F9FA]'
                    }`}
                >
                  <div>
                    <div className="text-sm text-[#6C757D]">{event?.creatorDisplayName || 'Unknown Creator'}</div>
                    <div className="text-base font-semibold text-[#212529]">{bid.eventTitle || 'Event'}</div>
                    {isOutbid && (
                      <Badge variant="danger" className="mt-1">⚠️ You've been outbid!</Badge>
                    )}
                    {event?.status === 'Accepting Bids' && !isOutbid && (
                      <div className="mt-1 inline-flex rounded-[8px] bg-[#1E4620] px-2 py-0.5">
                        <span className="text-[10px] font-semibold text-[#4ADE80]">✓ Accepting Bids</span>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-1 text-sm text-[#6C757D] md:justify-items-end">
                    <span>
                      Your Bid: <strong className="text-[#212529]">{formatCurrency(bid.amount)}</strong>
                    </span>
                    {event && (
                      <>
                        <span>
                          Current: <strong className="text-[#C045FF]">{formatCurrency(event.currentBid)}</strong>
                        </span>
                        <span>⏱️ {event.endsIn}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant={isOutbid ? 'primary' : 'secondary'}
                      onClick={() => navigate(`/events/${bid.eventId}`)}
                    >
                      {isOutbid ? 'Increase Bid Now' : 'Increase Bid'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/events/${bid.eventId}`)}>
                      Details →
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Bid Results" />
        <CardContent className="overflow-x-auto">
          {pastResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#6C757D]">
              No past bid results yet.
            </div>
          ) : (
            <table className="min-w-full table-auto border-collapse text-left text-sm">
              <thead className="text-[#6C757D]">
                <tr>
                  <th className="border-b border-[#E9ECEF] pb-3">Creator</th>
                  <th className="border-b border-[#E9ECEF] pb-3">Event</th>
                  <th className="border-b border-[#E9ECEF] pb-3">Your Bid</th>
                  <th className="border-b border-[#E9ECEF] pb-3">Result</th>
                </tr>
              </thead>
              <tbody className="text-[#212529]">
                {pastResults.map((bid) => (
                  <tr key={bid.id} className="border-b border-[#E9ECEF]">
                    <td className="py-3">{bid.creatorUsername || 'Unknown'}</td>
                    <td className="py-3">{bid.eventTitle || 'Event'}</td>
                    <td className="py-3">{formatCurrency(bid.amount)}</td>
                    <td className="py-3">
                      <Badge variant={bid.status === 'won' ? 'success' : 'danger'}>
                        {bid.status === 'won' ? '🎉 Won' : bid.status === 'lost' ? '❌ Lost' : 'Cancelled'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
