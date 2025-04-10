import React, { useState, useEffect } from 'react'
import { STATUS_COLORS } from '@/constants/colors'
import { IoClose } from 'react-icons/io5'
import { FaInfoCircle, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import tasksApi from '@/services/tasks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface ChangeStatusModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  crackId?: string
  currentTaskStatus: string
  currentCrackStatus?: string
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  onClose,
  taskId,
  crackId,
  currentTaskStatus,
  currentCrackStatus,
}) => {
  const [taskStatus, setTaskStatus] = useState<string>(currentTaskStatus)
  const [crackStatus, setCrackStatus] = useState<string>(currentCrackStatus || '')
  const [crackDescription, setCrackDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTaskStatus(currentTaskStatus)
      setCrackStatus(currentCrackStatus || '')
      setCrackDescription('')
      setError(null)
    }
  }, [isOpen, currentTaskStatus, currentCrackStatus])

  // Generate default description based on status
  useEffect(() => {
    if (crackStatus === 'Resolved') {
      setCrackDescription('Vết nứt đã được xử lý thành công.')
    } else if (crackStatus === 'Cancelled') {
      setCrackDescription('Hủy bỏ việc xử lý vết nứt.')
    }
  }, [crackStatus])

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // Task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      console.log(`Updating task status: ${taskId} to ${status}`)
      return await tasksApi.updateTaskStatus(taskId, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task status updated successfully')
    },
    onError: (error: any) => {
      console.error('Error updating task status:', error)
      setError(error?.message || 'Failed to update task status')
      toast.error('Failed to update task status')
      throw error
    },
  })

  // Crack status mutation
  const updateCrackStatusMutation = useMutation({
    mutationFn: async ({ status, description }: { status: string; description: string }) => {
      if (!crackId) throw new Error('No crack associated with this task')
      console.log(`Updating crack status: ${crackId} to ${status}`)
      return await tasksApi.updateCrackStatus(crackId, status, description)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Crack status updated successfully')
    },
    onError: (error: any) => {
      console.error('Error updating crack status:', error)
      setError(error?.message || 'Failed to update crack status')
      toast.error('Failed to update crack status')
      throw error
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Update task status
      if (taskStatus !== currentTaskStatus) {
        await updateTaskStatusMutation.mutateAsync(taskStatus)
      }

      // If crack exists and status is changed, update crack status
      if (crackId && crackStatus && crackStatus !== currentCrackStatus) {
        await updateCrackStatusMutation.mutateAsync({
          status: crackStatus,
          description: crackDescription || `Vết nứt đã được ${crackStatus}.`,
        })
      }

      // Close modal if both operations succeed
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      // Error state is already set in the mutation error handlers
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Get task status options
  const getTaskStatusOptions = () => {
    return [
      { value: 'Assigned', label: 'Assigned' },
      { value: 'Completed', label: 'Completed' },
    ]
  }

  // Get crack status options - only Resolved and Cancelled
  const getCrackStatusOptions = () => {
    return [
      { value: 'Completed', label: 'Completed' },
      { value: 'Rejected', label: 'Rejected' },
    ]
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Resolved':
        return STATUS_COLORS.RESOLVED
      case 'In Progress':
      case 'InProgress':
        return STATUS_COLORS.IN_PROGRESS
      case 'Assigned':
      case 'Pending':
        return STATUS_COLORS.INACTIVE
      case 'Reviewing':
        return STATUS_COLORS.REVIEWING
      case 'Cancelled':
        return STATUS_COLORS.INACTIVE
      default:
        return STATUS_COLORS.INACTIVE
    }
  }

  const taskStatusOptions = getTaskStatusOptions()
  const crackStatusOptions = getCrackStatusOptions()
  const taskStatusColor = getStatusColor(taskStatus)
  const crackStatusColor = getStatusColor(crackStatus)
  const hasCrack = !!crackId
  const hasChanges =
    taskStatus !== currentTaskStatus || (hasCrack && crackStatus !== currentCrackStatus)

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              disabled={isSubmitting}
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-4">
              {/* Task status section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Task Status</h4>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Status
                  </label>
                  <div
                    className="px-3 py-2 inline-flex items-center rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: getStatusColor(currentTaskStatus).BG,
                      color: getStatusColor(currentTaskStatus).TEXT,
                      border: '1px solid',
                      borderColor: getStatusColor(currentTaskStatus).BORDER,
                    }}
                  >
                    {currentTaskStatus}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-task-status"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    New Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {taskStatusOptions.map(option => (
                      <div
                        key={option.value}
                        className={`relative px-3 py-2 border rounded-md cursor-pointer transition-all ${taskStatus === option.value
                            ? 'ring-2 ring-offset-2 ring-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        style={
                          taskStatus === option.value
                            ? {
                              backgroundColor: getStatusColor(option.value).BG,
                              color: getStatusColor(option.value).TEXT,
                              borderColor: getStatusColor(option.value).BORDER,
                            }
                            : {}
                        }
                        onClick={() => setTaskStatus(option.value)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {taskStatus === option.value && <FaCheck className="text-blue-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Crack status section - only if crackId exists */}
              {hasCrack && (
                <div className="mb-6 border-t dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Crack Status</h4>

                  {currentCrackStatus && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Status
                      </label>
                      <div
                        className="px-3 py-2 inline-flex items-center rounded-md text-sm font-medium"
                        style={{
                          backgroundColor: getStatusColor(currentCrackStatus).BG,
                          color: getStatusColor(currentCrackStatus).TEXT,
                          border: '1px solid',
                          borderColor: getStatusColor(currentCrackStatus).BORDER,
                        }}
                      >
                        {currentCrackStatus}
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="new-crack-status"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      New Status
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {crackStatusOptions.map(option => (
                        <div
                          key={option.value}
                          className={`relative px-3 py-2 border rounded-md cursor-pointer transition-all ${crackStatus === option.value
                              ? 'ring-2 ring-offset-2 ring-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                            }`}
                          style={
                            crackStatus === option.value
                              ? {
                                backgroundColor: getStatusColor(option.value).BG,
                                color: getStatusColor(option.value).TEXT,
                                borderColor: getStatusColor(option.value).BORDER,
                              }
                              : {}
                          }
                          onClick={() => setCrackStatus(option.value)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            {crackStatus === option.value && <FaCheck className="text-blue-500" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter a description for the status change"
                        value={crackDescription}
                        onChange={e => setCrackDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded-md mb-4">
                  <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Info message */}
              <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 p-3 rounded-md mb-4">
                <FaInfoCircle className="mr-2 flex-shrink-0" />
                <span className="text-sm">
                  {hasCrack
                    ? 'This will update both the task status and its associated crack status.'
                    : 'This will update the task status.'}
                </span>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ChangeStatusModal
