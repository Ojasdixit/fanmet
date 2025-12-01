import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface TicketReply {
  id: string;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
  userName: string;
}

interface AdminTicketRow {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  firstResponseAt: string | null;
  userName: string;
  userEmail: string;
  userRole: string;
  isOverdue: boolean; // No response in 24 hours
}

const statusFilterOptions: { label: string; value: 'all' | TicketStatus | 'overdue' }[] = [
  { label: 'All', value: 'all' },
  { label: '🔴 Overdue', value: 'overdue' },
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

// Check if ticket is overdue (no admin response in 24 hours)
const isTicketOverdue = (createdAt: string, firstResponseAt: string | null, status: TicketStatus): boolean => {
  if (status === 'resolved' || status === 'closed') return false;
  if (firstResponseAt) return false; // Already responded
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= 24;
};

export function AdminSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus | 'overdue'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Fetch tickets - sorted oldest first for priority
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select(
            'id, subject, description, status, created_at, updated_at, first_response_at, users:user_id (email, role, display_name)',
          )
          .order('created_at', { ascending: true }); // Oldest first!

        if (error || !data) {
          console.error('Error fetching support tickets:', error);
          setTickets([]);
          return;
        }

        const rows: AdminTicketRow[] = (data as any[]).map((t: any) => {
          const userInfo = t.users as any | null;
          const name =
            userInfo?.display_name || (userInfo?.email ? userInfo.email.split('@')[0] : 'User');
          const overdue = isTicketOverdue(t.created_at, t.first_response_at, t.status);
          return {
            id: t.id,
            subject: t.subject,
            description: t.description,
            status: t.status as TicketStatus,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            firstResponseAt: t.first_response_at,
            userName: name,
            userEmail: userInfo?.email ?? '',
            userRole: userInfo?.role ?? '',
            isOverdue: overdue,
          };
        });

        // Sort: overdue tickets first, then by created date (oldest first)
        rows.sort((a, b) => {
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
  }, []);

  // Fetch replies for selected ticket
  useEffect(() => {
    const fetchReplies = async () => {
      if (!selectedTicketId) {
        setReplies([]);
        return;
      }

      const { data, error } = await supabase
        .from('ticket_replies')
        .select('id, message, is_admin_reply, created_at, user_id')
        .eq('ticket_id', selectedTicketId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('Error fetching replies:', error);
        setReplies([]);
        return;
      }

      // Get user names for replies
      const userIds = [...new Set((data as any[]).map((r) => r.user_id).filter(Boolean))];
      let userMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', userIds);
        
        if (users) {
          userMap = Object.fromEntries(
            (users as any[]).map((u) => [u.id, u.display_name || u.email?.split('@')[0] || 'User'])
          );
        }
      }

      setReplies(
        (data as any[]).map((r) => ({
          id: r.id,
          message: r.message,
          isAdminReply: r.is_admin_reply,
          createdAt: r.created_at,
          userName: r.is_admin_reply ? 'Support Team' : (userMap[r.user_id] || 'User'),
        }))
      );
    };

    void fetchReplies();
  }, [selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((t) => {
      // Handle overdue filter
      if (statusFilter === 'overdue') {
        if (!t.isOverdue) return false;
      } else if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      
      if (!query) return true;

      return (
        t.subject.toLowerCase().includes(query) ||
        t.userName.toLowerCase().includes(query) ||
        t.userEmail.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      );
    });
  }, [tickets, search, statusFilter]);

  // Send admin reply
  const handleSendReply = async () => {
    if (!user || !selectedTicketId || !replyMessage.trim()) {
      alert('Please enter a reply message.');
      return;
    }

    setIsSendingReply(true);
    try {
      // Insert reply
      const { error: replyError } = await supabase.from('ticket_replies').insert({
        ticket_id: selectedTicketId,
        user_id: user.id,
        message: replyMessage.trim(),
        is_admin_reply: true,
      });

      if (replyError) {
        console.error('Error sending reply:', replyError);
        alert('Failed to send reply.');
        return;
      }

      // Update first_response_at if this is the first admin response
      const ticket = tickets.find((t) => t.id === selectedTicketId);
      if (ticket && !ticket.firstResponseAt) {
        await supabase
          .from('support_tickets')
          .update({ 
            first_response_at: new Date().toISOString(),
            status: ticket.status === 'open' ? 'in_progress' : ticket.status,
          })
          .eq('id', selectedTicketId);

        // Update local state
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicketId
              ? { ...t, firstResponseAt: new Date().toISOString(), isOverdue: false, status: t.status === 'open' ? 'in_progress' : t.status }
              : t
          )
        );
      }

      // Add reply to local state
      setReplies((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          message: replyMessage.trim(),
          isAdminReply: true,
          createdAt: new Date().toISOString(),
          userName: 'Support Team',
        },
      ]);

      setReplyMessage('');
      alert('Reply sent successfully!');
    } finally {
      setIsSendingReply(false);
    }
  };

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
        <CardHeader title="Tickets" subtitle="Oldest tickets shown first. Overdue tickets (24h+ no response) highlighted in red." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Ticket</th>
                <th className="border-b border-[#E9ECEF] py-3">User</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Created</th>
                <th className="border-b border-[#E9ECEF] py-3">SLA</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-[#E9ECEF] ${
                    ticket.isOverdue 
                      ? 'bg-red-50 hover:bg-red-100' 
                      : selectedTicketId === ticket.id 
                        ? 'bg-[#F8F9FA]' 
                        : ''
                  }`}
                >
                  <td className="py-3 text-[#212529]">
                    <button
                      type="button"
                      className="flex flex-col text-left"
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <div className="flex items-center gap-2">
                        {ticket.isOverdue && <span className="text-red-500">🔴</span>}
                        <span className="font-semibold">{ticket.subject}</span>
                      </div>
                      <span className="text-xs text-[#6C757D]">{ticket.id.slice(0, 8)}...</span>
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
                  <td className="py-3">
                    {ticket.isOverdue ? (
                      <span className="font-semibold text-red-600">⚠️ OVERDUE</span>
                    ) : ticket.firstResponseAt ? (
                      <span className="text-green-600">✓ Responded</span>
                    ) : (
                      <span className="text-yellow-600">Awaiting</span>
                    )}
                  </td>
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
        <CardHeader title="Ticket Detail & Conversation" subtitle="View ticket details and reply to the user." />
        <CardContent className="flex flex-col gap-4">
          {selectedTicket ? (
            <>
              {/* Ticket Info */}
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {selectedTicket.isOverdue && <span className="text-red-500 text-lg">🔴</span>}
                    <h2 className="text-lg font-semibold">{selectedTicket.subject}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTicket.isOverdue && (
                      <Badge variant="danger">OVERDUE 24h+</Badge>
                    )}
                    <Badge variant={statusBadgeVariant[selectedTicket.status]}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-2 text-[#6C757D] md:grid-cols-3">
                  <p>
                    <span className="font-semibold text-[#212529]">From:</span>{' '}
                    {selectedTicket.userName} ({selectedTicket.userEmail})
                  </p>
                  <p>
                    <span className="font-semibold text-[#212529]">Created:</span>{' '}
                    {formatDateTime(selectedTicket.createdAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#212529]">Role:</span>{' '}
                    {selectedTicket.userRole || 'User'}
                  </p>
                </div>
                <div className="rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Original Message</p>
                  <p className="mt-2 whitespace-pre-line">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D] mb-4">
                  Conversation ({replies.length} {replies.length === 1 ? 'reply' : 'replies'})
                </p>
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                  {replies.length === 0 ? (
                    <p className="text-sm text-[#6C757D] text-center py-4">
                      No replies yet. Be the first to respond!
                    </p>
                  ) : (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`rounded-[12px] p-4 ${
                          reply.isAdminReply
                            ? 'bg-[#F4E6FF] ml-8'
                            : 'bg-[#F8F9FA] mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-sm font-semibold ${reply.isAdminReply ? 'text-[#C045FF]' : 'text-[#212529]'}`}>
                            {reply.userName}
                            {reply.isAdminReply && ' (Admin)'}
                          </span>
                          <span className="text-xs text-[#6C757D]">{formatDateTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm text-[#212529] whitespace-pre-line">{reply.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D] mb-3">
                  Send Reply
                </p>
                <TextArea
                  label=""
                  rows={4}
                  placeholder="Type your reply to the user..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyMessage.trim()}
                  >
                    {isSendingReply ? 'Sending...' : 'Send Reply'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => selectedTicket && updateTicketStatus(selectedTicket, 'resolved')}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedTicket && updateTicketStatus(selectedTicket, 'in_progress')}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => selectedTicket && updateTicketStatus(selectedTicket, 'closed')}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6C757D] text-center py-8">
              Select a ticket from the table above to view details and reply.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
