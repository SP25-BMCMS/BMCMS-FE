import { TaskEvent } from '@/types/calendar'
import {
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  TagIcon,
  XMarkIcon,
  CogIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { vi } from 'date-fns/locale'
import React, { useEffect, useState } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import BuildingDetailSelectionModal from './BuildingDetailSelectionModal'
import ConfirmModal from './ConfirmModal'
import { BuildingDetail } from '@/types/buildingDetail'
import { MaintenanceCycle } from '@/types'

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
      console.log('Selected Event Cycle ID:', cycleId) // Debug log

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

    // Prepare data for API submission
    const submitData = {
      ...formData,
      buildingDetailIds: selectedBuildingDetails,
    }

    // For edit mode, ensure we're passing the schedule_name field correctly
    const finalData = {
      ...submitData,
      // Map title to schedule_name for the API
      schedule_name: submitData.title,
    }

    if (isCreateMode) {
      onSave(finalData)
    } else {
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
    { value: 'Pending', label: 'Pending' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancel', label: 'Cancel' },
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
    console.log('Getting cycle label for:', cycleId)
    console.log('Available cycles:', maintenanceCycles)

    // Extract data array from the response if needed
    const cyclesArray = Array.isArray(maintenanceCycles)
      ? maintenanceCycles
      : maintenanceCycles?.data || []

    // Ensure cyclesArray is an array and cycleId exists
    if (!Array.isArray(cyclesArray) || !cycleId || cycleId.trim() === '') {
      console.log('Invalid maintenance cycles or cycle ID')
      return ''
    }

    try {
      const cycle = cyclesArray.find(c => c.cycle_id === cycleId)
      console.log('Found cycle:', cycle)
      return cycle ? `${cycle.device_type} - ${cycle.frequency} (${cycle.basis})` : ''
    } catch (error) {
      console.error('Error getting cycle label:', error)
      return ''
    }
  }

  if (!isOpen) return null

  console.log('Rendering Modal - Form Data:', formData)
  console.log('Rendering Modal - Maintenance Cycles:', maintenanceCycles)

  // Extract data array from the response if needed
  const cyclesArray = Array.isArray(maintenanceCycles)
    ? maintenanceCycles
    : maintenanceCycles?.data || []

  // Get current cycle for display
  const currentCycle =
    Array.isArray(cyclesArray) && formData.cycle_id && formData.cycle_id.trim() !== ''
      ? cyclesArray.find(c => c.cycle_id === formData.cycle_id)
      : null

  console.log('Current Cycle:', currentCycle) // Debug log

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {isCreateMode ? 'Create New Schedule' : 'Edit Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <DocumentTextIcon className="w-4 h-4 inline-block mr-2" />
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                aria-label="Schedule title"
                placeholder="Enter schedule title"
              />
            </div>

            {!isCreateMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <TagIcon className="w-4 h-4 inline-block mr-2" />
                  Schedule Type
                </label>
                <select
                  value={formData.schedule_type}
                  onChange={e => setFormData(prev => ({ ...prev, schedule_type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  aria-label="Schedule type"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Specific">Specific</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarIcon className="w-4 h-4 inline-block mr-2" />
                Start Date
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
                aria-label="Start date"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarIcon className="w-4 h-4 inline-block mr-2" />
                End Date
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
                aria-label="End date"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <CogIcon className="w-4 h-4 inline-block mr-2" />
                Maintenance Cycle
              </label>
              <select
                value={formData.cycle_id || ''}
                onChange={e => setFormData(prev => ({ ...prev, cycle_id: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                aria-label="Maintenance Cycle"
                required
              >
                <option value="">Select a maintenance cycle</option>
                {Array.isArray(cyclesArray) &&
                  cyclesArray.map(cycle => (
                    <option key={cycle.cycle_id} value={cycle.cycle_id}>
                      {cycle.device_type} - {cycle.frequency} ({cycle.basis})
                    </option>
                  ))}
              </select>
              {!isCreateMode && formData.cycle_id && formData.cycle_id.trim() !== '' && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Current cycle: {getCycleLabel(formData.cycle_id)}
                </div>
              )}
            </div>

            {!isCreateMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 inline-block mr-2" />
                  Status
                </label>
                <select
                  value={formData.schedule_status}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      schedule_status: e.target.value as
                        | 'Pending'
                        | 'InProgress'
                        | 'Completed'
                        | 'Cancel',
                    }))
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  aria-label="Schedule status"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <BuildingOfficeIcon className="w-4 h-4 inline-block mr-2" />
                Building Details
              </label>
              <button
                type="button"
                onClick={handleOpenBuildingModal}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                aria-label="Select building details"
              >
                {selectedBuildingDetails.length > 0
                  ? `${selectedBuildingDetails.length} Building Details Selected`
                  : 'Select Building Details'}
              </button>

              {selectedBuildingDetails.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedBuildingDetails.map((buildingDetailId, index) => {
                    const buildingDetail = buildingDetails.find(
                      b => b.buildingDetailId === buildingDetailId
                    )
                    return buildingDetail ? (
                      <div
                        key={`${buildingDetailId}-${index}`}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                      >
                        <span>{buildingDetail.name}</span>
                        <button
                          type="button"
                          onClick={() => onBuildingDetailSelect(buildingDetailId)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          aria-label={`Remove ${buildingDetail.name}`}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <DocumentTextIcon className="w-4 h-4 inline-block mr-2" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows={4}
                aria-label="Schedule description"
                placeholder="Enter schedule description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!isCreateMode && selectedEvent?.id && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onViewScheduleJob}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Detail
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isCreateMode ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>

      <BuildingDetailSelectionModal
        isOpen={showBuildingModal}
        onClose={() => setShowBuildingModal(false)}
        buildingDetails={buildingDetails}
        selectedBuildingDetails={selectedBuildingDetails}
        onBuildingDetailSelect={onBuildingDetailSelect}
        selectedEvent={selectedEvent}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Confirm Delete"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

export default EventModal
