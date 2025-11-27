import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string | null;
  reportedUserName: string | null;
  reportedEventId: string | null;
  reportType: string;
  resourceType: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  createdAt: string;
}

const reportTypes = ['harassment', 'spam', 'fraud', 'inappropriate', 'impersonation', 'other'];
const statuses = ['new', 'investigating', 'resolved', 'escalated', 'dismissed'];

export function AdminReportsFlags() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      // Fetch user profiles
      const userIds = new Set<string>();
      for (const r of (reportsData ?? []) as any[]) {
        if (r.reporter_id) userIds.add(r.reporter_id);
        if (r.reported_user_id) userIds.add(r.reported_user_id);
      }

      const { data: profilesData } = userIds.size
        ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', Array.from(userIds))
        : { data: [] };

      const profileMap = new Map<string, string>();
      for (const p of (profilesData ?? []) as any[]) {
        profileMap.set(p.user_id, p.display_name || p.username || 'User');
      }

      const mapped: Report[] = (reportsData ?? []).map((r: any) => ({
        id: r.id,
        reporterId: r.reporter_id,
        reporterName: profileMap.get(r.reporter_id) ?? 'System',
        reportedUserId: r.reported_user_id,
        reportedUserName: r.reported_user_id ? profileMap.get(r.reported_user_id) ?? 'Unknown' : null,
        reportedEventId: r.reported_event_id,
        reportType: r.report_type,
        resourceType: r.resource_type,
        title: r.title,
        description: r.description,
        severity: r.severity,
        status: r.status,
        createdAt: r.created_at,
      }));

      setReports(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    const confirmed = window.confirm(`Update report status to "${newStatus}"?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'resolved' || newStatus === 'dismissed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id;
        if (resolutionNotes.trim()) {
          updateData.resolution_notes = resolutionNotes.trim();
        }
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report:', error);
        alert('Failed to update report');
        return;
      }

      await fetchReports();
      setResolutionNotes('');
      alert('Report updated successfully');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q) ||
        (r.reportedUserName?.toLowerCase().includes(q) ?? false) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
    new: 'primary',
    investigating: 'warning',
    resolved: 'success',
    escalated: 'danger',
    dismissed: 'warning',
  };

  const severityVariant: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
    low: 'primary',
    medium: 'warning',
    high: 'warning',
    critical: 'danger',
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Reports &amp; Flags</h1>
          <p className="text-sm text-[#6C757D]">Investigate community reports and moderate platform safety.</p>
        </div>
        <Badge variant={reports.filter((r) => r.status === 'new').length > 0 ? 'danger' : 'success'}>
          {reports.filter((r) => r.status === 'new').length} new reports
        </Badge>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Narrow down by status or search" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Search"
            placeholder="Report ID, title, reporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={statusFilter === null ? 'secondary' : 'ghost'} onClick={() => setStatusFilter(null)}>
                All
              </Button>
              {statuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'secondary' : 'ghost'}
                  onClick={() => setStatusFilter(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Flagged Items" subtitle={`${filteredReports.length} reports`} />
        <CardContent className="space-y-4">
          {filteredReports.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6C757D]">
              {isLoading ? 'Loading...' : 'No reports found'}
            </p>
          )}
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className={`flex flex-col gap-4 rounded-[16px] border p-5 text-sm text-[#212529] ${
                selectedReport?.id === report.id ? 'border-[#C045FF] bg-[#F4E6FF]/30' : 'border-[#E9ECEF] bg-[#F8F9FA]'
              }`}
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{report.title}</h2>
                  <p className="text-[#6C757D]">{report.resourceType} · {report.reportType}</p>
                </div>
                <Badge variant={statusVariant[report.status] ?? 'primary'}>
                  {report.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-[#6C757D]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Reporter</p>
                  <p>{report.reporterName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Reported</p>
                  <p>{report.reportedUserName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Submitted</p>
                  <p>{formatDateTime(report.createdAt)}</p>
                </div>
              </div>
              {report.description && (
                <p className="text-[#6C757D]">{report.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant={severityVariant[report.severity] ?? 'primary'}>
                  {report.severity}
                </Badge>
                {report.status === 'new' && (
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(report.id, 'investigating')}>
                    Investigate
                  </Button>
                )}
                {report.status === 'investigating' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(report.id, 'escalated')}>
                      Escalate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(report.id, 'resolved')}>
                      Resolve
                    </Button>
                  </>
                )}
                {report.status !== 'resolved' && report.status !== 'dismissed' && (
                  <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(report.id, 'dismissed')}>
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedReport && (
        <Card>
          <CardHeader title="Resolution Notes" subtitle={`For report: ${selectedReport.title}`} />
          <CardContent className="space-y-4">
            <TextArea
              label="Resolution Summary"
              rows={3}
              placeholder="Explain action taken, evidence reviewed, outcome..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                disabled={isLoading}
              >
                Mark Resolved
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleUpdateStatus(selectedReport.id, 'escalated')}
                disabled={isLoading}
              >
                Escalate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
