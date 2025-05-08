import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { crackApi } from '@/lib/api/crack'
import { StaffWithPosition } from '@/types'

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
        return statusMapping[crackStatus as keyof typeof statusMapping]?.label || crackStatus
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
                        {t('common.crackStatus.current')}: {getStatusLabel()}
                    </span>
                </div>

                {/* ... rest of the JSX ... */}

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