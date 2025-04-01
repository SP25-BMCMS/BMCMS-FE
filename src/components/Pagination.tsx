import React from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { PaginationProps } from '../types';

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  className = '',
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisiblePages) {
      // If total pages are less than max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if near edges
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6 ${className}`}>
      <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        {totalItems !== undefined && itemsPerPage !== undefined && (
          <div className="flex items-center">
            <span className="font-medium text-gray-800">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
              <span className="mx-1 text-gray-500">-</span>
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>
            <span className="ml-1">
              <span className="text-gray-500">của</span> {totalItems} <span className="hidden sm:inline">mục</span>
            </span>
          </div>
        )}
        
        {onLimitChange && (
          <div className="flex items-center ml-4 border-l border-gray-300 pl-4">
            <label className="mr-2 text-gray-500 whitespace-nowrap">Hiển thị:</label>
            <select 
              className="bg-white border border-gray-300 rounded-md px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={itemsPerPage}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {limitOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center justify-center p-2 rounded-md transition-colors duration-200 ${
            currentPage === 1 
              ? 'text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed' 
              : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-600'
          }`}
          aria-label="Trang trước"
        >
          <IoChevronBack className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-1 overflow-x-auto">
          {getPageNumbers().map((page, index) => (
            page === 'ellipsis-start' || page === 'ellipsis-end' ? (
              <span key={`ellipsis-${index}`} className="w-10 text-center px-1 py-2 text-gray-500">...</span>
            ) : (
              <button
                key={index}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[40px] h-10 flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  currentPage === page
                    ? 'bg-blue-500 text-white shadow-sm border border-blue-600'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-600'
                }`}
                aria-label={`Trang ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`flex items-center justify-center p-2 rounded-md transition-colors duration-200 ${
            currentPage === totalPages || totalPages === 0
              ? 'text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed' 
              : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-600'
          }`}
          aria-label="Trang sau"
        >
          <IoChevronForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination; 