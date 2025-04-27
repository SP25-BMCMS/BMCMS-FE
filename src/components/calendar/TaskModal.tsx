import React, { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, UserIcon, ClipboardIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { ScheduleJob } from '@/services/scheduleJobs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiInstance from '@/lib/axios'
import { toast } from 'react-hot-toast'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  scheduleJob: ScheduleJob | null
}

interface Staff {
  userId: string
  username: string
  email: string
  role: string
  accountStatus: string
  userDetails?: {
    positionId: string
    departmentId: string
    position: {
      positionId: string
      positionName: string
    }
    department: {
      departmentId: string
      departmentName: string
      area: string
    }
  }
}

interface Task {
  task_id: string
  description: string
  status: string
  created_at: string
  updated_at: string
  crack_id: string
  schedule_job_id: string
  taskAssignments: {
    assignment_id: string
    task_id: string
    employee_id: string
    description: string
    status: string
    created_at: string
    updated_at: string
  }[]
  workLogs: any[]
  feedbacks: any[]
  crackInfo: any
}

interface TasksResponse {
  statusCode: number
  message: string
  data: Task[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, scheduleJob }) => {
  const queryClient = useQueryClient()
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Fetch staff list
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-leaders', scheduleJob?.schedule_job_id],
    queryFn: async () => {
      if (!scheduleJob?.schedule_job_id) {
        throw new Error('Schedule job ID is required')
      }
      const response = await apiInstance.get(
        `${import.meta.env.VITE_GET_STAFF_LEADERS_BY_SCHEDULE_JOB.replace(
          '{scheduleJobId}',
          scheduleJob.schedule_job_id
        )}`
      )
      return response.data
    },
    enabled: isOpen && !!scheduleJob?.schedule_job_id,
  })

  // Fetch all tasks and filter to find if a task exists for this schedule job
  const { data: tasksData, isLoading: tasksLoading } = useQuery<TasksResponse>({
    queryKey: ['tasks', scheduleJob?.schedule_job_id],
    queryFn: async () => {
      const response = await apiInstance.get(import.meta.env.VITE_VIEW_TASK_LIST)
      return response.data
    },
    enabled: isOpen && !!scheduleJob?.schedule_job_id,
  })

  // Find existing task for this schedule job
  const existingTask = tasksData?.data?.find(
    task => task.schedule_job_id === scheduleJob?.schedule_job_id
  )

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async ({
      scheduleJobId,
      staffId,
      description,
    }: {
      scheduleJobId: string
      staffId: string
      description: string
    }) => {
      const url = import.meta.env.VITE_CREATE_SCHEDULE_JOB_TASK.replace(
        '{scheduleJobId}',
        scheduleJobId
      ).replace('{staffId}', staffId)

      return await apiInstance.post(url, { description })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully')
      setIsSubmitting(false)
      onClose()
    },
    onError: (error: any) => {
      console.error('Error creating task:', error)
      toast.error(error.response?.data?.message || 'Failed to create task')
      setIsSubmitting(false)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedStaffId('')
      setDescription('')
    }
  }, [isOpen])

  // Filter staff with Leader position
  const leaderStaff = staffData?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!scheduleJob) {
      toast.error('No schedule job selected')
      return
    }

    if (!selectedStaffId) {
      toast.error('Please select a staff member')
      return
    }

    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }

    setIsSubmitting(true)

    try {
      await createTaskMutation.mutateAsync({
        scheduleJobId: scheduleJob.schedule_job_id,
        staffId: selectedStaffId,
        description,
      })
    } catch (error) {
      // Error handled in mutation
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isOpen) return null

  // Loading state
  const isLoading = staffLoading || tasksLoading

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden">
        <div className="flex justify-between items-center bg-blue-600 dark:bg-blue-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <ClipboardIcon className="w-5 h-5 mr-2" />
            {existingTask ? 'Task Details' : 'Create Task'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200" title="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        ) : existingTask ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-md border border-green-200 dark:border-green-700">
              <CheckCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
              <p>Task existing for this schedule job</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái - Thông tin Schedule Job và Task */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Schedule Job Details
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Building:{' '}
                      {scheduleJob?.buildingDetail?.name || scheduleJob?.building?.name || 'N/A'}
                      {scheduleJob?.buildingDetail?.building && (
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          ({scheduleJob.buildingDetail.building.name})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Schedule: {scheduleJob?.schedule?.schedule_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Run Date: {new Date(scheduleJob?.run_date || '').toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {scheduleJob?.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Task Information
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                      <div className="col-span-2">
                        <span
                          className={`text-sm font-medium px-2 py-0.5 rounded-full text-center inline-block ${existingTask.status === 'Completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}
                        >
                          {existingTask.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-2">
                        {formatDate(existingTask.created_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Last Updated:
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-2">
                        {formatDate(existingTask.updated_at)}
                      </span>
                    </div>
                    <div className="pt-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                        Description:
                      </span>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600">
                        {existingTask.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột phải - Thông tin Assignment */}
              <div>
                {existingTask.taskAssignments && existingTask.taskAssignments.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Assignment Information
                    </h3>
                    <div className="space-y-4">
                      {existingTask.taskAssignments.map((assignment, index) => (
                        <div
                          key={assignment.assignment_id}
                          className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Status:
                              </span>
                              <div className="col-span-2">
                                <span
                                  className={`text-sm font-medium px-2 py-0.5 rounded-full text-center inline-block ${assignment.status === 'Fixed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                    }`}
                                >
                                  {assignment.status}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Assigned To:
                              </span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-2">
                                {staffData?.data?.find(
                                  (staff: Staff) => staff.userId === assignment.employee_id
                                )?.username || 'Unknown Staff'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-500 dark:text-gray-400">
                        No assignment information for this task
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Schedule Job Details
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Building:{' '}
                  {scheduleJob?.buildingDetail?.name || scheduleJob?.building?.name || 'N/A'}
                  {scheduleJob?.buildingDetail?.building && (
                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                      ({scheduleJob.buildingDetail.building.name})
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Schedule: {scheduleJob?.schedule?.schedule_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Run Date: {new Date(scheduleJob?.run_date || '').toLocaleString()}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {scheduleJob?.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="staff"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Assign Leader <span className="text-red-500">*</span>
              </label>
              {staffLoading ? (
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                    Loading staff...
                  </span>
                </div>
              ) : leaderStaff.length > 0 ? (
                <div className="relative">
                  <select
                    id="staff"
                    className="block w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    required
                  >
                    <option value="">-- Select a Leader --</option>
                    {leaderStaff.map((staff: Staff) => (
                      <option key={staff.userId} value={staff.userId}>
                        {staff.username} - {staff.userDetails?.department?.area || 'N/A'}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500 border border-red-200 dark:border-red-800 rounded-md p-3 bg-red-50 dark:bg-red-900/20">
                  No Leader staff members available.
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                className="block w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Enter task description..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting || leaderStaff.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default TaskModal
