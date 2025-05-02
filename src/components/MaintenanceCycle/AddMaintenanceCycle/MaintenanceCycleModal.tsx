import React, { useState, useEffect } from 'react'
import { createMaintenanceCycle, updateMaintenanceCycle } from '@/services/maintenanceCycle'
import { toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import { MaintenanceCycle } from '@/types'
import { useTranslation } from 'react-i18next'

interface MaintenanceCycleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editMode?: boolean
  cycleData?: MaintenanceCycle
}

const frequencyOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
  { value: 'Specific', label: 'Specific' },
]

const basisOptions = [
  { value: 'ManufacturerRecommendation', label: 'Manufacturer Recommendation' },
  { value: 'LegalStandard', label: 'Legal Standard' },
  { value: 'OperationalExperience', label: 'Operational Experience' },
  { value: 'Other', label: 'Other' },
]

const deviceTypeOptions = [
  { value: 'Elevator', label: 'Elevator' },
  { value: 'FireProtection', label: 'Fire Protection' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'Generator', label: 'Generator' },
  { value: 'Lighting', label: 'Lighting' },
  { value: 'AutomaticDoor', label: 'Automatic Door' },
  { value: 'FireExtinguisher', label: 'Fire Extinguisher' },
  { value: 'Other', label: 'Other' },
]

const MaintenanceCycleModal: React.FC<MaintenanceCycleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  cycleData,
}) => {
  const { t } = useTranslation()
  const [deviceType, setDeviceType] = useState('')
  const [frequency, setFrequency] = useState('')
  const [basis, setBasis] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when in edit mode
  useEffect(() => {
    if (editMode && cycleData) {
      setDeviceType(cycleData.device_type || '')
      setFrequency(cycleData.frequency || '')
      setBasis(cycleData.basis || '')
      setReason(cycleData.reason || '')
    }
  }, [editMode, cycleData, isOpen])

  const resetForm = () => {
    setDeviceType('')
    setFrequency('')
    setBasis('')
    setReason('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!deviceType || !frequency || !basis) {
      toast.error(t('maintenanceCycle.modal.deviceType.required'))
      return
    }

    setIsSubmitting(true)
    try {
      if (editMode && cycleData) {
        // Get userId from localStorage (bmcms_user)
        const userStr = localStorage.getItem('bmcms_user')

        let userId = ''
        if (userStr) {
          try {
            const userData = JSON.parse(userStr)
            if (userData && userData.userId) {
              userId = userData.userId
            }
          } catch (error) {
            userId = ''
          }
        }

        if (!userId) {
          toast.error('User ID not found')
          return
        }

        await updateMaintenanceCycle(cycleData.cycle_id, {
          device_type: deviceType,
          frequency,
          basis,
          reason,
          updated_by: userId
        })
        toast.success(t('maintenanceCycle.modal.buttons.updating'))
      } else {
        await createMaintenanceCycle({
          device_type: deviceType,
          frequency,
          basis
        })
        toast.success(t('maintenanceCycle.modal.buttons.creating'))
      }
      resetForm()
      onSuccess()
      onClose()
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} maintenance cycle:`, error)
      toast.error(`Failed to ${editMode ? 'update' : 'create'} maintenance cycle`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label={t('maintenanceCycle.modal.buttons.cancel')}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {editMode ? t('maintenanceCycle.modal.title.edit') : t('maintenanceCycle.modal.title.create')}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('maintenanceCycle.modal.deviceType.label')} <span className="text-red-500">*</span>
              </label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                aria-label={t('maintenanceCycle.modal.deviceType.label')}
              >
                <option value="">{t('maintenanceCycle.modal.deviceType.required')}</option>
                {deviceTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(`maintenanceCycle.filterOptions.deviceType.${option.value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('maintenanceCycle.modal.frequency.label')} <span className="text-red-500">*</span>
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                aria-label={t('maintenanceCycle.modal.frequency.label')}
              >
                <option value="">{t('maintenanceCycle.modal.frequency.required')}</option>
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(`maintenanceCycle.filterOptions.frequency.${option.value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('maintenanceCycle.modal.basis.label')} <span className="text-red-500">*</span>
              </label>
              <select
                value={basis}
                onChange={e => setBasis(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                aria-label={t('maintenanceCycle.modal.basis.label')}
              >
                <option value="">{t('maintenanceCycle.modal.basis.required')}</option>
                {basisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(`maintenanceCycle.filterOptions.basis.${option.value}`)}
                  </option>
                ))}
              </select>
            </div>

            {editMode && (
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('maintenanceCycle.modal.reason.label')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder={t('maintenanceCycle.modal.reason.placeholder')}
                  required
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('maintenanceCycle.modal.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isSubmitting
                ? editMode
                  ? t('maintenanceCycle.modal.buttons.updating')
                  : t('maintenanceCycle.modal.buttons.creating')
                : editMode
                  ? t('maintenanceCycle.modal.buttons.update')
                  : t('maintenanceCycle.modal.buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MaintenanceCycleModal
