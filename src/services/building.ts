// services/buildings.ts
import apiInstance from '@/lib/axios';
import { BuildingResponse, BuildingsListResponse } from '@/types';

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

