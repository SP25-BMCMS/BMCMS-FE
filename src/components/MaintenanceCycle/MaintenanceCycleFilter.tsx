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
    { value: '', label: t('maintenanceCycle.filterOptions.frequency.all') },
    { value: 'Daily', label: t('maintenanceCycle.filterOptions.frequency.daily') },
    { value: 'Weekly', label: t('maintenanceCycle.filterOptions.frequency.weekly') },
    { value: 'Monthly', label: t('maintenanceCycle.filterOptions.frequency.monthly') },
    { value: 'Yearly', label: t('maintenanceCycle.filterOptions.frequency.yearly') },
    { value: 'Specific', label: t('maintenanceCycle.filterOptions.frequency.specific') }
  ]

  const basisOptions: FilterOption[] = [
    { value: '', label: t('maintenanceCycle.filterOptions.basis.all') },
    { value: 'ManufacturerRecommendation', label: t('maintenanceCycle.filterOptions.basis.manufacturerrecommendation') },
    { value: 'LegalStandard', label: t('maintenanceCycle.filterOptions.basis.legalstandard') },
    { value: 'OperationalExperience', label: t('maintenanceCycle.filterOptions.basis.operationalexperience') },
    { value: 'Other', label: t('maintenanceCycle.filterOptions.basis.other') },
  ]

  const deviceTypeOptions: FilterOption[] = [
    { value: '', label: t('maintenanceCycle.filterOptions.deviceType.all') },
    { value: 'Elevator', label: t('maintenanceCycle.filterOptions.deviceType.elevator') },
    { value: 'FireProtection', label: t('maintenanceCycle.filterOptions.deviceType.fireprotection') },
    { value: 'Electrical', label: t('maintenanceCycle.filterOptions.deviceType.electrical') },
    { value: 'Plumbing', label: t('maintenanceCycle.filterOptions.deviceType.plumbing') },
    { value: 'HVAC', label: t('maintenanceCycle.filterOptions.deviceType.hvac') },
    { value: 'CCTV', label: t('maintenanceCycle.filterOptions.deviceType.cctv') },
    { value: 'Generator', label: t('maintenanceCycle.filterOptions.deviceType.generator') },
    { value: 'Lighting', label: t('maintenanceCycle.filterOptions.deviceType.lighting') },
    { value: 'AutomaticDoor', label: t('maintenanceCycle.filterOptions.deviceType.automaticdoor') },
    { value: 'FireExtinguisher', label: t('maintenanceCycle.filterOptions.deviceType.fireextinguisher') },
    { value: 'Other', label: t('maintenanceCycle.filterOptions.deviceType.other') }
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
