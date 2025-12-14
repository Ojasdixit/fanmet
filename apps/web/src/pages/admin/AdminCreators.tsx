import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Badge, TextInput } from '@fanmeet/ui';
import { Pagination } from '../../components/Pagination';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

type CreatorStatus = 'pending' | 'approved' | 'rejected';

interface CreatorRow {
  id: string;
  name: string;
  username: string;
  email: string;
  joinedAt: string;
  status: CreatorStatus;
  phone?: string | null;
  bio?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  totalEvents: number;
}

const creatorStatusFilters: { label: string; value: 'all' | CreatorStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const creatorStatusBadgeVariant: Record<CreatorStatus, 'primary' | 'success' | 'danger' | 'default'> = {
  pending: 'primary',
  approved: 'success',
  rejected: 'danger',
};

const creatorStatusLabel: Record<CreatorStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function AdminCreators() {
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CreatorStatus>('all');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchCreators = async () => {
    setIsLoading(true);

    try {
      // Base creator records
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, display_name, role, creator_profile_status, created_at')
        .eq('role', 'creator');

      if (usersError || !usersData || usersData.length === 0) {
        if (usersError) console.error('Error fetching creators:', usersError);
        setCreators([]);
        return;
      }

      const creatorIds = (usersData as any[]).map((u) => u.id as string);

      // Profiles for username and bio
      let profilesData: any[] = [];
      if (creatorIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, bio')
          .in('user_id', creatorIds);
        profilesData = data ?? [];
      }

      const profileMap = new Map<string, any>(
        profilesData.map((p: any) => [p.user_id as string, p]),
      );

      // Creator settings for phone
      let settingsData: any[] = [];
      if (creatorIds.length > 0) {
        const { data } = await supabase
          .from('creator_settings')
          .select('user_id, phone_number')
          .in('user_id', creatorIds);
        settingsData = data ?? [];
      }
      const settingsMap = new Map<string, any>(
        settingsData.map((s: any) => [s.user_id as string, s]),
      );

      // Linked channels for instagram / youtube
      let linksData: any[] = [];
      if (creatorIds.length > 0) {
        const { data } = await supabase
          .from('linked_channels')
          .select('user_id, platform, handle')
          .in('user_id', creatorIds);
        linksData = data ?? [];
      }
      const linksMap = new Map<
        string,
        {
          instagram?: string | null;
          youtube?: string | null;
        }
      >();
      for (const link of linksData as any[]) {
        const existing = linksMap.get(link.user_id) ?? {};
        if (link.platform === 'instagram') {
          existing.instagram = link.handle;
        } else if (link.platform === 'youtube') {
          existing.youtube = link.handle;
        }
        linksMap.set(link.user_id, existing);
      }

      // Events per creator
      let eventsData: any[] = [];
      if (creatorIds.length > 0) {
        const { data } = await supabase
          .from('events')
          .select('id, creator_id')
          .in('creator_id', creatorIds);
        eventsData = data ?? [];
      }

      const eventsCount = new Map<string, number>();
      for (const event of eventsData as any[]) {
        const id = event.creator_id as string;
        eventsCount.set(id, (eventsCount.get(id) ?? 0) + 1);
      }

      const rows: CreatorRow[] = (usersData as any[]).map((u: any) => {
        const profile = profileMap.get(u.id as string);
        const settings = settingsMap.get(u.id as string);
        const links = linksMap.get(u.id as string) ?? {};

        const name =
          profile?.display_name || u.display_name || (u.email ? u.email.split('@')[0] : 'Creator');
        const username = profile?.username ? `@${profile.username}` : '@creator';
        const status = (u.creator_profile_status as CreatorStatus) ?? 'pending';

        return {
          id: u.id as string,
          name,
          username,
          email: u.email,
          joinedAt: u.created_at,
          status,
          phone: settings?.phone_number ?? null,
          bio: profile?.bio ?? null,
          instagram: links.instagram ?? null,
          youtube: links.youtube ?? null,
          totalEvents: eventsCount.get(u.id as string) ?? 0,
        };
      });

      setCreators(rows);
      setSelectedCreatorId((prev) => prev ?? (rows[0]?.id ?? null));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    const query = search.trim().toLowerCase();

    return creators.filter((creator) => {
      if (statusFilter !== 'all' && creator.status !== statusFilter) return false;

      if (!query) return true;

      return (
        creator.name.toLowerCase().includes(query) ||
        creator.email.toLowerCase().includes(query) ||
        creator.username.toLowerCase().includes(query)
      );
    });
  }, [creators, search, statusFilter]);

  const pendingCreators = useMemo(
    () => filteredCreators.filter((c) => c.status === 'pending'),
    [filteredCreators],
  );

  const approvedCreators = useMemo(
    () => filteredCreators.filter((c) => c.status === 'approved'),
    [filteredCreators],
  );

  const paginatedApprovedCreators = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return approvedCreators.slice(startIndex, endIndex);
  }, [approvedCreators, currentPage, itemsPerPage]);

  const selectedCreator = useMemo(
    () => filteredCreators.find((c) => c.id === selectedCreatorId) ?? null,
    [filteredCreators, selectedCreatorId],
  );

  const updateCreatorStatus = async (creator: CreatorRow, nextStatus: CreatorStatus) => {
    const confirmed = window.confirm(
      `${nextStatus === 'approved' ? 'Approve' : 'Reject'} ${creator.name}?`,
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ creator_profile_status: nextStatus })
        .eq('id', creator.id);

      if (error) {
        console.error('Error updating creator status:', error);
        alert('Failed to update creator status.');
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ creator_profile_status: nextStatus })
        .eq('user_id', creator.id);

      if (profileError) {
        console.error('Error updating creator status on profile:', profileError);
      }

      setCreators((prev) =>
        prev.map((c) => (c.id === creator.id ? { ...c, status: nextStatus } : c)),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoined = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Creator Approvals</h1>
          <p className="text-sm text-[#ADB5BD]">Review new applications and manage existing creators.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={isLoading}>
            Export
          </Button>
          <Button disabled={isLoading}>Invite Creator</Button>
        </div>
      </div>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader
          title="Filters"
          subtitle="Search and filter creators by status."
          className="border-b border-[#3A3D42]"
        />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Search"
              placeholder="Name, username, or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#ADB5BD]">Status</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {creatorStatusFilters.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setStatusFilter(status.value)}
                    className={`rounded-full border px-3 py-1 font-medium ${statusFilter === status.value
                      ? 'border-[#C045FF] bg-[#3A1B4D] text-[#F7E9FF]'
                      : 'border-[#3A3D42] bg-[#1F2124] text-[#ADB5BD] hover:border-[#C045FF]/60'
                      }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader
          title="Pending Approval"
          subtitle="Creators awaiting manual review before onboarding"
          className="border-b border-[#3A3D42]"
        />
        <CardContent className="gap-6">
          {isLoading && pendingCreators.length === 0 ? (
            <p className="text-sm text-[#ADB5BD]">Loading pending creators…</p>
          ) : pendingCreators.length === 0 ? (
            <p className="text-sm text-[#ADB5BD]">No creators pending approval.</p>
          ) : (
            pendingCreators.map((creator) => (
              <div key={creator.id} className="rounded-[16px] border border-[#3A3D42] bg-[#1F2124] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{creator.name}</div>
                    <div className="text-sm text-[#ADB5BD]">{creator.username}</div>
                  </div>
                  <Badge variant="primary">Joined {formatJoined(creator.joinedAt)}</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-[#ADB5BD] md:grid-cols-2">
                  <div>Email: {creator.email}</div>
                  <div>Phone: {creator.phone ?? 'Not provided'}</div>
                  <div className="md:col-span-2">Bio: {creator.bio ?? 'Not provided'}</div>
                  <div>📸 Instagram: {creator.instagram ?? 'Not linked'}</div>
                  <div>🎥 YouTube: {creator.youtube ?? 'Not linked'}</div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    variant="danger"
                    onClick={() => updateCreatorStatus(creator, 'rejected')}
                    disabled={isLoading}
                  >
                    ❌ Reject
                  </Button>
                  <Button
                    onClick={() => updateCreatorStatus(creator, 'approved')}
                    disabled={isLoading}
                  >
                    ✅ Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedCreatorId(creator.id)}
                    disabled={isLoading}
                  >
                    View details
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader title="Approved Creators" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#ADB5BD]">
              <tr>
                <th className="border-b border-[#3A3D42] py-3">Creator</th>
                <th className="border-b border-[#3A3D42] py-3">Username</th>
                <th className="border-b border-[#3A3D42] py-3">Status</th>
                <th className="border-b border-[#3A3D42] py-3">Events</th>
                <th className="border-b border-[#3A3D42] py-3">Joined</th>
                <th className="border-b border-[#3A3D42] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApprovedCreators.map((creator) => (
                <tr key={creator.id} className="border-b border-[#3A3D42]">
                  <td className="py-3 text-white">{creator.name}</td>
                  <td className="py-3 text-[#ADB5BD]">{creator.username}</td>
                  <td className="py-3">
                    <Badge variant={creatorStatusBadgeVariant[creator.status]}>
                      {creatorStatusLabel[creator.status]}
                    </Badge>
                  </td>
                  <td className="py-3 text-white">{creator.totalEvents}</td>
                  <td className="py-3 text-[#ADB5BD]">{formatJoined(creator.joinedAt)}</td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedCreatorId(creator.id)}
                      disabled={isLoading}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {approvedCreators.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-sm text-[#ADB5BD]"
                  >
                    No approved creators yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={approvedCreators.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader
          title={selectedCreator ? `Creator Detail — ${selectedCreator.name}` : 'Creator Detail'}
          subtitle="Full profile view and admin actions for this creator."
          className="border-b border-[#3A3D42]"
        />
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {selectedCreator ? (
            <>
              <div className="grid gap-4 rounded-[16px] border border-[#3A3D42] bg-[#1F2124] p-6">
                <div className="grid gap-3 text-sm text-[#ADB5BD] md:grid-cols-2">
                  <div>
                    <p className="text-[#6C757D]">Email</p>
                    <p className="text-white">{selectedCreator.email}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Username</p>
                    <p className="text-white">{selectedCreator.username}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Status</p>
                    <Badge variant={creatorStatusBadgeVariant[selectedCreator.status]}>
                      {creatorStatusLabel[selectedCreator.status]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Joined</p>
                    <p className="text-white">{formatJoined(selectedCreator.joinedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Total Events</p>
                    <p className="text-white">{selectedCreator.totalEvents}</p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm text-[#ADB5BD]">
                  <div>
                    <p className="text-[#6C757D]">Phone</p>
                    <p className="text-white">{selectedCreator.phone ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Instagram</p>
                    <p className="text-white">{selectedCreator.instagram ?? 'Not linked'}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">YouTube</p>
                    <p className="text-white">{selectedCreator.youtube ?? 'Not linked'}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Bio</p>
                    <p className="text-white">{selectedCreator.bio ?? 'Not provided'}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#3A3D42] bg-[#1F2124] p-6 text-sm text-white">
                <p className="text-[#ADB5BD]">Admin Actions</p>
                <div className="flex flex-col gap-2">
                  {selectedCreator.status !== 'approved' && (
                    <Button
                      onClick={() => updateCreatorStatus(selectedCreator, 'approved')}
                      disabled={isLoading}
                    >
                      Approve Creator
                    </Button>
                  )}
                  {selectedCreator.status !== 'rejected' && (
                    <Button
                      variant="danger"
                      onClick={() => updateCreatorStatus(selectedCreator, 'rejected')}
                      disabled={isLoading}
                    >
                      Reject Creator
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    className="mt-2 bg-purple-600 hover:bg-purple-700"
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to log in as ${selectedCreator.name}? You will be logged out of your admin account.`)) return;

                      try {
                        setIsLoading(true);
                        const { data, error } = await supabase.functions.invoke('admin-impersonate-user', {
                          body: { targetUserId: selectedCreator.id }
                        });

                        if (error) throw error;
                        if (data?.actionLink) {
                          // Redirect to the magic link to login as the user
                          window.location.href = data.actionLink;
                        } else {
                          throw new Error('No login link returned');
                        }
                      } catch (err: any) {
                        console.error('Impersonation failed:', err);
                        alert('Failed to login as user: ' + (err.message || 'Unknown error'));
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Login as Creator
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#ADB5BD]">
              Select a creator from the list above to view details.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
