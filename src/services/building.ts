// services/buildings.ts
import apiInstance from '@/lib/axios';
import { BuildingResponse, AddBuildingRequest } from '@/types';

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

export interface BuildingDetailResponse {
  statusCode: number;
  message: string;
  data: {
    buildingDetailId: string;
    buildingId: string;
    name: string;
    total_apartments: number;
    createdAt: string;
    updatedAt: string;
    building: BuildingResponse & {
      area: {
        areaId: string;
        name: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
    };
  };
}

export interface AllBuildingDetailsResponse {
  statusCode: number;
  message: string;
  data: Array<{
    buildingDetailId: string;
    buildingId: string;
    name: string;
    total_apartments: number;
    createdAt: string;
    updatedAt: string;
    building: BuildingResponse;
    locationDetails?: Array<any>;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hàm lấy danh sách tòa nhà với pagination và search
export const getBuildings = async (
  params: BuildingListParams = {}
): Promise<BuildingListResponse> => {
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
    const response = await apiInstance.post<{
      statusCode: number;
      message: string;
      data: BuildingResponse;
    }>(import.meta.env.VITE_ADD_BUILDING, buildingData);
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

export const getBuildingDetail = async (
  buildingDetailId: string
): Promise<BuildingDetailResponse> => {
  try {
    const url = import.meta.env.VITE_VIEW_BUILDING_DETAIL.replace('{id}', buildingDetailId);
    console.log(`Fetching building detail with URL: ${url}, buildingDetailId: ${buildingDetailId}`);
    const response = await apiInstance.get<BuildingDetailResponse>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching building detail:', error);
    throw error;
  }
};

export const getAllBuildingDetails = async (): Promise<AllBuildingDetailsResponse> => {
  try {
    const response = await apiInstance.get<AllBuildingDetailsResponse>(
      import.meta.env.VITE_VIEW_ALL_BUIDLINGS_DETAIL
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching all building details:', error);
    throw error;
  }
};
