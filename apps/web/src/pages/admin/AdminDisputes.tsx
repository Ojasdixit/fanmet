import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Dispute {
  id: string;
  complainantId: string;
  complainantName: string;
  respondentId: string;
  respondentName: string;
  eventId: string | null;
  disputeType: string;
  title: string;
  description: string | null;
  amount: number;
  priority: string;
  status: string;
  resolution: string | null;
  createdAt: string;
}

const disputeTypes = ['payment', 'quality', 'no_show', 'policy', 'other'];
const statuses = ['new', 'under_review', 'escalated', 'resolved', 'closed'];
const priorities = ['low', 'medium', 'high', 'critical'];

export function AdminDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const { data: disputesData, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching disputes:', error);
        return;
      }

      // Get all user IDs
      const userIds = new Set<string>();
      for (const d of (disputesData ?? []) as any[]) {
        userIds.add(d.complainant_id);
        userIds.add(d.respondent_id);
      }

      const { data: profilesData } = userIds.size
        ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', Array.from(userIds))
        : { data: [] };

      const { data: usersData } = userIds.size
        ? await supabase.from('users').select('id, role').in('id', Array.from(userIds))
        : { data: [] };

      const profileMap = new Map<string, string>();
      const roleMap = new Map<string, string>();
      
      for (const p of (profilesData ?? []) as any[]) {
        profileMap.set(p.user_id, p.display_name || p.username || 'User');
      }
      for (const u of (usersData ?? []) as any[]) {
        roleMap.set(u.id, u.role);
      }

      const mapped: Dispute[] = (disputesData ?? []).map((d: any) => ({
        id: d.id,
        complainantId: d.complainant_id,
        complainantName: `${roleMap.get(d.complainant_id) === 'creator' ? 'Creator' : 'Fan'} · ${profileMap.get(d.complainant_id) ?? 'Unknown'}`,
        respondentId: d.respondent_id,
        respondentName: `${roleMap.get(d.respondent_id) === 'creator' ? 'Creator' : 'Fan'} · ${profileMap.get(d.respondent_id) ?? 'Unknown'}`,
        eventId: d.event_id,
        disputeType: d.dispute_type,
        title: d.title,
        description: d.description,
        amount: d.amount ?? 0,
        priority: d.priority,
        status: d.status,
        resolution: d.resolution,
        createdAt: d.created_at,
      }));

      setDisputes(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDisputes();
  }, []);

  const handleUpdateStatus = async (disputeId: string, newStatus: string) => {
    const confirmed = window.confirm(`Update dispute status to "${newStatus.replace('_', ' ')}"?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id;
        if (resolutionText.trim()) {
          updateData.resolution = resolutionText.trim();
        }
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) {
        console.error('Error updating dispute:', error);
        alert('Failed to update dispute');
        return;
      }

      await fetchDisputes();
      setResolutionText('');
      alert('Dispute updated successfully');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.complainantName.toLowerCase().includes(q) ||
        d.respondentName.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
    new: 'primary',
    under_review: 'warning',
    escalated: 'danger',
    resolved: 'success',
    closed: 'success',
  };

  const priorityVariant: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
    low: 'primary',
    medium: 'warning',
    high: 'warning',
    critical: 'danger',
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Dispute Management</h1>
          <p className="text-sm text-[#6C757D]">Resolve conflicts between fans and creators fairly.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="warning">{disputes.filter((d) => d.status === 'new' || d.status === 'under_review').length} active</Badge>
          <Badge variant="danger">{disputes.filter((d) => d.status === 'escalated').length} escalated</Badge>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Identify disputes based on status" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Search"
            placeholder="Dispute ID, title, names..."
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
                  {s.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Active Disputes" subtitle={`${filteredDisputes.length} disputes`} />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Dispute</th>
                <th className="border-b border-[#E9ECEF] py-3">Complainant</th>
                <th className="border-b border-[#E9ECEF] py-3">Respondent</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Priority</th>
                <th className="border-b border-[#E9ECEF] py-3">Created</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map((dispute) => (
                <tr
                  key={dispute.id}
                  className={`border-b border-[#E9ECEF] cursor-pointer hover:bg-[#F8F9FA] ${
                    selectedDispute?.id === dispute.id ? 'bg-[#F4E6FF]/30' : ''
                  }`}
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <td className="py-3 text-[#212529]">
                    <div className="flex flex-col">
                      <span className="font-semibold">{dispute.title}</span>
                      <span className="text-xs text-[#6C757D]">{dispute.disputeType}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#6C757D]">{dispute.complainantName}</td>
                  <td className="py-3 text-[#6C757D]">{dispute.respondentName}</td>
                  <td className="py-3 text-[#212529]">{formatCurrency(dispute.amount)}</td>
                  <td className="py-3">
                    <Badge variant={statusVariant[dispute.status] ?? 'primary'}>
                      {dispute.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={priorityVariant[dispute.priority] ?? 'primary'}>
                      {dispute.priority}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{formatDateTime(dispute.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {dispute.status === 'new' && (
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(dispute.id, 'under_review'); }}>
                          Review
                        </Button>
                      )}
                      {dispute.status === 'under_review' && (
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(dispute.id, 'escalated'); }}>
                          Escalate
                        </Button>
                      )}
                      {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(dispute.id, 'resolved'); }}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDisputes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No disputes found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedDispute && (
        <Card>
          <CardHeader title="Dispute Detail" subtitle={selectedDispute.title} />
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[selectedDispute.status] ?? 'primary'}>
                  {selectedDispute.status.replace('_', ' ')}
                </Badge>
                <Badge variant={priorityVariant[selectedDispute.priority] ?? 'primary'}>
                  {selectedDispute.priority}
                </Badge>
                <Badge variant="primary">{selectedDispute.disputeType}</Badge>
              </div>
              <div className="space-y-2 text-[#6C757D]">
                <p><strong>Complainant:</strong> {selectedDispute.complainantName}</p>
                <p><strong>Respondent:</strong> {selectedDispute.respondentName}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedDispute.amount)}</p>
                <p><strong>Created:</strong> {formatDateTime(selectedDispute.createdAt)}</p>
              </div>
              {selectedDispute.description && (
                <div>
                  <p className="font-semibold">Description</p>
                  <p className="text-[#6C757D]">{selectedDispute.description}</p>
                </div>
              )}
              {selectedDispute.resolution && (
                <div className="rounded-[12px] bg-white p-4">
                  <p className="font-semibold text-[#28A745]">Resolution</p>
                  <p className="text-[#6C757D]">{selectedDispute.resolution}</p>
                </div>
              )}
            </div>
            <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Resolution</p>
              <TextArea
                label="Decision & Outcome"
                rows={4}
                placeholder="Describe resolution, compensation, actions taken..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateStatus(selectedDispute.id, 'resolved')}
                  disabled={isLoading}
                >
                  Mark Resolved
                </Button>
                {selectedDispute.status !== 'escalated' && (
                  <Button
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedDispute.id, 'escalated')}
                    disabled={isLoading}
                  >
                    Escalate
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => handleUpdateStatus(selectedDispute.id, 'closed')}
                  disabled={isLoading}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
