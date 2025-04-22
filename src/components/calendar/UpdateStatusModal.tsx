import React, { useState } from 'react'
import { ScheduleJob } from '@/services/scheduleJobs'
import {
    RiCheckboxCircleLine,
    RiTimeLine,
    RiAlertLine,
    RiCloseCircleLine,
    RiArrowLeftLine,
    RiQuestionLine,
} from 'react-icons/ri'

interface UpdateStatusModalProps {
    isOpen: boolean
    onClose: () => void
    job: ScheduleJob | null
    onUpdateStatus: (jobId: string, status: string) => void
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
    isOpen,
    onClose,
    job,
    onUpdateStatus,
}) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<string>('')

    if (!isOpen || !job) return null

    const statusOptions = [
        {
            value: 'Pending',
            label: 'Pending',
            icon: <RiAlertLine className="w-5 h-5" />,
            color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            hoverColor: 'hover:bg-yellow-200 dark:hover:bg-yellow-800/50',
        },
        {
            value: 'InProgress',
            label: 'In Progress',
            icon: <RiTimeLine className="w-5 h-5" />,
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            hoverColor: 'hover:bg-blue-200 dark:hover:bg-blue-800/50',
        },
        {
            value: 'Completed',
            label: 'Completed',
            icon: <RiCheckboxCircleLine className="w-5 h-5" />,
            color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            hoverColor: 'hover:bg-green-200 dark:hover:bg-green-800/50',
        },
        {
            value: 'Cancel',
            label: 'Cancel',
            icon: <RiCloseCircleLine className="w-5 h-5" />,
            color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            hoverColor: 'hover:bg-red-200 dark:hover:bg-red-800/50',
        },
    ]

    const handleStatusChange = (newStatus: string) => {
        setSelectedStatus(newStatus)
        setShowConfirmModal(true)
    }

    const handleConfirm = () => {
        onUpdateStatus(job.schedule_job_id, selectedStatus)
        setShowConfirmModal(false)
        onClose()
    }

    const getCurrentStatusInfo = () => {
        return statusOptions.find(option => option.value === job.status) || statusOptions[0]
    }

    const currentStatus = getCurrentStatusInfo()

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center z-[60]">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                            Update Job Status
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Close modal"
                        >
                            <RiArrowLeftLine className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Status</p>
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentStatus.color}`}
                        >
                            {currentStatus.icon}
                            <span className="font-medium">{currentStatus.label}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Select New Status</p>
                        {statusOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => handleStatusChange(option.value)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${option.color} ${option.hoverColor} ${job.status === option.value ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                disabled={job.status === option.value}
                            >
                                {option.icon}
                                <span className="font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Job Details</p>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                Building: {job.buildingDetail?.building?.name}
                            </p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                Detail: {job.buildingDetail?.name}
                            </p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                Run Date: {new Date(job.run_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[70]">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-center mb-4">
                            <RiQuestionLine className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
                            Confirm Status Change
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                            Are you sure you want to change the status from{' '}
                            <span className="font-medium">{job.status}</span> to{' '}
                            <span className="font-medium">{selectedStatus}</span>?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default UpdateStatusModal 