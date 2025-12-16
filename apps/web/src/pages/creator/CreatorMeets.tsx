import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatDateTime, formatCurrency } from '@fanmeet/utils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const preparationChecklist = [
  'Review fan questions in advance to personalize the session.',
  'Test your audio/video setup 15 minutes before the meet.',
  'Keep exclusive content ready to reward high bidders.',
  'Use the built-in timer to stay on schedule.'
];

const statusVariantMap: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  scheduled: 'success',
  live: 'primary',
  completed: 'primary',
  cancelled: 'danger',
  cancelled_no_show_creator: 'danger',
  no_show: 'warning'
};

export function CreatorMeets() {
  const { user, onlineUsers } = useAuth();
  const navigate = useNavigate();
  const [meets, setMeets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('meets')
      .select(`
        *,
        events:event_id (title, base_price)
      `)
      .eq('creator_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching meets:', error);
      setLoading(false);
      return;
    }

    console.log('🔍 Fetched meets for creator:', user.id);
    console.log('📊 Meets data:', data);
    console.log('📝 Number of meets:', data?.length || 0);

    if (data && data.length > 0) {
      // Fetch fan profiles
      const fanIds = [...new Set(data.map(m => m.fan_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', fanIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      // Fetch bids for these events
      const eventIds = [...new Set(data.map(m => m.event_id))];
      const { data: bidsData } = await supabase
        .from('bids')
        .select('event_id, amount')
        .in('event_id', eventIds);

      // Attach bids and profiles to meets
      const meetsWithDetails = data.map(meet => ({
        ...meet,
        fan_profile: profileMap.get(meet.fan_id),
        bids: bidsData?.filter(b => b.event_id === meet.event_id) || []
      }));

      setMeets(meetsWithDetails);
    } else {
      setMeets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeets();
  }, [user]);

  // Meeting completion is handled automatically by the cron job
  // No manual status changes allowed

  const calculateWinningBid = (session: any) => {
    if (session?.bids?.length) {
      return Math.max(...session.bids.map((b: any) => b.amount || 0));
    }
    return session?.events?.base_price || 0;
  };

  // Separate active (scheduled/live) from completed meets
  // Show all scheduled and live meets regardless of date so creators can manage them
  const upcomingMeets = meets.filter((m) => m.status === 'scheduled' || m.status === 'live');
  const completedMeets = meets.filter((m) => m.status === 'completed');
  const cancelledMeets = meets.filter((m) => m.status === 'cancelled' || m.status === 'cancelled_no_show_creator');
  const noShowMeets = meets.filter((m) => m.status === 'cancelled_no_show_creator');
  const totalNoShowLoss = noShowMeets.reduce((sum, meet) => sum + calculateWinningBid(meet), 0);

  console.log('📅 Upcoming meets (scheduled):', upcomingMeets.length, upcomingMeets);
  console.log('✅ Completed meets:', completedMeets.length, completedMeets);
  console.log('📦 All meets:', meets.length, meets);

  if (loading) return <div className="p-8 text-center">Loading meets...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">My Meets</h1>
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

      {/* Auto-completion info banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="font-semibold text-blue-800">Automatic Meeting System</p>
            <p className="text-sm text-blue-600 mt-1">
              <strong>Important:</strong> You must start your call <strong>before</strong> the scheduled time. 
              If you don't join before the scheduled time, the meeting will be auto-cancelled and the fan will receive a full refund.
              Meetings automatically complete at the scheduled end time and your earnings (90%) will be credited to your wallet.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Upcoming Sessions"
          subtitle="Start your call before the scheduled time to avoid no-show cancellation."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {upcomingMeets.map((session) => {
            const winningBid = calculateWinningBid(session);

            return (
              <div key={session.id} className="flex flex-col gap-4 rounded-[14px] border border-[#E9ECEF] bg-white p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={statusVariantMap[session.status] ?? 'default'}>{session.status}</Badge>
                      <span className="text-xs text-[#6C757D]">
                        {formatDateTime(session.scheduled_at)} • {session.duration_minutes} mins
                      </span>
                      <span className="text-xs font-semibold text-[#28A745]">
                        Amount: {formatCurrency(winningBid)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#212529]">{session.events?.title || 'Untitled Event'}</h3>
                      <p className="text-sm text-[#6C757D]">with {session.fan_profile?.display_name || session.fan_profile?.username || 'Unknown Fan'}</p>
                    </div>
                    <div className="text-sm text-[#6C757D]">
                      <span className="font-medium">Meeting Link: </span>
                      <span className="break-all">{session.meeting_link || 'No link yet'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {session.meeting_link && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigator.clipboard.writeText(session.meeting_link)}
                          >
                            Copy Link
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/messages?chatWith=${session.fan_id}`)}
                          >
                            Message Fan
                          </Button>
                        </div>
                        {(() => {
                          const now = new Date();
                          const scheduledStart = new Date(session.scheduled_at);
                          const scheduledEnd = new Date(scheduledStart.getTime() + session.duration_minutes * 60 * 1000);
                          const canStartEarly = now >= new Date(scheduledStart.getTime() - 30000); // 30s buffer
                          const meetingEnded = now >= scheduledEnd || session.status === 'completed' || session.status === 'cancelled' || session.status === 'cancelled_no_show_creator';
                          const isLive = session.status === 'live';
                          
                          return (
                            <Button
                              size="sm"
                              disabled={meetingEnded || (!isLive && !onlineUsers.has(session.fan_id)) || (!isLive && !canStartEarly)}
                              variant={meetingEnded ? 'secondary' : 'primary'}
                              title={
                                meetingEnded
                                  ? "This meeting has ended"
                                  : isLive
                                    ? "Rejoin your live call"
                                    : !onlineUsers.has(session.fan_id)
                                      ? "Fan is offline. You cannot start the call."
                                      : !canStartEarly
                                        ? `Call starts at ${formatDateTime(session.scheduled_at)} (30s early buffer available)`
                                        : "Start the call"
                              }
                              onClick={() => window.open(session.meeting_link, '_blank', 'noopener,noreferrer')}
                            >
                              {meetingEnded ? '✓ Completed' : isLive ? 'Rejoin Call' : 'Start Call'}
                            </Button>
                          );
                        })()}
                        {!onlineUsers.has(session.fan_id) && (
                          <span className="text-[10px] text-red-500">Fan is offline</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {upcomingMeets.length === 0 && (
            <p className="text-sm text-[#6C757D]">No upcoming meets scheduled.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Completed Sessions"
          subtitle="Your past meets and earnings."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {completedMeets.map((session) => {
            const winningBid = calculateWinningBid(session);

            return (
              <div
                key={session.id}
                className="flex flex-col gap-4 rounded-[14px] border border-[#28A745] bg-gradient-to-r from-green-50 to-white p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="success">✓ Completed</Badge>
                      <span className="text-xs text-[#6C757D]">
                        {formatDateTime(session.scheduled_at)} • {session.duration_minutes} mins
                      </span>
                      <div className="flex items-center gap-2 rounded-full bg-[#28A745] px-3 py-1">
                        <span className="text-xs font-bold text-white">💰 {formatCurrency(winningBid)}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#212529]">{session.events?.title || 'Untitled Event'}</h3>
                      <p className="text-sm text-[#6C757D]">with {session.fan_profile?.display_name || session.fan_profile?.username || 'Unknown Fan'}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {completedMeets.length === 0 && (
            <p className="text-sm text-[#6C757D]">No completed meets yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Cancelled Sessions */}
      {cancelledMeets.length > 0 && (
        <Card>
          <CardHeader
            title="Cancelled Sessions"
            subtitle="Meetings that were cancelled due to no-show."
            className="border-b border-[#E9ECEF] pb-4"
          />
          <CardContent className="gap-4">
            {cancelledMeets.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-4 rounded-[14px] border border-red-200 bg-gradient-to-r from-red-50 to-white p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="danger">
                      {session.status === 'cancelled_no_show_creator' ? '🚫 No-Show' : '❌ Cancelled'}
                    </Badge>
                    <span className="text-xs text-[#6C757D]">
                      {formatDateTime(session.scheduled_at)} • {session.duration_minutes} mins
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#212529]">{session.events?.title || 'Untitled Event'}</h3>
                    <p className="text-sm text-[#6C757D]">with {session.fan_profile?.display_name || session.fan_profile?.username || 'Unknown Fan'}</p>
                  </div>
                  {session.status === 'cancelled_no_show_creator' && (
                    <p className="text-xs text-red-600">
                      ⚠️ You did not start the call before the scheduled time. Fan received a full refund.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Creator No-Show Impact */}
      <Card>
        <CardHeader
          title="Cancelled / No-Show Impact"
          subtitle="These meetings were auto-cancelled because you didn’t go live in time."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-red-200 bg-red-50 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-red-600 font-semibold">Total amount refunded</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalNoShowLoss)}</p>
              <p className="text-xs text-red-500">100% of the winning bid is refunded to the fan when you miss the call.</p>
            </div>
            <div className="ml-auto text-center">
              <p className="text-xs text-[#6C757D]">No-show instances</p>
              <p className="text-3xl font-bold text-red-600">{noShowMeets.length}</p>
            </div>
          </div>

          {noShowMeets.length === 0 ? (
            <p className="text-sm text-[#28A745]">Great job! You haven’t missed any meets.</p>
          ) : (
            noShowMeets.map((session) => {
              const winningBid = calculateWinningBid(session);
              return (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-[14px] border border-red-200 bg-gradient-to-r from-red-50 to-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="danger">🚫 Creator No-Show</Badge>
                    <span className="text-xs text-[#6C757D]">
                      {formatDateTime(session.scheduled_at)} • {session.duration_minutes} mins
                    </span>
                    <span className="text-xs font-semibold text-red-600">
                      Lost: {formatCurrency(winningBid)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#212529]">{session.events?.title || 'Untitled Event'}</h3>
                    <p className="text-sm text-[#6C757D]">Fan: {session.fan_profile?.display_name || session.fan_profile?.username || 'Unknown Fan'}</p>
                  </div>
                  <p className="text-xs text-red-600">
                    ⚠️ Call never started. Fan was auto-refunded and the slot was marked as missed.
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
