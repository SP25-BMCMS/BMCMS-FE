// services/buildings.ts
import apiInstance from '@/lib/axios';
import { BuildingResponse, BuildingsListResponse, AddBuildingRequest } from '@/types';

export interface BuildingListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'operational' | 'under_construction';
}

export interface BuildingListResponse {
  data: BuildingResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hàm lấy danh sách tòa nhà với pagination và search
export const getBuildings = async (params: BuildingListParams = {}): Promise<BuildingListResponse> => {
  try {
    const response = await apiInstance.get<BuildingListResponse>(
      import.meta.env.VITE_VIEW_BUILDING_LIST,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching buildings list:', error);
    throw error;
  }
};

export const addBuilding = async (buildingData: AddBuildingRequest): Promise<BuildingResponse> => {
  try {
    const response = await apiInstance.post<{statusCode: number, message: string, data: BuildingResponse}>(
      import.meta.env.VITE_ADD_BUILDING,
      buildingData
    );
    return response.data.data;
  } catch (error) {
    console.error('Error adding new building:', error);
    throw error;
  }
};

export const deleteBuilding = async (buildingId: string): Promise<void> => {
  try {
    const url = import.meta.env.VITE_DELETE_BUIDLING.replace('{id}', buildingId);
    await apiInstance.delete(url);
  } catch (error) {
    console.error('Error deleting building:', error);
    throw error;
  }
};

