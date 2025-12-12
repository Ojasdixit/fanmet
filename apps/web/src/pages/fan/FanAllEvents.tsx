import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, Badge } from '@fanmeet/ui';
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

const EVENTS_PER_PAGE = 20;

export function FanAllEvents() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events } = useEvents();
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    (searchParams.get('category') as CategoryFilter) || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'popular'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (searchQuery) params.set('q', searchQuery);
    if (currentPage > 1) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [selectedCategory, sortBy, searchQuery, currentPage]);

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
          return b.id.localeCompare(a.id);
        case 'ending-soon':
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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEvents.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const paginatedEvents = filteredAndSortedEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">All Events</h1>
          <p className="text-sm text-[#6C757D]">
            Browse through all {filteredAndSortedEvents.length} available events
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/fan')}>
          ← Back to Dashboard
        </Button>
      </div>

      {/* Filters Card */}
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

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#212529]">
          {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'Event' : 'Events'}
          {filteredAndSortedEvents.length > EVENTS_PER_PAGE && (
            <span className="ml-2 text-sm font-normal text-[#6C757D]">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </h2>
        {(selectedCategory !== 'all' || searchQuery) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Events Grid */}
      {paginatedEvents.length === 0 ? (
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
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedEvents.map((event) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first, last, current, and adjacent pages
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1;
                  
                  const showEllipsis = 
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2);

                  if (!showPage && !showEllipsis) return null;
                  
                  if (showEllipsis && !showPage) {
                    return (
                      <span key={page} className="px-2 text-[#6C757D]">...</span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-[#C045FF] text-white'
                          : 'bg-[#F8F9FA] text-[#6C757D] hover:bg-[#E9ECEF]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
