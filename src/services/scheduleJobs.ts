import apiInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface Schedule {
  schedule_id: string;
  schedule_name: string;
  schedule_type: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Area {
  areaId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationDetail {
  locationDetailId: string;
  buildingDetailId: string;
  inspection_id: string;
  roomNumber: string;
  floorNumber: number;
  areaType: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingDetail {
  buildingDetailId: string;
  buildingId: string;
  name: string;
  total_apartments: number;
  createdAt: string;
  updatedAt: string;
  locationDetails: LocationDetail[];
}

export interface Building {
  buildingId: string;
  name: string;
  description: string;
  numberFloor: number;
  imageCover: string;
  areaId: string;
  createdAt: string;
  updatedAt: string;
  Status: string;
  construction_date: string;
  completion_date: string;
  area: Area;
  buildingDetails: BuildingDetail[];
}

export interface ScheduleJob {
  schedule_job_id: string;
  schedule_id: string;
  building_id: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  run_date: string;
  created_at: string;
  updated_at: string;
  schedule: Schedule;
  building: Building;
}

export interface ScheduleJobResponse {
  statusCode: number;
  message: string;
  data: ScheduleJob;
}

export interface ScheduleJobListResponse {
  statusCode: number;
  message: string;
  data: ScheduleJob[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateScheduleJobRequest {
  schedule_id: string;
  building_id: string;
  run_date: string;
}

export interface UpdateScheduleJobRequest {
  schedule_id?: string;
  building_id?: string;
  run_date?: string;
  status?: 'Pending' | 'InProgress' | 'Completed' | 'Cancel';
}

const scheduleJobsApi = {
  // Get all schedule jobs with pagination
  getScheduleJobs: async (params: {
    page: number;
    limit: number;
    schedule_id?: string;
  }): Promise<ScheduleJobListResponse> => {
    const { page, limit, schedule_id } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (schedule_id) {
      queryParams.append('schedule_id', schedule_id);
    }

    const response = await apiInstance.get(`/schedule-jobs?${queryParams.toString()}`);
    return response.data;
  },

  // Get schedule jobs by schedule ID
  fetchScheduleJobsByScheduleId: async (
    scheduleId: string,
    params?: { page: number; limit: number }
  ): Promise<ScheduleJobListResponse> => {
    const url = import.meta.env.VITE_GET_DETAIL_SCHEDULE_JOB.replace('{scheduleId}', scheduleId);
    
    let queryString = '';
    if (params) {
      const { page, limit } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      queryString = `?${queryParams.toString()}`;
    }
    
    const response = await apiInstance.get(`${url}${queryString}`);
    return response.data;
  },

  // Get schedule job by ID
  getScheduleJobById: async (scheduleId: string): Promise<ScheduleJobResponse> => {
    const response = await apiInstance.get(`/schedule-jobs/schedule/${scheduleId}`);
    return response.data;
  },

  // Create a new schedule job
  createScheduleJob: async (data: CreateScheduleJobRequest): Promise<ScheduleJobResponse> => {
    const response = await apiInstance.post('/schedule-jobs', data);
    return response.data;
  },

  // Update a schedule job
  updateScheduleJob: async (
    scheduleJobId: string,
    data: UpdateScheduleJobRequest
  ): Promise<ScheduleJobResponse> => {
    const response = await apiInstance.put(`/schedule-jobs/${scheduleJobId}`, data);
    return response.data;
  },

  // Update schedule job status
  updateScheduleJobStatus: async (
    scheduleJobId: string,
    status: 'Pending' | 'InProgress' | 'Completed'
  ): Promise<ScheduleJobResponse> => {
    const response = await apiInstance.put(`/schedule-jobs/status/${scheduleJobId}`, { status });
    return response.data;
  },
};

export const useSendMaintenanceEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleJobId: string) => {
      const response = await apiInstance.post(
        `/schedule-jobs/${scheduleJobId}/send-maintenance-email`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] });
    },
  });
};

export default scheduleJobsApi;
