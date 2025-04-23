import React, { useState, useRef, useEffect } from 'react';
import { RiEyeLine, RiFilterLine, RiDeleteBinLine, RiFileDownloadLine } from 'react-icons/ri';

interface DropdownMenuProps {
  onViewDetail: () => void;
  onChangeStatus?: () => void;
  onRemove?: () => void;
  onExportPdf?: () => void;
  changeStatusTitle?: string;
  viewDetailDisabled?: boolean;
  showExportPdf?: boolean;
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  onViewDetail,
  onChangeStatus,
  onRemove,
  onExportPdf,
  changeStatusTitle = 'Change Status',
  viewDetailDisabled = false,
  showExportPdf = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewDetail = () => {
    if (!viewDetailDisabled) {
      onViewDetail();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Nút ba chấm */}
      <button
        type="button"
        title="Open menu"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg rounded-md z-[100] ${className}`}
        >
          <button
            onClick={handleViewDetail}
            className={`flex items-center w-full px-4 py-2 ${
              viewDetailDisabled
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'text-blue-700 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            disabled={viewDetailDisabled}
            title={viewDetailDisabled ? 'Not available for buildings under construction' : 'View details'}
          >
            <RiEyeLine className="mr-2" />
            View Detail
            {viewDetailDisabled && <span className="ml-1 text-xs">(Not available)</span>}
          </button>

          {showExportPdf && onExportPdf && (
            <button
              onClick={() => {
                onExportPdf();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RiFileDownloadLine className="mr-2" /> Export PDF
            </button>
          )}

          {/* Only show Change Status button if onChangeStatus is provided */}
          {onChangeStatus && (
            <button
              onClick={() => {
                onChangeStatus();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RiFilterLine className="mr-2" /> {changeStatusTitle}
            </button>
          )}

          {/* Only show Remove button if onRemove is provided */}
          {onRemove && (
            <button
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RiDeleteBinLine className="mr-2" /> Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
