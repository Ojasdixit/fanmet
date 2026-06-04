import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface WithdrawalRequest {
  id: string;
  code: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  amount: number;
  destination: string | null;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  adminNotes: string | null;
  gatewayReference: string | null;
  rejectionReason: string | null;
  earnings: {
    total: number;
    withdrawn: number;
    pending: number;
  };
  bankDetails: {
    accountName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    upiId: string | null;
  };
}

interface PaymentForm {
  gatewayReference: string;
  adminNotes: string;
}

interface RejectForm {
  reason: string;
  message: string;
}

export function AdminWithdrawalRequests() {
  const [pendingRequests, setPendingRequests] = useState<WithdrawalRequest[]>([]);
  const [historyRequests, setHistoryRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentForms, setPaymentForms] = useState<Record<string, PaymentForm>>({});
  const [rejectForms, setRejectForms] = useState<Record<string, RejectForm>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Fetch withdrawal requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching withdrawal requests:', requestsError);
        setFetchError('Failed to load withdrawal requests: ' + requestsError.message);
        setPendingRequests([]);
        setHistoryRequests([]);
        return;
      }

      // Fetch creator info with bank details
      const creatorIds = Array.from(new Set((requestsData ?? []).map((r: any) => r.creator_id)));
      const { data: profilesData, error: profilesError } = creatorIds.length
        ? await supabase.from('profiles').select('user_id, display_name, username, bank_account_name, bank_account_number, bank_ifsc, upi_id').in('user_id', creatorIds)
        : { data: [], error: null };

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profileMap = new Map<string, { displayName: string; username: string; bankDetails: any }>();
      for (const p of (profilesData ?? []) as any[]) {
        profileMap.set(p.user_id, {
          displayName: p.display_name || p.username || 'Creator',
          username: p.username ? `@${p.username}` : '@creator',
          bankDetails: {
            accountName: p.bank_account_name || null,
            accountNumber: p.bank_account_number || null,
            ifsc: p.bank_ifsc || null,
            upiId: p.upi_id || null,
          },
        });
      }

      // Fetch total earnings per creator (from won bids)
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('event_id, amount, status')
        .eq('status', 'won');

      if (bidsError) {
        console.error('Error fetching bids:', bidsError);
      }

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, creator_id');

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      }

      const eventCreatorMap = new Map<string, string>();
      for (const e of (eventsData ?? []) as any[]) {
        eventCreatorMap.set(e.id, e.creator_id);
      }

      const earningsPerCreator = new Map<string, number>();
      for (const b of (bidsData ?? []) as any[]) {
        const creatorId = eventCreatorMap.get(b.event_id);
        if (creatorId) {
          // Creator gets 90% of winning bid (10% platform commission)
          const earning = Math.floor((b.amount ?? 0) * 0.9);
          earningsPerCreator.set(creatorId, (earningsPerCreator.get(creatorId) ?? 0) + earning);
        }
      }

      // Calculate withdrawn amounts per creator
      const withdrawnPerCreator = new Map<string, number>();
      for (const r of (requestsData ?? []) as any[]) {
        if (r.status === 'completed') {
          withdrawnPerCreator.set(r.creator_id, (withdrawnPerCreator.get(r.creator_id) ?? 0) + (r.amount ?? 0));
        }
      }

      // Map requests
      const mapped: WithdrawalRequest[] = (requestsData ?? []).map((r: any) => {
        const profile = profileMap.get(r.creator_id);
        const totalEarnings = earningsPerCreator.get(r.creator_id) ?? 0;
        const totalWithdrawn = withdrawnPerCreator.get(r.creator_id) ?? 0;

        return {
          id: r.id,
          code: `#WR-${r.id.slice(0, 4).toUpperCase()}`,
          creatorId: r.creator_id,
          creatorName: profile?.displayName ?? 'Unknown',
          creatorUsername: profile?.username ?? '@creator',
          amount: r.amount ?? 0,
          destination: r.destination,
          status: r.status,
          requestedAt: r.requested_at,
          processedAt: r.processed_at,
          adminNotes: r.admin_notes,
          gatewayReference: r.gateway_reference,
          rejectionReason: r.rejection_reason,
          earnings: {
            total: totalEarnings,
            withdrawn: totalWithdrawn,
            pending: totalEarnings - totalWithdrawn,
          },
          bankDetails: profile?.bankDetails ?? {
            accountName: null,
            accountNumber: null,
            ifsc: null,
            upiId: null,
          },
        };
      });

      const pending = mapped.filter((r) => r.status === 'pending' || r.status === 'in_review');
      const history = mapped.filter((r) => r.status === 'completed' || r.status === 'failed');

      setPendingRequests(pending);
      setHistoryRequests(history);
    } catch (err: any) {
      console.error('Unexpected error fetching withdrawals:', err);
      setFetchError('Unexpected error: ' + (err?.message || String(err)));
      setPendingRequests([]);
      setHistoryRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleApprove = async (requestId: string) => {
    const form = paymentForms[requestId] ?? { gatewayReference: '', adminNotes: '' };

    if (!form.gatewayReference.trim()) {
      alert('Please enter the gateway reference ID.');
      return;
    }

    const confirmed = window.confirm('Confirm this payment has been processed?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          gateway_reference: form.gatewayReference.trim(),
          admin_notes: form.adminNotes.trim() || null,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error approving withdrawal:', error);
        alert('Failed to approve withdrawal.');
        return;
      }

      // Notify creator
      const request = pendingRequests.find((r) => r.id === requestId);
      if (request) {
        await supabase.from('notifications').insert({
          user_id: request.creatorId,
          type: 'withdrawal_processed',
          title: 'Money Transferred',
          message: `Your withdrawal request for ${formatCurrency(request.amount)} has been processed and the money has been transferred. Reference: ${form.gatewayReference.trim()}`,
        });
      }

      await fetchData();
      setPaymentForms((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
      alert('Withdrawal approved and marked as completed! Creator has been notified.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    const form = rejectForms[requestId] ?? { reason: '', message: '' };

    if (!form.reason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    const confirmed = window.confirm('Reject this withdrawal request?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString(),
          rejection_reason: form.reason.trim(),
          admin_notes: form.message.trim() || null,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting withdrawal:', error);
        alert('Failed to reject withdrawal.');
        return;
      }

      await fetchData();
      setRejectForms((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
      alert('Withdrawal request rejected.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
    pending: 'warning',
    in_review: 'primary',
    completed: 'success',
    failed: 'danger',
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Withdrawal Requests</h1>
          <p className="text-sm text-[#6C757D]">Verify payouts, capture references, and keep the audit trail healthy.</p>
        </div>
        <Badge variant="warning">{pendingRequests.length} pending</Badge>
      </div>

      {fetchError && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Error loading data</p>
          <p>{fetchError}</p>
          <button
            type="button"
            onClick={() => fetchData()}
            className="mt-2 text-red-700 underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      <Card>
        <CardHeader title="Pending" subtitle="Requests needing manual review or payment confirmation." />
        <CardContent className="space-y-4">
          {pendingRequests.length === 0 && (
            <p className="py-4 text-center text-sm text-[#6C757D]">
              {isLoading ? 'Loading...' : 'No pending withdrawal requests'}
            </p>
          )}
          {pendingRequests.map((request) => {
            const payForm = paymentForms[request.id] ?? { gatewayReference: '', adminNotes: '' };
            const rejForm = rejectForms[request.id] ?? { reason: '', message: '' };

            return (
              <div key={request.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#212529]">{request.creatorName}</h2>
                    <p className="text-sm text-[#6C757D]">
                      {request.creatorUsername} · Requested {formatTimeAgo(request.requestedAt)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[request.status] ?? 'warning'}>
                    {request.status === 'pending' ? 'Awaiting payout' : request.status}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 text-sm text-[#212529]">
                    <p>Request ID: <strong>{request.code}</strong></p>
                    <p>Amount: <strong className="text-lg">{formatCurrency(request.amount)}</strong></p>
                    <p>Method: {request.destination || 'Not specified'}</p>
                    <p>Requested On: {formatDateTime(request.requestedAt)}</p>
                  </div>
                  <div className="space-y-2 rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                    <p className="text-[#6C757D]">Creator Earnings Breakdown</p>
                    <p>Total Earnings: <strong>{formatCurrency(request.earnings.total)}</strong></p>
                    <p>Withdrawn: <strong>{formatCurrency(request.earnings.withdrawn)}</strong></p>
                    <p>Available Balance: <strong className="text-[#28A745]">{formatCurrency(request.earnings.pending)}</strong></p>
                  </div>
                  <div className="space-y-2 rounded-[12px] border border-[#E9ECEF] bg-white p-4 text-sm text-[#212529]">
                    <p className="font-semibold text-[#7B2CBF]">🏦 Payment Details</p>
                    {request.bankDetails.upiId ? (
                      <div>
                        <p className="text-[#6C757D]">UPI ID</p>
                        <p className="font-mono text-sm">{request.bankDetails.upiId}</p>
                      </div>
                    ) : request.bankDetails.accountNumber ? (
                      <div className="space-y-1">
                        <p><span className="text-[#6C757D]">Account Name:</span> <strong>{request.bankDetails.accountName || 'N/A'}</strong></p>
                        <p><span className="text-[#6C757D]">Account Number:</span> <span className="font-mono">{request.bankDetails.accountNumber}</span></p>
                        <p><span className="text-[#6C757D]">IFSC:</span> <span className="font-mono">{request.bankDetails.ifsc || 'N/A'}</span></p>
                      </div>
                    ) : (
                      <p className="text-xs text-red-500">⚠️ No payment details saved. Ask creator to add bank/UPI in settings.</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                    <p className="text-sm font-semibold text-[#212529]">✅ Mark as Paid</p>
                    <TextInput
                      label="Gateway Reference ID"
                      placeholder="pay_xyz123"
                      value={payForm.gatewayReference}
                      onChange={(e) =>
                        setPaymentForms((prev) => ({
                          ...prev,
                          [request.id]: { ...payForm, gatewayReference: e.target.value },
                        }))
                      }
                    />
                    <TextArea
                      label="Admin Notes"
                      rows={2}
                      placeholder="Optional note for audit log"
                      value={payForm.adminNotes}
                      onChange={(e) =>
                        setPaymentForms((prev) => ({
                          ...prev,
                          [request.id]: { ...payForm, adminNotes: e.target.value },
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      disabled={isLoading}
                    >
                      Confirm Payment
                    </Button>
                  </div>
                  <div className="space-y-3 rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                    <p className="text-sm font-semibold text-[#212529]">❌ Reject Request</p>
                    <TextInput
                      label="Reason"
                      placeholder="Insufficient balance / pending dispute / ..."
                      value={rejForm.reason}
                      onChange={(e) =>
                        setRejectForms((prev) => ({
                          ...prev,
                          [request.id]: { ...rejForm, reason: e.target.value },
                        }))
                      }
                    />
                    <TextArea
                      label="Message to creator"
                      rows={2}
                      placeholder="Explain next steps"
                      value={rejForm.message}
                      onChange={(e) =>
                        setRejectForms((prev) => ({
                          ...prev,
                          [request.id]: { ...rejForm, message: e.target.value },
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(request.id)}
                      disabled={isLoading}
                    >
                      Reject Request
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="History" subtitle="Resolved withdrawal requests across the platform." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">ID</th>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Method</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Processed</th>
                <th className="border-b border-[#E9ECEF] py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {historyRequests.map((entry) => (
                <tr key={entry.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#6C757D]">{entry.code}</td>
                  <td className="py-3 text-[#212529]">{entry.creatorName}</td>
                  <td className="py-3 text-[#212529]">{formatCurrency(entry.amount)}</td>
                  <td className="py-3 text-[#6C757D]">{entry.destination || '-'}</td>
                  <td className="py-3">
                    <Badge variant={statusVariant[entry.status] ?? 'primary'}>
                      {entry.status === 'completed' ? 'Paid' : 'Rejected'}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">
                    {entry.processedAt ? formatDateTime(entry.processedAt) : '-'}
                  </td>
                  <td className="py-3 text-[#6C757D]">
                    {entry.gatewayReference || entry.rejectionReason || '-'}
                  </td>
                </tr>
              ))}
              {historyRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No withdrawal history'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
