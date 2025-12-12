import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, Button, Badge } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { useEvents } from '../contexts/EventContext';

const EVENTS_PER_PAGE = 20;

export function BrowseEventsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, isLoading } = useEvents();
  const searchQuery = searchParams.get('q') || '';
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const lowerQuery = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.creatorDisplayName.toLowerCase().includes(lowerQuery) ||
        event.title.toLowerCase().includes(lowerQuery) ||
        event.category?.toLowerCase().includes(lowerQuery) ||
        event.description?.toLowerCase().includes(lowerQuery)
    );
  }, [events, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  const hasMoreEvents = filteredEvents.length > EVENTS_PER_PAGE;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    setSearchParams(params, { replace: true });
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-[#6C757D]">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Browse Events</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
          Explore live and upcoming FanMeet events.
        </h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          This is a public browse page so fans can get a feel for the experience before creating an account.
          When you are ready to bid or join, you can sign up in a single step.
        </p>
      </section>

      {/* Search Bar */}
      <section>
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search events or creators..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-[12px] border-2 border-[#E9ECEF] px-4 py-3 pr-12 text-sm focus:border-[#C045FF] focus:outline-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>
      </section>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6C757D]">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
          {hasMoreEvents && ` (showing ${paginatedEvents.length} on page ${currentPage})`}
        </p>
        {searchQuery && (
          <Button variant="secondary" size="sm" onClick={() => handleSearch('')}>
            Clear Search
          </Button>
        )}
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {paginatedEvents.length > 0 ? (
          paginatedEvents.map((event) => (
            <Card
              key={event.id}
              elevated
              className="flex h-full flex-col overflow-hidden p-0 cursor-pointer transition-all hover:shadow-[0_12px_30px_rgba(160,64,255,0.15)]"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className="relative h-36 w-full flex-shrink-0 bg-gradient-to-br from-[#FCE7FF] via-white to-[#E5DEFF]" />
              <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {event.status === 'Accepting Bids' ? (
                      <div className="mb-1 inline-block rounded-[8px] bg-[#1E4620] px-2 py-1">
                        <span className="text-[11px] font-semibold text-[#4ADE80]">✓ Accepting Bids</span>
                      </div>
                    ) : (
                      <Badge
                        variant={event.status === 'LIVE' ? 'danger' : 'primary'}
                        className="mb-1 text-[11px] uppercase tracking-wide"
                      >
                        {event.status === 'LIVE' ? '🔴 Live Now' : event.status}
                      </Badge>
                    )}
                    <div className="text-lg font-semibold text-[#212529]">{event.creatorDisplayName}</div>
                    <div className="text-sm text-[#495057]">{event.title}</div>
                    <div className="text-xs text-[#6C757D]">{event.category || 'General'}</div>
                  </div>
                  <div className="text-right text-xs text-[#6C757D]">
                    <div>{event.duration}</div>
                    <div className="mt-1">Base: {formatCurrency(event.basePrice)}</div>
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#F4E6FF] bg-[#F8F9FA] p-4 text-sm text-[#343A40]">
                  <div className="flex items-center justify-between">
                    <span>Current highest bid</span>
                    <span className="text-base font-semibold text-[#C045FF]">{formatCurrency(event.currentBid)}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#6C757D]">{event.participants} fans bidding</div>
                </div>

                <div className="text-xs text-[#6C757D]">
                  📅 {event.date} • ⏱️ {event.endsIn}
                </div>

                <Button className="mt-auto w-full bg-[#050014] text-white hover:bg-[#140423]" size="sm">
                  View event details →
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-[#6C757D]">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-lg font-semibold text-[#212529] mb-2">No events found</h3>
            {searchQuery ? (
              <p>No events found matching "{searchQuery}"</p>
            ) : (
              <p>No events available at the moment. Check back soon!</p>
            )}
          </div>
        )}
      </section>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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

      <section>
        <Card elevated className="border-dashed border-[#E9ECEF] bg-[#F8F9FA]">
          <CardHeader
            title="Ready to bid or join a free event?"
            subtitle="Create a fan account in less than 30 seconds and keep track of all your bids and meetings."
          />
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-sm text-[#6C757D]">
              Login or sign up from the top-right corner when you are ready. You can browse this page without an
              account.
            </p>
            <Button size="sm" onClick={() => navigate('/auth')}>Go to login / sign up</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
