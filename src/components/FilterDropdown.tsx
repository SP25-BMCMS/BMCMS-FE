// FilterDropdown.tsx
import React, { useState } from 'react';

type FilterOption = {
  value: string;
  label: string;
};

type FilterDropdownProps = {
  options: FilterOption[];
  onSelect?: (value: string) => void;
  buttonClassName?: string;
  dropdownClassName?: string;
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  onSelect,
  buttonClassName = '',
  dropdownClassName = '',
}) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const handleSelect = (value: string) => {
    onSelect && onSelect(value);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center px-4 py-2 bg-[#d9d9d9] w-[137px] rounded-[20px] border border-black hover:bg-gray-300 ${buttonClassName}`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
        </svg>
        Filter
      </button>
      
      {showDropdown && (
        <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 ${dropdownClassName}`}>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;