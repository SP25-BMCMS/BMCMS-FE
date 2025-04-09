import apiInstance from '@/lib/axios';

export interface ScheduleJob {
  schedule_job_id: string;
  schedule_id: string;
  building_id: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  run_date: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  schedule_id: string;
  schedule_name: string;
  schedule_type: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  scheduleJobs: ScheduleJob[];
  schedule_job: ScheduleJob[];
  buildings: Array<{
    buildingId: string;
    name: string;
    description?: string;
    Status: string;
  }>;
}

// Define the interface for API response
export interface PaginationResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const schedulesApi = {
  getSchedules: async () => {
    const response = await apiInstance.get<PaginationResponse<Schedule>>('/schedules', {
      params: {
        limit: 9999,
      },
    });
    return response.data;
  },

  getScheduleById: async (scheduleId: string) => {
    const response = await apiInstance.get<{ statusCode: number; message: string; data: Schedule }>(
      `/schedules/${scheduleId}`
    );
    return response.data;
  },

  createSchedule: async (schedule: Omit<Schedule, 'schedule_id' | 'created_at' | 'updated_at'>) => {
    const response = await apiInstance.post<{
      statusCode: number;
      message: string;
      data: Schedule;
    }>('/schedules', schedule);
    return response.data;
  },

  updateSchedule: async (scheduleId: string, schedule: Partial<Schedule>) => {
    const response = await apiInstance.put<{ statusCode: number; message: string; data: Schedule }>(
      `/schedules/${scheduleId}`,
      schedule
    );
    return response.data;
  },

  deleteSchedule: async (scheduleId: string) => {
    const response = await apiInstance.delete<{ statusCode: number; message: string }>(
      `/schedules/${scheduleId}`
    );
    return response.data;
  },
};

export default schedulesApi;
