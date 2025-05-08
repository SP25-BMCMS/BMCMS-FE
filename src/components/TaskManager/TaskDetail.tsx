import InspectionDetails from '@/components/TaskManager/InspectionDetails'
import SimpleInspectionModal from '@/components/TaskManager/SimpleInspectionModal'
import { STATUS_COLORS } from '@/constants/colors'
import apiInstance from '@/lib/axios'
import buildingDetailsApi, { BuildingDetail } from '@/services/buildingDetails'
import { getAllStaff } from '@/services/staff'
import tasksApi from '@/services/tasks'
import { StaffData, TaskAssignment, TaskResponse } from '@/types'
import { FORMAT_DATE } from '@/utils/format'
import { FORMAT_DATE_TIME } from '@/utils/helpers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaClipboardList,
  FaExchangeAlt,
  FaFileAlt,
  FaMailBulk,
  FaMapMarkerAlt,
  FaTools,
  FaUser,
} from 'react-icons/fa'
import { IoArrowBack } from 'react-icons/io5'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import crackApi from '@/services/cracks'

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
  crackInfo?: TaskResponse['crackInfo']
}

// Add loading indicator component
interface LoadingIndicatorProps {
  loadingText?: string
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ loadingText }) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-4">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
        {loadingText || t('common.loading')}
      </span>
    </div>
  )
}

// Update StyledSelect interface
interface StyledSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
  icon: React.ComponentType<{ className: string }>
  isLoading: boolean
  label: string
  error?: string
  loadingText?: string
  onSearch?: (value: string) => void
  searchValue?: string
  searchPlaceholder?: string
}

