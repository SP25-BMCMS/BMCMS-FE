import React, { useState, useRef, useEffect } from 'react';

type FilterOption = {
  value: string;
  label: string;
};

type FilterDropdownProps = {
  options: FilterOption[];
  onSelect?: (value: string) => void;
  buttonClassName?: string;
  dropdownClassName?: string;
  label?: string;
  selectedValue?: string;
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  onSelect,
  buttonClassName = '',
  dropdownClassName = '',
  label = 'Filter',
  selectedValue = 'all',
}) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value: string) => {
    onSelect && onSelect(value);
    setShowDropdown(false);
  };

  // Find selected option label
  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : label;

  // Define keyframe animations
  const dropdownAnimation = {
    animationName: 'dropdownFadeIn',
    animationDuration: '0.3s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
  } as React.CSSProperties;

  // Add keyframes to the document
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    // Add keyframe animations
    styleElement.textContent = `
      @keyframes dropdownFadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes optionFadeIn {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    // Append to document head
    document.head.appendChild(styleElement);

    // Cleanup on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${buttonClassName}`}
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            ></path>
          </svg>
          <span className="truncate">{displayText}</span>
        </div>
        <svg
          className={`w-4 h-4 ml-2 transition-transform duration-300 ${showDropdown ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {showDropdown && (
        <div
          className={`absolute right-0 mt-2 w-full min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/30 z-10 border border-gray-200 dark:border-gray-700 overflow-hidden ${dropdownClassName}`}
          style={dropdownAnimation}
        >
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-150 ${
                  selectedValue === option.value
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                style={
                  {
                    animationName: 'optionFadeIn',
                    animationDuration: '0.2s',
                    animationTimingFunction: 'ease-out',
                    animationFillMode: 'forwards',
                    animationDelay: `${index * 0.05}s`,
                    opacity: 0,
                  } as React.CSSProperties
                }
              >
                {selectedValue === option.value && (
                  <svg
                    className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                )}
                <span className={selectedValue === option.value ? 'font-medium' : ''}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
