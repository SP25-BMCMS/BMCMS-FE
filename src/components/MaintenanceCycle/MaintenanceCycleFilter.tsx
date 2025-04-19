import React from 'react';
import FilterDropdown from '@/components/FilterDropdown';

type FilterOption = {
  value: string;
  label: string;
};

interface MaintenanceCycleFilterProps {
  frequencyFilter: string;
  setFrequencyFilter: (value: string) => void;
  basisFilter: string;
  setBasisFilter: (value: string) => void;
  deviceTypeFilter: string;
  setDeviceTypeFilter: (value: string) => void;
  onFilterApply: () => void;
  onFilterReset: () => void;
}

const frequencyOptions: FilterOption[] = [
  { value: '', label: 'All Frequencies' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
  { value: 'Specific', label: 'Specific' },
];

const basisOptions: FilterOption[] = [
  { value: '', label: 'All Basis' },
  { value: 'ManufacturerRecommendation', label: 'Manufacturer Recommendation' },
  { value: 'LegalStandard', label: 'Legal Standard' },
  { value: 'OperationalExperience', label: 'Operational Experience' },
  { value: 'Other', label: 'Other' },
];

const deviceTypeOptions: FilterOption[] = [
  { value: '', label: 'All Device Types' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Elevator', label: 'Elevator' },
  { value: 'FireProtection', label: 'Fire Protection' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Lighting', label: 'Lighting' },
  { value: 'FireExtinguisher', label: 'Fire Extinguisher' },
  { value: 'AutomaticDoor', label: 'Automatic Door' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'Generator', label: 'Generator' },
  { value: 'Other', label: 'Other' },
];

const MaintenanceCycleFilter: React.FC<MaintenanceCycleFilterProps> = ({
  frequencyFilter,
  setFrequencyFilter,
  basisFilter,
  setBasisFilter,
  deviceTypeFilter,
  setDeviceTypeFilter,
  onFilterApply,
  onFilterReset,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 flex-grow">
          <FilterDropdown
            options={frequencyOptions}
            selectedValue={frequencyFilter}
            onSelect={setFrequencyFilter}
            label="Frequency"
          />

          <FilterDropdown
            options={basisOptions}
            selectedValue={basisFilter}
            onSelect={setBasisFilter}
            label="Basis"
          />

          <FilterDropdown
            options={deviceTypeOptions}
            selectedValue={deviceTypeFilter}
            onSelect={setDeviceTypeFilter}
            label="Device Type"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onFilterReset}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
          >
            Reset
          </button>
          <button
            onClick={onFilterApply}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCycleFilter;
