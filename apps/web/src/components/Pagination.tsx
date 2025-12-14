import { Button } from '@fanmeet/ui';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-[#E9ECEF] pt-4">
            <div className="flex items-center gap-2 text-sm text-[#6C757D]">
                <span>
                    Showing {startItem} to {endItem} of {totalItems} results
                </span>
                <span className="mx-2">•</span>
                <label htmlFor="itemsPerPage" className="flex items-center gap-2">
                    <span>Show:</span>
                    <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1); // Reset to first page when changing items per page
                        }}
                        className="rounded-[8px] border border-[#CED4DA] bg-white px-3 py-1.5 text-sm text-[#212529] focus:border-[#C045FF] focus:outline-none focus:ring-2 focus:ring-[#C045FF]/20"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                    </select>
                </label>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) =>
                        typeof page === 'number' ? (
                            <button
                                key={idx}
                                onClick={() => goToPage(page)}
                                className={`h-8 min-w-[32px] rounded-[8px] px-2 text-sm font-medium transition-colors ${currentPage === page
                                        ? 'bg-[#C045FF] text-white'
                                        : 'bg-white text-[#212529] hover:bg-[#F8F9FA] border border-[#E9ECEF]'
                                    }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={idx} className="px-2 text-[#6C757D]">
                                {page}
                            </span>
                        )
                    )}
                </div>

                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
