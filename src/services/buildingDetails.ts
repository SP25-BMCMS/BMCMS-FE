import apiInstance from '@/lib/axios';

export interface BuildingDetail {
  buildingDetailId: string;
  buildingId: string;
  name: string;
  total_apartments: number;
}

export interface BuildingWithDetails {
  buildingId: string;
  name: string;
  description: string;
  Status: string;
  buildingDetails: BuildingDetail[];
}

export interface BuildingDetailsResponse {
  statusCode: number;
  message: string;
  data: BuildingWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const buildingDetailsApi = {
  // Get buildings with details for a specific manager
  getBuildingDetailsForManager: async (managerId: string) => {
    try {
      const url = import.meta.env.VITE_VIEW_BUILDING_LIST_FOR_MANAGER.replace('{managerId}', managerId);
      const response = await apiInstance.get<BuildingDetailsResponse>(url);
      
      // Extract all building details from the response
      const buildingDetails: BuildingDetail[] = [];
      
      // Only process buildings that have buildingDetails
      response.data.data
        .filter(building => building.buildingDetails && building.buildingDetails.length > 0)
        .forEach(building => {
          building.buildingDetails.forEach(detail => {
            buildingDetails.push({
              buildingDetailId: detail.buildingDetailId,
              buildingId: building.buildingId,
              name: `${building.name} - ${detail.name}`,
              total_apartments: detail.total_apartments
            });
          });
        });
      
      return buildingDetails;
    } catch (error) {
      console.error('Error fetching building details for manager:', error);
      throw error;
    }
  }
};

export default buildingDetailsApi; 