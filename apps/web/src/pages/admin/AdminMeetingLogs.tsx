import { useEffect, useState } from 'react';
import { Card, CardContent, Badge, Button } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface MeetingLog {
  id: string;
  meet_id: string;
  event_type: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface MeetWithLogs {
  id: string;
  event_id: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  creator_id: string;
  fan_id: string;
  creator_started_at: string | null;
  fan_joined_at: string | null;
  recording_started_at: string | null;
  recording_stopped_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_id: string | null;
  completed_at: string | null;
  logs: MeetingLog[];
  creator_profile?: { username: string; display_name: string };
  fan_profile?: { username: string; display_name: string };
  event?: { title: string };
}

interface RefundRecord {
  id: string;
  event_id: string;
  fan_id: string;
  amount: number;
  refund_amount: number;
  refund_status: string;
  refunded_at: string;
  fan_profile?: { username: string; display_name: string };
  event?: { title: string };
}

interface Stats {
  total: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
  totalRefunds: number;
  totalRefundAmount: number;
}

const eventTypeColors: Record<string, string> = {
  CREATOR_STREAM_STARTED: 'bg-emerald-100 text-emerald-800',
  CREATOR_JOINED: 'bg-blue-100 text-blue-800',
  FAN_JOINED: 'bg-violet-100 text-violet-800',
  FAN_WAITING_ROOM: 'bg-amber-100 text-amber-800',
  RECORDING_STARTED: 'bg-rose-100 text-rose-800',
  RECORDING_STOPPED: 'bg-slate-100 text-slate-800',
  MEETING_CANCELLED_NO_SHOW_CREATOR: 'bg-red-100 text-red-800',
  REFUND_ISSUED: 'bg-orange-100 text-orange-800',
  MEETING_COMPLETED: 'bg-green-100 text-green-800',
  FAN_JOIN_STATUS_AT_S: 'bg-indigo-100 text-indigo-800',
};

const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
  scheduled: { color: 'text-blue-600', bg: 'bg-blue-500', icon: '📅' },
  live: { color: 'text-green-600', bg: 'bg-green-500', icon: '🔴' },
  completed: { color: 'text-gray-600', bg: 'bg-gray-500', icon: '✅' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-500', icon: '❌' },
  cancelled_no_show_creator: { color: 'text-red-600', bg: 'bg-red-600', icon: '🚫' },
};

type FilterStatus = 'all' | 'scheduled' | 'live' | 'completed' | 'cancelled_no_show_creator';
type TabType = 'overview' | 'meetings' | 'refunds' | 'logs';

export function AdminMeetingLogs() {
  const [meets, setMeets] = useState<MeetWithLogs[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [allLogs, setAllLogs] = useState<MeetingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeet, setSelectedMeet] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats>({ 
    total: 0, scheduled: 0, live: 0, completed: 0, cancelled: 0, 
    totalRefunds: 0, totalRefundAmount: 0 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMeets(), fetchRefunds(), fetchAllLogs()]);
    setLoading(false);
  };

  const fetchMeets = async () => {
    const { data: meetsData, error: meetsError } = await supabase
      .from('meets')
      .select('*')
      .order('scheduled_at', { ascending: false })
      .limit(100);

    if (meetsError) {
      console.error('Error fetching meets:', meetsError);
      return;
    }

    const creatorIds = [...new Set((meetsData || []).map(m => m.creator_id))];
    const fanIds = [...new Set((meetsData || []).map(m => m.fan_id))];
    const eventIds = [...new Set((meetsData || []).map(m => m.event_id))];

    const [profilesRes, eventsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, username, display_name').in('user_id', [...creatorIds, ...fanIds]),
      supabase.from('events').select('id, title').in('id', eventIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const eventMap = new Map((eventsRes.data || []).map(e => [e.id, e]));

    const meetsWithDetails: MeetWithLogs[] = [];
    for (const meet of meetsData || []) {
      const { data: logsData } = await supabase
        .from('meeting_event_logs')
        .select('*')
        .eq('meet_id', meet.id)
        .order('timestamp', { ascending: true });

      meetsWithDetails.push({
        ...meet,
        logs: logsData || [],
        creator_profile: profileMap.get(meet.creator_id),
        fan_profile: profileMap.get(meet.fan_id),
        event: eventMap.get(meet.event_id),
      });
    }

    setMeets(meetsWithDetails);
    setStats(prev => ({
      ...prev,
      total: meetsWithDetails.length,
      scheduled: meetsWithDetails.filter(m => m.status === 'scheduled').length,
      live: meetsWithDetails.filter(m => m.status === 'live').length,
      completed: meetsWithDetails.filter(m => m.status === 'completed').length,
      cancelled: meetsWithDetails.filter(m => m.status === 'cancelled_no_show_creator' || m.status === 'cancelled').length,
    }));
  };

  const fetchRefunds = async () => {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('refund_status', 'refunded')
      .order('refunded_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching refunds:', error);
      return;
    }

    const fanIds = [...new Set((data || []).map(b => b.fan_id))];
    const eventIds = [...new Set((data || []).map(b => b.event_id))];

    const [profilesRes, eventsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, username, display_name').in('user_id', fanIds),
      supabase.from('events').select('id, title').in('id', eventIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const eventMap = new Map((eventsRes.data || []).map(e => [e.id, e]));

    const refundsWithDetails = (data || []).map(bid => ({
      ...bid,
      fan_profile: profileMap.get(bid.fan_id),
      event: eventMap.get(bid.event_id),
    }));

    const totalAmount = refundsWithDetails.reduce((sum, r) => sum + (r.refund_amount || r.amount), 0);
    
    setRefunds(refundsWithDetails);
    setStats(prev => ({ 
      ...prev, 
      totalRefunds: refundsWithDetails.length,
      totalRefundAmount: totalAmount,
    }));
  };

  const fetchAllLogs = async () => {
    const { data, error } = await supabase
      .from('meeting_event_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);

    if (!error) setAllLogs(data || []);
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();
  const formatShortDate = (date: string) => new Date(date).toLocaleDateString();

  const filteredMeets = filterStatus === 'all' 
    ? meets 
    : meets.filter(m => m.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-[#C045FF] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212529]">Meeting Lifecycle</h1>
          <p className="text-sm text-[#6C757D]">Automated meeting management with auto-refunds</p>
        </div>
        <Button onClick={fetchData} variant="secondary" size="sm">
          ↻ Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {(['overview', 'meetings', 'refunds', 'logs'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab 
                ? 'bg-white text-[#C045FF] shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'meetings' && `Meetings (${stats.total})`}
            {tab === 'refunds' && `Refunds (${stats.totalRefunds})`}
            {tab === 'logs' && `Logs (${allLogs.length})`}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">📊</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 hover:shadow-md transition-shadow border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">📅</div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Scheduled</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 hover:shadow-md transition-shadow border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">🔴</div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.live}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Live</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 hover:shadow-md transition-shadow border-l-4 border-gray-400">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">✅</div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 hover:shadow-md transition-shadow border-l-4 border-red-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">🚫</div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Cancelled</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Auto Payment Flow Info */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
                ⚡
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800 text-lg mb-2">Automatic Payment System Active</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <div>
                      <p className="font-medium text-green-800">Creator No-Show</p>
                      <p className="text-green-600">100% auto-refund to fan's wallet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <div>
                      <p className="font-medium text-green-800">Meeting Completed</p>
                      <p className="text-green-600">90% auto-credited to creator (10% platform fee)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <div>
                      <p className="font-medium text-green-800">Fan No-Show</p>
                      <p className="text-green-600">No refund - creator still gets paid on completion</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <div>
                      <p className="font-medium text-green-800">Cron Running</p>
                      <p className="text-green-600">Checks every minute for no-shows & completions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Refund Summary */}
          {stats.totalRefunds > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">💸</div>
                  <div>
                    <p className="font-semibold text-gray-800">{stats.totalRefunds} Auto-Refunds Processed</p>
                    <p className="text-sm text-gray-500">Total: {formatCurrency(stats.totalRefundAmount)}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('refunds')}>
                  View All →
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Activity */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {allLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${eventTypeColors[log.event_type] || 'bg-gray-100'}`}>
                    {log.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">{log.meet_id.slice(0, 8)}...</span>
                  <span className="text-xs text-gray-400">{formatDate(log.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'scheduled', 'live', 'completed', 'cancelled_no_show_creator'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === status 
                    ? 'bg-[#C045FF] text-white shadow-sm' 
                    : 'bg-white text-gray-600 border hover:border-[#C045FF] hover:text-[#C045FF]'
                }`}
              >
                {status === 'all' ? 'All' : status === 'cancelled_no_show_creator' ? 'No-Show' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredMeets.map((meet) => (
              <Card key={meet.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedMeet(selectedMeet === meet.id ? null : meet.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${statusConfig[meet.status]?.bg || 'bg-gray-400'} flex items-center justify-center text-white text-lg`}>
                        {statusConfig[meet.status]?.icon || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{meet.event?.title || 'Untitled'}</p>
                        <p className="text-sm text-gray-500">
                          {meet.creator_profile?.display_name || 'Creator'} → {meet.fan_profile?.display_name || 'Fan'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={meet.status === 'live' ? 'success' : meet.status === 'completed' ? 'primary' : meet.status.includes('cancelled') ? 'danger' : 'default'}>
                        {meet.status.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{formatShortDate(meet.scheduled_at)}</p>
                    </div>
                  </div>
                </div>

                {selectedMeet === meet.id && (
                  <CardContent className="bg-gray-50 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Creator Started</p>
                        <p className="font-medium text-sm mt-1">
                          {meet.creator_started_at ? formatDate(meet.creator_started_at) : <span className="text-red-500">Not started</span>}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Fan Joined</p>
                        <p className="font-medium text-sm mt-1">
                          {meet.fan_joined_at ? formatDate(meet.fan_joined_at) : <span className="text-red-500">Not joined</span>}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Recording</p>
                        <p className="font-medium text-sm mt-1">
                          {meet.recording_started_at ? <span className="text-green-600">✓ Recorded</span> : <span className="text-gray-400">None</span>}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                        <p className="font-medium text-sm mt-1">{meet.duration_minutes} min</p>
                      </div>
                    </div>

                    {meet.cancellation_reason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Cancellation: {meet.cancellation_reason}</p>
                        {meet.refund_id && <p className="text-xs text-red-600 mt-1">Refund ID: {meet.refund_id}</p>}
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Event Timeline ({meet.logs.length})</h4>
                      {meet.logs.length === 0 ? (
                        <p className="text-sm text-gray-400">No events yet</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {meet.logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 p-2 bg-white rounded border text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${eventTypeColors[log.event_type] || 'bg-gray-100'}`}>
                                {log.event_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-gray-400">{formatDate(log.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {filteredMeets.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-gray-500">No meetings found</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white text-xl">⚡</div>
              <div>
                <p className="font-bold text-green-800">Auto-Refund Active</p>
                <p className="text-sm text-green-600">Creator no-shows trigger 100% instant wallet refund to fans</p>
              </div>
            </div>
          </Card>

          {stats.totalRefunds > 0 && (
            <div className="flex gap-4">
              <Card className="flex-1 p-4">
                <p className="text-sm text-gray-500">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRefunds}</p>
              </Card>
              <Card className="flex-1 p-4">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRefundAmount)}</p>
              </Card>
            </div>
          )}

          {refunds.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-2">✨</p>
              <p className="text-gray-500">No refunds processed yet</p>
              <p className="text-sm text-gray-400 mt-1">Refunds appear here when creators miss meetings</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {refunds.map((refund) => (
                <Card key={refund.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg">
                        💸
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{refund.event?.title || 'Unknown Event'}</p>
                        <p className="text-sm text-gray-500">
                          To: {refund.fan_profile?.display_name || refund.fan_profile?.username || 'Fan'}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(refund.refunded_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">{formatCurrency(refund.refund_amount || refund.amount)}</p>
                      <Badge variant="success">Auto-Refunded</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {allLogs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-500">No logs yet</p>
            </Card>
          ) : (
            allLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${eventTypeColors[log.event_type] || 'bg-gray-100'}`}>
                  {log.event_type.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">Meet: <code className="bg-gray-100 px-1 rounded">{log.meet_id.slice(0, 8)}</code></span>
                    <span className="text-gray-400">{formatDate(log.timestamp)}</span>
                  </div>
                  {Object.keys(log.metadata || {}).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View metadata</summary>
                      <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminMeetingLogs;
