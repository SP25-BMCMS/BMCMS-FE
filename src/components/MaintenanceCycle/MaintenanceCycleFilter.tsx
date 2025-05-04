import React from 'react'
import FilterDropdown from '@/components/FilterDropdown'
import { useTranslation } from 'react-i18next'

type FilterOption = {
  value: string
  label: string
}

interface MaintenanceCycleFilterProps {
  frequencyFilter: string
  setFrequencyFilter: (value: string) => void
  basisFilter: string
  setBasisFilter: (value: string) => void
  deviceTypeFilter: string
  setDeviceTypeFilter: (value: string) => void
  onFilterApply: () => void
  onFilterReset: () => void
}

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
  const { t } = useTranslation()

  const frequencyOptions: FilterOption[] = [
    { value: '', label: t('maintenanceCycle.filterOptions.frequency.All') },
    { value: 'Daily', label: t('maintenanceCycle.filterOptions.frequency.Daily') },
    { value: 'Weekly', label: t('maintenanceCycle.filterOptions.frequency.Weekly') },
    { value: 'Monthly', label: t('maintenanceCycle.filterOptions.frequency.Monthly') },
    { value: 'Quarterly', label: t('maintenanceCycle.filterOptions.frequency.Quarterly') },
    { value: 'Yearly', label: t('maintenanceCycle.filterOptions.frequency.Yearly') },
    { value: 'Specific', label: t('maintenanceCycle.filterOptions.frequency.Specific') }
  ]

  const basisOptions: FilterOption[] = [
    { value: '', label: t('maintenanceCycle.filterOptions.basis.All') },
    { value: 'ManufacturerRecommendation', label: t('maintenanceCycle.filterOptions.basis.ManufacturerRecommendation') },
    { value: 'LegalStandard', label: t('maintenanceCycle.filterOptions.basis.LegalStandard') },
    { value: 'OperationalExperience', label: t('maintenanceCycle.filterOptions.basis.OperationalExperience') },
    { value: 'Other', label: t('maintenanceCycle.filterOptions.basis.Other') },
  ]

  const deviceTypeOptions: FilterOption[] = [
    { value: '', label: t('maintenanceCycle.filterOptions.deviceType.All') },
    { value: 'Elevator', label: t('maintenanceCycle.filterOptions.deviceType.Elevator') },
    { value: 'FireProtection', label: t('maintenanceCycle.filterOptions.deviceType.FireProtection') },
    { value: 'Electrical', label: t('maintenanceCycle.filterOptions.deviceType.Electrical') },
    { value: 'Plumbing', label: t('maintenanceCycle.filterOptions.deviceType.Plumbing') },
    { value: 'HVAC', label: t('maintenanceCycle.filterOptions.deviceType.HVAC') },
    { value: 'CCTV', label: t('maintenanceCycle.filterOptions.deviceType.CCTV') },
    { value: 'Generator', label: t('maintenanceCycle.filterOptions.deviceType.Generator') },
    { value: 'Lighting', label: t('maintenanceCycle.filterOptions.deviceType.Lighting') },
    { value: 'AutomaticDoor', label: t('maintenanceCycle.filterOptions.deviceType.AutomaticDoor') },
    { value: 'FireExtinguisher', label: t('maintenanceCycle.filterOptions.deviceType.FireExtinguisher') },
    { value: 'BuildingStructure', label: t('maintenanceCycle.filterOptions.deviceType.BuildingStructure') },
    { value: 'Other', label: t('maintenanceCycle.filterOptions.deviceType.Other') }
  ]

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 flex-grow">
          <FilterDropdown
            options={frequencyOptions}
            selectedValue={frequencyFilter}
            onSelect={setFrequencyFilter}
            label={t('maintenanceCycle.filter.frequency')}
          />

          <FilterDropdown
            options={basisOptions}
            selectedValue={basisFilter}
            onSelect={setBasisFilter}
            label={t('maintenanceCycle.filter.basis')}
          />

          <FilterDropdown
            options={deviceTypeOptions}
            selectedValue={deviceTypeFilter}
            onSelect={setDeviceTypeFilter}
            label={t('maintenanceCycle.filter.deviceType')}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onFilterReset}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
          >
            {t('maintenanceCycle.filter.reset')}
          </button>
          <button
            onClick={onFilterApply}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
          >
            {t('maintenanceCycle.filter.apply')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceCycleFilter
