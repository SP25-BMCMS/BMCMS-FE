import React, { useState } from 'react'
import Table, { Column } from '@/components/Table'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import FilterDropdown from '@/components/FilterDropdown'
import AddButton from '@/components/AddButton'
import { MdOutlineAddTask } from 'react-icons/md'
import { motion } from 'framer-motion'
import tasksApi from '@/services/tasks'
import { getAllStaff } from '@/services/staff'
import { TaskResponse } from '@/types'
import Pagination from '@/components/Pagination'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { STATUS_COLORS } from '@/constants/colors'
import { useNavigate } from 'react-router-dom'
import ChangeStatusModal from '@/components/TaskManager/ChangeStatusModal'
import { FaTools, FaCalendarAlt, FaBuilding } from 'react-icons/fa'
import Tooltip from '@/components/Tooltip'
import { useTranslation } from 'react-i18next'
import { FORMAT_DATE } from '@/utils/format'
import ViewPdfModal from '@/components/TaskManager/ViewPdfModal'
import ConfirmModal from '@/components/ConfirmModal'

interface TasksCacheData {
  data: TaskResponse[]
  pagination: {
    total: number
    totalPages: number
  }
}

interface CrackReportData {
  crackReportId: string
  buildingDetailId: string
  description: string
  isPrivatesAsset: boolean
  position: string
  status: 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing' | 'Completed' | 'Rejected' | 'InFixing' | 'WaitingConfirm'
  reportedBy: {
    userId: string
    username: string
  }
  verifiedBy?: {
    userId: string
    username: string
  }
  createdAt: string
  updatedAt: string
  crackDetails: {
    crackDetailsId: string
    crackReportId: string
    photoUrl: string
    severity: string
    severityLabel: string
    aiDetectionUrl: string
    createdAt: string
    updatedAt: string
  }[]
  buildingId: string
  buildingName: string
}

interface TaskResponse {
  task_id: string
  title: string
  description: string
  status: string
  statusLabel: string
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
    statusLabel: string
    created_at: string
    updated_at: string
  }[]
  workLogs: {
    worklog_id: string
    task_id: string
    title: string
    description: string
    status: string
    statusLabel: string
    created_at: string
    updated_at: string
  }[]
  feedbacks: {
    feedback_id: string
    task_id: string
    feedback_by: string
    comments: string
    rating: number
    created_at: string
    updated_at: string
    status: string
    statusLabel: string
  }[]
  crackInfo?: {
    isSuccess: boolean
    message: string
    data: CrackReportData[]
  }
  schedulesjobInfo?: {
    isSuccess: boolean
    message: string
    data: {
      buildingDetail?: {
        building?: {
          name: string
        }
        name: string
      }
      schedule?: {
        schedule_name: string
        cycle?: {
          device_type: string
        }
      }
      run_date: string
      status: string
    }
  }
}

