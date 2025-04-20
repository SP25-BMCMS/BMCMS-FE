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
