import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface BulkAction {
  id: string;
  title: string;
  description: string | null;
  actionType: string;
  targetCriteria: Record<string, any> | null;
  affectedCount: number;
  status: string;
  notes: string | null;
  createdBy: string | null;
  createdByName: string;
  createdAt: string;
}

const actionTypes = [
  'suspend_users', 'ban_users', 'approve_withdrawals', 'send_notifications',
  'update_status', 'delete_records', 'export_data', 'other'
];

export function AdminSystemBulkActions() {
  const { user } = useAuth();
  const [actions, setActions] = useState<BulkAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActionType, setNewActionType] = useState('other');
  const [newTargetCriteria, setNewTargetCriteria] = useState('');

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bulk_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bulk actions:', error);
        return;
      }

      // Get creator names
      const creatorIds = new Set<string>();
      for (const a of (data ?? []) as any[]) {
        if (a.created_by) creatorIds.add(a.created_by);
      }

      const { data: profilesData } = creatorIds.size
        ? await supabase.from('profiles').select('user_id, display_name').in('user_id', Array.from(creatorIds))
        : { data: [] };

      const profileMap = new Map<string, string>();
      for (const p of (profilesData ?? []) as any[]) {
        profileMap.set(p.user_id, p.display_name || 'Admin');
      }

      const mapped: BulkAction[] = (data ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        actionType: a.action_type,
        targetCriteria: a.target_criteria,
        affectedCount: a.affected_count ?? 0,
        status: a.status,
        notes: a.notes,
        createdBy: a.created_by,
        createdByName: profileMap.get(a.created_by) ?? 'System',
        createdAt: a.created_at,
      }));

      setActions(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchActions();
  }, []);

  const handleCreateAction = async (status: 'pending' | 'approved') => {
    if (!newTitle.trim()) {
      alert('Title is required');
      return;
    }

    setIsLoading(true);
    try {
      let criteria = null;
      if (newTargetCriteria.trim()) {
        try {
          criteria = JSON.parse(newTargetCriteria);
        } catch {
          criteria = { description: newTargetCriteria };
        }
      }

      const { error } = await supabase.from('bulk_actions').insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        action_type: newActionType,
        target_criteria: criteria,
        status,
        created_by: user?.id,
      });

      if (error) {
        console.error('Error creating bulk action:', error);
        alert('Failed to create bulk action');
        return;
      }

      await fetchActions();
      setNewTitle('');
      setNewDescription('');
      setNewTargetCriteria('');
      alert(`Bulk action ${status === 'pending' ? 'saved as draft' : 'submitted for approval'}!`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (actionId: string, newStatus: string) => {
    const confirmed = window.confirm(`Update action status to "${newStatus}"?`);
    if (!confirmed) return;

    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'approved') {
      updateData.approved_by = user?.id;
    }

    if (newStatus === 'completed') {
      updateData.executed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('bulk_actions')
      .update(updateData)
      .eq('id', actionId);

    if (error) {
      console.error('Error updating bulk action:', error);
      alert('Failed to update action');
      return;
    }

    await fetchActions();
  };

  const handleDelete = async (actionId: string) => {
    const confirmed = window.confirm('Delete this bulk action?');
    if (!confirmed) return;

    const { error } = await supabase.from('bulk_actions').delete().eq('id', actionId);

    if (error) {
      console.error('Error deleting bulk action:', error);
      alert('Failed to delete action');
      return;
    }

    await fetchActions();
  };

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
    pending: 'warning',
    approved: 'primary',
    completed: 'success',
    rejected: 'danger',
    failed: 'danger',
  };

  const formatActionType = (type: string) =>
    type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Bulk Actions</h1>
          <p className="text-sm text-[#6C757D]">Execute large-scale updates safely with approval trails.</p>
        </div>
        <Badge variant="primary">{actions.filter((a) => a.status === 'pending').length} pending</Badge>
      </div>

      <Card>
        <CardHeader title="Active Actions" subtitle={`${actions.length} bulk actions`} />
        <CardContent className="space-y-4">
          {actions.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6C757D]">
              {isLoading ? 'Loading...' : 'No bulk actions created yet'}
            </p>
          )}
          {actions.map((action) => (
            <div key={action.id} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{action.title}</h2>
                  <p className="text-xs text-[#6C757D]">
                    {action.createdByName} · {formatDateTime(action.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{formatActionType(action.actionType)}</Badge>
                  <Badge variant={statusVariant[action.status] ?? 'primary'}>{action.status}</Badge>
                </div>
              </div>
              {action.description && (
                <p className="mt-3 text-[#6C757D]">{action.description}</p>
              )}
              {action.notes && (
                <p className="mt-2 text-xs text-[#ADB5BD]">Notes: {action.notes}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {action.status === 'pending' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(action.id, 'approved')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(action.id, 'rejected')}>
                      Reject
                    </Button>
                  </>
                )}
                {action.status === 'approved' && (
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(action.id, 'completed')}>
                    Mark Completed
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDelete(action.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="New Bulk Action" subtitle="Design and schedule batch operations" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Action Title"
            placeholder="e.g. Suspend flagged accounts"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6C757D] mb-1">
              Action Type
            </label>
            <select
              className="w-full rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm"
              value={newActionType}
              onChange={(e) => setNewActionType(e.target.value)}
            >
              {actionTypes.map((type) => (
                <option key={type} value={type}>{formatActionType(type)}</option>
              ))}
            </select>
          </div>
          <TextArea
            label="Description"
            rows={3}
            placeholder="Describe what this action will do..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <TextArea
            label="Target Criteria (JSON or text)"
            rows={3}
            placeholder='{"user_status": "flagged"} or plain text description'
            value={newTargetCriteria}
            onChange={(e) => setNewTargetCriteria(e.target.value)}
          />
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => handleCreateAction('pending')} disabled={isLoading}>
              Save Draft
            </Button>
            <Button onClick={() => handleCreateAction('approved')} disabled={isLoading}>
              Submit for Approval
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
