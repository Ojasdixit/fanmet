import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';

const logSources = ['API Gateway', 'Realtime Service', 'Postgres', 'Auth', 'Storage'];

const systemLogs = [
  {
    id: 'sys-9021',
    time: 'Jan 12 · 10:34:21',
    source: 'API Gateway',
    level: 'Error',
    message: 'POST /auth/login returned 401 for ip 13.232.92.1',
    correlationId: 'req-89ad',
  },
  {
    id: 'sys-9020',
    time: 'Jan 12 · 10:31:02',
    source: 'Realtime Service',
    level: 'Warning',
    message: 'Socket disconnect spike detected (42 disconnects/min)',
    correlationId: 'rt-6543',
  },
  {
    id: 'sys-9019',
    time: 'Jan 12 · 10:28:54',
    source: 'Postgres',
    level: 'Info',
    message: 'Autovacuum completed on table bids (duration 1.2s)',
    correlationId: 'pg-1298',
  },
];

export function AdminSystemLogs() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">System Logs</h1>
          <p className="text-sm text-[#6C757D]">Monitor infrastructure and application health across services.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Download Logs</Button>
          <Button>Stream Live</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Search by source, level, or correlation ID." />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <TextInput label="Search" placeholder="Message, ID, correlation" />
          <TextInput label="Time Range" placeholder="Last 15 minutes" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Sources</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {logSources.map((source) => (
                <Badge key={source} variant="primary">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Recent Events" subtitle="Newest to oldest." />
        <CardContent className="space-y-4">
          {systemLogs.map((log) => (
            <div key={log.id} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{log.message}</div>
                <Badge variant={log.level === 'Error' ? 'danger' : log.level === 'Warning' ? 'warning' : 'primary'}>
                  {log.level}
                </Badge>
              </div>
              <p className="mt-2 text-[#6C757D]">{log.time} · {log.source}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="primary">{log.id}</Badge>
                <Badge variant="default">{log.correlationId}</Badge>
                <Button size="sm" variant="ghost">
                  View JSON
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
