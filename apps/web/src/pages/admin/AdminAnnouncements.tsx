import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

type TargetAudience = 'all' | 'fans' | 'creators';
type DisplayType = 'notification' | 'banner' | 'modal' | 'email';
type AnnouncementStatus = 'draft' | 'active' | 'expired' | 'cancelled';

interface Announcement {
  id: string;
  title: string;
  message: string;
  targetAudience: TargetAudience;
  displayType: DisplayType;
  status: AnnouncementStatus;
  scheduledAt: string | null;
  expiresAt: string | null;
  viewsCount: number;
  clicksCount: number;
  createdAt: string;
}

const targetLabels: Record<TargetAudience, string> = {
  all: 'All Users',
  fans: 'Fans Only',
  creators: 'Creators Only',
};

const displayTypeLabels: Record<DisplayType, string> = {
  notification: 'In-App Notification',
  banner: 'Banner',
  modal: 'Modal',
  email: 'Email',
};

const statusVariant: Record<AnnouncementStatus, 'primary' | 'success' | 'warning' | 'danger'> = {
  draft: 'warning',
  active: 'success',
  expired: 'danger',
  cancelled: 'danger',
};

export function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Composer state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
  const [displayType, setDisplayType] = useState<DisplayType>('notification');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        setAnnouncements([]);
        return;
      }

      const mapped: Announcement[] = (data ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        targetAudience: a.target_audience,
        displayType: a.display_type,
        status: a.status,
        scheduledAt: a.scheduled_at,
        expiresAt: a.expires_at,
        viewsCount: a.views_count ?? 0,
        clicksCount: a.clicks_count ?? 0,
        createdAt: a.created_at,
      }));

      setAnnouncements(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnnouncements();
  }, []);

  const resetComposer = () => {
    setTitle('');
    setMessage('');
    setTargetAudience('all');
    setDisplayType('notification');
    setExpiresAt('');
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please enter a title and message.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('admin_announcements').insert({
        title: title.trim(),
        message: message.trim(),
        target_audience: targetAudience,
        display_type: displayType,
        status: 'draft',
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        created_by: user?.id,
      });

      if (error) {
        console.error('Error saving draft:', error);
        alert('Failed to save draft.');
        return;
      }

      resetComposer();
      await fetchAnnouncements();
      alert('Draft saved successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please enter a title and message.');
      return;
    }

    const targetDesc = targetLabels[targetAudience];
    const confirmed = window.confirm(
      `Publish announcement to ${targetDesc}?\n\nThis will send notifications to all ${targetAudience === 'all' ? 'users' : targetAudience}.`,
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      // Create announcement
      const { data: announcementData, error: announcementError } = await supabase
        .from('admin_announcements')
        .insert({
          title: title.trim(),
          message: message.trim(),
          target_audience: targetAudience,
          display_type: displayType,
          status: 'active',
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (announcementError || !announcementData) {
        console.error('Error creating announcement:', announcementError);
        alert('Failed to create announcement.');
        return;
      }

      // Fetch target users based on audience
      let usersQuery = supabase.from('users').select('id');

      if (targetAudience === 'fans') {
        usersQuery = usersQuery.eq('role', 'fan');
      } else if (targetAudience === 'creators') {
        usersQuery = usersQuery.eq('role', 'creator');
      } else {
        // All users - exclude admins
        usersQuery = usersQuery.in('role', ['fan', 'creator']);
      }

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Create notifications for all target users
      if (usersData && usersData.length > 0) {
        const notifications = usersData.map((u: any) => ({
          user_id: u.id,
          type: 'announcement',
          title: title.trim(),
          message: message.trim(),
          announcement_id: announcementData.id,
          read: false,
        }));

        // Insert notifications in batches of 100
        for (let i = 0; i < notifications.length; i += 100) {
          const batch = notifications.slice(i, i + 100);
          await supabase.from('notifications').insert(batch);
        }
      }

      resetComposer();
      await fetchAnnouncements();
      alert(`Announcement published! Notifications sent to ${usersData?.length ?? 0} users.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishDraft = async (announcementId: string) => {
    const announcement = announcements.find((a) => a.id === announcementId);
    if (!announcement) return;

    const targetDesc = targetLabels[announcement.targetAudience];
    const confirmed = window.confirm(
      `Publish "${announcement.title}" to ${targetDesc}?\n\nThis will send notifications to all ${announcement.targetAudience === 'all' ? 'users' : announcement.targetAudience}.`,
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      // Update announcement status
      await supabase
        .from('admin_announcements')
        .update({ status: 'active' })
        .eq('id', announcementId);

      // Fetch target users
      let usersQuery = supabase.from('users').select('id');

      if (announcement.targetAudience === 'fans') {
        usersQuery = usersQuery.eq('role', 'fan');
      } else if (announcement.targetAudience === 'creators') {
        usersQuery = usersQuery.eq('role', 'creator');
      } else {
        usersQuery = usersQuery.in('role', ['fan', 'creator']);
      }

      const { data: usersData } = await usersQuery;

      // Create notifications
      if (usersData && usersData.length > 0) {
        const notifications = usersData.map((u: any) => ({
          user_id: u.id,
          type: 'announcement',
          title: announcement.title,
          message: announcement.message,
          announcement_id: announcementId,
          read: false,
        }));

        for (let i = 0; i < notifications.length; i += 100) {
          const batch = notifications.slice(i, i + 100);
          await supabase.from('notifications').insert(batch);
        }
      }

      await fetchAnnouncements();
      alert(`Announcement published! Notifications sent to ${usersData?.length ?? 0} users.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (announcementId: string) => {
    const confirmed = window.confirm('Deactivate this announcement?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await supabase
        .from('admin_announcements')
        .update({ status: 'cancelled' })
        .eq('id', announcementId);

      await fetchAnnouncements();
      alert('Announcement deactivated.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (announcementId: string) => {
    const confirmed = window.confirm('Delete this announcement permanently?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      // Delete associated notifications
      await supabase.from('notifications').delete().eq('announcement_id', announcementId);
      
      // Delete announcement
      await supabase.from('admin_announcements').delete().eq('id', announcementId);

      await fetchAnnouncements();
      alert('Announcement deleted.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeAnnouncements = announcements.filter((a) => a.status === 'active');
  const draftAnnouncements = announcements.filter((a) => a.status === 'draft');
  const pastAnnouncements = announcements.filter((a) => a.status === 'expired' || a.status === 'cancelled');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Announcements</h1>
          <p className="text-sm text-[#6C757D]">
            Publish platform-wide communications and send notifications to users.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Composer" subtitle="Create a new announcement with targeting options." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Title"
            placeholder="Announcement headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-[#212529]">Target Audience</label>
            <select
              className="w-full rounded-lg border border-[#E9ECEF] bg-white px-3 py-2 text-sm"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
            >
              <option value="all">📢 All Users (Fans + Creators)</option>
              <option value="fans">👥 Fans Only</option>
              <option value="creators">🎨 Creators Only</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#212529]">Display Type</label>
            <select
              className="w-full rounded-lg border border-[#E9ECEF] bg-white px-3 py-2 text-sm"
              value={displayType}
              onChange={(e) => setDisplayType(e.target.value as DisplayType)}
            >
              <option value="notification">🔔 In-App Notification</option>
              <option value="banner">🏷️ Banner</option>
              <option value="modal">📦 Modal Popup</option>
              <option value="email">📧 Email</option>
            </select>
          </div>
          <TextInput
            label="Expiry Date (Optional)"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Message"
              rows={4}
              placeholder="Write the announcement message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button variant="secondary" onClick={handleSaveDraft} disabled={isLoading}>
              📝 Save as Draft
            </Button>
            <Button onClick={handlePublish} disabled={isLoading}>
              🚀 Publish & Send Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Active Announcements" subtitle={`${activeAnnouncements.length} live announcements`} />
        <CardContent className="space-y-4">
          {activeAnnouncements.length === 0 && (
            <p className="py-4 text-center text-sm text-[#6C757D]">No active announcements</p>
          )}
          {activeAnnouncements.map((announcement) => (
            <div key={announcement.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#212529]">{announcement.title}</h2>
                  <p className="text-sm text-[#6C757D]">
                    Target: {targetLabels[announcement.targetAudience]} · Type: {displayTypeLabels[announcement.displayType]}
                  </p>
                </div>
                <Badge variant={statusVariant[announcement.status]}>
                  {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-[#212529]">{announcement.message}</p>
              <div className="flex flex-wrap gap-6 text-sm text-[#6C757D]">
                <span>Created: {formatDateTime(announcement.createdAt)}</span>
                {announcement.expiresAt && <span>Expires: {formatDateTime(announcement.expiresAt)}</span>}
                <span>Views: {announcement.viewsCount.toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeactivate(announcement.id)}
                  disabled={isLoading}
                >
                  Deactivate
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Drafts" subtitle={`${draftAnnouncements.length} drafts awaiting publish`} />
        <CardContent className="space-y-3">
          {draftAnnouncements.length === 0 && (
            <p className="py-4 text-center text-sm text-[#6C757D]">No drafts</p>
          )}
          {draftAnnouncements.map((draft) => (
            <div key={draft.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-[#212529]">
              <div className="flex-1">
                <div className="font-medium">{draft.title}</div>
                <div className="text-xs text-[#6C757D]">
                  Target: {targetLabels[draft.targetAudience]} · Created: {formatDateTime(draft.createdAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handlePublishDraft(draft.id)}
                  disabled={isLoading}
                >
                  🚀 Publish Now
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(draft.id)}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {pastAnnouncements.length > 0 && (
        <Card>
          <CardHeader title="Past Announcements" subtitle="Expired or cancelled announcements" />
          <CardContent className="space-y-3">
            {pastAnnouncements.map((announcement) => (
              <div key={announcement.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-[#212529]">
                <div className="flex-1">
                  <div className="font-medium">{announcement.title}</div>
                  <div className="text-xs text-[#6C757D]">
                    {targetLabels[announcement.targetAudience]} · {formatDateTime(announcement.createdAt)}
                  </div>
                </div>
                <Badge variant={statusVariant[announcement.status]}>
                  {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(announcement.id)}
                  disabled={isLoading}
                >
                  🗑️ Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
