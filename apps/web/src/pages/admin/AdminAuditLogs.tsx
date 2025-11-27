import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface AuditLog {
  id: string;
  actorId: string | null;
  actorType: string;
  actorName: string | null;
  action: string;
  actionType: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, any> | null;
  status: string;
  createdAt: string;
}

const actionTypeLabels: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  signup: 'Signup',
  event_created: 'Event Created',
  event_updated: 'Event Updated',
  event_cancelled: 'Event Cancelled',
  event_completed: 'Event Completed',
  bid_placed: 'Bid Placed',
  bid_won: 'Bid Won',
  bid_refunded: 'Bid Refunded',
  withdrawal_requested: 'Withdrawal Requested',
  withdrawal_approved: 'Withdrawal Approved',
  withdrawal_rejected: 'Withdrawal Rejected',
  user_suspended: 'User Suspended',
  user_banned: 'User Banned',
  user_unbanned: 'User Unbanned',
  creator_approved: 'Creator Approved',
  creator_rejected: 'Creator Rejected',
  settings_updated: 'Settings Updated',
  announcement_published: 'Announcement Published',
  meet_scheduled: 'Meet Scheduled',
  meet_completed: 'Meet Completed',
  payment_processed: 'Payment Processed',
  refund_processed: 'Refund Processed',
  other: 'Other',
};

const actorTypeVariant: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
  system: 'primary',
  admin: 'danger',
  creator: 'success',
  fan: 'warning',
};

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const [selectedActorType, setSelectedActorType] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedActionType) {
        query = query.eq('action_type', selectedActionType);
      }

      if (selectedActorType) {
        query = query.eq('actor_type', selectedActorType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        setLogs([]);
        return;
      }

      const mapped: AuditLog[] = (data ?? []).map((log: any) => ({
        id: log.id,
        actorId: log.actor_id,
        actorType: log.actor_type,
        actorName: log.actor_name,
        action: log.action,
        actionType: log.action_type,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        details: log.details,
        status: log.status,
        createdAt: log.created_at,
      }));

      setLogs(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [selectedActionType, selectedActorType]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.id.toLowerCase().includes(q) ||
      (log.actorName?.toLowerCase().includes(q) ?? false)
    );
  });

  const actionTypes = Object.keys(actionTypeLabels);
  const actorTypes = ['system', 'admin', 'creator', 'fan'];

  const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
    success: 'success',
    warning: 'warning',
    error: 'danger',
  };

  const exportLogs = () => {
    const csvContent = 'ID,Time,Actor,Action,Type,Status\n' +
      filteredLogs.map((log) =>
        `${log.id},"${formatDateTime(log.createdAt)}","${log.actorName || log.actorType}","${log.action}",${log.actionType},${log.status}`
      ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Audit Logs</h1>
          <p className="text-sm text-[#6C757D]">Immutable record of every critical action across the platform.</p>
        </div>
        <Button variant="secondary" onClick={exportLogs}>
          📥 Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Filter logs by actor type and action type" />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput
            label="Search"
            placeholder="ID, actor, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Actor Type</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <Button
                size="sm"
                variant={selectedActorType === null ? 'secondary' : 'ghost'}
                onClick={() => setSelectedActorType(null)}
              >
                All
              </Button>
              {actorTypes.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={selectedActorType === type ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedActorType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Action Type</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <Button
                size="sm"
                variant={selectedActionType === null ? 'secondary' : 'ghost'}
                onClick={() => setSelectedActionType(null)}
              >
                All
              </Button>
              {['login', 'bid_placed', 'bid_won', 'bid_refunded', 'withdrawal_approved', 'event_created'].map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={selectedActionType === type ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedActionType(type)}
                >
                  {actionTypeLabels[type]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Log Stream" subtitle={`${filteredLogs.length} entries · Newest first`} />
        <CardContent className="space-y-4">
          {filteredLogs.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6C757D]">
              {isLoading ? 'Loading logs...' : 'No audit logs found. Actions will appear here as they occur.'}
            </p>
          )}
          {filteredLogs.map((log) => (
            <div key={log.id} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{log.action}</div>
                <Badge variant={statusVariant[log.status] ?? 'primary'}>
                  {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                </Badge>
              </div>
              <p className="mt-2 text-[#6C757D]">
                {formatDateTime(log.createdAt)} ·{' '}
                <Badge variant={actorTypeVariant[log.actorType] ?? 'primary'}>
                  {log.actorType}
                </Badge>
                {log.actorName && ` · ${log.actorName}`}
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <p className="mt-2 text-xs text-[#6C757D]">
                  {JSON.stringify(log.details).slice(0, 200)}
                  {JSON.stringify(log.details).length > 200 && '...'}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="primary">{actionTypeLabels[log.actionType] ?? log.actionType}</Badge>
                {log.resourceType && (
                  <Badge variant="warning">{log.resourceType}</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
