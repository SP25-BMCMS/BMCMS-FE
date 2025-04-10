/* eslint-disable @typescript-eslint/no-explicit-any */
import apiInstance from '@/lib/axios';
import {
  TaskListParams,
  TaskListPaginationResponse,
  TaskAssignmentResponse,
  TaskAssignmentDetailResponse,
  InspectionResponse,
} from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CreateTaskRequest {
  description: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  crack_id?: string;
  schedule_job_id: string;
}

export interface Task {
  task_id: string;
  description: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  crack_id?: string;
  schedule_job_id: string;
  created_at: string;
  updated_at: string;
}

const getTasks = async (params: TaskListParams = {}): Promise<TaskListPaginationResponse> => {
  try {
    const { data } = await apiInstance.get<TaskListPaginationResponse>(
      import.meta.env.VITE_VIEW_TASK_LIST,
      { params }
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch tasks');
  }
};

const getTaskAssignmentsByTaskId = async (taskId: string): Promise<TaskAssignmentResponse> => {
  try {
    const endpoint = import.meta.env.VITE_GET_TASK_ASSIGNMENT_BY_TASK_ID.replace(
      '{taskId}',
      taskId
    );
    const { data } = await apiInstance.get<TaskAssignmentResponse>(endpoint);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch task assignments');
  }
};

const getTaskAssignmentDetail = async (
  assignmentId: string
): Promise<TaskAssignmentDetailResponse> => {
  try {
    console.log(
      `Calling API: ${import.meta.env.VITE_GET_TASK_ASSIGNMENT_BY_ID.replace('{id}', assignmentId)}`
    );
    const endpoint = import.meta.env.VITE_GET_TASK_ASSIGNMENT_BY_ID.replace('{id}', assignmentId);
    const { data } = await apiInstance.get<TaskAssignmentDetailResponse>(endpoint);

    // Validate response structure
    if (!data || !data.data) {
      console.error('Invalid response structure from task assignment detail API:', data);
      throw new Error('Invalid response structure from API');
    }

    return data;
  } catch (error: any) {
    console.error('Error in getTaskAssignmentDetail:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch task assignment details');
  }
};

const getInspectionsByAssignmentId = async (assignmentId: string): Promise<InspectionResponse> => {
  try {
    console.log(
      `Calling API: ${import.meta.env.VITE_GET_INSPECTION_ASSIGNMENT_ID.replace('{task_assignment_id}', assignmentId)}`
    );
    const endpoint = import.meta.env.VITE_GET_INSPECTION_ASSIGNMENT_ID.replace(
      '{task_assignment_id}',
      assignmentId
    );
    const { data } = await apiInstance.get<InspectionResponse>(endpoint);

    // Validate response structure
    if (!data) {
      console.error('Invalid response structure from inspections API');
      throw new Error('Invalid response structure from API');
    }

    return data;
  } catch (error: any) {
    console.error('Error in getInspectionsByAssignmentId:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch inspections');
  }
};

const updateTaskStatus = async (taskId: string, status: string): Promise<any> => {
  try {
    console.log(`Updating task status: ${taskId} to ${status}`);
    const endpoint = import.meta.env.VITE_CHANGE_STATUS_TASK.replace('{task_id}', taskId);
    const { data } = await apiInstance.put(endpoint, { status });
    return data;
  } catch (error: any) {
    console.error('Error updating task status:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to update task status');
  }
};

const updateCrackStatus = async (
  crackId: string,
  status: string,
  description: string
): Promise<any> => {
  try {
    console.log(`Updating crack status: ${crackId} to ${status}`);
    const endpoint = import.meta.env.VITE_CHANGE_PATCH_CRACK.replace('{id}', crackId);
    const { data } = await apiInstance.patch(endpoint, {
      status,
      description: description || `The crack has been ${status}.`,
    });
    return data;
  } catch (error: any) {
    console.error('Error updating crack status:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to update crack status');
  }
};

const createTask = async (data: CreateTaskRequest) => {
  try {
    const response = await apiInstance.post('/tasks/task', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create task');
  }
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      const response = await apiInstance.post('/tasks/task', taskData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch tasks query
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Also invalidate schedule jobs since they contain task information
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] });
    },
  });
};

const exportTaskCostPdf = async (taskId: string): Promise<Blob> => {
  try {
    const response = await apiInstance.post(
      '/task-assignments/export-cost-pdf',
      { task_id: taskId },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error exporting task cost PDF:', error);
    throw new Error(error.response?.data?.message || 'Failed to export PDF');
  }
};

const tasksApi = {
  getTasks,
  createTask,
  getTaskAssignmentsByTaskId,
  getTaskAssignmentDetail,
  getInspectionsByAssignmentId,
  updateTaskStatus,
  updateCrackStatus,
  exportTaskCostPdf,
};

export default tasksApi;
