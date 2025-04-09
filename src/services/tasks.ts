/* eslint-disable @typescript-eslint/no-explicit-any */
import apiInstance from '@/lib/axios'
import { TaskListParams, TaskListPaginationResponse, TaskAssignmentResponse } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'


export interface CreateTaskRequest {
  description: string
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'
  crack_id?: string
  schedule_job_id: string
}

export interface Task {
  task_id: string
  description: string
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'
  crack_id?: string
  schedule_job_id: string
  created_at: string
  updated_at: string
}

const getTasks = async (params: TaskListParams = {}): Promise<TaskListPaginationResponse> => {
  try {
    const { data } = await apiInstance.get<TaskListPaginationResponse>(
      import.meta.env.VITE_VIEW_TASK_LIST,
      { params }
    )
    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch tasks")
  }
}

const getTaskAssignmentsByTaskId = async (taskId: string): Promise<TaskAssignmentResponse> => {
  try {
    const endpoint = import.meta.env.VITE_GET_TASK_ASSIGNMENT_BY_TASK_ID.replace('{taskId}', taskId)
    const { data } = await apiInstance.get<TaskAssignmentResponse>(endpoint)
    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch task assignments")
  }
}

const createTask = async (data: CreateTaskRequest) => {
  try {
    const response = await apiInstance.post('/tasks/task', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create task")
  }
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      const response = await apiInstance.post('/tasks/task', taskData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch tasks query
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      // Also invalidate schedule jobs since they contain task information
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] })
    }
  })
}

const tasksApi = {
  getTasks,
  createTask,
  getTaskAssignmentsByTaskId
}

export default tasksApi
