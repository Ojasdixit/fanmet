import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { useEvents } from '../../contexts/EventContext';

type SortOption = 'popular' | 'price-low' | 'price-high' | 'newest' | 'ending-soon';
type CategoryFilter = 'all' | 'entertainment' | 'music' | 'education' | 'fitness' | 'gaming' | 'lifestyle' | 'general';

const categories: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Events', emoji: '🌟' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
  { value: 'general', label: 'General', emoji: '📌' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newly Added' },
];

export function FanDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { events, myBids } = useEvents();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query !== null && query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(event => {
      // Filter by category
      if (selectedCategory !== 'all' && event.category !== selectedCategory) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.creatorDisplayName.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Sort events
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.participants - a.participants;
        case 'price-low':
          return a.basePrice - b.basePrice;
        case 'price-high':
          return b.basePrice - a.basePrice;
        case 'newest':
          return b.id.localeCompare(a.id); // Using ID as proxy for creation time
        case 'ending-soon':
          // Parse "X hours left to bid" to sort by time
          const getTimeValue = (endsIn: string) => {
            if (endsIn.includes('Closed')) return 999999;
            if (endsIn.includes('days')) {
              const days = parseInt(endsIn);
              return days * 24 * 60;
            }
            if (endsIn.includes('hours')) {
              const hours = parseInt(endsIn);
              return hours * 60;
            }
            if (endsIn.includes('minutes')) {
              return parseInt(endsIn);
            }
            return 0;
          };
          return getTimeValue(a.endsIn) - getTimeValue(b.endsIn);
        default:
          return 0;
      }
    });

    return sorted;
  }, [events, selectedCategory, sortBy, searchQuery]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalBids = myBids.length;
    const wonBids = myBids.filter(b => b.status === 'won').length;
    const winRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;
    const totalRefunds = myBids
      .filter(b => b.status === 'lost')
      .reduce((sum, b) => sum + Math.floor(b.amount * 0.9), 0);

    return [
      { id: 'stat-1', label: 'Bids placed', value: String(totalBids), hint: `${myBids.filter(b => b.status === 'active' || b.status === 'outbid').length} active` },
      { id: 'stat-2', label: 'Win rate', value: `${winRate}%`, hint: `${wonBids} wins out of ${totalBids}` },
      { id: 'stat-3', label: 'Refunds received', value: formatCurrency(totalRefunds), hint: '90% back on lost bids' },
      { id: 'stat-4', label: 'Meets completed', value: String(wonBids), hint: `Across ${new Set(myBids.filter(b => b.status === 'won').map(b => b.creatorUsername)).size} creators` },
    ];
  }, [myBids]);

  return (
    <div className="flex flex-col gap-8">
      <Card
        elevated
        className="overflow-hidden border-none bg-gradient-to-r from-[#FCE7FF] via-[#F4E6FF] to-[#E5DEFF] shadow-[0_24px_60px_rgba(160,64,255,0.18)]"
      >
        <div className="relative flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:px-8 md:py-8">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">
              Browse Events
            </p>
            <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
              Find a live FanMeet that matches your vibe.
            </h1>
            <p className="text-sm text-[#4B445F]">
              Browse, bid, and secure your spot with your favorite creators in small, exclusive meetups.
            </p>
          </div>
          <div className="flex-shrink-0 text-6xl md:text-7xl">🎯</div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="gap-6">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search events or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[12px] border-2 border-[#E9ECEF] px-4 py-3 pr-12 text-sm focus:border-[#C045FF] focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          </div>

          {/* Category Filters */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#212529]">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${selectedCategory === cat.value
                    ? 'border-[#C045FF] bg-[#F4E6FF] text-[#C045FF]'
                    : 'border-[#E9ECEF] bg-white text-[#6C757D] hover:border-[#C045FF]/40'
                    }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#212529]">Sort By</h3>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${sortBy === option.value
                    ? 'border-[#C045FF] bg-[#C045FF] text-white'
                    : 'border-[#E9ECEF] bg-white text-[#6C757D] hover:border-[#C045FF]/40'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#212529]">
            {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'Event' : 'Events'} Found
          </h2>
        </div>

        {filteredAndSortedEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-lg font-semibold text-[#212529] mb-2">No events found</h3>
              <p className="text-sm text-[#6C757D] mb-4">
                Try adjusting your filters or search query
              </p>
              <Button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedEvents.map((event) => (
              <Card
                key={event.id}
                className="group cursor-pointer transition-all hover:shadow-[0_12px_30px_rgba(160,64,255,0.15)]"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardContent className="gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 text-xs text-[#6C757D]">{event.creatorDisplayName}</div>
                      <h3 className="text-base font-semibold text-[#212529] group-hover:text-[#C045FF]">
                        {event.title}
                      </h3>
                    </div>
                    {event.status === 'Accepting Bids' ? (
                      <div className="rounded-[8px] bg-[#1E4620] px-2 py-1">
                        <span className="text-xs font-semibold text-[#4ADE80]">✓ Accepting Bids</span>
                      </div>
                    ) : (
                      <Badge variant={event.status === 'LIVE' ? 'danger' : 'primary'}>
                        {event.status}
                      </Badge>
                    )}
                  </div>

                  {event.description && (
                    <p className="line-clamp-2 text-sm text-[#6C757D]">{event.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-xs text-[#6C757D]">Current Bid</div>
                      <div className="font-semibold text-[#C045FF]">{formatCurrency(event.currentBid)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#6C757D]">Base Price</div>
                      <div className="font-semibold text-[#212529]">{formatCurrency(event.basePrice)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E9ECEF] pt-3 text-xs text-[#6C757D]">
                    <span>👥 {event.participants} bidding</span>
                    <span>⏱️ {event.endsIn}</span>
                  </div>

                  <Button className="w-full" size="sm">
                    View & Bid →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fan Analytics */}
      <Card>
        <CardHeader title="Your Activity" subtitle="Track your bidding performance" />
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {analytics.map((stat) => (
              <div
                key={stat.id}
                className="rounded-[16px] border border-[#E9ECEF] bg-gradient-to-br from-[#F8F9FA] to-white p-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6C757D]">
                  {stat.label}
                </div>
                <div className="mt-1 text-2xl font-bold text-[#212529]">{stat.value}</div>
                <div className="mt-1 text-xs text-[#6C757D]">{stat.hint}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
