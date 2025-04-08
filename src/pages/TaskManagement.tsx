import React, { useState } from 'react'
import Table, { Column } from '@/components/Table'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import FilterDropdown from '@/components/FilterDropdown'
import AddButton from '@/components/AddButton'
import { MdOutlineAddTask } from "react-icons/md"
import { motion } from "framer-motion"
import tasksApi from '@/services/tasks'
import { TaskResponse } from '@/types'
import Pagination from '@/components/Pagination'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface TasksCacheData {
  data: TaskResponse[]
  pagination: {
    total: number
    totalPages: number
  }
}

const TaskManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const queryClient = useQueryClient()

  // Fetch tasks with React Query
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', currentPage, itemsPerPage, searchTerm, selectedStatus],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      }
      const response = await tasksApi.getTasks(params)
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false
  })

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string, newStatus: string }) => {
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
          task.task_id === taskId
            ? { ...task, status: newStatus }
            : task
        )
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

  const handleStatusChange = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Assigned' ? 'In Progress' :
      currentStatus === 'In Progress' ? 'Completed' : 'Assigned'

    updateTaskStatusMutation.mutate({ taskId, newStatus })
  }

  // Loading animation
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">Loading tasks data...</p>
    </div>
  )

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
  ]

  const columns: Column<TaskResponse>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => <div className="text-sm text-gray-500 dark:text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</div>,
      width: '60px'
    },
    {
      key: 'task_id',
      title: 'Task ID',
      render: (item) => <div className="text-sm text-gray-500 dark:text-gray-400">{item.task_id.substring(0, 8)}</div>
    },
    {
      key: 'description',
      title: 'Description',
      render: (item) => <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</div>
    },
    {
      key: 'crack_id',
      title: 'Crack ID',
      render: (item) => <div className="text-sm text-gray-500 dark:text-gray-400">{item.crack_id.substring(0, 8)}</div>
    },
    {
      key: 'created_at',
      title: 'Created Date',
      render: (item) => <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleDateString()}</div>
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Completed'
          ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
          : item.status === 'In Progress'
            ? 'bg-[rgba(255,193,7,0.3)] text-[#ffc107] border border-[#ffc107]'
            : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
          }`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'action',
      title: 'Action',
      render: (item) => (
        <DropdownMenu
          onViewDetail={() => console.log('View detail clicked', item)}
          onChangeStatus={() => handleStatusChange(item.task_id, item.status)}
          onRemove={() => console.log("Remove", item)}
        />
      ),
      width: '80px',
    }
  ]

  return (
    <div className="w-full mt-[60px]">
      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput
          placeholder="Search by ID"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="w-[20rem] max-w-xs"
        />

        <FilterDropdown
          options={filterOptions}
          onSelect={handleFilterChange}
          selectedValue={selectedStatus}
        />

        <AddButton
          label="Add Task"
          icon={<MdOutlineAddTask />}
          className='w-[154px]'
          onClick={() => console.log('Add Task clicked')}
        />
      </div>

      {isLoadingTasks ? (
        <LoadingIndicator />
      ) : (
        <>
          <Table<TaskResponse>
            data={tasksData?.data || []}
            columns={columns}
            keyExtractor={(item) => item.task_id}
            onRowClick={(item) => console.log('Row clicked:', item)}
            className="w-[95%] mx-auto"
            tableClassName="w-full"
          />

          <Pagination
            currentPage={currentPage}
            totalPages={tasksData?.pagination.totalPages || 1}
            onPageChange={handlePageChange}
            totalItems={tasksData?.pagination.total || 0}
            itemsPerPage={itemsPerPage}
            onLimitChange={handleLimitChange}
            className="w-[95%] mx-auto mt-4"
          />
        </>
      )}
    </div>
  )
}

export default TaskManagement