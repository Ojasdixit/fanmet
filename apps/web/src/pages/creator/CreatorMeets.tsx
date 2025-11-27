import { useEffect, useState } from 'react';
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
  completed: 'primary',
  cancelled: 'danger',
  no_show: 'warning'
};

export function CreatorMeets() {
  const { user } = useAuth();
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

  const markMeetAsComplete = async (meetId: string) => {
    if (!user) return;

    console.log('🔁 Marking meet as complete:', meetId);

    const { data, error } = await supabase
      .from('meets')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', meetId)
      .eq('creator_id', user.id)
      .select('id, status');

    if (error) {
      console.error('Error marking meet as complete:', error);
      alert('Failed to mark meeting as complete');
      return;
    }

    console.log('✅ Meet update result:', data);

    // Refresh the meets list
    fetchMeets();
  };

  const markMeetAsPending = async (meetId: string) => {
    if (!user) return;

    console.log('🔁 Marking meet as pending:', meetId);

    const { data, error } = await supabase
      .from('meets')
      .update({ status: 'scheduled', updated_at: new Date().toISOString() })
      .eq('id', meetId)
      .eq('creator_id', user.id)
      .select('id, status');

    if (error) {
      console.error('Error marking meet as pending:', error);
      alert('Failed to mark meeting as pending');
      return;
    }

    console.log('✅ Meet update result (pending):', data);

    // Refresh the meets list
    fetchMeets();
  };

  // Separate scheduled from completed meets
  // Show all scheduled meets regardless of date so creators can mark past meetings as complete
  const upcomingMeets = meets.filter((m) => m.status === 'scheduled');
  const completedMeets = meets.filter((m) => m.status === 'completed');

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

      <Card>
        <CardHeader
          title="Upcoming Sessions"
          subtitle="Direct links and status updates for your upcoming meets."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {upcomingMeets.map((session) => {
            // Get the winning bid amount
            const winningBid = session.bids && session.bids.length > 0
              ? Math.max(...session.bids.map((b: any) => b.amount))
              : session.events?.base_price || 0;

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
                      <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(session.meeting_link)}>
                        Copy Link
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => markMeetAsComplete(session.id)}
                    >
                      ✓ Mark as Done
                    </Button>
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
            // Get the winning bid amount
            const winningBid = session.bids && session.bids.length > 0
              ? Math.max(...session.bids.map((b: any) => b.amount))
              : session.events?.base_price || 0;

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
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => markMeetAsPending(session.id)}
                    >
                      ← Mark as Pending
                    </Button>
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
    </div>
  );
}
