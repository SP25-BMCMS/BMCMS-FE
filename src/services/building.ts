// services/buildings.ts
import apiInstance from '@/lib/axios';
import { BuildingResponse, BuildingsListResponse, AddBuildingRequest } from '@/types';

// Hàm lấy danh sách tòa nhà
export const getBuildings = async (): Promise<BuildingResponse[]> => {
  try {
    const response = await apiInstance.get<BuildingsListResponse>(
      import.meta.env.VITE_VIEW_BUILDING_LIST
    );
    return response.data.data;
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

