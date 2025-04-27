/* eslint-disable @typescript-eslint/no-explicit-any */
import apiInstance from '@/lib/axios'
import {
  TaskListParams,
  TaskListPaginationResponse,
  TaskAssignmentResponse,
  TaskAssignmentDetailResponse,
  InspectionResponse,
} from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getStaffDetail } from '@/services/staffs'

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

// Add interface for notification request
export interface SendNotificationRequest {
  taskId: string
  scheduleJobId: string
}

const getTasks = async (params: TaskListParams = {}): Promise<TaskListPaginationResponse> => {
  try {
    const { data } = await apiInstance.get<TaskListPaginationResponse>(
      import.meta.env.VITE_VIEW_TASK_LIST,
      { params }
    )
    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch tasks')
  }
}

const getTaskAssignmentsByTaskId = async (taskId: string): Promise<TaskAssignmentResponse> => {
  try {
    const endpoint = import.meta.env.VITE_GET_TASK_ASSIGNMENT_BY_TASK_ID.replace(
      '{taskId}',
      taskId
    )
    const { data } = await apiInstance.get<TaskAssignmentResponse>(endpoint)

    // Fetch staff details for each assignment
    if (data && data.data && data.data.taskAssignments && data.data.taskAssignments.length > 0) {
      try {
        // Get unique employee IDs
        const employeeIds = [
          ...new Set(data.data.taskAssignments.map(assignment => assignment.employee_id)),
        ]
        console.log('Employee IDs to fetch:', employeeIds)

        // Make parallel requests to get all staff details
        const staffDetailsPromises = employeeIds.map(employeeId =>
          getStaffDetail(employeeId)
            .then(response => ({
              employeeId,
              username: response.data.username,
              success: true,
            }))
            .catch(error => {
              console.error(`Error fetching staff details for ${employeeId}:`, error)
              return {
                employeeId,
                username: employeeId.substring(0, 8),
                success: false,
              }
            })
        )

        const staffDetails = await Promise.all(staffDetailsPromises)
        console.log('Staff details results:', staffDetails)

        // Create a map of employee IDs to usernames
        const employeeMap = staffDetails.reduce(
          (acc, detail) => {
            acc[detail.employeeId] = detail.success
              ? detail.username
              : detail.employeeId.substring(0, 8)
            return acc
          },
          {} as Record<string, string>
        )

        // Add employee names to assignments
        data.data.taskAssignments = data.data.taskAssignments.map(assignment => ({
          ...assignment,
          employee_name:
            employeeMap[assignment.employee_id] || assignment.employee_id.substring(0, 8),
        }))

        console.log('Assignments with employee names:', data.data.taskAssignments)
      } catch (error) {
        console.warn('Error adding staff names to assignments:', error)
        // Continue with the original response if staff details can't be fetched
      }
    }

    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch task assignments')
  }
}

const getTaskAssignmentDetail = async (
  assignmentId: string
): Promise<TaskAssignmentDetailResponse> => {
  try {
    console.log(
      `Calling API: ${import.meta.env.VITE_GET_TASK_ASSIGNMENT_BY_ID.replace('{id}', assignmentId)}`
    )
    const endpoint = import.meta.env.VITE_GET_TASK_ASSIGNMENT_BY_ID.replace('{id}', assignmentId)
    const { data } = await apiInstance.get<TaskAssignmentDetailResponse>(endpoint)

    // Validate response structure
    if (!data || !data.data) {
      console.error('Invalid response structure from task assignment detail API:', data)
      throw new Error('Invalid response structure from API')
    }

    return data
  } catch (error: any) {
    console.error('Error in getTaskAssignmentDetail:', error)
    console.error('Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to fetch task assignment details')
  }
}

const getInspectionsByAssignmentId = async (assignmentId: string): Promise<InspectionResponse> => {
  try {
    console.log(
      `Calling API: ${import.meta.env.VITE_GET_INSPECTION_ASSIGNMENT_ID.replace('{task_assignment_id}', assignmentId)}`
    )
    const endpoint = import.meta.env.VITE_GET_INSPECTION_ASSIGNMENT_ID.replace(
      '{task_assignment_id}',
      assignmentId
    )
    const { data } = await apiInstance.get<InspectionResponse>(endpoint)

    // Validate response structure
    if (!data) {
      console.error('Invalid response structure from inspections API')
      throw new Error('Invalid response structure from API')
    }

    return data
  } catch (error: any) {
    console.error('Error in getInspectionsByAssignmentId:', error)
    console.error('Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to fetch inspections')
  }
}

const updateTaskStatus = async (taskId: string, status: string): Promise<any> => {
  try {
    console.log(`Updating task status: ${taskId} to ${status}`)
    const endpoint = import.meta.env.VITE_CHANGE_STATUS_TASK.replace('{task_id}', taskId)
    const { data } = await apiInstance.put(endpoint, { status })
    return data
  } catch (error: any) {
    console.error('Error updating task status:', error)
    console.error('Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to update task status')
  }
}

const updateCrackStatus = async (
  crackId: string,
  status: string,
  description: string
): Promise<any> => {
  try {
    console.log(`Updating crack status: ${crackId} to ${status}`)
    const endpoint = import.meta.env.VITE_CHANGE_PATCH_CRACK.replace('{id}', crackId)
    const { data } = await apiInstance.patch(endpoint, {
      status,
      description: description || `The crack has been ${status}.`,
    })
    return data
  } catch (error: any) {
    console.error('Error updating crack status:', error)
    console.error('Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to update crack status')
  }
}

const createTask = async (data: CreateTaskRequest) => {
  try {
    const response = await apiInstance.post('/tasks/task', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create task')
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
    },
  })
}

const exportTaskCostPdf = async (taskId: string): Promise<Blob> => {
  try {
    const response = await apiInstance.post(
      '/task-assignments/export-cost-pdf',
      { task_id: taskId },
      { responseType: 'blob' }
    )
    return response.data
  } catch (error: any) {
    console.error('Error exporting task cost PDF:', error)
    throw new Error(error.response?.data?.message || 'Failed to export PDF')
  }
}

// Add function to send notification
const sendNotificationToResident = async (data: SendNotificationRequest) => {
  try {
    const response = await apiInstance.post(
      import.meta.env.VITE_SEND_NOTIFICATION_TO_RESIDENT,
      data
    )
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to send notification')
  }
}

// Add mutation hook for sending notification
export const useSendNotificationToResident = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendNotificationToResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

const tasksApi = {
  getTasks,
  createTask,
  getTaskAssignmentsByTaskId,
  getTaskAssignmentDetail,
  getInspectionsByAssignmentId,
  updateTaskStatus,
  updateCrackStatus,
  exportTaskCostPdf,
  sendNotificationToResident,
}

export default tasksApi
