import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

const fanFilters = {
  segments: ['High Spenders', 'Active Bidders', 'Inactive', 'Multiple Wins', 'Never Won', 'Refund Issues'],
  sortOptions: ['Total Spent', 'Number of Bids', 'Wins Count', 'Join Date', 'Last Activity'],
};

type FanStatus = 'Active' | 'Inactive' | 'At risk';

interface FanRow {
  id: string; // user id (uuid)
  code: string; // display id like #F-XXXX
  name: string;
  email: string;
  totalSpent: number;
  bids: number;
  wins: number;
  lastBidAt: string | null;
  status: FanStatus;
  joinedAt: string;
  isVip: boolean;
  isFlagged: boolean;
}

interface FanBid {
  id: string;
  fanId: string;
  eventId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface SimpleEvent {
  id: string;
  title: string;
  category?: string | null;
}

interface FanDetail {
  profile: {
    id: string;
    code: string;
    name: string;
    email: string;
    phone: string | null;
    joinDate: string;
    preferredEvents: string;
    status: FanStatus;
    isVip: boolean;
    isFlagged: boolean;
  };
  bidHistory: {
    date: string;
    event: string;
    amountLabel: string;
    resultLabel: string;
  }[];
  spending: {
    averageBid: number;
    highestBid: number;
    winRate: number;
    refundsTotal: number;
  };
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return 'No bids yet';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

function buildFanDetail(
  fanId: string,
  fans: FanRow[],
  fanBids: FanBid[],
  eventsById: Record<string, SimpleEvent>,
): FanDetail | null {
  const fan = fans.find((f) => f.id === fanId);
  if (!fan) return null;

  const bidsForFan = fanBids.filter((b) => b.fanId === fanId);
  const totalBids = bidsForFan.length;
  const totalAmount = bidsForFan.reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const highestBid = bidsForFan.reduce((max, b) => Math.max(max, b.amount ?? 0), 0);
  const wins = bidsForFan.filter((b) => b.status === 'won').length;
  const winRate = totalBids > 0 ? Math.round((wins / totalBids) * 100) : 0;
  const refundsTotal = bidsForFan
    .filter((b) => b.status === 'lost')
    .reduce((sum, b) => sum + Math.floor((b.amount ?? 0) * 0.9), 0);

  const categoryCounts = new Map<string, number>();
  for (const b of bidsForFan) {
    const ev = eventsById[b.eventId];
    const cat = ev?.category || 'General';
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  const sortedCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  const preferredEvents =
    sortedCategories.length > 0 ? sortedCategories.join(', ') : 'No data yet';

  const bidHistory = bidsForFan
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map((b) => {
      const ev = eventsById[b.eventId];
      const d = new Date(b.createdAt);
      const dateLabel = d.toLocaleDateString('en-IN', {
        month: 'short',
        day: '2-digit',
      });

      let resultLabel: string;
      if (b.status === 'won') resultLabel = '🏆 Won';
      else if (b.status === 'lost') resultLabel = '❌ Lost';
      else if (b.status === 'cancelled') resultLabel = 'Cancelled';
      else resultLabel = b.status;

      return {
        date: dateLabel,
        event: ev?.title ?? 'Event',
        amountLabel: formatCurrency(b.amount ?? 0),
        resultLabel,
      };
    });

  return {
    profile: {
      id: fan.id,
      code: fan.code,
      name: fan.name,
      email: fan.email,
      phone: null,
      joinDate: formatDateTime(fan.joinedAt),
      preferredEvents,
      status: fan.status,
      isVip: fan.isVip,
      isFlagged: fan.isFlagged,
    },
    spending: {
      averageBid: totalBids > 0 ? totalAmount / totalBids : 0,
      highestBid,
      winRate,
      refundsTotal,
    },
    bidHistory,
  };
}

export function AdminFans() {
  const [fans, setFans] = useState<FanRow[]>([]);
  const [fanBids, setFanBids] = useState<FanBid[]>([]);
  const [eventsById, setEventsById] = useState<Record<string, SimpleEvent>>({});
  const [selectedFanId, setSelectedFanId] = useState<string | null>(null);
  const [selectedFanDetail, setSelectedFanDetail] = useState<FanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFans = async () => {
      setIsLoading(true);

      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, display_name, account_status, created_at, updated_at, is_vip, is_flagged_for_review')
          .eq('role', 'fan');

        if (usersError || !usersData) {
          console.error('Error fetching fans:', usersError);
          setFans([]);
          setFanBids([]);
          setEventsById({});
          setSelectedFanId(null);
          setSelectedFanDetail(null);
          return;
        }

        const { data: bidsData } = await supabase
          .from('bids')
          .select('id, event_id, fan_id, amount, status, created_at');

        const fanBidsLocal: FanBid[] = (bidsData ?? []).map((b: any) => ({
          id: b.id,
          fanId: b.fan_id,
          eventId: b.event_id,
          amount: b.amount ?? 0,
          status: b.status,
          createdAt: b.created_at,
        }));

        const eventIds = Array.from(
          new Set(fanBidsLocal.map((b) => b.eventId).filter(Boolean)),
        );

        const { data: eventsData } = eventIds.length
          ? await supabase
              .from('events')
              .select('id, title, category')
              .in('id', eventIds)
          : { data: null };

        const eventsByIdLocal: Record<string, SimpleEvent> = {};
        for (const e of (eventsData ?? []) as any[]) {
          eventsByIdLocal[e.id] = {
            id: e.id,
            title: e.title,
            category: e.category,
          };
        }

        const bidsByFan = new Map<string, FanBid[]>();
        for (const b of fanBidsLocal) {
          const list = bidsByFan.get(b.fanId) ?? [];
          list.push(b);
          bidsByFan.set(b.fanId, list);
        }

        const now = new Date();

        const fanRows: FanRow[] = (usersData as any[]).map((u: any) => {
          const bidList = bidsByFan.get(u.id) ?? [];
          const totalSpent = bidList
            .filter((b) => b.status === 'won')
            .reduce((sum, b) => sum + (b.amount ?? 0), 0);
          const bidsCount = bidList.length;
          const winsCount = bidList.filter((b) => b.status === 'won').length;
          const lastBid = bidList.reduce<FanBid | null>((latest, b) => {
            if (!latest) return b;
            return new Date(b.createdAt) > new Date(latest.createdAt)
              ? b
              : latest;
          }, null);
          const lastBidAt = lastBid ? lastBid.createdAt : null;

          let status: FanStatus = 'Inactive';
          if (!lastBidAt) {
            status = 'Inactive';
          } else {
            const diffDays =
              (now.getTime() - new Date(lastBidAt).getTime()) /
              (1000 * 60 * 60 * 24);
            if (diffDays <= 7) status = 'Active';
            else if (diffDays <= 30) status = 'At risk';
            else status = 'Inactive';
          }

          const code = `#F-${String(u.id).slice(0, 4).toUpperCase()}`;
          const name = u.display_name || (u.email ? u.email.split('@')[0] : 'Fan');

          return {
            id: u.id,
            code,
            name,
            email: u.email,
            totalSpent,
            bids: bidsCount,
            wins: winsCount,
            lastBidAt,
            status,
            joinedAt: u.created_at,
            isVip: u.is_vip ?? false,
            isFlagged: u.is_flagged_for_review ?? false,
          };
        });

        fanRows.sort((a, b) => b.totalSpent - a.totalSpent);

        const initialFanId = fanRows[0]?.id ?? null;
        const initialDetail = initialFanId
          ? buildFanDetail(initialFanId, fanRows, fanBidsLocal, eventsByIdLocal)
          : null;

        setFans(fanRows);
        setFanBids(fanBidsLocal);
        setEventsById(eventsByIdLocal);
        setSelectedFanId(initialFanId);
        setSelectedFanDetail(initialDetail);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFans();
  }, []);

  const filteredFans = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...fans];

