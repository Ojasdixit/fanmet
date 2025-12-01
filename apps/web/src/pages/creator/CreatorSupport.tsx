import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Button, TextArea, Badge } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface TicketReply {
  id: string;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
}

interface MyTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

const statusBadgeVariant: Record<TicketStatus, 'primary' | 'warning' | 'success' | 'danger'> = {
  open: 'primary',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'danger',
};

export function CreatorSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, subject, description, status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching support tickets:', error);
        setTickets([]);
        setIsLoading(false);
        return;
      }

      setTickets(
        (data as any[]).map((t) => ({
          id: t.id,
          subject: t.subject,
          description: t.description,
          status: t.status as TicketStatus,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })),
      );
      setIsLoading(false);
    };

    void fetchTickets();
  }, [user]);

  // Fetch replies when a ticket is selected
  useEffect(() => {
    const fetchReplies = async () => {
      if (!selectedTicketId) {
        setReplies([]);
        return;
      }

      const { data, error } = await supabase
        .from('ticket_replies')
        .select('id, message, is_admin_reply, created_at')
        .eq('ticket_id', selectedTicketId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('Error fetching replies:', error);
        setReplies([]);
        return;
      }

      setReplies(
        (data as any[]).map((r) => ({
          id: r.id,
          message: r.message,
          isAdminReply: r.is_admin_reply,
          createdAt: r.created_at,
        }))
      );
    };

    void fetchReplies();
  }, [selectedTicketId]);

  const handleSendReply = async () => {
    if (!user || !selectedTicketId || !replyMessage.trim()) {
      alert('Please enter a message.');
      return;
    }

    setIsSendingReply(true);
    try {
      const { error } = await supabase.from('ticket_replies').insert({
        ticket_id: selectedTicketId,
        user_id: user.id,
        message: replyMessage.trim(),
        is_admin_reply: false,
      });

      if (error) {
        console.error('Error sending reply:', error);
        alert('Failed to send reply.');
        return;
      }

      setReplies((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          message: replyMessage.trim(),
          isAdminReply: false,
          createdAt: new Date().toISOString(),
        },
      ]);

      setReplyMessage('');
      alert('Reply sent! Our support team will respond soon.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please log in to raise a support ticket.');
      return;
    }

    if (!subject.trim() || !description.trim()) {
      alert('Please enter a subject and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          description: description.trim(),
          status: 'open',
        })
        .select('id, subject, description, status, created_at, updated_at')
        .single();

      if (error || !data) {
        console.error('Error creating support ticket:', error);
        alert('Failed to create support ticket.');
        return;
      }

      setTickets((prev) => [
        {
          id: data.id,
          subject: data.subject,
          description: data.description,
          status: data.status as TicketStatus,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        ...prev,
      ]);
      setSubject('');
      setDescription('');
      alert('Support ticket created successfully. Our team will get back to you.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader
          title="Creator Support"
          subtitle="Raise a ticket for payout issues, events, or other account questions."
        />
        <CardContent className="gap-4">
          <TextArea
            label="Subject"
            rows={2}
            placeholder="Briefly describe your issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <TextArea
            label="Details"
            rows={5}
            placeholder="Share as many details as possible, including event names, fans, dates, and screenshots where relevant."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Your Tickets"
          subtitle="Click a ticket to view the conversation and reply."
        />
        <CardContent className="flex flex-col gap-3">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-[#6C757D]">Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="py-4 text-center text-sm text-[#6C757D]">
              You have not raised any tickets yet.
            </div>
          ) : (
            tickets.map((t) => (
              <div key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(selectedTicketId === t.id ? null : t.id)}
                  className={`w-full text-left rounded-[12px] border p-4 text-sm text-[#212529] transition-all ${
                    selectedTicketId === t.id
                      ? 'border-[#C045FF] bg-[#F4E6FF]/30'
                      : 'border-[#E9ECEF] bg-white hover:border-[#C045FF]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-semibold">{t.subject}</span>
                      <span className="text-xs text-[#6C757D]">{formatDateTime(t.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant[t.status]}>
                        {t.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-[#6C757D]">{selectedTicketId === t.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#6C757D] whitespace-pre-line">
                    {t.description}
                  </p>
                </button>

                {/* Expanded conversation view */}
                {selectedTicketId === t.id && (
                  <div className="mt-2 ml-4 border-l-2 border-[#C045FF] pl-4 space-y-4">
                    {/* Conversation thread */}
                    <div className="space-y-3">
                      {replies.length === 0 ? (
                        <p className="text-sm text-[#6C757D] py-2">
                          No replies yet. Our support team will respond soon.
                        </p>
                      ) : (
                        replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`rounded-[10px] p-3 text-sm ${
                              reply.isAdminReply
                                ? 'bg-[#F4E6FF] border-l-4 border-[#C045FF]'
                                : 'bg-[#F8F9FA]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`font-semibold ${reply.isAdminReply ? 'text-[#C045FF]' : 'text-[#212529]'}`}>
                                {reply.isAdminReply ? '🎧 Support Team' : 'You'}
                              </span>
                              <span className="text-xs text-[#6C757D]">{formatDateTime(reply.createdAt)}</span>
                            </div>
                            <p className="text-[#212529] whitespace-pre-line">{reply.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply form - only show if ticket is not closed/resolved */}
                    {t.status !== 'closed' && t.status !== 'resolved' && (
                      <div className="space-y-2">
                        <TextArea
                          label="Reply to this ticket"
                          rows={3}
                          placeholder="Type your message..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={handleSendReply}
                          disabled={isSendingReply || !replyMessage.trim()}
                        >
                          {isSendingReply ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    )}

                    {(t.status === 'closed' || t.status === 'resolved') && (
                      <p className="text-sm text-[#6C757D] italic">
                        This ticket is {t.status}. Create a new ticket if you need further assistance.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
