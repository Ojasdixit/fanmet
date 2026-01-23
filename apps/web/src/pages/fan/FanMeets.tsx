import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatDateTime, formatCurrency } from '@fanmeet/utils';
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
  const { myMeets, events } = useEvents();
  const navigate = useNavigate();
  const [loadingNoBids, setLoadingNoBids] = useState(true);

  // Filter for scheduled, live, completed, and cancelled meets
  const upcomingMeets = myMeets
    .filter((meet) => meet.status === 'scheduled' || meet.status === 'live' || meet.status === 'completed' || meet.status === 'cancelled' || meet.status === 'cancelled_no_show_creator')
    .sort((a, b) => {
      // Priority 1: Live meetings first
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;

      // Priority 2: Recent meetings (within 24 hours) for scheduled status
      const now = new Date();
      const aTime = new Date(a.scheduledAt);
      const bTime = new Date(b.scheduledAt);
      const aIsRecent = a.status === 'scheduled' && (aTime.getTime() - now.getTime()) <= 24 * 60 * 60 * 1000 && aTime > now;
      const bIsRecent = b.status === 'scheduled' && (bTime.getTime() - now.getTime()) <= 24 * 60 * 60 * 1000 && bTime > now;

      if (aIsRecent && !bIsRecent) return -1;
      if (bIsRecent && !aIsRecent) return 1;

      // Priority 3: Sort by status (scheduled, completed, cancelled)
      const statusOrder = { live: 0, scheduled: 1, completed: 2, cancelled: 3, cancelled_no_show_creator: 3 };
      const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 4) - (statusOrder[b.status as keyof typeof statusOrder] || 4);
      if (statusDiff !== 0) return statusDiff;

      // Priority 4: For same status, sort by scheduledAt ascending (nearest first)
      return aTime.getTime() - bTime.getTime();
    });

  // Categorize meets by status
  const liveMeets = upcomingMeets.filter((meet) => meet.status === 'live');
  const scheduledMeets = upcomingMeets.filter((meet) => meet.status === 'scheduled');
  const completedMeets = upcomingMeets.filter((meet) => meet.status === 'completed');

  const eventsWithNoBids = useMemo(() => {
    const eligibleStatuses = new Set(['Upcoming', 'LIVE', 'Accepting Bids', 'Completed']);
    return events
      .filter((event) => eligibleStatuses.has(event.status) && event.currentBid === 0)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [events]);

  useEffect(() => {
    if (loadingNoBids && events.length >= 0) {
      setLoadingNoBids(false);
    }
  }, [events.length, loadingNoBids]);

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
            {upcomingMeets.map((meet) => {
              const now = new Date();
              const meetTime = new Date(meet.scheduledAt);
              const isRecent = meet.status === 'scheduled' && (meetTime.getTime() - now.getTime()) <= 24 * 60 * 60 * 1000 && meetTime > now;

              return (
                <div key={meet.id} className={`grid gap-4 md:grid-cols-[auto_1fr] md:gap-6 ${isRecent ? 'rounded-lg border-2 border-[#FF6B35] bg-[#FFF5F0] p-4 -mx-4' : ''}`}>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant={meet.status === 'live' ? 'success' : meet.status === 'completed' ? 'default' : (meet.status === 'cancelled' || meet.status === 'cancelled_no_show_creator') ? 'danger' : 'primary'}
                      className={`w-fit px-4 py-2 text-sm ${meet.status === 'live' ? 'animate-pulse' : ''}`}
                    >
                      {meet.status === 'live' ? '🔴 LIVE - Creator is waiting!' :
                        meet.status === 'completed' ? '✅ Completed' :
                          meet.status === 'cancelled_no_show_creator' ? '🚫 Creator No-Show' :
                            meet.status === 'cancelled' ? '❌ Cancelled' : 'Scheduled'}
                    </Badge>
                    {isRecent && (
                      <Badge variant="danger" className="w-fit px-3 py-1 text-xs animate-pulse">
                        🔥 Starting Soon!
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#212529]">
                        Meeting with {meet.creatorDisplayName || meet.creatorUsername}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isRecent ? 'bg-[#FF6B35] text-white' : 'bg-[#F4E6FF] text-[#C045FF]'}`}>
                          <span className="text-lg">📅</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium opacity-90">Date & Time</span>
                            <span className="text-sm font-bold">{formatDateTime(meet.scheduledAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-[#E5DEFF] px-3 py-2 text-[#7B2CBF]">
                          <span className="text-lg">⏱️</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium opacity-90">Duration</span>
                            <span className="text-sm font-bold">{meet.durationMinutes} minutes</span>
                          </div>
                        </div>
                      </div>
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
                        {meet.status !== 'completed' && meet.status !== 'cancelled' && meet.status !== 'cancelled_no_show_creator' && (
                          <Button variant="secondary">Add to Calendar</Button>
                        )}
                        <button
                          disabled={!meet.meetingLink || meet.status === 'completed' || meet.status === 'cancelled' || meet.status === 'cancelled_no_show_creator'}
                          onClick={() => handleJoin(meet.meetingLink)}
                          className={`
                          relative rounded-full px-8 py-3 text-base font-semibold transition-all
                          ${!meet.meetingLink || meet.status === 'completed' || meet.status === 'cancelled' || meet.status === 'cancelled_no_show_creator'
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-[#050014] shadow-lg hover:shadow-xl transform hover:scale-105'
                            }
                        `}
                          style={
                            meet.meetingLink && meet.status !== 'completed' && meet.status !== 'cancelled' && meet.status !== 'cancelled_no_show_creator'
                              ? {
                                background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #A78BFA, #C084FC, #E0E7FF) border-box',
                                border: '2px solid transparent',
                              }
                              : undefined
                          }
                        >
                          {meet.status === 'completed' ? 'Meeting Ended' :
                            meet.status === 'cancelled_no_show_creator' ? 'Creator No-Show' :
                              meet.status === 'cancelled' ? 'Meeting Cancelled' : 'Join Meeting →'}
                        </button>
                      </div>
                      {meet.status !== 'completed' && meet.status !== 'cancelled' && meet.status !== 'cancelled_no_show_creator' ? (
                        <span className={`text-sm font-medium ${isRecent ? 'text-[#FF6B35]' : 'text-[#6C757D]'}`}>
                          ⏰ Starts in:{' '}
                          <strong className={isRecent ? 'text-[#FF6B35]' : 'text-[#C045FF]'}>
                            {getStartsIn(meet.scheduledAt)}
                          </strong>
                        </span>
                      ) : meet.status === 'completed' ? (
                        <span className="text-sm text-[#6C757D]">
                          ✅ This meeting has been completed
                        </span>
                      ) : (
                        <span className="text-sm text-[#6C757D]">
                          {meet.status === 'cancelled_no_show_creator' ? '🚫 Creator didn\'t show up - Full refund issued to your wallet' : '❌ This meeting was cancelled'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Events with No Bids Yet */}
      {loadingNoBids ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-sm text-[#6C757D]">Loading events...</div>
          </CardContent>
        </Card>
      ) : eventsWithNoBids.length > 0 ? (
        <Card>
          <CardHeader
            title="Events with No Bids"
            subtitle="Events that ended without any bids placed."
            className="border-b border-[#E9ECEF] pb-4"
          />
          <CardContent className="gap-4">
            {eventsWithNoBids.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-4 rounded-[14px] border border-[#E9ECEF] bg-white p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => event.status !== 'Completed' && navigate(`/events/${event.id}`)}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={event.status === 'Completed' ? 'default' : 'primary'}>
                    {event.status === 'Completed' ? '✅ Completed - No Bids' : '🎯 No Bids Yet'}
                  </Badge>
                  <span className="text-xs text-[#6C757D]">
                    {event.status === 'Completed' ? 'Ended' : 'Starts'} {formatDateTime(event.startsAt)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#212529]">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-[#6C757D] mt-1 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#6C757D]">Base Price</div>
                    <div className="font-semibold text-[#C045FF]">{formatCurrency(event.basePrice)}</div>
                  </div>
                  <Button size="sm" disabled={event.status === 'Completed'}>
                    {event.status === 'Completed' ? 'Event Ended' : 'View & Bid →'}
                  </Button>
                </div>
              </div>
            ))}
            {eventsWithNoBids.length > 10 && (
              <div className="text-center">
                <Button variant="secondary" onClick={() => navigate('/fan')}>
                  View More Events →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

    </div>
  );
}
