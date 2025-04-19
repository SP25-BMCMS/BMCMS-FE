import apiInstance from '@/lib/axios';

export interface MaintenanceHistoryDevice {
  device_id: string;
  name: string;
  type: string;
  buildingDetail: {
    buildingDetailId: string;
    name: string;
    building: {
      buildingId: string;
      name: string;
    };
  };
}

export interface MaintenanceHistory {
  maintenance_id: string;
  device_id: string;
  date_performed: string;
  description: string;
  cost: string;
  device: MaintenanceHistoryDevice;
}

export interface MaintenanceHistoryResponse {
  data: MaintenanceHistory[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MaintenanceHistoryParams {
  page?: number;
  limit?: number;
}

export const getMaintenanceHistoryByBuildingId = async (
  buildingId: string,
  params: MaintenanceHistoryParams = {}
): Promise<MaintenanceHistoryResponse> => {
  try {
    const url = import.meta.env.VITE_GET_MAINTENANCE_HISTORY_BY_BUILDING_ID.replace(
      '{buildingId}',
      buildingId
    );
    
    const response = await apiInstance.get<MaintenanceHistoryResponse>(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    throw error;
  }
}; 