// Update StyledSelect component
const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  isLoading,
  label,
  error,
  loadingText,
  onSearch,
  searchValue,
  searchPlaceholder
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-2" ref={selectRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
        {label}
      </label>
      <div className="relative">
        <div
          className="w-full cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={`block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md dark:bg-gray-700 dark:text-gray-300 transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {value ? options.find(opt => opt.value === value)?.label : placeholder}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input inside dropdown */}
            {onSearch && (
              <div className="sticky top-0 p-2 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="py-1">
              {options.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('common.noResults')}
                </div>
              ) : (
                options.map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2 text-sm cursor-pointer ${value === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange(option.value)
                      // Close dropdown after selection
                      setIsOpen(false)
                      // Clear search when closing
                      if (onSearch) {
                        onSearch('')
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {isLoading && <LoadingIndicator loadingText={loadingText} />}
      {error && !isLoading && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

// Add function to get user data from localStorage
const getUserFromLocalStorage = () => {
  const userStr = localStorage.getItem('bmcms_user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error)
    return null
  }
}

const TaskDetail: React.FC = () => {
  const { t } = useTranslation()
  const { taskId } = useParams<{ taskId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('')
  const [selectedScheduleJobId, setSelectedScheduleJobId] = useState<string>('')
  const [scheduleSearch, setScheduleSearch] = useState<string>('')

  // Add mutation for sending notification
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { taskId: string; schedule_job_id: string }) => {
      const response = await apiInstance.post('/tasks/notification-thanks-to-resident', data)
      return response.data
    },
    onSuccess: async () => {
      try {
        // Invalidate and refetch all related queries
        await Promise.all([
          // Invalidate task detail
          queryClient.invalidateQueries({ queryKey: ['task', 'detail', taskId] }),
          // Invalidate tasks list with all possible filters
          queryClient.invalidateQueries({ queryKey: ['tasks'] }),
          // Invalidate tasks with specific filters
          queryClient.invalidateQueries({
            queryKey: ['tasks', 1, 10, '', 'all', 'crack']
          }),
          queryClient.invalidateQueries({
            queryKey: ['tasks', 1, 10, '', 'all', 'schedule']
          }),
          // Invalidate tasks with status filters
          queryClient.invalidateQueries({
            queryKey: ['tasks', 1, 10, '', 'Assigned', 'crack']
          }),
          queryClient.invalidateQueries({
            queryKey: ['tasks', 1, 10, '', 'Completed', 'crack']
          }),
          queryClient.invalidateQueries({
            queryKey: ['tasks', 1, 10, '', 'In Progress', 'crack']
          })
        ])

        // Prefetch the tasks data before navigation
        await queryClient.prefetchQuery({
          queryKey: ['tasks', 1, 10, '', 'all', 'crack'],
          queryFn: () => tasksApi.getTasksByType({
            page: 1,
            limit: 10,
            taskType: 'crack'
          })
        })

        toast.success(t('taskManagement.detail.notificationSentSuccess'))
        navigate('/tasks')
      } catch (error) {
        console.error('Error updating data:', error)
        toast.error(t('taskManagement.detail.errorUpdatingData'))
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('taskManagement.detail.failedToSendNotification'))
    },
  })

  // Get user data from localStorage
  const user = getUserFromLocalStorage()

  // Get crackInfo from location state
  const crackInfoFromState = location.state?.crackInfo

  // Fetch all staff data to map IDs to names
  const { data: staffData } = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: async () => {
      const response = await getAllStaff({ page: '1', limit: '9999' })
      return response.data || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  // Create a map of staff IDs to names
  const staffNameMap = React.useMemo(() => {
    const map: { [key: string]: { username: string; position?: string; department?: string, positionNameLabel?: string } } = {}
    if (staffData) {
      staffData.forEach((staff: StaffData) => {
        map[staff.userId] = {
          username: staff.username,
          position: staff.userDetails?.position?.positionNameLabel,
          department: staff.userDetails?.department?.departmentName
        }
      })
    }
    return map
  }, [staffData])

  // Fetch task details and assignments
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', 'detail', taskId],
    queryFn: async () => {
      try {
        const response = await tasksApi.getTaskAssignmentsByTaskId(taskId || '')

        // Return response with employee names and crackInfo from state
        if (response.data && response.data.taskAssignments) {
          return {
            ...response,
            data: {
              ...response.data,
              crackInfo: crackInfoFromState,
              taskAssignments: response.data.taskAssignments.map(assignment => ({
                ...assignment,
                employee_name: staffNameMap[assignment.employee_id]?.username || 'Unknown Staff',
              })),
            },
          }
        }

        return response
      } catch (error) {
        console.error('Error fetching task details:', error)
        throw error
      } finally {
        setIsInitialLoading(false)
      }
    },
    enabled: !!taskId && Object.keys(staffNameMap).length > 0,
    staleTime: 0, // Set staleTime to 0 to always refetch on mount
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  })

  // Get crack information
  const { data: crackInfoData } = useQuery({
    queryKey: ['crack', 'detail', taskData?.data?.crack_id],
    queryFn: async () => {
      if (!taskData?.data?.crack_id) return null
      try {
        const response = await crackApi.getCrackDetail(taskData.data.crack_id)
        return response
      } catch (error) {
        console.error('Error fetching crack details:', error)
        console.log("🚀 Kha ne ~ crackInfo:", crackInfo)
        return null
      }
    },
    enabled: !!taskData?.data?.crack_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Update hasCrackInfo check
  const hasCrackInfo = !!crackInfoData
  const crackInfo = crackInfoData
  console.log("🚀 Kha ne ~ crackInfo:", crackInfo)


  // Fetch inspections for selected assignment only when modal is open
  const {
    data: inspections,
    isLoading: isLoadingInspections,
    error: inspectionsError,
  } = useQuery({
    queryKey: ['task', 'inspections', selectedAssignmentId],
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
                username: staffNameMap[inspection.inspected_by]?.username || 'Unknown Staff',
              },
              confirmed_by_user: inspection.confirmed_by
                ? {
                  userId: inspection.confirmed_by,
                  username: staffNameMap[inspection.confirmed_by]?.username || 'Unknown Staff',
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  })

  // Add effect to handle initial loading
  React.useEffect(() => {
    if (taskId && Object.keys(staffNameMap).length > 0) {
      setIsInitialLoading(true)
    }
  }, [taskId, staffNameMap])

  // Update schedules query to include limit 9999
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      try {
        const response = await apiInstance.get('/schedules?limit=9999')
        console.log('Raw Schedules Response:', response.data)
        return response.data.data
      } catch (error) {
        console.error('Error fetching schedules:', error)
        return []
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  // Update building details query to use userId from localStorage
  const { data: buildingDetails } = useQuery<BuildingDetail[]>({
    queryKey: ['buildingDetails', user?.userId],
    queryFn: async () => {
      if (!user?.userId) {
        throw new Error('User ID not found')
      }
      const response = await buildingDetailsApi.getBuildingDetailsForManager(user.userId)
      console.log('Building Details Response:', response)
      if (!response) {
        throw new Error('No building details returned')
      }
      return response
    },
    enabled: !!user?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create a map of buildingDetailId to building information
  const buildingDetailMap = React.useMemo(() => {
    const map = new Map<string, BuildingDetail>()
    if (buildingDetails) {
      console.log('Building Details for mapping:', buildingDetails)
      buildingDetails.forEach(detail => {
        if (detail.buildingDetailId) {
          map.set(detail.buildingDetailId, detail)
        }
      })
    }
    return map
  }, [buildingDetails])

  // Log schedules data for debugging
  React.useEffect(() => {
    if (schedules) {
      console.log('Schedules Data:', schedules)
      const selectedSchedule = schedules.find(s => s.schedule_id === selectedScheduleId)
      if (selectedSchedule) {
        console.log('Selected Schedule Jobs:', selectedSchedule.schedule_job)
      }
    }
  }, [schedules, selectedScheduleId])

  // Show loading only if we don't have any data
  if ((isInitialLoading || isLoading) && !taskData) {
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
          <p>{t('taskManagement.detail.error')}</p>
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
  const displayStaffName = (assignment: TaskAssignment) => {
    const staffInfo = staffNameMap[assignment.employee_id]
    if (!staffInfo) return t('taskManagement.detail.unknownStaff')

    return (
      <div className="flex flex-col">
        <span className="font-medium">{staffInfo.username}</span>
        {staffInfo.position && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{staffInfo.position}</span>
        )}
        {staffInfo.department && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{staffInfo.department}</span>
        )}
      </div>
    )
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
    if (!selectedScheduleId || !selectedScheduleJobId) {
      toast.error(t('taskManagement.detail.scheduleJobRequired'))
      return
    }

    try {
      await sendNotificationMutation.mutateAsync({
        taskId: taskId,
        schedule_job_id: selectedScheduleJobId
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  // Add handler for navigating to schedule job creation
  const handleNavigateToScheduleJob = () => {
    navigate('/maintenance-cycles')
  }

  // Add function to filter schedules
  const getFilteredSchedules = () => {
    if (!schedules) return []
    const searchTerm = scheduleSearch.toLowerCase()
    if (!searchTerm) return schedules

    return schedules.filter(schedule => {
      const cycleInfo = schedule.cycle
        ? `${schedule.cycle.device_type} - ${schedule.cycle.frequency} (${schedule.cycle.basis})`
        : ''
      const scheduleText = `${schedule.schedule_name} ${cycleInfo}`.toLowerCase()
      return scheduleText.includes(searchTerm)
    })
  }

  return (
    <div className="p-6 w-full bg-gray-50 dark:bg-gray-800 min-h-screen">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="mr-4 p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          title={t('taskManagement.detail.backButton')}
        >
          <IoArrowBack className="text-xl" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">{t('taskManagement.detail.title')}</h1>
      </div>

      {/* Task details card */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center mb-2">
              <FaClipboardList className="mr-2 text-blue-500" />
              <h2 className="text-xl font-semibold dark:text-white">{task.description}</h2>
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
            {t(`taskManagement.detail.taskStatus.${task.status.toLowerCase()}`)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {t('taskManagement.detail.created')}: {FORMAT_DATE_TIME(task.created_at)}
            </span>
          </div>
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {t('taskManagement.detail.updated')}: {FORMAT_DATE_TIME(task.updated_at)}
            </span>
          </div>

          {/* Add user information if this is a crack repair task */}
          {crackInfo && (
            <>
              <div className="flex items-center">
                <FaUser className="mr-2 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {t('taskManagement.detail.reportedBy')}: {crackInfo?.data[0].reportedBy?.username || 'Unknown User'}
                </span>
              </div>
              {crackInfo?.data[0] && (
                <div className="flex items-center">
                  <FaCheckCircle className="mr-2 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('taskManagement.detail.verifiedBy')}: {crackInfo?.data[0].verifiedBy?.username || 'Unknown User'}
                  </span>
                </div>
              )}
              {crackInfo?.data[0] && (
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('taskManagement.detail.location')}: {crackInfo?.data[0].position}
                  </span>
                </div>
              )}
              {crackInfo?.data[0].isPrivatesAsset === false && task.status !== 'Completed' && (
                <div className="mt-4">
                  {isLoadingSchedules ? (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{t('taskManagement.detail.loadingSchedules')}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenConfirmModal}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      title={t('taskManagement.detail.sendNotification')}
                    >
                      <FaMailBulk className="w-5 h-5 mr-2" />
                      {t('taskManagement.detail.sendNotification')}
                    </button>
                  )}
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
              {t('taskManagement.detail.assignments.confirmed')} ({assignmentsByStatus.Confirmed.length})
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
                    {t('taskManagement.detail.assignments.assignment')} {formatAssignmentNumber(index)}
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
                {t('taskManagement.detail.assignments.noAssignments')}
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
              {t('taskManagement.detail.assignments.reassigned')} ({assignmentsByStatus.Reassigned.length})
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
                    {t('taskManagement.detail.assignments.assignment')} {formatAssignmentNumber(index)}
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
                {t('taskManagement.detail.assignments.noAssignments')}
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
              {t('taskManagement.detail.assignments.inFixing')} ({assignmentsByStatus.InFixing.length})
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
                    {t('taskManagement.detail.assignments.assignment')} {formatAssignmentNumber(index)}
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
                {t('taskManagement.detail.assignments.noAssignments')}
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
              {t('taskManagement.detail.assignments.fixed')} ({assignmentsByStatus.Fixed.length})
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
                    {t('taskManagement.detail.assignments.assignment')} {formatAssignmentNumber(index)}
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
                {t('taskManagement.detail.assignments.noAssignments')}
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('taskManagement.detail.confirmNotification.title')}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('taskManagement.detail.confirmNotification.message')}
                </p>
                <div className="w-full text-center mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t('taskManagement.detail.createNewScheduleHint')}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigateToScheduleJob()}
                    className="px-4 py-2 text-sm font-medium border border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 transition"
                  >
                    {t('taskManagement.detail.createNewSchedule')}
                  </button>
                </div>
                {/* Schedule Selection */}
                <div className="mt-4">
                  {isLoadingSchedules ? (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{t('taskManagement.detail.loadingSchedules')}</span>
                    </div>
                  ) : (
                    <StyledSelect
                      value={selectedScheduleId}
                      onChange={(value) => {
                        setSelectedScheduleId(value)
                        setSelectedScheduleJobId('')
                      }}
                      options={getFilteredSchedules().map(schedule => {
                        return {
                          value: schedule.schedule_id,
                          label: `${schedule.schedule_name} -  (${FORMAT_DATE(schedule.start_date)})`
                        }
                      })}
                      placeholder={t('taskManagement.detail.selectSchedule')}
                      icon={FaCalendarAlt}
                      isLoading={isLoadingSchedules}
                      label={t('taskManagement.detail.selectScheduleLabel')}
                      error={!selectedScheduleId && !isLoadingSchedules ? t('taskManagement.detail.scheduleRequired') : undefined}
                      loadingText={t('taskManagement.detail.loadingSchedules')}
                      onSearch={setScheduleSearch}
                      searchValue={scheduleSearch}
                      searchPlaceholder={t('taskManagement.detail.searchSchedules')}
                    />
                  )}
                </div>

                {/* Schedule Job Selection */}
                {selectedScheduleId && (
                  <div className="mt-4">
                    <StyledSelect
                      value={selectedScheduleJobId}
                      onChange={(value) => setSelectedScheduleJobId(value)}
                      options={schedules
                        ?.find(s => s.schedule_id === selectedScheduleId)
                        ?.schedule_job
                        ?.filter(job => {
                          // Filter out jobs with unknown building details
                          const mappedBuildingDetail = job.buildingDetailId ? buildingDetailMap.get(job.buildingDetailId) : null
                          const jobBuildingDetail = job.buildingDetail
                          return mappedBuildingDetail || (jobBuildingDetail && jobBuildingDetail.name)
                        })
                        ?.map(job => {
                          let label = ''
                          // Try to get building detail from the map
                          const mappedBuildingDetail = job.buildingDetailId ? buildingDetailMap.get(job.buildingDetailId) : null
                          // Try to get building detail from the job
                          const jobBuildingDetail = job.buildingDetail
                          if (jobBuildingDetail?.name) {
                            label = jobBuildingDetail.name
                          } else if (mappedBuildingDetail) {
                            label = mappedBuildingDetail.name
                          }
                          label += ` - ${FORMAT_DATE(job.run_date)}`
                          return {
                            value: job.schedule_job_id,
                            label
                          }
                        }) || []}
                      placeholder={t('taskManagement.detail.selectScheduleJob')}
                      icon={FaBuilding}
                      isLoading={false}
                      label={t('taskManagement.detail.selectScheduleJobLabel')}
                      error={!selectedScheduleJobId ? t('taskManagement.detail.scheduleJobRequired') : undefined}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-center space-x-3 w-full">
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('taskManagement.detail.confirmNotification.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                disabled={!selectedScheduleId || !selectedScheduleJobId || isLoadingSchedules || sendNotificationMutation.isPending}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none ${selectedScheduleId && selectedScheduleJobId && !isLoadingSchedules && !sendNotificationMutation.isPending
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-400 cursor-not-allowed'
                  }`}
              >
                {sendNotificationMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t('common.sending')}
                  </div>
                ) : isLoadingSchedules ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t('common.loading')}
                  </div>
                ) : (
                  t('taskManagement.detail.confirmNotification.sendAndComplete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetail
