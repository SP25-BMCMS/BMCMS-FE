import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import tasksApi from '@/services/tasks'
import { getAllStaff } from '@/services/staff'
import { motion } from 'framer-motion'
import { FORMAT_DATE_TIME } from '@/utils/helpers'
import { STATUS_COLORS } from '@/constants/colors'
import { IoArrowBack } from 'react-icons/io5'
import {
  FaUser,
  FaCalendarAlt,
  FaClipboardList,
  FaCheckCircle,
  FaExchangeAlt,
  FaTools,
  FaCheck,
  FaFileAlt,
  FaMapMarkerAlt,
  FaMailBulk,
} from 'react-icons/fa'
import SimpleInspectionModal from '@/components/TaskManager/SimpleInspectionModal'
import InspectionDetails from '@/components/TaskManager/InspectionDetails'
import { StaffData, TaskAssignment, TaskResponse } from '@/types'
import { toast } from 'react-hot-toast'
import apiInstance from '@/lib/axios'

// Extended task data interface that includes both task assignment and crack info
interface ExtendedTaskData {
  task_id: string
  description: string
  status: string
  created_at: string
  updated_at: string
  crack_id?: string
  schedule_job_id?: string
  taskAssignments: TaskAssignment[]
  // Include crackInfo from TaskResponse type
  crackInfo?: TaskResponse['crackInfo']
}

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Fetch all staff data to map IDs to names
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await getAllStaff()
      return response.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Create a map of staff IDs to names
  const staffNameMap = React.useMemo(() => {
    const map: { [key: string]: string } = {}
    if (staffData) {
      staffData.forEach((staff: StaffData) => {
        map[staff.userId] = staff.username
      })
    }
    return map
  }, [staffData])

  // Fetch task details and assignments
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['taskAssignments', taskId],
    queryFn: async () => {
      const response = await tasksApi.getTaskAssignmentsByTaskId(taskId || '')

      // Also fetch the task details to get crack info if needed
      if (response.data?.crack_id) {
        try {
          // Fetch task with crack info from the tasks API
          const taskResponse = await tasksApi.getTasks({ search: response.data.task_id })
          if (taskResponse.data && taskResponse.data.length > 0) {
            const taskWithCrackInfo = taskResponse.data.find(
              t => t.task_id === response.data.task_id
            )
            if (taskWithCrackInfo) {
              // Merge the crack info with the task assignments data
              return {
                ...response,
                data: {
                  ...response.data,
                  crackInfo: taskWithCrackInfo.crackInfo,
                  taskAssignments: response.data.taskAssignments.map(assignment => ({
                    ...assignment,
                    employee_name: staffNameMap[assignment.employee_id] || 'Unknown Staff',
                  })),
                },
              }
            }
          }
        } catch (error) {
          console.error('Error fetching task with crack info:', error)
        }
      }

      // If no crack info or error, return the original response with employee names
      if (response.data && response.data.taskAssignments) {
        return {
          ...response,
          data: {
            ...response.data,
            taskAssignments: response.data.taskAssignments.map(assignment => ({
              ...assignment,
              employee_name: staffNameMap[assignment.employee_id] || 'Unknown Staff',
            })),
          },
        }
      }

      return response
    },
    enabled: !!taskId && Object.keys(staffNameMap).length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  console.log("🚀 Kha ne ~ taskData:", taskData)

  // Fetch inspections for selected assignment only when modal is open
  const {
    data: inspections,
    isLoading: isLoadingInspections,
    error: inspectionsError,
  } = useQuery({
    queryKey: ['inspections', selectedAssignmentId],
    queryFn: async () => {
      try {
        const response = await tasksApi.getInspectionsByAssignmentId(selectedAssignmentId || '')

        // Enhance inspection data with staff names
        if (response.data && response.data.length > 0) {
          return {
            ...response,
            data: response.data.map(inspection => ({
              ...inspection,
              inspected_by_user: {
                userId: inspection.inspected_by,
                username: staffNameMap[inspection.inspected_by] || 'Unknown Staff',
              },
              confirmed_by_user: inspection.confirmed_by
                ? {
                  userId: inspection.confirmed_by,
                  username: staffNameMap[inspection.confirmed_by] || 'Unknown Staff',
                }
                : null,
            })),
          }
        }

        return response
      } catch (error) {
        console.error('Error fetching inspections:', error)
        throw error
      }
    },
    enabled: !!selectedAssignmentId && Object.keys(staffNameMap).length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  // Get crack information
  const hasCrackInfo =
    taskData?.data?.crack_id &&
    (taskData?.data as ExtendedTaskData)?.crackInfo?.isSuccess &&
    (taskData?.data as ExtendedTaskData)?.crackInfo?.data?.length > 0

  const crackInfo = hasCrackInfo ? (taskData?.data as ExtendedTaskData)?.crackInfo?.data[0] : null

  // Add mutation for sending notification
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { taskId: string; scheduleJobId: string }) => {
      const response = await apiInstance.post('/tasks/notification-thanks-to-resident', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Notification sent successfully')
      navigate('/tasks')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send notification')
    },
  })

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!taskData || !taskId) {
    return (
      <div className="p-6 w-full">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Unable to load job information. Please try again later.</p>
        </div>
      </div>
    )
  }

  const task = taskData.data as ExtendedTaskData

  // Group assignments by status
  const assignmentsByStatus = {
    Confirmed: task.taskAssignments.filter(a => a.status === 'Confirmed'),
    Reassigned: task.taskAssignments.filter(a => a.status === 'Reassigned'),
    InFixing: task.taskAssignments.filter(a => a.status === 'InFixing'),
    Fixed: task.taskAssignments.filter(a => a.status === 'Fixed'),
  }

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <FaCheckCircle className="text-[#360AFE]" />
      case 'Reassigned':
        return <FaExchangeAlt className="text-[#5856D6]" />
      case 'InFixing':
        return <FaTools className="text-[#FFA500]" />
      case 'Fixed':
        return <FaCheck className="text-[#50F186]" />
      default:
        return null
    }
  }

  // Find the selected assignment from task data
  const findSelectedAssignment = () => {
    if (!selectedAssignmentId || !task.taskAssignments) return null
    return task.taskAssignments.find(a => a.assignment_id === selectedAssignmentId) || null
  }

  const handleAssignmentClick = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId)
  }

  const handleCloseModal = () => {
    setSelectedAssignmentId(null)
  }

  const selectedAssignment = findSelectedAssignment()

  // Helper function to display staff name
  const displayStaffName = assignment => {
    return assignment.employee_name || 'Staff Member'
  }

  // Format assignment identifier
  const formatAssignmentNumber = (index: number) => {
    return `#${index + 1}`
  }

  // Add handler for opening confirmation modal
  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true)
  }

  // Add handler for closing confirmation modal
  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false)
  }

  // Update handler for confirming and sending notification
  const handleConfirmAndSend = async () => {
    if (!taskId) return
    try {
      await sendNotificationMutation.mutateAsync({
        taskId: taskId,
        scheduleJobId: ""
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  return (
    <div className="p-6 w-full bg-gray-50 dark:bg-gray-800 min-h-screen">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="mr-4 p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition"
        >
          <IoArrowBack className="text-xl" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">Task Assignment</h1>
      </div>

      {/* Task details card */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center mb-2">
              <FaClipboardList className="mr-2 text-blue-500" />
              <h2 className="text-xl font-semibold dark:text-white">{task.description}</h2>
            </div>
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
              <FaFileAlt className="mr-1" />
              <span>Task Reference: {task.task_id.substring(0, 8)}</span>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor:
                task.status === 'Completed'
                  ? STATUS_COLORS.RESOLVED.BG
                  : task.status === 'In Progress'
                    ? STATUS_COLORS.IN_PROGRESS.BG
                    : task.status === 'Assigned'
                      ? STATUS_COLORS.INACTIVE.BG
                      : STATUS_COLORS.REVIEWING.BG,
              color:
                task.status === 'Completed'
                  ? STATUS_COLORS.RESOLVED.TEXT
                  : task.status === 'In Progress'
                    ? STATUS_COLORS.IN_PROGRESS.TEXT
                    : task.status === 'Assigned'
                      ? STATUS_COLORS.INACTIVE.TEXT
                      : STATUS_COLORS.REVIEWING.TEXT,
              border: '1px solid',
              borderColor:
                task.status === 'Completed'
                  ? STATUS_COLORS.RESOLVED.BORDER
                  : task.status === 'In Progress'
                    ? STATUS_COLORS.IN_PROGRESS.BORDER
                    : task.status === 'Assigned'
                      ? STATUS_COLORS.INACTIVE.BORDER
                      : STATUS_COLORS.REVIEWING.BORDER,
            }}
          >
            {task.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Created: {FORMAT_DATE_TIME(task.created_at)}
            </span>
          </div>
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Updated: {FORMAT_DATE_TIME(task.updated_at)}
            </span>
          </div>

          {/* Add user information if this is a crack repair task */}
          {crackInfo && (
            <>
              <div className="flex items-center">
                <FaUser className="mr-2 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Reported by: {crackInfo.reportedBy?.username || 'Unknown User'}
                </span>
              </div>
              {crackInfo.verifiedBy && (
                <div className="flex items-center">
                  <FaCheckCircle className="mr-2 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Verified by: {crackInfo.verifiedBy?.username || 'Unknown User'}
                  </span>
                </div>
              )}
              {crackInfo.position && (
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Location: {crackInfo.position}
                  </span>
                </div>
              )}
              {crackInfo.isPrivatesAsset === false && task.status !== 'Completed' && (
                <div className="mt-4">
                  <button
                    onClick={handleOpenConfirmModal}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="Send Maintenance Notification to Residents"
                  >
                    <FaMailBulk className="w-5 h-5 mr-2" />
                    Send Maintenance Notification to Residents
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Task assignments section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Confirmed Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.IN_PROGRESS.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">
              Confirmed ({assignmentsByStatus.Confirmed.length})
            </h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.Confirmed.map((assignment, index) => (
              <div
                key={assignment.assignment_id}
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition cursor-pointer"
                style={{ borderLeftColor: STATUS_COLORS.IN_PROGRESS.TEXT }}
                onClick={() => handleAssignmentClick(assignment.assignment_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">
                    Assignment {formatAssignmentNumber(index)}
                  </h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {assignment.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>{displayStaffName(assignment)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.Confirmed.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No assignments in this status
              </div>
            )}
          </div>
        </div>

        {/* Reassigned Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.REVIEWING.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">
              Reassigned ({assignmentsByStatus.Reassigned.length})
            </h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.Reassigned.map((assignment, index) => (
              <div
                key={assignment.assignment_id}
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition cursor-pointer"
                style={{ borderLeftColor: STATUS_COLORS.REVIEWING.TEXT }}
                onClick={() => handleAssignmentClick(assignment.assignment_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">
                    Assignment {formatAssignmentNumber(index)}
                  </h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {assignment.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>{displayStaffName(assignment)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.Reassigned.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No assignments in this status
              </div>
            )}
          </div>
        </div>

        {/* InFixing Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.PENDING.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">
              In Fixing ({assignmentsByStatus.InFixing.length})
            </h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.InFixing.map((assignment, index) => (
              <div
                key={assignment.assignment_id}
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition cursor-pointer"
                style={{ borderLeftColor: STATUS_COLORS.PENDING.TEXT }}
                onClick={() => handleAssignmentClick(assignment.assignment_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">
                    Assignment {formatAssignmentNumber(index)}
                  </h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {assignment.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>{displayStaffName(assignment)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.InFixing.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No assignments in this status
              </div>
            )}
          </div>
        </div>

        {/* Fixed Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.RESOLVED.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">
              Fixed ({assignmentsByStatus.Fixed.length})
            </h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.Fixed.map((assignment, index) => (
              <div
                key={assignment.assignment_id}
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition cursor-pointer"
                style={{ borderLeftColor: STATUS_COLORS.RESOLVED.TEXT }}
                onClick={() => handleAssignmentClick(assignment.assignment_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">
                    Assignment {formatAssignmentNumber(index)}
                  </h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {assignment.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>{displayStaffName(assignment)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.Fixed.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No assignments in this status
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspection Details Section */}
      {task.taskAssignments && task.taskAssignments.length > 0 && (
        <InspectionDetails taskAssignments={task.taskAssignments} />
      )}

      {/* Simple Inspection Modal */}
      {selectedAssignmentId && selectedAssignment && (
        <SimpleInspectionModal
          isOpen={!!selectedAssignmentId}
          onClose={handleCloseModal}
          assignment={selectedAssignment}
          inspections={inspections}
          isLoading={isLoadingInspections}
          error={inspectionsError ? String(inspectionsError) : undefined}
        />
      )}

      {/* Add confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <div className="text-center mb-5">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <FaMailBulk className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Confirm Notification</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to send maintenance notification to residents and mark this task as completed?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-center space-x-3">
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none"
              >
                Send & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetail
