import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';

interface FeaturedCreator {
  id: string;
  creatorId: string;
  name: string;
  username: string;
  category: string;
  totalEarnings: number;
  eventsCount: number;
  featuredSince: string;
  displayOrder: number;
}

interface CandidateCreator {
  id: string;
  name: string;
  username: string;
  category: string;
  eventsCount: number;
  completedMeets: number;
  totalEarnings: number;
}

export function AdminFeaturedCreators() {
  const [featuredCreators, setFeaturedCreators] = useState<FeaturedCreator[]>([]);
  const [candidates, setCandidates] = useState<CandidateCreator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch featured creators
      const { data: featuredData } = await supabase
        .from('featured_creators')
        .select('id, creator_id, display_order, featured_since, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const featuredCreatorIds = (featuredData ?? []).map((f: any) => f.creator_id);

      // Fetch all creators (users with role creator)
      const { data: creatorsData } = await supabase
        .from('users')
        .select('id, email, display_name')
        .eq('role', 'creator');

      // Fetch profiles for all creators
      const creatorIds = (creatorsData ?? []).map((c: any) => c.id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, category')
        .in('user_id', creatorIds);

      const profileMap = new Map<string, any>();
      for (const p of (profilesData ?? []) as any[]) {
        profileMap.set(p.user_id, p);
      }

      // Fetch events per creator
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, creator_id');

      const eventsByCreator = new Map<string, number>();
      for (const e of (eventsData ?? []) as any[]) {
        eventsByCreator.set(e.creator_id, (eventsByCreator.get(e.creator_id) ?? 0) + 1);
      }

      // Fetch completed meets per creator
      const { data: meetsData } = await supabase
        .from('meets')
        .select('creator_id, status')
        .eq('status', 'completed');

      const meetsByCreator = new Map<string, number>();
      for (const m of (meetsData ?? []) as any[]) {
        meetsByCreator.set(m.creator_id, (meetsByCreator.get(m.creator_id) ?? 0) + 1);
      }

      // Fetch earnings (won bids) per creator
      const { data: bidsData } = await supabase
        .from('bids')
        .select('event_id, amount, status')
        .eq('status', 'won');

      const eventCreatorMap = new Map<string, string>();
      for (const e of (eventsData ?? []) as any[]) {
        eventCreatorMap.set(e.id, e.creator_id);
      }

      const earningsByCreator = new Map<string, number>();
      for (const b of (bidsData ?? []) as any[]) {
        const creatorId = eventCreatorMap.get(b.event_id);
        if (creatorId) {
          earningsByCreator.set(creatorId, (earningsByCreator.get(creatorId) ?? 0) + (b.amount ?? 0));
        }
      }

      // Build featured creators list
      const featured: FeaturedCreator[] = (featuredData ?? []).map((f: any) => {
        const profile = profileMap.get(f.creator_id);
        return {
          id: f.id,
          creatorId: f.creator_id,
          name: profile?.display_name || profile?.username || 'Creator',
          username: profile?.username ? `@${profile.username}` : '@creator',
          category: profile?.category || 'general',
          totalEarnings: earningsByCreator.get(f.creator_id) ?? 0,
          eventsCount: eventsByCreator.get(f.creator_id) ?? 0,
          featuredSince: f.featured_since,
          displayOrder: f.display_order,
        };
      });

      // Build candidates list (creators not featured, sorted by earnings)
      const candidatesList: CandidateCreator[] = (creatorsData ?? [])
        .filter((c: any) => !featuredCreatorIds.includes(c.id))
        .map((c: any) => {
          const profile = profileMap.get(c.id);
          return {
            id: c.id,
            name: profile?.display_name || profile?.username || c.display_name || 'Creator',
            username: profile?.username ? `@${profile.username}` : '@creator',
            category: profile?.category || 'general',
            eventsCount: eventsByCreator.get(c.id) ?? 0,
            completedMeets: meetsByCreator.get(c.id) ?? 0,
            totalEarnings: earningsByCreator.get(c.id) ?? 0,
          };
        })
        .sort((a: CandidateCreator, b: CandidateCreator) => b.totalEarnings - a.totalEarnings);

      setFeaturedCreators(featured);
      setCandidates(candidatesList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleFeatureCreator = async (creatorId: string, creatorName: string) => {
    const confirmed = window.confirm(`Add ${creatorName} to featured creators?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const maxOrder = featuredCreators.reduce((max, f) => Math.max(max, f.displayOrder), 0);

      const { error } = await supabase.from('featured_creators').insert({
        creator_id: creatorId,
        display_order: maxOrder + 1,
        is_active: true,
      });

      if (error) {
        console.error('Error featuring creator:', error);
        alert('Failed to feature creator.');
        return;
      }

      await fetchData();
      alert(`${creatorName} is now featured!`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFeatured = async (featuredId: string, creatorName: string) => {
    const confirmed = window.confirm(`Remove ${creatorName} from featured creators?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('featured_creators')
        .update({ is_active: false })
        .eq('id', featuredId);

      if (error) {
        console.error('Error removing featured creator:', error);
        alert('Failed to remove featured creator.');
        return;
      }

      await fetchData();
      alert(`${creatorName} removed from featured.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveUp = async (featuredId: string, currentOrder: number) => {
    if (currentOrder <= 1) return;

    setIsLoading(true);
    try {
      // Find the creator above
      const creatorAbove = featuredCreators.find((f) => f.displayOrder === currentOrder - 1);
      if (creatorAbove) {
        await supabase
          .from('featured_creators')
          .update({ display_order: currentOrder })
          .eq('id', creatorAbove.id);
      }

      await supabase
        .from('featured_creators')
        .update({ display_order: currentOrder - 1 })
        .eq('id', featuredId);

      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveDown = async (featuredId: string, currentOrder: number) => {
    const maxOrder = featuredCreators.reduce((max, f) => Math.max(max, f.displayOrder), 0);
    if (currentOrder >= maxOrder) return;

    setIsLoading(true);
    try {
      // Find the creator below
      const creatorBelow = featuredCreators.find((f) => f.displayOrder === currentOrder + 1);
      if (creatorBelow) {
        await supabase
          .from('featured_creators')
          .update({ display_order: currentOrder })
          .eq('id', creatorBelow.id);
      }

      await supabase
        .from('featured_creators')
        .update({ display_order: currentOrder + 1 })
        .eq('id', featuredId);

      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Featured Creators</h1>
          <p className="text-sm text-[#6C757D]">Control homepage placement, scheduling, and promotion of spotlighted creators.</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Featured Creators"
          subtitle={`${featuredCreators.length} creators featured • Priority influences homepage carousel`}
        />
        <CardContent className="space-y-4">
          {featuredCreators.length === 0 && !isLoading && (
            <p className="py-4 text-center text-sm text-[#6C757D]">
              No featured creators yet. Add creators from the candidate pool below.
            </p>
          )}
          {featuredCreators.map((creator, index) => (
            <div
              key={creator.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveUp(creator.id, creator.displayOrder)}
                    disabled={isLoading || index === 0}
                  >
                    ▲
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveDown(creator.id, creator.displayOrder)}
                    disabled={isLoading || index === featuredCreators.length - 1}
                  >
                    ▼
                  </Button>
                </div>
                <div>
                  <div className="text-sm text-[#6C757D]">#{index + 1}</div>
                  <div className="text-lg font-semibold text-[#212529]">{creator.name}</div>
                  <div className="text-sm text-[#6C757D]">{creator.username}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#6C757D]">
                <div>
                  Category <span className="font-semibold capitalize text-[#212529]">{creator.category}</span>
                </div>
                <div>
                  Events <span className="font-semibold text-[#212529]">{creator.eventsCount}</span>
                </div>
                <div>
                  Earned <span className="font-semibold text-[#212529]">{formatCurrency(creator.totalEarnings)}</span>
                </div>
                <Badge variant="primary">
                  Featured since {new Date(creator.featuredSince).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleRemoveFeatured(creator.id, creator.name)}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Candidate Pool" subtitle="High-performing creators eligible for featuring." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Category</th>
                <th className="border-b border-[#E9ECEF] py-3">Events</th>
                <th className="border-b border-[#E9ECEF] py-3">Completed Meets</th>
                <th className="border-b border-[#E9ECEF] py-3">Total Earnings</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((creator) => (
                <tr key={creator.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#212529]">{creator.name}</span>
                      <span className="text-xs text-[#6C757D]">{creator.username}</span>
                    </div>
                  </td>
                  <td className="py-3 capitalize text-[#212529]">{creator.category}</td>
                  <td className="py-3 text-[#212529]">{creator.eventsCount}</td>
                  <td className="py-3 text-[#212529]">{creator.completedMeets}</td>
                  <td className="py-3 text-[#212529]">{formatCurrency(creator.totalEarnings)}</td>
                  <td className="py-3">
                    <div className="flex gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleFeatureCreator(creator.id, creator.name)}
                        disabled={isLoading}
                      >
                        ⭐ Feature
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading creators...' : 'No candidates available'}
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
