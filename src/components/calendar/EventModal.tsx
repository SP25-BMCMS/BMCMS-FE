import { MaintenanceCycle } from '@/types'
import { TaskEvent } from '@/types/calendar'
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  CogIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { vi } from 'date-fns/locale'
import React, { useEffect, useState } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import ConfirmModal from './ConfirmModal'

registerLocale('vi', vi)

interface FormData {
  title: string
  description: string
  schedule_type: string
  start_date: Date
  end_date: Date
  buildingDetailIds: string[]
  cycle_id: string
  schedule_status: 'Pending' | 'InProgress' | 'Completed' | 'Cancel'
}

interface EventModalProps {
  isOpen: boolean
  isCreateMode: boolean
  selectedEvent: TaskEvent | null
  onClose: () => void
  onSave: (formData: FormData) => void
  onUpdate: (formData: FormData) => void
  onDelete: (id: string) => void
  onViewScheduleJob: () => void
  onUpdateStatus: (id: string, status: string) => void
  initialFormData: Partial<TaskEvent>
  buildings: Array<{
    buildingId: string
    name: string
    description?: string
    Status: string
  }>
  buildingDetails: BuildingDetail[]
  selectedBuildingDetails: string[]
  onBuildingDetailSelect: (buildingDetailId: string) => void
  onSetSelectedBuildingDetails: (buildingDetails: string[]) => void
  maintenanceCycles: MaintenanceCycle[]
}

interface BuildingDetail {
  buildingDetailId: string
  name: string
  building?: {
    name: string
  }
  status?: string
  total_apartments: number
  area?: number
}

