import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMaintenanceCycles } from '@/services/maintenanceCycle'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  XMarkIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import { RiSearchLine } from 'react-icons/ri'

interface CreateAutoScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  buildingDetails: any[] | undefined
  onSubmit: (data: {
    schedule_name: string
    description: string
    cycle_id: string
    buildingDetailIds: string[]
    start_date: string
    end_date: string
  }) => void
}

const CreateAutoScheduleModal: React.FC<CreateAutoScheduleModalProps> = ({
  isOpen,
  onClose,
  buildingDetails = [],
  onSubmit,
}) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    schedule_name: '',
    description: '',
    cycle_id: '',
    buildingDetailIds: [] as string[],
    start_date: '',
    end_date: '',
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'all' | 'selected'>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [dateErrors, setDateErrors] = useState({
    start_date: '',
    end_date: '',
  })

  // Fetch maintenance cycles
  const { data: cyclesData, isLoading: isLoadingCycles } = useQuery({
    queryKey: ['maintenanceCycles'],
    queryFn: () =>
      getMaintenanceCycles({
        page: 1,
        limit: 99999,
      }),
  })

  const validateDates = () => {
    const errors = {
      start_date: '',
      end_date: '',
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (formData.start_date) {
      const startDate = new Date(formData.start_date)
      startDate.setHours(0, 0, 0, 0)

      if (startDate < now) {
        errors.start_date = t('autoSchedule.errors.startDatePast')
      }
    }

    if (formData.end_date) {
      const endDate = new Date(formData.end_date)
      endDate.setHours(0, 0, 0, 0)

      if (formData.start_date) {
        const startDate = new Date(formData.start_date)
        startDate.setHours(0, 0, 0, 0)

        if (endDate < startDate) {
          errors.end_date = t('autoSchedule.errors.endDateBeforeStart')
        }
      }
    }

    setDateErrors(errors)
    return !errors.start_date && !errors.end_date
  }

  useEffect(() => {
    validateDates()
  }, [formData.start_date, formData.end_date])

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.schedule_name.trim()) {
        toast.error(t('autoSchedule.errors.scheduleNameRequired'))
        return
      }
      if (!formData.cycle_id) {
        toast.error(t('autoSchedule.errors.cycleRequired'))
        return
      }
      if (formData.buildingDetailIds.length === 0) {
        toast.error(t('autoSchedule.errors.buildingRequired'))
        return
      }
      if (!formData.start_date) {
        toast.error(t('autoSchedule.errors.startDateRequired'))
        return
      }
      if (!formData.end_date) {
        toast.error(t('autoSchedule.errors.endDateRequired'))
        return
      }

      if (!validateDates()) {
        toast.error(t('autoSchedule.errors.fixDateErrors'))
        return
      }

      await onSubmit(formData)
      toast.success(t('autoSchedule.success'))
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      onClose()
    } catch (error) {
      toast.error(t('autoSchedule.errors.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBuildingDetailToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      buildingDetailIds: prev.buildingDetailIds.includes(id)
        ? prev.buildingDetailIds.filter(buildingId => buildingId !== id)
        : [...prev.buildingDetailIds, id],
    }))
  }

  const filteredBuildingDetails = buildingDetails?.filter(buildingDetail => {
    const searchLower = searchTerm.toLowerCase()
    return (
      buildingDetail.building?.name?.toLowerCase().includes(searchLower) ||
      buildingDetail.name?.toLowerCase().includes(searchLower)
    )
  })

  const selectedBuildingDetails = buildingDetails?.filter(buildingDetail =>
    formData.buildingDetailIds.includes(buildingDetail.buildingDetailId)
  )

  // Add getStatusBadge function
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {t('building.status.operational')}
          </span>
        )
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {t('building.status.maintenance')}
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            {t('building.status.inactive')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            {status}
          </span>
        )
    }
  }

  // Add getCycleLabel function
  const getCycleLabel = (cycle: any) => {
    if (!cycle) return ''
    const deviceType = t(`maintenanceCycle.filterOptions.deviceType.${cycle.device_type}`)
    const frequency = t(`maintenanceCycle.filterOptions.frequency.${cycle.frequency}`)
    const basis = t(`maintenanceCycle.filterOptions.basis.${cycle.basis}`)
    return `${deviceType} - ${frequency} (${basis})`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {t('autoSchedule.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.close')}
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {isLoadingCycles ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('autoSchedule.form.scheduleName.label')}
                </label>
                <input
                  type="text"
                  value={formData.schedule_name}
                  onChange={e => setFormData(prev => ({ ...prev, schedule_name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder={t('autoSchedule.form.scheduleName.placeholder')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CogIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('autoSchedule.form.maintenanceCycle.label')}
                </label>
                <select
                  value={formData.cycle_id}
                  onChange={e => setFormData(prev => ({ ...prev, cycle_id: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={isSubmitting}
                  aria-label={t('autoSchedule.form.maintenanceCycle.label')}
                >
                  <option value="">{t('autoSchedule.form.maintenanceCycle.placeholder')}</option>
                  {cyclesData?.data?.map((cycle: any) => (
                    <option key={cycle.cycle_id} value={cycle.cycle_id}>
                      {getCycleLabel(cycle)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-500" />
                {t('autoSchedule.form.description.label')}
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder={t('autoSchedule.form.description.placeholder')}
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('autoSchedule.form.startDate.label')}
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={e => handleDateChange('start_date', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${dateErrors.start_date
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition`}
                    disabled={isSubmitting}
                    min={new Date().toISOString().slice(0, 16)}
                    aria-label={t('autoSchedule.form.startDate.label')}
                    placeholder={t('autoSchedule.form.startDate.placeholder')}
                  />
                  {dateErrors.start_date && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm">
                      {dateErrors.start_date}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('autoSchedule.form.endDate.label')}
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={e => handleDateChange('end_date', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${dateErrors.end_date
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition`}
                    disabled={isSubmitting}
                    min={formData.start_date || new Date().toISOString().slice(0, 16)}
                    aria-label={t('autoSchedule.form.endDate.label')}
                    placeholder={t('autoSchedule.form.endDate.placeholder')}
                  />
                  {dateErrors.end_date && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm">
                      {dateErrors.end_date}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-blue-500" />
                {t('autoSchedule.form.buildingDetails.label')}
              </label>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    placeholder={t('autoSchedule.form.buildingDetails.searchPlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTab('all')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${selectedTab === 'all'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    disabled={isSubmitting}
                  >
                    {t('autoSchedule.form.buildingDetails.all')} ({buildingDetails?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTab('selected')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${selectedTab === 'selected'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    disabled={isSubmitting}
                  >
                    {t('autoSchedule.form.buildingDetails.selected')} ({formData.buildingDetailIds.length})
                  </button>
                </div>
              </div>

              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {selectedTab === 'all' ? (
                    filteredBuildingDetails?.length > 0 ? (
                      filteredBuildingDetails.map(buildingDetail => (
                        <div
                          key={buildingDetail.buildingDetailId}
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 border ${formData.buildingDetailIds.includes(buildingDetail.buildingDetailId)
                            ? 'border-blue-200 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/10'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                          <input
                            type="checkbox"
                            id={`building-${buildingDetail.buildingDetailId}`}
                            checked={formData.buildingDetailIds.includes(buildingDetail.buildingDetailId)}
                            onChange={() => handleBuildingDetailToggle(buildingDetail.buildingDetailId)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor={`building-${buildingDetail.buildingDetailId}`}
                            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-base">{buildingDetail.building?.name}</div>
                              {buildingDetail.status && (
                                <div className="text-xs">
                                  {getStatusBadge(buildingDetail.status)}
                                </div>
                              )}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 mt-1">
                              {buildingDetail.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {buildingDetail.total_apartments} {t('buildingDetail.selection.apartments')}
                            </div>
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                        {t('autoSchedule.form.buildingDetails.noResults')}
                      </div>
                    )
                  ) : selectedBuildingDetails?.length > 0 ? (
                    selectedBuildingDetails.map(buildingDetail => (
                      <div
                        key={buildingDetail.buildingDetailId}
                        className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/10"
                      >
                        <input
                          type="checkbox"
                          id={`selected-building-${buildingDetail.buildingDetailId}`}
                          checked={true}
                          onChange={() => handleBuildingDetailToggle(buildingDetail.buildingDetailId)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                          disabled={isSubmitting}
                        />
                        <label
                          htmlFor={`selected-building-${buildingDetail.buildingDetailId}`}
                          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-base">{buildingDetail.building?.name}</div>
                            {buildingDetail.status && (
                              <div className="text-xs">
                                {getStatusBadge(buildingDetail.status)}
                              </div>
                            )}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 mt-1">
                            {buildingDetail.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {buildingDetail.total_apartments} {t('buildingDetail.selection.apartments')}
                          </div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                      {t('autoSchedule.form.buildingDetails.noSelected')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                {t('autoSchedule.buttons.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('autoSchedule.buttons.creating')}</span>
                  </div>
                ) : (
                  t('autoSchedule.buttons.create')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CreateAutoScheduleModal
