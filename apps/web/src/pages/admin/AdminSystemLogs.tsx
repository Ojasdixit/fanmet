import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface SystemLog {
  id: string;
  actorType: string;
  actorName: string | null;
  action: string;
  actionType: string;
  status: string;
  resourceType: string | null;
  details: Record<string, any> | null;
  createdAt: string;
}

const actionTypes = ['login', 'bid_placed', 'bid_won', 'event_created', 'withdrawal_approved', 'settings_updated'];

export function AdminSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        return;
      }

      const mapped: SystemLog[] = (data ?? []).map((log: any) => ({
        id: log.id,
        actorType: log.actor_type,
        actorName: log.actor_name,
        action: log.action,
        actionType: log.action_type,
        status: log.status,
        resourceType: log.resource_type,
        details: log.details,
        createdAt: log.created_at,
      }));

      setLogs(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [selectedStatus]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      (log.actorName?.toLowerCase().includes(q) ?? false)
    );
  });

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
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate stats
  const errorCount = logs.filter((l) => l.status === 'error').length;
  const warningCount = logs.filter((l) => l.status === 'warning').length;
  const successCount = logs.filter((l) => l.status === 'success').length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">System Logs</h1>
          <p className="text-sm text-[#6C757D]">Monitor platform activity and system health.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportLogs}>
            Download Logs
          </Button>
          <Button onClick={fetchLogs} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-center">
          <p className="text-3xl font-bold text-[#212529]">{logs.length}</p>
          <p className="text-sm text-[#6C757D]">Total Logs</p>
        </div>
        <div className="rounded-[16px] border border-[#28A745]/30 bg-[#28A745]/10 p-5 text-center">
          <p className="text-3xl font-bold text-[#28A745]">{successCount}</p>
          <p className="text-sm text-[#6C757D]">Success</p>
        </div>
        <div className="rounded-[16px] border border-[#FFC107]/30 bg-[#FFC107]/10 p-5 text-center">
          <p className="text-3xl font-bold text-[#FFC107]">{warningCount}</p>
          <p className="text-sm text-[#6C757D]">Warnings</p>
        </div>
        <div className="rounded-[16px] border border-[#DC3545]/30 bg-[#DC3545]/10 p-5 text-center">
          <p className="text-3xl font-bold text-[#DC3545]">{errorCount}</p>
          <p className="text-sm text-[#6C757D]">Errors</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Search and filter logs" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Search"
            placeholder="Action, type, actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={selectedStatus === null ? 'secondary' : 'ghost'} onClick={() => setSelectedStatus(null)}>
                All
              </Button>
              <Button size="sm" variant={selectedStatus === 'success' ? 'secondary' : 'ghost'} onClick={() => setSelectedStatus('success')}>
                Success
              </Button>
              <Button size="sm" variant={selectedStatus === 'warning' ? 'secondary' : 'ghost'} onClick={() => setSelectedStatus('warning')}>
                Warning
              </Button>
              <Button size="sm" variant={selectedStatus === 'error' ? 'secondary' : 'ghost'} onClick={() => setSelectedStatus('error')}>
                Error
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Log Stream" subtitle={`${filteredLogs.length} entries · Newest first`} />
        <CardContent className="space-y-4">
          {filteredLogs.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6C757D]">
              {isLoading ? 'Loading logs...' : 'No logs found'}
            </p>
          )}
          {filteredLogs.map((log) => (
            <div key={log.id} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{log.action}</div>
                <Badge variant={statusVariant[log.status] ?? 'primary'}>
                  {log.status}
                </Badge>
              </div>
              <p className="mt-2 text-[#6C757D]">
                {formatDateTime(log.createdAt)} · {log.actorType}
                {log.actorName && ` · ${log.actorName}`}
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-[#6C757D]">View Details</summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-xs">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="primary">{log.actionType}</Badge>
                {log.resourceType && <Badge variant="warning">{log.resourceType}</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
