import { useEffect, useMemo, useState, useRef } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { Pagination } from '../../components/Pagination';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

type UserRole = 'fan' | 'creator' | 'admin';
type AccountStatus = 'active' | 'suspended' | 'banned';

interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  joinedAt: string;
  lastActiveAt: string | null;
  totalAmount: number; // spent for fans, earned for creators
}

const roleFilters: { label: string; value: 'all' | UserRole }[] = [
  { label: 'All', value: 'all' },
  { label: 'Fans', value: 'fan' },
  { label: 'Creators', value: 'creator' },
  { label: 'Admins', value: 'admin' },
];

const statusFilters: { label: string; value: 'all' | AccountStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned', value: 'banned' },
];

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const userDetailRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);

      try {
        // Base user data
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, display_name, role, account_status, created_at, updated_at');

        if (usersError || !usersData) {
          console.error('Error fetching users:', usersError);
          setUsers([]);
          return;
        }

        // Aggregate fan spending (won bids)
        const { data: wonBidsAll } = await supabase
          .from('bids')
          .select('event_id, fan_id, amount, status')
          .eq('status', 'won');

        const fanSpend = new Map<string, number>();
        for (const bid of (wonBidsAll ?? []) as any[]) {
          const prev = fanSpend.get(bid.fan_id) ?? 0;
          fanSpend.set(bid.fan_id, prev + (bid.amount ?? 0));
        }

        // Aggregate creator earnings (won bids per creator)
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, creator_id');

        const eventToCreator = new Map<string, string>(
          (eventsData ?? []).map((e: any) => [e.id, e.creator_id]),
        );

        const creatorEarnings = new Map<string, number>();
        for (const bid of (wonBidsAll ?? []) as any[]) {
          const creatorId = eventToCreator.get(bid.event_id);
          if (!creatorId) continue;
          const prev = creatorEarnings.get(creatorId) ?? 0;
          creatorEarnings.set(creatorId, prev + (bid.amount ?? 0));
        }

        const rows: AdminUserRow[] = (usersData as any[]).map((u: any) => {
          const name = u.display_name || (u.email ? u.email.split('@')[0] : 'User');
          const role: UserRole = u.role;
          const accountStatus: AccountStatus = u.account_status ?? 'active';

          const spent = fanSpend.get(u.id) ?? 0;
          const earned = creatorEarnings.get(u.id) ?? 0;

          return {
            id: u.id,
            email: u.email,
            displayName: name,
            role,
            accountStatus,
            joinedAt: u.created_at,
            lastActiveAt: u.updated_at,
            totalAmount: role === 'fan' ? spent : role === 'creator' ? earned : 0,
          };
        });

        setUsers(rows);
        if (rows.length > 0 && !selectedUserId) {
          setSelectedUserId(rows[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsers();
  }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter !== 'all' && user.accountStatus !== statusFilter) return false;

      if (!query) return true;

      return (
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const handleStatusChange = async (user: AdminUserRow, nextStatus: AccountStatus) => {
    const labelMap: Record<AccountStatus, string> = {
      active: 'Activate',
      suspended: 'Suspend',
      banned: 'Ban',
    };

    const confirmed = window.confirm(
      `${labelMap[nextStatus]} ${user.displayName}? This will update their account status.`,
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ account_status: nextStatus })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating account status:', error);
        alert('Failed to update account status.');
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, accountStatus: nextStatus } : u)),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">All Users</h1>
          <p className="text-sm text-[#6C757D]">
            Search, filter, and take bulk actions across the entire user base.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled>
            Export CSV
          </Button>
          <Button disabled>Send Notification</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Refine the user list by role, status, or activity." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Search"
              placeholder="Name, email, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <TextInput label="Registration Date" placeholder="(coming soon)" disabled />
            <TextInput label="Last Active" placeholder="(coming soon)" disabled />
            <TextInput label="Verification" placeholder="(coming soon)" disabled />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Roles</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {roleFilters.map((role) => (
                  <button
                    key={role.value}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${roleFilter === role.value
                      ? 'border-[#C045FF] bg-[#F4E6FF] text-[#C045FF]'
                      : 'border-[#E9ECEF] bg-white text-[#6C757D] hover:border-[#C045FF]/40'
                      }`}
                    type="button"
                    onClick={() => setRoleFilter(role.value)}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {statusFilters.map((status) => (
                  <button
                    key={status.value}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusFilter === status.value
                      ? 'border-[#C045FF] bg-[#F4E6FF] text-[#C045FF]'
                      : 'border-[#E9ECEF] bg-white text-[#6C757D] hover:border-[#C045FF]/40'
                      }`}
                    type="button"
                    onClick={() => setStatusFilter(status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Users" subtitle="Bulk manage accounts and view key metrics." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Select</th>
                <th className="border-b border-[#E9ECEF] py-3">Name</th>
                <th className="border-b border-[#E9ECEF] py-3">Email</th>
                <th className="border-b border-[#E9ECEF] py-3">Role</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Joined</th>
                <th className="border-b border-[#E9ECEF] py-3">Last Active</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Spent / Earned</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#CED4DA]" />
                  </td>
                  <td className="py-3 text-[#212529]">{user.displayName}</td>
                  <td className="py-3 text-[#6C757D]">{user.email}</td>
                  <td className="py-3 text-[#212529]">{user.role}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        user.accountStatus === 'active'
                          ? 'success'
                          : user.accountStatus === 'suspended'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {user.accountStatus === 'active'
                        ? 'Active'
                        : user.accountStatus === 'suspended'
                          ? 'Suspended'
                          : 'Banned'}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{formatDateTime(user.joinedAt)}</td>
                  <td className="py-3 text-[#6C757D]">
                    {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : '—'}
                  </td>
                  <td className="py-3 text-[#212529]">
                    {user.totalAmount > 0 ? formatCurrency(user.totalAmount) : '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setTimeout(() => {
                            userDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }}
                      >
                        View
                      </Button>
                      {user.accountStatus !== 'banned' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusChange(
                              user,
                              user.accountStatus === 'suspended' ? 'active' : 'suspended',
                            )
                          }
                        >
                          {user.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </Button>
                      )}
                      {user.accountStatus === 'banned' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(user, 'active')}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(user, 'banned')}
                        >
                          Ban
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-6 text-center text-sm text-[#6C757D]"
                  >
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>

      <Card ref={userDetailRef}>
        <CardHeader
          title={
            selectedUser
              ? `User Detail — ${selectedUser.displayName}`
              : 'User Detail'
          }
          subtitle="Full profile view for context and actions."
        />
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {selectedUser ? (
            <>
              <div className="grid gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6">
                <div className="grid gap-2 text-sm text-[#212529] md:grid-cols-2">
                  <div>
                    <p className="text-[#6C757D]">Email</p>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Role</p>
                    <Badge variant="primary">{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Joined</p>
                    <p>{formatDateTime(selectedUser.joinedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Last Active</p>
                    <p>
                      {selectedUser.lastActiveAt
                        ? formatDateTime(selectedUser.lastActiveAt)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Status</p>
                    <Badge
                      variant={
                        selectedUser.accountStatus === 'active'
                          ? 'success'
                          : selectedUser.accountStatus === 'suspended'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {selectedUser.accountStatus === 'active'
                        ? 'Active'
                        : selectedUser.accountStatus === 'suspended'
                          ? 'Suspended'
                          : 'Banned'}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                    <p className="text-[#6C757D]">
                      {selectedUser.role === 'fan'
                        ? 'Total Spent'
                        : selectedUser.role === 'creator'
                          ? 'Total Earned'
                          : 'Total Volume'}
                    </p>
                    <p className="text-xl font-semibold">
                      {selectedUser.totalAmount > 0
                        ? formatCurrency(selectedUser.totalAmount)
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
                <p className="text-[#6C757D]">Admin Actions</p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleStatusChange(
                        selectedUser,
                        selectedUser.accountStatus === 'active' ? 'suspended' : 'active',
                      )
                    }
                  >
                    {selectedUser.accountStatus === 'suspended'
                      ? 'Unsuspend Account'
                      : 'Suspend Account'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusChange(selectedUser, 'banned')}
                  >
                    Ban Account
                  </Button>
                  <Button
                    variant="primary"
                    className="mt-2 bg-purple-600 hover:bg-purple-700"
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to log in as ${selectedUser.displayName}? You will be logged out of your admin account.`)) return;

                      try {
                        setIsLoading(true);
                        const { data, error } = await supabase.functions.invoke('admin-impersonate-user', {
                          body: { targetUserId: selectedUser.id }
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
                    Login as User
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6C757D]">
              Select a user from the table above to view details.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
