import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface AdminTicketRow {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

const statusFilterOptions: { label: string; value: 'all' | TicketStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const statusBadgeVariant: Record<TicketStatus, 'primary' | 'warning' | 'success' | 'danger'> = {
  open: 'primary',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'danger',
};

export function AdminSupportTickets() {
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select(
            'id, subject, description, status, created_at, updated_at, users:user_id (email, role, display_name)',
          )
          .order('created_at', { ascending: false });

        if (error || !data) {
          console.error('Error fetching support tickets:', error);
          setTickets([]);
          return;
        }

        const rows: AdminTicketRow[] = (data as any[]).map((t: any) => {
          const user = t.users as any | null;
          const name =
            user?.display_name || (user?.email ? user.email.split('@')[0] : 'User');
          return {
            id: t.id,
            subject: t.subject,
            description: t.description,
            status: t.status as TicketStatus,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            userName: name,
            userEmail: user?.email ?? '',
            userRole: user?.role ?? '',
          };
        });

        setTickets(rows);
        if (rows.length > 0 && !selectedTicketId) {
          setSelectedTicketId(rows[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTickets();
  }, [selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!query) return true;

      return (
        t.subject.toLowerCase().includes(query) ||
        t.userName.toLowerCase().includes(query) ||
        t.userEmail.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      );
    });
  }, [tickets, search, statusFilter]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  const updateTicketStatus = async (ticket: AdminTicketRow, nextStatus: TicketStatus) => {
    const confirmed = window.confirm(
      `Change status of ticket "${ticket.subject}" to ${nextStatus.replace('_', ' ')}?`,
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: nextStatus })
        .eq('id', ticket.id);

      if (error) {
        console.error('Error updating ticket:', error);
        alert('Failed to update ticket status.');
        return;
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: nextStatus } : t)),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Support Tickets</h1>
          <p className="text-sm text-[#6C757D]">
            Track customer issues, update their status, and maintain SLAs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled>
            View SLA Dashboard
          </Button>
          <Button disabled>Assign to Me</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Focus on critical tickets or specific owners." />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput
            label="Search"
            placeholder="Ticket ID, subject, user"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <TextInput label="Date Range" placeholder="(coming soon)" disabled />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Status</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    statusFilter === option.value
                      ? 'border-[#C045FF] bg-[#F4E6FF] text-[#C045FF]'
                      : 'border-[#E9ECEF] bg-white text-[#6C757D] hover:border-[#C045FF]/40'
                  }`}
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Priority</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Badge variant="danger">Critical (coming soon)</Badge>
              <Badge variant="warning">High (coming soon)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Tickets" subtitle="Most recent issues needing attention." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Ticket</th>
                <th className="border-b border-[#E9ECEF] py-3">User</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Created</th>
                <th className="border-b border-[#E9ECEF] py-3">Updated</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-[#E9ECEF] ${
                    selectedTicketId === ticket.id ? 'bg-[#F8F9FA]' : ''
                  }`}
                >
                  <td className="py-3 text-[#212529]">
                    <button
                      type="button"
                      className="flex flex-col text-left"
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <span className="font-semibold">{ticket.subject}</span>
                      <span className="text-xs text-[#6C757D]">{ticket.id}</span>
                    </button>
                  </td>
                  <td className="py-3 text-[#6C757D]">
                    <div className="flex flex-col">
                      <span>{ticket.userName}</span>
                      <span className="text-xs">{ticket.userEmail}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={statusBadgeVariant[ticket.status]}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{formatDateTime(ticket.createdAt)}</td>
                  <td className="py-3 text-[#6C757D]">{formatDateTime(ticket.updatedAt)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {ticket.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateTicketStatus(ticket, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                      {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateTicketStatus(ticket, 'in_progress')}
                        >
                          In Progress
                        </Button>
                      )}
                      {ticket.status !== 'closed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateTicketStatus(ticket, 'closed')}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-sm text-[#6C757D]"
                  >
                    No tickets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Ticket Detail" subtitle="Peek into the full conversation." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {selectedTicket ? (
            <>
              <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{selectedTicket.subject}</h2>
                  <Badge variant={statusBadgeVariant[selectedTicket.status]}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-2 text-[#6C757D]">
                  <p>
                    <span className="font-semibold text-[#212529]">From:</span>{' '}
                    {selectedTicket.userName} ({selectedTicket.userEmail})
                  </p>
                  <p>
                    <span className="font-semibold text-[#212529]">Created:</span>{' '}
                    {formatDateTime(selectedTicket.createdAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#212529]">Last Updated:</span>{' '}
                    {formatDateTime(selectedTicket.updatedAt)}
                  </p>
                </div>
                <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                  <p className="text-[#6C757D]">Description</p>
                  <p className="mt-2 whitespace-pre-line">{selectedTicket.description}</p>
                </div>
              </div>
              <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">
                    Update ticket
                  </p>
                  <TextArea
                    label="Internal note (optional)"
                    rows={3}
                    placeholder="Add resolution details (not yet persisted)"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => selectedTicket && updateTicketStatus(selectedTicket, 'resolved')}
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedTicket && updateTicketStatus(selectedTicket, 'in_progress')}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => selectedTicket && updateTicketStatus(selectedTicket, 'closed')}
                  >
                    Close Ticket
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6C757D]">
              Select a ticket from the table above to view details.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
