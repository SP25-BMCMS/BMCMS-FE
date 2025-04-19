// SearchInput.tsx
import React, { KeyboardEvent } from 'react';

type SearchInputProps = {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
  className?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search by ID',
  value = '',
  onChange,
  onSearch,
  className = '',
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200
                 placeholder-gray-400 dark:placeholder-gray-500 
                 text-gray-700 dark:text-gray-200
                 bg-white dark:bg-gray-800
                 shadow-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default SearchInput;