// Helper function to render status badges
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

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  isCreateMode,
  selectedEvent,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  onViewScheduleJob,
  initialFormData,
  buildings,
  buildingDetails,
  selectedBuildingDetails,
  onBuildingDetailSelect,
  onSetSelectedBuildingDetails,
  maintenanceCycles,
}) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    schedule_type: 'Daily',
    start_date: new Date(),
    end_date: new Date(),
    buildingDetailIds: [],
    cycle_id: '',
    schedule_status: 'Pending',
  })
  const [showBuildingModal, setShowBuildingModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isCreateMode && initialFormData) {
      setFormData({
        title: initialFormData.title || '',
        description: initialFormData.description || '',
        schedule_type: 'Daily',
        start_date: initialFormData.start ? new Date(initialFormData.start) : new Date(),
        end_date: initialFormData.end ? new Date(initialFormData.end) : new Date(),
        buildingDetailIds: selectedBuildingDetails,
        cycle_id: initialFormData.cycle_id || '',
        schedule_status: 'Pending',
      })
    } else if (selectedEvent) {
      // Map event status to API status format
      let scheduleStatus: 'Pending' | 'InProgress' | 'Completed' | 'Cancel' = 'InProgress'

      if (selectedEvent.status === 'pending') {
        scheduleStatus = 'Pending'
      } else if (selectedEvent.status === 'inprogress') {
        scheduleStatus = 'InProgress'
      } else if (selectedEvent.status === 'completed') {
        scheduleStatus = 'Completed'
      } else if (selectedEvent.status === 'cancel') {
        scheduleStatus = 'Cancel'
      }

      // Get cycle ID from existing data if available
      const cycleId = selectedEvent.cycle_id || ''

      setFormData({
        title: selectedEvent.title || '',
        description: selectedEvent.description || '',
        schedule_type: selectedEvent.schedule_type || 'Daily',
        start_date: selectedEvent.start ? new Date(selectedEvent.start) : new Date(),
        end_date: selectedEvent.end ? new Date(selectedEvent.end) : new Date(),
        buildingDetailIds: selectedEvent.buildingDetailIds || [],
        cycle_id: cycleId,
        schedule_status: scheduleStatus,
      })

      // Set selectedBuildingDetails only if modal first opens
      if (selectedEvent.buildingDetailIds && selectedEvent.buildingDetailIds.length > 0) {
        onSetSelectedBuildingDetails(selectedEvent.buildingDetailIds)
      }
    }
  }, [
    isCreateMode,
    initialFormData,
    selectedEvent,
    isOpen,
    onSetSelectedBuildingDetails,
    maintenanceCycles,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted', formData)
    console.log('isCreateMode:', isCreateMode)
    console.log('selectedEvent:', selectedEvent)

    const submitData = {
      ...formData,
      buildingDetailIds: selectedBuildingDetails,
    }

    const finalData = {
      ...submitData,
      schedule_name: submitData.title,
    }

    console.log('Final data to submit:', finalData)

    if (isCreateMode) {
      console.log('Calling onSave')
      onSave(finalData)
    } else {
      console.log('Calling onUpdate')
      onUpdate(finalData)
    }
  }

  const handleDelete = () => {
    if (selectedEvent?.id) {
      onDelete(selectedEvent.id)
      setShowDeleteConfirm(false)
    }
  }

  const statusOptions = [
    { value: 'Pending', label: t('calendar.statusLabels.pending') },
    { value: 'InProgress', label: t('calendar.statusLabels.inProgress') },
    { value: 'Completed', label: t('calendar.statusLabels.completed') },
    { value: 'Cancel', label: t('calendar.statusLabels.cancel') },
  ]

  // Add this function to handle building modal toggling while preserving form data
  const handleOpenBuildingModal = () => {
    // Ensure selected building details are synced with form data before opening modal
    setFormData(prev => ({
      ...prev,
      buildingDetailIds: selectedBuildingDetails,
    }))
    setShowBuildingModal(true)
  }

  // Add effect to sync form data with selected building details
  useEffect(() => {
    // Only update form data if we're not in create mode and we have a selected event
    if (!isCreateMode && selectedEvent) {
      setFormData(prev => ({
        ...prev,
        buildingDetailIds: selectedBuildingDetails,
      }))
    }
  }, [selectedBuildingDetails, isCreateMode, selectedEvent])

  // Add function to get cycle label
  const getCycleLabel = (cycleId: string) => {
    // Extract data array from the response if needed
    const cyclesArray = Array.isArray(maintenanceCycles)
      ? maintenanceCycles
      : maintenanceCycles?.data || []

    // Ensure cyclesArray is an array and cycleId exists
    if (!Array.isArray(cyclesArray) || !cycleId || cycleId.trim() === '') {
      return ''
    }

    try {
      const cycle = cyclesArray.find(c => c.cycle_id === cycleId)
      if (!cycle) return ''

      const deviceType = t(`maintenanceCycle.filterOptions.deviceType.${cycle.device_type}`)
      const frequency = t(`maintenanceCycle.filterOptions.frequency.${cycle.frequency}`)
      const basis = t(`maintenanceCycle.filterOptions.basis.${cycle.basis}`)

      return `${deviceType} - ${frequency} (${basis})`
    } catch (error) {
      return ''
    }
  }

  if (!isOpen) return null

  // Extract data array from the response if needed
  const cyclesArray = Array.isArray(maintenanceCycles)
    ? maintenanceCycles
    : maintenanceCycles?.data || []

  // Get current cycle for display
  const currentCycle =
    Array.isArray(cyclesArray) && formData.cycle_id && formData.cycle_id.trim() !== ''
      ? cyclesArray.find(c => c.cycle_id === formData.cycle_id)
      : null

  // Filter building details based on search term
  const filteredBuildingDetails = buildingDetails.filter(buildingDetail =>
    buildingDetail.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {isCreateMode ? t('calendar.eventModal.createTitle') : t('calendar.eventModal.editTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.close')}
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('calendar.eventModal.title')}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                  placeholder={t('calendar.eventModal.titlePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CogIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('calendar.eventModal.maintenanceCycle')}
                </label>
                <select
                  value={formData.cycle_id || ''}
                  onChange={e => setFormData(prev => ({ ...prev, cycle_id: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                  aria-label={t('calendar.eventModal.maintenanceCycle')}
                >
                  <option value="">{t('calendar.eventModal.selectCycle')}</option>
                  {Array.isArray(cyclesArray) &&
                    cyclesArray.map(cycle => (
                      <option key={cycle.cycle_id} value={cycle.cycle_id}>
                        {getCycleLabel(cycle.cycle_id)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('calendar.eventModal.startDate')}
                </label>
                <DatePicker
                  selected={formData.start_date}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, start_date: date }))
                    }
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  locale="vi"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('calendar.eventModal.endDate')}
                </label>
                <DatePicker
                  selected={formData.end_date}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, end_date: date }))
                    }
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  locale="vi"
                  minDate={formData.start_date}
                />
              </div>

              {!isCreateMode && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2 text-blue-500" />
                    {t('calendar.eventModal.status')}
                  </label>
                  <select
                    value={formData.schedule_status}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        schedule_status: e.target.value as 'Pending' | 'InProgress' | 'Completed' | 'Cancel',
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    aria-label={t('calendar.eventModal.status')}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {isCreateMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <BuildingOfficeIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {t('calendar.eventModal.buildings.title')}
                </label>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                      placeholder={t('calendar.eventModal.buildings.search')}
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
                    >
                      {t('calendar.eventModal.buildings.all')} ({buildingDetails?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTab('selected')}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${selectedTab === 'selected'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                      {t('calendar.eventModal.buildings.selected')} ({selectedBuildingDetails.length})
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
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 border ${selectedBuildingDetails.includes(buildingDetail.buildingDetailId)
                              ? 'border-blue-200 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/10'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                          >
                            <input
                              type="checkbox"
                              id={`building-${buildingDetail.buildingDetailId}`}
                              checked={selectedBuildingDetails.includes(buildingDetail.buildingDetailId)}
                              onChange={() => onBuildingDetailSelect(buildingDetail.buildingDetailId)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
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
                          {t('calendar.eventModal.buildings.noResults')}
                        </div>
                      )
                    ) : selectedBuildingDetails.length > 0 ? (
                      selectedBuildingDetails.map(buildingDetailId => {
                        const buildingDetail = buildingDetails.find(
                          b => b.buildingDetailId === buildingDetailId
                        )
                        return buildingDetail ? (
                          <div
                            key={buildingDetailId}
                            className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/10"
                          >
                            <input
                              type="checkbox"
                              id={`selected-building-${buildingDetailId}`}
                              checked={true}
                              onChange={() => onBuildingDetailSelect(buildingDetailId)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                            />
                            <label
                              htmlFor={`selected-building-${buildingDetailId}`}
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
                        ) : null
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                        {t('calendar.eventModal.buildings.noSelected')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-500" />
                {t('calendar.eventModal.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows={4}
                placeholder={t('calendar.eventModal.descriptionPlaceholder')}
              />
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-end gap-4">
            {!isCreateMode && selectedEvent?.id && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('calendar.eventModal.buttons.delete')}
                </button>
                <button
                  type="button"
                  onClick={onViewScheduleJob}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('calendar.eventModal.buttons.viewDetail')}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t('calendar.eventModal.buttons.cancel')}
            </button>
            <button
              type="submit"
              onClick={() => {
                console.log('Update button clicked')
                handleSubmit(new Event('submit') as any)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isCreateMode ? t('calendar.eventModal.buttons.create') : t('calendar.eventModal.buttons.update')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('calendar.eventModal.deleteConfirm.title')}
        message={t('calendar.eventModal.deleteConfirm.message')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

export default EventModal
