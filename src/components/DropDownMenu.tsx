import React, { useState, useRef, useEffect } from "react";
import { RiEyeLine, RiFilterLine, RiDeleteBinLine } from "react-icons/ri";

interface DropdownMenuProps {
  onViewDetail: () => void;
  onChangeStatus: () => void;
  onRemove: () => void;
  changeStatusTitle?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  onViewDetail,
  onChangeStatus,
  onRemove,
  changeStatusTitle = "Change Status",
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
            onClick={onViewDetail}
            className="flex items-center w-full px-4 py-2 text-blue-700 hover:bg-gray-100"
          >
            <RiEyeLine className="mr-2" /> View Detail
          </button>
          <button
            onClick={onChangeStatus}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <RiFilterLine className="mr-2" /> {changeStatusTitle}
          </button>
          <button
            onClick={onRemove}
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
