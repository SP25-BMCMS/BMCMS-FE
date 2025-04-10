import axios from 'axios';

export interface DashboardSummary {
  pendingTasksCount: number;
  completedTasksCount: number;
  inProgressTasksCount: number;
  buildingsCount: number;
  scheduleJobsCount: number;
  staffCount: number;
  recentTasks: {
    task_id: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
  }[];
  taskStatusDistribution: {
    status: string;
    count: number;
  }[];
  scheduleDistribution: {
    month: string;
    count: number;
  }[];
}

const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const token = localStorage.getItem('bmcms_token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_SECRET}${import.meta.env.VITE_GET_DASHBOARD_SUMMARY}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

export default {
  getDashboardSummary,
};
