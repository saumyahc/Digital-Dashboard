import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = ''
}) => {
  // Generate page numbers to display
  const generatePaginationItems = () => {
    // Always show first and last page
    const firstPage = 1;
    const lastPage = totalPages;

    // Calculate range of pages to show around current page
    const leftSiblingIndex = Math.max(currentPage - siblingCount, firstPage);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, lastPage);

    // Determine if we need to show ellipsis
    const shouldShowLeftDots = leftSiblingIndex > firstPage + 1;
    const shouldShowRightDots = rightSiblingIndex < lastPage - 1;

    // Generate the page numbers array
    const pageNumbers = [];

    // Always add first page
    pageNumbers.push(firstPage);

    // Add left ellipsis if needed
    if (shouldShowLeftDots) {
      pageNumbers.push('...');
    }

    // Add page numbers between siblings
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== firstPage && i !== lastPage) {
        pageNumbers.push(i);
      }
    }

    // Add right ellipsis if needed
    if (shouldShowRightDots) {
      pageNumbers.push('...');
    }

    // Always add last page if it's different from first page
    if (lastPage !== firstPage) {
      pageNumbers.push(lastPage);
    }

    return pageNumbers;
  };

  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  const paginationItems = generatePaginationItems();

  return (
    <nav
      className={`flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 py-3 ${className}`}
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Showing page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
          Previous
        </button>

        <div className="hidden sm:flex ml-3">
          {paginationItems.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page
                  ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative ml-3 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          Next
          <ChevronRightIcon className="h-5 w-5 ml-1" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;