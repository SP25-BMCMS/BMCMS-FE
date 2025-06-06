import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import crackApi from '@/services/cracks'
import { StaffData } from '@/types'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface StaffWithPosition extends Omit<StaffData, 'userDetails'> {
  userDetails?: {
    positionId: string
    departmentId: string
    staffStatus?: string
    image?: string
    position?: {
      positionId: string
      positionName: string
      description: string
    }
    department?: {
      departmentId: string
      departmentName: string
      description: string
      area: string
    }
  }
}

interface StatusCrackProps {
  isOpen: boolean
  onClose: () => void
  crackId: string
  crackStatus: string
  onUpdateSuccess: () => void
}

const StatusCrack: React.FC<StatusCrackProps> = ({
  isOpen,
  onClose,
  crackId,
  crackStatus,
  onUpdateSuccess,
}) => {
  const { t } = useTranslation()
  const [staffLeaders, setStaffLeaders] = useState<StaffWithPosition[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Status title mapping
  const statusMapping = {
    pending: {
      title: t('common.crackStatus.pending'),
      label: t('common.crackStatus.pending')
    },
    InProgress: {
      title: t('common.crackStatus.inProgress'),
      label: t('common.crackStatus.inProgress')
    },
    resolved: {
      title: t('common.crackStatus.resolved'),
      label: t('common.crackStatus.resolved')
    },
    reviewing: {
      title: t('common.crackStatus.reviewing'),
      label: t('common.crackStatus.reviewing')
    },
    rejected: {
      title: t('common.crackStatus.rejected'),
      label: t('common.crackStatus.rejected')
    },
    completed: {
      title: t('common.crackStatus.completed'),
      label: t('common.crackStatus.completed')
    }
  }

  // Get the status title
  const getStatusTitle = () => {
    return statusMapping[crackStatus as keyof typeof statusMapping]?.title || t('common.crackStatus.pending')
  }

  // Get the status label
  const getStatusLabel = () => {
    const status = crackStatus.toLowerCase()
    switch (status) {
      case 'pending':
        return t('common.crackStatus.pending')
      case 'inprogress':
      case 'in_progress':
        return t('common.crackStatus.inProgress')
      case 'resolved':
        return t('common.crackStatus.resolved')
      case 'reviewing':
        return t('common.crackStatus.reviewing')
      case 'rejected':
        return t('common.crackStatus.rejected')
      case 'completed':
        return t('common.crackStatus.completed')
      default:
        return t('common.crackStatus.pending')
    }
  }

  // Fetch staff leader when modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchStaffLeader()
    }
  }, [isOpen])

  // Fetch staff leader from API
  const fetchStaffLeader = async () => {
    setIsLoading(true)
    try {
      const response = await crackApi.getStaffLeaderByCrackId(crackId)
      if (response.isSuccess && response.data) {
        // Handle both array and single object responses
        const leaders = Array.isArray(response.data) ? response.data : [response.data]
        setStaffLeaders(leaders)
        if (leaders.length > 0) {
          setSelectedStaffId(leaders[0].userId)
        }
      } else {
        toast.error(t('staffManagement.error'))
      }
    } catch (error) {
      console.error('Error fetching staff leader:', error)
      toast.error(t('staffManagement.error'))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle selection change
  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStaffId(e.target.value)
  }

  // Get status animation class for the badge
  const getStatusAnimationClass = (status: string) => {
    switch (status) {
      case 'resolved':
        return ''
      case 'InProgress':
        return 'animate-pulse'
      case 'reviewing':
        return 'animate-pulse'
      case 'rejected':
        return 'animate-pulse'
      case 'completed':
        return 'animate-pulse'
      default:
        return 'animate-pulse-fast'
    }
  }

  // Get status colors for the badge
  const getStatusColors = () => {
    switch (crackStatus) {
      case 'resolved':
        return 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
      case 'InProgress':
        return 'bg-[rgba(255,165,0,0.3)] text-[#ff9900] border border-[#ffa500]'
      case 'reviewing':
        return 'bg-[rgba(255,165,0,0.3)] text-[#ff9900] border border-[#ffa500]'
      case 'rejected':
        return 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
      case 'completed':
        return 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
      default:
        return 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
    }
  }

  // Get dot colors for the status badge
  const getDotColors = () => {
    switch (crackStatus) {
      case 'resolved':
        return 'bg-[#00ff90]'
      case 'InProgress':
        return 'bg-[#ff9900]'
      case 'reviewing':
        return 'bg-[#ff9900]'
      case 'rejected':
        return 'bg-[#ff0000]'
      case 'completed':
        return 'bg-[#00ff90]'
      default:
        return 'bg-[#ff0000]'
    }
  }

  // Save the staff assignment
  const handleSave = async () => {
    if (!selectedStaffId) {
      toast.error(t('staffManagement.error'))
      return
    }

    setIsSaving(true)
    try {
      const apiStatus =
        crackStatus === 'InProgress'
          ? 'InProgress'
          : crackStatus === 'resolved'
            ? 'Resolved'
            : 'Pending'

      const response = await crackApi.updateCrackStatus(
        crackId,
        apiStatus,
        selectedStaffId
      )

      if (response.isSuccess) {
        toast.success(t('common.crackStatus.updateSuccess'))
        onUpdateSuccess()
        onClose()
      } else {
        toast.error(response.message || t('common.crackStatus.updateError'))
      }
    } catch (error: any) {
      console.error('Failed to update crack status:', error)
      toast.error(error.message || t('common.crackStatus.updateError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getStatusTitle()} size="md">
      <div className="space-y-4">
        {/* Current status display */}
        <div className="flex justify-center mb-4">
          <span
            className={`px-4 py-2 inline-flex items-center text-sm leading-5 font-semibold rounded-full ${getStatusColors()}`}
          >
            <span className="relative mr-2">
              <span
                className={`inline-block w-3 h-3 rounded-full ${getDotColors()} ${getStatusAnimationClass(crackStatus)}`}
              ></span>
              {crackStatus !== 'resolved' && (
                <span
                  className={`absolute -inset-1 rounded-full ${crackStatus === 'InProgress' ? 'bg-[#ff9900]' : 'bg-[#ff0000]'
                    } opacity-30 animate-ping`}
                ></span>
              )}
            </span>
            {t('crackManagement.status.current')}: {getStatusLabel()}
          </span>
        </div>

        {/* Staff selection dropdown */}
        <div>
          <label
            htmlFor="staff"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('staffManagement.assignLeader')}
          </label>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : staffLeaders.length === 0 ? (
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-yellow-700 dark:text-yellow-400">
              {t('staffManagement.noLeadersAvailable')}
            </div>
          ) : (
            <select
              id="staff"
              value={selectedStaffId}
              onChange={handleStaffChange}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 border-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
              disabled={isSaving}
            >
              <option value="">{t('staffManagement.selectLeader')}</option>
              {staffLeaders.map((leader) => (
                <option key={leader.userId} value={leader.userId}>
                  {leader.username} ({t('staffManagement.leader')})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Staff selection note */}
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
          <p>
            {t('staffManagement.assignNote')} <strong>{getStatusLabel()}</strong>.
          </p>
          <p className="mt-1">
            {t('staffManagement.responsibilityNote')}
          </p>
          <p className="mt-1 text-blue-500 dark:text-blue-400">
            {t('staffManagement.leaderNote')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
            disabled={isSaving}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedStaffId || isSaving}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                {t('common.crackStatus.processing')}
              </span>
            ) : (
              t('staffManagement.assignAndUpdate')
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default StatusCrack
