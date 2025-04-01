import React from 'react';
import { SeverityFilterProps} from '@/types';


const SeverityFilter: React.FC<SeverityFilterProps> = ({
  options,
  selectedValue,
  onSelect,
  label = 'Severity:',
  className = '',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-sm font-medium text-gray-700 mr-2">{label}</span>
      <div className="flex space-x-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedValue === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeverityFilter; 