import React, { useState } from 'react'
import Table, { Column } from '@/components/Table'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import FilterDropdown from '@/components/FilterDropdown'
import AddButton from '@/components/AddButton'
import { MdOutlineAddTask } from 'react-icons/md'
import { motion } from 'framer-motion'
import tasksApi from '@/services/tasks'
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

interface TasksCacheData {
  data: TaskResponse[]
  pagination: {
    total: number
    totalPages: number
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
  const navigate = useNavigate()

  const queryClient = useQueryClient()

  // Add new state for loading navigation
  const [isNavigating, setIsNavigating] = useState(false)

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
  const handleNavigateToDetail = (taskId: string) => {
    setIsNavigating(true)
    navigate(`/task-detail/${taskId}`)
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
      width: '40px sm:50px md:60px',
    },
    {
      key: 'title',
      title: t('taskManagement.table.title'),
      render: item => (
        <Tooltip content={item.title || ''} position="bottom">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[120px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[220px] truncate">
            {item.title}
          </div>
        </Tooltip>
      ),
      width: '120px xs:140px sm:180px md:220px',
    },
    {
      key: 'description',
      title: t('taskManagement.table.description'),
      render: item => {
        const shortDescription = item.description?.substring(0, 60) || ''
        const needsTooltip = (item.description?.length || 0) > 60

        return (
          <Tooltip content={item.description || ''} position="bottom">
            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[180px] truncate">
              {shortDescription}
              {needsTooltip ? '...' : ''}
            </div>
          </Tooltip>
        )
      },
      width: '80px xs:120px sm:160px md:180px',
    },
    {
      key: 'building',
      title: t('taskManagement.table.building'),
      render: item => {
        let buildingInfo = null

        if (taskType === 'crack' && item.crackInfo?.isSuccess && item.crackInfo.data.length > 0) {
          const crackData = item.crackInfo.data[0]
          const buildingDetailId = crackData.buildingDetailId
          const position = crackData.position

          buildingInfo = (
            <div className="flex items-center">
              <FaBuilding className="text-blue-500 mr-1 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-medium truncate">{buildingDetailId?.substring(0, 8)}</div>
                <div className="text-xs truncate">{position}</div>
              </div>
            </div>
          )
        } else if (taskType === 'schedule' && item.schedulesjobInfo?.isSuccess) {
          const scheduleData = item.schedulesjobInfo.data
          if (scheduleData.buildingDetail) {
            const buildingDetail = scheduleData.buildingDetail
            const buildingName = buildingDetail.building?.name || ''
            const buildingDetailName = buildingDetail.name || ''

            buildingInfo = (
              <Tooltip content={`${buildingName} - ${buildingDetailName}`} position="bottom">
                <div className="flex items-center">
                  <FaBuilding className="text-green-500 mr-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[120px]">{buildingName}</div>
                    <div className="text-xs truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[120px]">{buildingDetailName}</div>
                  </div>
                </div>
              </Tooltip>
            )
          }
        }

        return buildingInfo || <div className="text-sm text-gray-400">-</div>
      },
      width: '100px xs:120px sm:140px',
    },
    ...(taskType === 'crack'
      ? [
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
              default:
                bgColor = 'rgba(128, 128, 128, 0.35)'
                textColor = '#808080'
                borderColor = '#808080'
            }

            return (
              <span
                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80"
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
                  <div className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[120px] md:max-w-[140px]">
                    {scheduleName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[120px] md:max-w-[140px]">
                    {deviceType} - {runDate}
                  </div>
                </div>
              </Tooltip>
            )
          },
          width: '110px xs:140px sm:160px',
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
                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
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
        },
      ]),
    {
      key: 'created_at',
      title: t('taskManagement.table.createdDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {new Date(item.created_at).toLocaleDateString()}
        </div>
      ),
      width: '90px xs:100px sm:110px',
    },
    {
      key: 'status',
      title: t('taskManagement.table.status'),
      render: item => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 ${item.status === 'Completed'
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
      width: '90px xs:100px',
    },
    {
      key: 'action',
      title: t('taskManagement.table.action'),
      render: item => (
        <div onClick={e => e.stopPropagation()}>
          <DropdownMenu
            onViewDetail={() => handleNavigateToDetail(item.task_id)}
            onChangeStatus={() => handleTaskStatusChange(item)}
            onRemove={() => console.log('Remove', item)}
            showExportPdf={item.status === 'Completed'}
            onExportPdf={() => handleExportPdf(item.task_id)}
          />
        </div>
      ),
      width: '60px xs:70px sm:80px',
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
      <div className="w-full overflow-x-auto rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        {isLoadingTasks || isNavigating ? (
          <LoadingIndicator />
        ) : tasksError ? (
          <ErrorMessage />
        ) : (
          <>
            <div className="min-w-[640px] sm:min-w-[768px] md:min-w-[900px]">
              <Table<TaskResponse>
                data={tasksData?.data || []}
                columns={columns}
                keyExtractor={item => item.task_id}
                onRowClick={item => handleNavigateToDetail(item.task_id)}
                className="w-full"
                tableClassName="w-full"
              />
            </div>

            <div className="w-full px-4 py-3">
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
          </>
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
    </div>
  )
}

export default TaskManagement;

