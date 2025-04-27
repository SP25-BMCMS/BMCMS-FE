import axios from 'axios';

export interface DashboardSummary {
  taskStats: {
    tasksByStatus: {
      pending: number;
      inProgress: number;
      completed: number;
      assigned: number;
      total: number;
    };
    assignmentsByStatus: {
      pending: number;
      confirmed: number;
      verified: number;
      unverified: number;
      total: number;
    };
    costStatistics: {
      totalCost: number;
      estimatedCost: number;
      currency: string;
    };
    recentTasks: {
      task_id: string;
      description: string;
      status: string;
      created_at: string;
      updated_at: string;
      crack_id?: string;
      schedule_job_id?: string;
      taskAssignments?: any[];
      workLogs?: any[];
      feedbacks?: any[];
      crackInfo?: any;
    }[];
  };
  crackStats: {
    cracksByStatus: {
      pending: number;
      inProgress: number;
      completed: number;
      rejected: number;
      total: number;
    };
    cracksBySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    recentCracks: any[];
  };
  staffStats: {
    totalStaff: number;
    staffByDepartment: Record<string, number>;
    staffList: {
      userId: string;
      username: string;
      department: string;
      position: string;
    }[];
  };
  feedbackStats: {
    totalFeedbacks: number;
    averageRating: number;
    ratingCount: number;
    recentFeedbacks: any[];
  };
  lastUpdated: string;
}

export interface Feedback {
  feedback_id: string;
  task_id: string;
  feedback_by: string;
  comments: string;
  rating: number;
  created_at: string;
  updated_at: string;
  status: string;
  task?: {
    task_id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
    crack_id?: string;
    schedule_job_id?: string;
  };
  user?: {
    userId: string;
    username: string;
  };
}

export interface FeedbacksResponse {
  isSuccess: boolean;
  message: string;
  data: Feedback[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

const getFeedbacks = async (params?: { page?: number; limit?: number; search?: string }): Promise<FeedbacksResponse> => {
  try {
    const token = localStorage.getItem('bmcms_token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_SECRET}${import.meta.env.VITE_GET_ALL_FEEDBACK}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          ...params,
          include: 'task,user',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }
};

export default {
  getDashboardSummary,
  getFeedbacks,
};
