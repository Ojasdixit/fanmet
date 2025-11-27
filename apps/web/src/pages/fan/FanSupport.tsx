import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Button, TextArea, Badge } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

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

export function FanSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          title="Help & Support"
          subtitle="Raise a ticket if you face issues with payments, meets, or your account."
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
            placeholder="Share as many details as possible, including event names, creators, dates, and screenshots where relevant."
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
          subtitle="Track the status of requests you have raised."
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
              <div
                key={t.id}
                className="flex flex-col gap-1 rounded-[12px] border border-[#E9ECEF] bg-white p-4 text-sm text-[#212529]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold">{t.subject}</span>
                    <span className="text-xs text-[#6C757D]">{formatDateTime(t.createdAt)}</span>
                  </div>
                  <Badge variant={statusBadgeVariant[t.status]}>
                    {t.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-[#6C757D] whitespace-pre-line">
                  {t.description}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
