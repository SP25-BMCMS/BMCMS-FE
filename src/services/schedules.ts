import apiInstance from '@/lib/axios';

export interface ScheduleJob {
  schedule_job_id: string;
  schedule_id: string;
  building_id: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancel';
  run_date: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  buildingDetailId: string;
  inspection_id: string | null;
}

export interface Schedule {
  schedule_id: string;
  schedule_name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  schedule_status: 'Pending' | 'InProgress' | 'Completed' | 'Cancel';
  cycle_id?: string;
  schedule_type?: string;
  scheduleJobs: ScheduleJob[];
  schedule_job: ScheduleJob[];
  buildings?: Array<{
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
  getSchedules: async (page: number = 1, limit: number = 10) => {
    const response = await apiInstance.get<PaginationResponse<Schedule>>(
      import.meta.env.VITE_GET_SCHEDULE_LIST,
      {
        params: {
          page,
          limit,
        },
      }
    );
    return response.data;
  },

  getScheduleById: async (scheduleId: string) => {
    const url = import.meta.env.VITE_GET_DETAIL_SCHEDULE.replace('{schedule_id}', scheduleId);
    const response = await apiInstance.get<{ statusCode: number; message: string; data: Schedule }>(
      url
    );
    return response.data;
  },

  createSchedule: async (schedule: Omit<Schedule, 'schedule_id' | 'created_at' | 'updated_at'>) => {
    const response = await apiInstance.post<{
      statusCode: number;
      message: string;
      data: Schedule;
    }>(import.meta.env.VITE_GET_SCHEDULE_LIST, schedule);
    return response.data;
  },

  updateSchedule: async (scheduleId: string, schedule: Partial<Schedule>) => {
    const url = import.meta.env.VITE_PUT_SCHEDULE.replace('{schedule_id}', scheduleId);
    const response = await apiInstance.put<{ statusCode: number; message: string; data: Schedule }>(
      url,
      schedule
    );
    return response.data;
  },

  deleteSchedule: async (scheduleId: string) => {
    const url = import.meta.env.VITE_DELETE_SCHEDULE.replace('{schedule_id}', scheduleId);
    const response = await apiInstance.delete<{ statusCode: number; message: string }>(url);
    return response.data;
  },
};

export default schedulesApi;
