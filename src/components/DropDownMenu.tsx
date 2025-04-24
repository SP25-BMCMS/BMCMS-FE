import React, { useState, useRef, useEffect } from 'react';
import { RiEyeLine, RiFilterLine, RiDeleteBinLine, RiFileDownloadLine } from 'react-icons/ri';
import { createPortal } from 'react-dom';

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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showAbove, setShowAbove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Tính toán số mục menu hiển thị để ước tính chiều cao
  const getItemCount = () => {
    let count = 1; // View Detail luôn hiển thị
    if (showExportPdf && onExportPdf) count++;
    if (onChangeStatus) count++;
    if (onRemove) count++;
    return count;
  };

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const menuWidth = 220; // Chiều rộng menu đã tăng lên
      const itemHeight = 44; // Chiều cao trung bình mỗi menu item
      const menuHeight = getItemCount() * itemHeight;

      // Kiểm tra xem có đủ không gian phía dưới không
      const spaceBelow = windowHeight - rect.bottom;
      const needToShowAbove = spaceBelow < menuHeight;

      // Kiểm tra không gian bên phải
      const rightEdge = rect.right;
      const spaceOnRight = window.innerWidth - rightEdge;
      const alignLeft = spaceOnRight < menuWidth;

      setShowAbove(needToShowAbove);

      setMenuPosition({
        top: needToShowAbove
          ? rect.top - menuHeight + window.scrollY
          : rect.bottom + window.scrollY,
        left: alignLeft
          ? rect.right - menuWidth + window.scrollX
          : Math.max(rect.left - 20, 5) + window.scrollX, // Giữ menu luôn nằm trong màn hình, lùi vào 20px
      });
    }
  };

  const toggleMenu = () => {
    if (!isOpen) {
      updateMenuPosition();
    }
    setIsOpen(!isOpen);
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update position if window is resized
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => updateMenuPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen]);

  const handleViewDetail = () => {
    if (!viewDetailDisabled) {
      onViewDetail();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Nút ba chấm */}
      <button
        ref={buttonRef}
        type="button"
        title="Open menu"
        onClick={toggleMenu}
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

      {/* Dropdown menu - rendered in portal to avoid scroll container issues */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg rounded-md z-[9999] ${className}`}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: '220px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="py-1 max-h-[calc(100vh-20px)] overflow-auto">
              <button
                onClick={handleViewDetail}
                className={`flex items-center w-full px-4 py-2 ${
                  viewDetailDisabled
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-blue-700 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                disabled={viewDetailDisabled}
                title={
                  viewDetailDisabled
                    ? 'Not available for buildings under construction'
                    : 'View details'
                }
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
          </div>,
          document.body
        )}
    </div>
  );
};

export default DropdownMenu;
