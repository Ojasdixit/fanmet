import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Button, Badge } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface PastMeet {
  id: string;
  creator_name: string;
  event_title: string;
  scheduled_at: string;
  amount: number;
  status: string;
}

interface PendingRequest {
  id: string;
  creator_name: string;
  event_title: string;
  created_at: string;
  amount: number;
  status: string;
}

const statusVariantMap: Record<string, 'primary' | 'warning' | 'success' | 'danger' | 'default'> = {
  'active': 'primary',
  'lost': 'danger',
  'won': 'success',
};

export function FanHistory() {
  const { user } = useAuth();
  const [pastMeets, setPastMeets] = useState<PastMeet[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch completed meets
        const { data: meetsData, error: meetsError } = await supabase
          .from('meets')
          .select(`
            id,
            scheduled_at,
            status,
            event_id,
            creator_id
          `)
          .eq('fan_id', user.id)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false });

        if (meetsError) throw meetsError;

        // Fetch details for meets
        const meetsWithDetails = await Promise.all(
          (meetsData || []).map(async (meet) => {
            const { data: event } = await supabase
              .from('events')
              .select('title')
              .eq('id', meet.event_id)
              .single();

            const { data: creator } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', meet.creator_id)
              .single();

            // Fetch winning bid amount
            const { data: bid } = await supabase
              .from('bids')
              .select('amount')
              .eq('event_id', meet.event_id)
              .eq('bidder_id', user.id)
              .eq('status', 'won')
              .single();

            return {
              id: meet.id,
              creator_name: creator?.display_name || 'Unknown Creator',
              event_title: event?.title || 'Unknown Event',
              scheduled_at: meet.scheduled_at,
              amount: bid?.amount || 0,
              status: meet.status,
            };
          })
        );

        setPastMeets(meetsWithDetails);

        // Fetch active bids (pending requests)
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select(`
            id,
            amount,
            status,
            created_at,
            event_id
          `)
          .eq('bidder_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (bidsError) throw bidsError;

        // Fetch details for bids
        const bidsWithDetails = await Promise.all(
          (bidsData || []).map(async (bid) => {
            const { data: event } = await supabase
              .from('events')
              .select('title, creator_id')
              .eq('id', bid.event_id)
              .single();

            let creatorName = 'Unknown Creator';
            if (event?.creator_id) {
              const { data: creator } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('user_id', event.creator_id)
                .single();
              creatorName = creator?.display_name || 'Unknown Creator';
            }

            return {
              id: bid.id,
              creator_name: creatorName,
              event_title: event?.title || 'Unknown Event',
              created_at: bid.created_at,
              amount: bid.amount,
              status: bid.status,
            };
          })
        );

        setPendingRequests(bidsWithDetails);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return <div className="p-8 text-center text-[#6C757D]">Loading history...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">History</h1>
        <p className="text-sm text-[#6C757D]">
          Catch up on your past sessions and keep tabs on upcoming requests.
        </p>
      </div>

      <Card elevated>
        <CardHeader
          title="Past Experiences"
          subtitle="Rate your meets and revisit standout memories."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-6">
          {pastMeets.length === 0 ? (
            <div className="text-center text-sm text-[#6C757D] py-4">
              No past meets yet.
            </div>
          ) : (
            pastMeets.map((meet) => (
              <div key={meet.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="primary">{meet.creator_name}</Badge>
                    <span className="text-sm text-[#6C757D]">{formatDateTime(new Date(meet.scheduled_at))}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[#212529]">{meet.event_title}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm text-[#6C757D]">Winning Bid</span>
                  <span className="text-xl font-semibold text-[#212529]">{formatCurrency(meet.amount)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Pending Requests"
          subtitle="Stay updated on events waiting for confirmation."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center text-sm text-[#6C757D] py-4">
              No pending requests.
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-[12px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-[#6C757D]">Requested on {formatDateTime(new Date(request.created_at))}</p>
                  <h3 className="text-lg font-semibold text-[#212529]">{request.event_title}</h3>
                  <p className="text-sm text-[#6C757D]">with {request.creator_name}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={statusVariantMap[request.status] ?? 'default'}>{request.status}</Badge>
                  <span className="text-sm font-medium text-[#212529]">Bid: {formatCurrency(request.amount)}</span>
                </div>
              </div>
            ))
          )}
          <Button variant="ghost" className="self-start">
            View all requests →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
