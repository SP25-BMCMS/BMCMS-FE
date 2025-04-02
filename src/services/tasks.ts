import apiInstance from '@/lib/axios';
import { TaskListParams, TaskListPaginationResponse } from '@/types';


const getTasks = async (params: TaskListParams = {}): Promise<TaskListPaginationResponse> => {
  try {
    const { data } = await apiInstance.get<TaskListPaginationResponse>(
      import.meta.env.VITE_VIEW_TASK_LIST,
      { params }
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch tasks");
  }
};

const tasksApi = {
  getTasks
};

export default tasksApi;