const TaskManagement: React.FC = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null)
  const [modalType, setModalType] = useState<'task' | 'crack'>('task')
  const [currentCrackStatus, setCurrentCrackStatus] = useState<string>('')
  const [taskType, setTaskType] = useState<'crack' | 'schedule'>('crack')
  const [isNavigating, setIsNavigating] = useState(false)
  const navigate = useNavigate()
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskAssignmentId, setSelectedTaskAssignmentId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Fetch tasks with React Query
  const { data: tasksData, isLoading: isLoadingTasks, error: tasksError } = useQuery({
    queryKey: ['tasks', currentPage, itemsPerPage, searchTerm, selectedStatus, taskType],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page: currentPage,
        limit: itemsPerPage,
        // search: searchTerm || undefined,
        ...(selectedStatus !== 'all' && { statusFilter: selectedStatus }),
        taskType: taskType
      }
      // @ts-ignore
      const response = await tasksApi.getTasksByType(params)

      // Lọc dữ liệu dựa trên loại task
      if (response.data && Array.isArray(response.data)) {
        const filteredData = response.data.filter(task => {
          if (taskType === 'crack') {
            return !!task.crack_id
          } else {
            return !task.crack_id
          }
        })

        // Cập nhật pagination dựa trên response từ API
        const updatedPagination = {
          ...response.pagination,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          page: currentPage,
          limit: itemsPerPage
        }

        return {
          ...response,
          data: filteredData,
          pagination: updatedPagination
        }
      }

      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      // Here you would call your API to update the task status
      // For now, we'll just simulate a successful update
      return { taskId, newStatus }
    },
    onMutate: async ({ taskId, newStatus }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks'])

      // Optimistically update to the new value
      queryClient.setQueryData(['tasks'], (old: TasksCacheData) => ({
        ...old,
        data: old.data.map((task: TaskResponse) =>
          task.task_id === taskId ? { ...task, status: newStatus } : task
        ),
      }))

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // Revert back to the previous value
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
      toast.error('Failed to update task status!')
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Export PDF mutation
  const exportPdfMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await tasksApi.exportTaskCostPdf(taskId)
    },
    onSuccess: data => {
      // Create a download link for the PDF
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `task-cost-report.pdf`)
      document.body.appendChild(link)
      link.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      toast.success('PDF exported successfully')
    },
    onError: error => {
      console.error('Export PDF error:', error)
      toast.error('Failed to export PDF')
    },
  })

  // Add viewPdf mutation
  const viewPdfMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await tasksApi.exportTaskCostPdf(taskId)
    },
    onSuccess: data => {
      // Create a blob URL and open in new tab
      const url = window.URL.createObjectURL(new Blob([data]))
      window.open(url, '_blank')

      // Clean up
      window.URL.revokeObjectURL(url)
    },
    onError: error => {
      console.error('View PDF error:', error)
      toast.error(t('taskManagement.viewPdfError'))
    },
  })

  // Add prefetch function for task details
  const prefetchTaskDetails = async (taskId: string) => {
    try {
      setIsNavigating(true)
      // Prefetch staff data first
      const staffResponse = await getAllStaff({ page: '1', limit: '9999' })
      await queryClient.prefetchQuery({
        queryKey: ['staff', 'all'],
        queryFn: async () => staffResponse.data || [],
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
      })

      // Then prefetch task details
      const taskResponse = await tasksApi.getTaskAssignmentsByTaskId(taskId)
      await queryClient.prefetchQuery({
        queryKey: ['task', 'detail', taskId],
        queryFn: async () => taskResponse,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        initialData: taskResponse, // Set initial data immediately
      })
    } catch (error) {
      // Don't throw the error, just log it
    } finally {
      setIsNavigating(false)
    }
  }

  const handleFilterChange = (value: string) => {
    setSelectedStatus(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit)
    setCurrentPage(1)
  }

  const handleTaskStatusChange = (task: TaskResponse) => {
    setSelectedTask(task)
    setModalType('task')
    setIsStatusModalOpen(true)
  }

  const handleCrackStatusChange = (task: TaskResponse) => {
    if (!task.crackInfo || !task.crackInfo.isSuccess || !task.crackInfo.data.length) {
      toast.error(t('taskManagement.crackInfoNotAvailable'))
      return
    }

    setSelectedTask(task)
    setModalType('crack')
    setCurrentCrackStatus(task.crackInfo.data[0].status)
    setIsStatusModalOpen(true)
  }

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false)
    setSelectedTask(null)
  }

  const handleExportPdf = (taskId: string) => {
    exportPdfMutation.mutate(taskId)
  }

  // Toggle task type between crack and schedule
  const toggleTaskType = () => {
    setTaskType(prev => (prev === 'crack' ? 'schedule' : 'crack'))
    setCurrentPage(1) // Reset to first page when switching views
    setItemsPerPage(10) // Reset items per page to default
  }

  // Loading animation
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  }

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-48 md:h-56 lg:h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-600 dark:text-gray-300">{t('taskManagement.loading')}</p>
    </div>
  )

  const ErrorMessage = () => (
    <div className="flex flex-col items-center justify-center h-48 md:h-56 lg:h-64 bg-red-50 dark:bg-red-900/10 rounded-lg">
      <div className="text-red-500 dark:text-red-400 mb-2">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-red-600 dark:text-red-400 text-center px-4">
        {tasksError instanceof Error ? tasksError.message : t('taskManagement.error')}
      </p>
      <button
        onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      >
        {t('taskManagement.tryAgain')}
      </button>
    </div>
  )

  const filterOptions = [
    { value: 'all', label: t('taskManagement.filterOptions.all') },
    { value: 'Assigned', label: t('taskManagement.filterOptions.assigned') },
    { value: 'Completed', label: t('taskManagement.filterOptions.completed') },
  ]

  // Update the navigation handler
  const handleNavigateToDetail = async (taskId: string) => {
    try {
      setIsNavigating(true)
      await prefetchTaskDetails(taskId)
    } catch (error) {
      console.log('Error prefetching data:', error)
    } finally {
      // Find the task data to get crackInfo
      const task = tasksData?.data?.find(t => t.task_id === taskId)
      navigate(`/task-detail/${taskId}`, { state: { crackInfo: task?.crackInfo } })
    }
  }

  // Add mouse enter handler for prefetching
  const handleTaskMouseEnter = (taskId: string) => {
    prefetchTaskDetails(taskId).catch(error => {
      console.log('Error prefetching on hover:', error)
    })
  }

  // Update handleViewPdf function
  const handleViewPdf = async (taskId: string) => {
    try {
      console.log('Opening PDF modal for task:', taskId)
      // Get task assignments for this task
      const response = await tasksApi.getTaskAssignmentsByTaskId(taskId)
      console.log('Task assignments response:', response)

      if (response?.data?.taskAssignments) {
        // Find the verified assignment
        const verifiedAssignment = response.data.taskAssignments.find(
          assignment => assignment.status === 'Verified'
        )
        console.log('Found verified assignment:', verifiedAssignment)

        if (verifiedAssignment) {
          setSelectedTaskAssignmentId(verifiedAssignment.assignment_id)
          setIsPdfModalOpen(true)
        } else {
          toast.error(t('taskManagement.noVerifiedAssignments'))
        }
      } else {
        console.log('No task assignments found in response')
        toast.error(t('taskManagement.errorFetchingAssignments'))
      }
    } catch (error) {
      console.error('Error fetching task assignments:', error)
      toast.error(t('taskManagement.errorFetchingAssignments'))
    }
  }

  // Update handleClosePdfModal
  const handleClosePdfModal = () => {
    setIsPdfModalOpen(false)
    setSelectedTaskAssignmentId(null)
  }

  // Add delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await tasksApi.deleteTask(taskId)
    },
    onSuccess: () => {
      toast.success(t('taskManagement.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      console.error('Delete task error:', error)
      toast.error(t('taskManagement.deleteError'))
    },
  })

  // Update handleDeleteTask function
  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId)
    setIsDeleteModalOpen(true)
  }

  // Add handleConfirmDelete function
  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete)
      setIsDeleteModalOpen(false)
      setTaskToDelete(null)
    }
  }

  // Add handleCloseDeleteModal function
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setTaskToDelete(null)
  }

  const columns: Column<TaskResponse>[] = [
    {
      key: 'index',
      title: t('taskManagement.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'title',
      title: t('taskManagement.table.title'),
      render: item => (
        <Tooltip content={item.title || ''}>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px] md:max-w-[220px] lg:max-w-[280px]">
            {item.title}
          </div>
        </Tooltip>
      ),
      width: '220px',
    },
    {
      key: 'description',
      title: t('taskManagement.table.description'),
      render: item => (
        <Tooltip content={item.description || ''}>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[220px] md:max-w-[280px] lg:max-w-[320px]">
            {item.description}
          </div>
        </Tooltip>
      ),
      width: '280px',
    },
    {
      key: 'building',
      title: t('taskManagement.table.building'),
      render: item => {
        let buildingInfo = null

        if (taskType === 'crack' && item.crackInfo?.isSuccess && item.crackInfo.data.length > 0) {
          const crackData = item.crackInfo.data[0]
          const buildingName = crackData.buildingName
          const position = crackData.position

          buildingInfo = (
            <Tooltip content={`${buildingName} - ${position}`}>
              <div className="flex items-center space-x-2">
                <FaBuilding className="text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate max-w-[120px] md:max-w-[160px]">{buildingName}</div>
                  <div className="text-xs truncate max-w-[120px] md:max-w-[160px]">{position}</div>
                </div>
              </div>
            </Tooltip>
          )
        } else if (taskType === 'schedule' && item.schedulesjobInfo?.isSuccess) {
          const scheduleData = item.schedulesjobInfo.data
          if (scheduleData.buildingDetail) {
            const buildingDetail = scheduleData.buildingDetail
            const buildingName = buildingDetail.building?.name || ''
            const buildingDetailName = buildingDetail.name || ''

            buildingInfo = (
              <Tooltip content={`${buildingName} - ${buildingDetailName}`}>
                <div className="flex items-center space-x-2">
                  <FaBuilding className="text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate max-w-[120px] md:max-w-[160px]">{buildingName}</div>
                    <div className="text-xs truncate max-w-[120px] md:max-w-[160px]">{buildingDetailName}</div>
                  </div>
                </div>
              </Tooltip>
            )
          }
        }

        return buildingInfo || <div className="text-sm text-gray-400">-</div>
      },
      width: '160px',
    },
    ...(taskType === 'crack'
      ? [
        {
          key: 'asset_type',
          title: t('taskManagement.table.assetType'),
          render: item => {
            if (item.crackInfo?.isSuccess && item.crackInfo.data.length > 0) {
              const isPrivateAsset = item.crackInfo.data[0].isPrivatesAsset
              return (
                <div className="flex items-center">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${isPrivateAsset
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}
                  >
                    {isPrivateAsset ? t('crackManagement.privateAsset') : t('crackManagement.publicAsset')}
                  </span>
                </div>
              )
            }
            return <div className="text-sm text-gray-400">-</div>
          },
          width: '140px',
        },
        {
          key: 'crack_status',
          title: t('taskManagement.table.crackStatus'),
          render: item => {
            if (!item.crackInfo || !item.crackInfo.isSuccess || !item.crackInfo.data.length) {
              return <div className="text-sm text-gray-500 dark:text-gray-400">-</div>
            }

            const crackStatus = item.crackInfo.data[0].status
            let bgColor = ''
            let textColor = ''
            let borderColor = ''

            switch (crackStatus) {
              case 'Reviewing':
                bgColor = STATUS_COLORS.REVIEWING.BG
                textColor = STATUS_COLORS.REVIEWING.TEXT
                borderColor = STATUS_COLORS.REVIEWING.BORDER
                break
              case 'Pending':
                bgColor = STATUS_COLORS.PENDING.BG
                textColor = STATUS_COLORS.PENDING.TEXT
                borderColor = STATUS_COLORS.PENDING.BORDER
                break
              case 'InProgress':
                bgColor = STATUS_COLORS.IN_PROGRESS.BG
                textColor = STATUS_COLORS.IN_PROGRESS.TEXT
                borderColor = STATUS_COLORS.IN_PROGRESS.BORDER
                break
              case 'Completed':
                bgColor = STATUS_COLORS.RESOLVED.BG
                textColor = STATUS_COLORS.RESOLVED.TEXT
                borderColor = STATUS_COLORS.RESOLVED.BORDER
                break
              case 'WaitingConfirm':
                bgColor = STATUS_COLORS.WAITING_CONFIRM.BG
                textColor = STATUS_COLORS.WAITING_CONFIRM.TEXT
                borderColor = STATUS_COLORS.WAITING_CONFIRM.BORDER
                break
              case 'InFixing':
                bgColor = STATUS_COLORS.IN_FIXING.BG
                textColor = STATUS_COLORS.IN_FIXING.TEXT
                borderColor = STATUS_COLORS.IN_FIXING.BORDER
                break
              default:
                bgColor = 'rgba(128, 128, 128, 0.35)'
                textColor = '#808080'
                borderColor = '#808080'
            }

            return (
              <span
                className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor: borderColor,
                  border: '1px solid',
                }}
                onClick={() => item.crack_id && handleCrackStatusChange(item)}
              >
                {t(`taskManagement.crackStatus.${crackStatus.toLowerCase()}`)}
              </span>
            )
          },
          width: '160px',
        },
      ]
      : [
        {
          key: 'schedule_info',
          title: t('taskManagement.table.scheduleInfo'),
          render: item => {
            if (!item.schedulesjobInfo?.isSuccess) {
              return <div className="text-sm text-gray-500 dark:text-gray-400">-</div>
            }

            const scheduleData = item.schedulesjobInfo.data
            const scheduleName = scheduleData.schedule?.schedule_name || ''
            const deviceType = scheduleData.schedule?.cycle?.device_type || ''
            const runDate = scheduleData.run_date
              ? new Date(scheduleData.run_date).toLocaleDateString()
              : 'N/A'

            return (
              <Tooltip content={`${scheduleName} - ${deviceType} - ${runDate}`} position="bottom">
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px] xs:max-w-[120px] sm:max-w-[140px] md:max-w-[160px]">
                    {scheduleName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] xs:max-w-[120px] sm:max-w-[140px] md:max-w-[160px]">
                    {deviceType} - {runDate}
                  </div>
                </div>
              </Tooltip>
            )
          },
          width: '180px',
        },
        {
          key: 'schedule_status',
          title: t('taskManagement.table.scheduleStatus'),
          render: item => {
            if (!item.schedulesjobInfo?.isSuccess) {
              return <div className="text-sm text-gray-500 dark:text-gray-400">-</div>
            }

            const scheduleStatus = item.schedulesjobInfo.data?.status || ''
            let bgColor = ''
            let textColor = ''
            let borderColor = ''

            switch (scheduleStatus) {
              case 'Pending':
                bgColor = STATUS_COLORS.PENDING.BG
                textColor = STATUS_COLORS.PENDING.TEXT
                borderColor = STATUS_COLORS.PENDING.BORDER
                break
              case 'InProgress':
                bgColor = STATUS_COLORS.IN_PROGRESS.BG
                textColor = STATUS_COLORS.IN_PROGRESS.TEXT
                borderColor = STATUS_COLORS.IN_PROGRESS.BORDER
                break
              case 'Completed':
                bgColor = STATUS_COLORS.RESOLVED.BG
                textColor = STATUS_COLORS.RESOLVED.TEXT
                borderColor = STATUS_COLORS.RESOLVED.BORDER
                break
              case 'Cancel':
                bgColor = 'rgba(128, 128, 128, 0.35)'
                textColor = '#808080'
                borderColor = '#808080'
                break
              default:
                bgColor = 'rgba(128, 128, 128, 0.35)'
                textColor = '#808080'
                borderColor = '#808080'
            }

            return (
              <span
                className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor: borderColor,
                  border: '1px solid',
                }}
              >
                {t(`taskManagement.scheduleStatus.${scheduleStatus.toLowerCase()}`)}
              </span>
            )
          },
          width: '140px',
        },
      ]),
    {
      key: 'created_at',
      title: t('taskManagement.table.createdDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {FORMAT_DATE(item.created_at)}
        </div>
      ),
      width: '120px',
    },
    {
      key: 'status',
      title: t('taskManagement.table.status'),
      render: item => (
        <span
          className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${item.status === 'Completed'
            ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
            : item.status === 'In Progress'
              ? 'bg-[rgba(255,193,7,0.3)] text-[#ffc107] border border-[#ffc107]'
              : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
            }`}
          onClick={() => handleTaskStatusChange(item)}
        >
          {t(`taskManagement.status.${item.status.toLowerCase()}`)}
        </span>
      ),
      width: '120px',
    },
    {
      key: 'action',
      title: t('taskManagement.table.action'),
      render: item => (
        <div onClick={e => e.stopPropagation()}>
          <DropdownMenu
            onViewDetail={() => handleNavigateToDetail(item.task_id)}
            onChangeStatus={() => handleTaskStatusChange(item)}
            onRemove={item.status !== 'Completed' ? () => handleDeleteTask(item.task_id) : undefined}
            showExportPdf={item.status === 'Completed'}
            onExportPdf={() => handleExportPdf(item.task_id)}
            showViewPdf={item.status === 'Completed'}
            onViewPdf={() => handleViewPdf(item.task_id)}
          />
        </div>
      ),
      width: '80px',
    },
  ]

  const getCustomCrackMenu = (item: TaskResponse) => {
    if (item.crack_id && item.crackInfo?.isSuccess && item.crackInfo.data.length) {
      return [
        {
          label: t('taskManagement.changeCrackStatus'),
          onClick: () => handleCrackStatusChange(item),
        },
      ]
    }
    return []
  }

  return (
    <div className="w-full mt-5 md:mt-6 lg:mt-[30px] xl:mt-[60px] px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-4 gap-2 sm:gap-3 md:gap-4">
        <SearchInput
          placeholder={t('taskManagement.searchPlaceholder')}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full md:w-[16rem] lg:w-[20rem] max-w-full"
        />

        <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end mt-2 md:mt-0">
          {/* Task Type Toggle Button */}
          <button
            onClick={toggleTaskType}
            className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base rounded-lg transition-colors ${taskType === 'crack' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
              }`}
          >
            {taskType === 'crack' ? (
              <>
                <FaTools className="mr-1 md:mr-2" />
                <span className="hidden xs:inline">{t('taskManagement.crackRepair')}</span>
                <span className="xs:hidden">{t('taskManagement.crackRepair')}</span>
              </>
            ) : (
              <>
                <FaCalendarAlt className="mr-1 md:mr-2" />
                <span className="hidden xs:inline">{t('taskManagement.scheduledMaintenance')}</span>
                <span className="xs:hidden">{t('taskManagement.scheduledMaintenance')}</span>
              </>
            )}
          </button>

          <FilterDropdown
            options={filterOptions}
            onSelect={handleFilterChange}
            selectedValue={selectedStatus}
          />
        </div>
      </div>

      {/* Title Section */}
      <div className="mb-3 md:mb-4">
        <h1 className="text-base sm:text-lg md:text-xl font-bold">
          {taskType === 'crack' ? t('taskManagement.crackRepairTasks') : t('taskManagement.scheduledMaintenanceTasks')}
        </h1>
        <p className="text-xs md:text-sm text-gray-500">
          {taskType === 'crack'
            ? t('taskManagement.displayingCrackTasks')
            : t('taskManagement.displayingMaintenanceTasks')}
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full overflow-hidden rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        {isLoadingTasks || isNavigating ? (
          <LoadingIndicator />
        ) : tasksError ? (
          <ErrorMessage />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1024px] h-[calc(100vh-400px)] overflow-y-auto">
              <Table<TaskResponse>
                data={tasksData?.data || []}
                columns={columns}
                keyExtractor={item => item.task_id}
                onRowClick={item => handleNavigateToDetail(item.task_id)}
                onRowMouseEnter={item => handleTaskMouseEnter(item.task_id)}
                className="w-full"
                tableClassName="w-full table-fixed"
              />
            </div>

            <div className="w-full px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                currentPage={currentPage}
                totalPages={tasksData?.pagination?.totalPages || 1}
                onPageChange={handlePageChange}
                totalItems={tasksData?.pagination?.total || 0}
                itemsPerPage={itemsPerPage}
                onLimitChange={handleLimitChange}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Change Status Modal */}
      {selectedTask && (
        <ChangeStatusModal
          isOpen={isStatusModalOpen}
          onClose={handleCloseStatusModal}
          taskId={selectedTask.task_id}
          crackId={selectedTask.crack_id}
          currentTaskStatus={selectedTask.status}
          currentCrackStatus={
            selectedTask.crackInfo?.isSuccess && selectedTask.crackInfo.data.length > 0
              ? selectedTask.crackInfo.data[0].status
              : undefined
          }
        />
      )}

      {/* PDF Modal */}
      {selectedTaskAssignmentId && (
        <ViewPdfModal
          isOpen={isPdfModalOpen}
          onClose={handleClosePdfModal}
          taskAssignmentId={selectedTaskAssignmentId}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title={t('taskManagement.deleteConfirmTitle')}
        message={t('taskManagement.deleteConfirmMessage')}
        confirmText={t('taskManagement.delete')}
        cancelText={t('taskManagement.cancel')}
      />

      <style>
        {`
          /* Table scrollbar styles */
          .min-w-\\[1024px\\]::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          .min-w-\\[1024px\\]::-webkit-scrollbar-track {
            background: transparent;
          }

          .min-w-\\[1024px\\]::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }

          .dark .min-w-\\[1024px\\]::-webkit-scrollbar-thumb {
            background-color: rgba(75, 85, 99, 0.5);
          }

          /* Ensure table header stays fixed */
          thead {
            position: sticky;
            top: 0;
            z-index: 10;
            background: white;
          }

          .dark thead {
            background: #1f2937;
          }
        `}
      </style>
    </div>
  )
}

export default TaskManagement;

