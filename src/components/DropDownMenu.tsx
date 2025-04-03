import React, { useState, useRef, useEffect } from "react";
import { RiEyeLine, RiFilterLine, RiDeleteBinLine } from "react-icons/ri";

interface DropdownMenuProps {
  onViewDetail: () => void;
  onChangeStatus: () => void;
  onRemove: () => void;
  changeStatusTitle?: string;
  viewDetailDisabled?: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  onViewDetail,
  onChangeStatus,
  onRemove,
  changeStatusTitle = "Change Status",
  viewDetailDisabled = false,
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="fixed right-0 mt-2 w-44 bg-white border border-gray-300 shadow-lg rounded-md z-50 mr-[3.5rem]">
          <button
            onClick={handleViewDetail}
            className={`flex items-center w-full px-4 py-2 ${
              viewDetailDisabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-700 hover:bg-gray-100'
            }`}
            disabled={viewDetailDisabled}
            title={viewDetailDisabled ? "Không khả dụng với tòa nhà đang xây dựng" : "Xem chi tiết"}
          >
            <RiEyeLine className="mr-2" /> 
            View Detail
            {viewDetailDisabled && <span className="ml-1 text-xs">(Không khả dụng)</span>}
          </button>
          <button
            onClick={() => {
              onChangeStatus();
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <RiFilterLine className="mr-2" /> {changeStatusTitle}
          </button>
          <button
            onClick={() => {
              onRemove();
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100"
          >
            <RiDeleteBinLine className="mr-2" /> Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