    if (query) {
      list = list.filter((fan) => {
        return (
          fan.name.toLowerCase().includes(query) ||
          fan.email.toLowerCase().includes(query) ||
          fan.code.toLowerCase().includes(query)
        );
      });
    }

    list.sort((a, b) => b.totalSpent - a.totalSpent);
    return list;
  }, [fans, search]);

  const handleSelectFan = (fanId: string) => {
    setSelectedFanId(fanId);
    const detail = buildFanDetail(fanId, fans, fanBids, eventsById);
    setSelectedFanDetail(detail);
  };

  const handleSendOffer = async (fanId: string, fanName: string) => {
    const offerAmount = window.prompt(`Enter offer amount (₹) to send to ${fanName}:`, '100');
    if (!offerAmount) return;

    const amount = parseInt(offerAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    try {
      // Create offer record
      const { error: offerError } = await supabase.from('fan_offers').insert({
        fan_id: fanId,
        offer_type: 'discount',
        offer_details: `₹${amount} discount offer`,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (offerError) {
        console.error('Error creating offer:', offerError);
        alert('Failed to send offer.');
        return;
      }

      alert(`Offer of ₹${amount} sent to ${fanName}!`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLoyaltyReward = async () => {
    if (!selectedFanId || !selectedFanDetail) return;

    const rewardAmount = window.prompt(
      `Enter loyalty reward amount (₹) to add to ${selectedFanDetail.profile.name}'s wallet:`,
      '500',
    );
    if (!rewardAmount) return;

    const amount = parseInt(rewardAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    try {
      // Create loyalty reward record
      const { error: rewardError } = await supabase.from('loyalty_rewards').insert({
        fan_id: selectedFanId,
        reward_type: 'credits',
        amount,
        description: `Loyalty reward of ₹${amount}`,
      });

      if (rewardError) {
        console.error('Error creating loyalty reward:', rewardError);
        alert('Failed to create loyalty reward record.');
        return;
      }

      // Add credits to fan's wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', selectedFanId)
        .maybeSingle();

      if (walletData) {
        // Update existing wallet
        await supabase
          .from('wallets')
          .update({ balance: (walletData.balance ?? 0) + amount })
          .eq('id', walletData.id);
      } else {
        // Create new wallet
        await supabase.from('wallets').insert({
          user_id: selectedFanId,
          balance: amount,
        });
      }

      alert(`Loyalty reward of ₹${amount} added to ${selectedFanDetail.profile.name}'s wallet!`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVip = async () => {
    if (!selectedFanId || !selectedFanDetail) return;

    const currentVip = selectedFanDetail.profile.isVip;
    const action = currentVip ? 'remove VIP status from' : 'grant VIP status to';
    const confirmed = window.confirm(`${action} ${selectedFanDetail.profile.name}?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_vip: !currentVip })
        .eq('id', selectedFanId);

      if (error) {
        console.error('Error updating VIP status:', error);
        alert('Failed to update VIP status.');
        return;
      }

      // Update local state
      setFans((prev) =>
        prev.map((f) => (f.id === selectedFanId ? { ...f, isVip: !currentVip } : f)),
      );
      setSelectedFanDetail((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, isVip: !currentVip } } : null,
      );

      alert(`${selectedFanDetail.profile.name} ${currentVip ? 'removed from' : 'marked as'} VIP!`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFlag = async () => {
    if (!selectedFanId || !selectedFanDetail) return;

    const currentFlag = selectedFanDetail.profile.isFlagged;

    let reason: string | null = null;
    if (!currentFlag) {
      reason = window.prompt('Enter reason for flagging this fan for review:');
      if (reason === null) return; // Cancelled
    } else {
      const confirmed = window.confirm(`Remove flag from ${selectedFanDetail.profile.name}?`);
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_flagged_for_review: !currentFlag,
          flagged_reason: currentFlag ? null : reason,
        })
        .eq('id', selectedFanId);

      if (error) {
        console.error('Error updating flag status:', error);
        alert('Failed to update flag status.');
        return;
      }

      // Update local state
      setFans((prev) =>
        prev.map((f) => (f.id === selectedFanId ? { ...f, isFlagged: !currentFlag } : f)),
      );
      setSelectedFanDetail((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, isFlagged: !currentFlag } } : null,
      );

      alert(
        `${selectedFanDetail.profile.name} ${currentFlag ? 'unflagged' : 'flagged for review'}!`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Fans Management</h1>
          <p className="text-sm text-[#6C757D]">Surface high-value fans, address churn risk, and track spending patterns.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Create Segment</Button>
          <Button>Send Campaign</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Mix and match segments to focus on specific fan cohorts." />
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Search Fans"
              placeholder="Name, email, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <TextInput label="Date Range" placeholder="Last activity" />
            <TextInput label="Total Spent" placeholder="> ₹5,000" />
            <TextInput label="Win Rate" placeholder="> 20%" />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Segments</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {fanFilters.segments.map((segment) => (
                  <Badge key={segment} variant="primary">
                    {segment}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Sort By</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {fanFilters.sortOptions.map((option) => (
                  <Badge key={option} variant="warning">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Fan Leaderboard" subtitle="Compare engagement, wins, and spend at a glance." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Fan</th>
                <th className="border-b border-[#E9ECEF] py-3">Email</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Spent</th>
                <th className="border-b border-[#E9ECEF] py-3">Bids</th>
                <th className="border-b border-[#E9ECEF] py-3">Wins</th>
                <th className="border-b border-[#E9ECEF] py-3">Last Bid</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFans.map((fan) => (
                <tr key={fan.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {fan.name}
                        {fan.isVip && (
                          <span className="ml-1 text-xs text-[#FFD700]">⭐ VIP</span>
                        )}
                        {fan.isFlagged && (
                          <span className="ml-1 text-xs text-[#DC3545]">🚩</span>
                        )}
                      </span>
                      <span className="text-xs text-[#6C757D]">{fan.code}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#6C757D]">{fan.email}</td>
                  <td className="py-3 text-[#212529]">{formatCurrency(fan.totalSpent)}</td>
                  <td className="py-3 text-[#212529]">{fan.bids}</td>
                  <td className="py-3 text-[#212529]">{fan.wins}</td>
                  <td className="py-3 text-[#6C757D]">{formatTimeAgo(fan.lastBidAt)}</td>
                  <td className="py-3">
                    <Badge
                      variant={fan.status === 'Active' ? 'success' : fan.status === 'At risk' ? 'warning' : 'danger'}
                    >
                      {fan.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSelectFan(fan.id)}
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendOffer(fan.id, fan.name)}
                        disabled={isLoading}
                      >
                        Send Offer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Fan Detail" subtitle="Deep dive into engagement and outcomes for a specific fan." />
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {selectedFanDetail ? (
            <>
              <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-[#6C757D]">Name / ID</p>
                    <p>{selectedFanDetail.profile.name}</p>
                    <p className="text-xs text-[#6C757D]">{selectedFanDetail.profile.code}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Email</p>
                    <p>{selectedFanDetail.profile.email}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Phone</p>
                    <p>{selectedFanDetail.profile.phone ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Joined</p>
                    <p>{selectedFanDetail.profile.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Status</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant={
                          selectedFanDetail.profile.status === 'Active'
                            ? 'success'
                            : selectedFanDetail.profile.status === 'At risk'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {selectedFanDetail.profile.status}
                      </Badge>
                      {selectedFanDetail.profile.isVip && (
                        <Badge variant="warning">⭐ VIP</Badge>
                      )}
                      {selectedFanDetail.profile.isFlagged && (
                        <Badge variant="danger">🚩 Flagged</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[#6C757D]">Preferences</p>
                    <p>{selectedFanDetail.profile.preferredEvents}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[#6C757D]">Spending Pattern</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[12px] bg-white p-4">
                      <p className="text-xs text-[#6C757D]">Average Bid</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(selectedFanDetail.spending.averageBid)}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-white p-4">
                      <p className="text-xs text-[#6C757D]">Highest Bid</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(selectedFanDetail.spending.highestBid)}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-white p-4">
                      <p className="text-xs text-[#6C757D]">Win Rate</p>
                      <p className="text-lg font-semibold">
                        {selectedFanDetail.spending.winRate}%
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-white p-4">
                      <p className="text-xs text-[#6C757D]">Refunds</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(selectedFanDetail.spending.refundsTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
                <div>
                  <p className="text-[#6C757D]">Recent Bid History</p>
                  <ul className="mt-2 space-y-2">
                    {selectedFanDetail.bidHistory.map((entry) => (
                      <li
                        key={`${entry.date}-${entry.event}-${entry.amountLabel}`}
                        className="flex items-center justify-between rounded-[10px] bg-[#F8F9FA] px-3 py-2"
                      >
                        <span>
                          <strong>{entry.date}</strong> · {entry.event}
                        </span>
                        <span>
                          {entry.amountLabel} {entry.resultLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleSendLoyaltyReward}
                    disabled={isLoading}
                  >
                    💰 Send Loyalty Reward
                  </Button>
                  <Button
                    variant={selectedFanDetail.profile.isVip ? 'ghost' : 'primary'}
                    onClick={handleToggleVip}
                    disabled={isLoading}
                  >
                    {selectedFanDetail.profile.isVip ? '❌ Remove VIP' : '⭐ Mark as VIP'}
                  </Button>
                  <Button
                    variant={selectedFanDetail.profile.isFlagged ? 'secondary' : 'danger'}
                    onClick={handleToggleFlag}
                    disabled={isLoading}
                  >
                    {selectedFanDetail.profile.isFlagged ? '✅ Unflag' : '🚩 Flag for Review'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6C757D]">
              Select a fan from the leaderboard above to view detailed stats.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
