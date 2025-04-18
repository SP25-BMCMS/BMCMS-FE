import apiInstance from '@/lib/axios';

export interface CrackRecord {
  crackRecordId: string;
  locationDetailId: string;
  crackType: string;
  length: number;
  width: number;
  depth: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrackRecordResponse {
  statusCode: number;
  message: string;
  data: CrackRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getCrackRecordsByBuildingDetailId = async (
  buildingDetailId: string,
  params: { page?: number; limit?: number } = {}
): Promise<CrackRecordResponse> => {
  try {
    const url = import.meta.env.VITE_GET_CRACK_RECORD_BY_BUILDNGDETAILID.replace(
      '{buildingDetailId}',
      buildingDetailId
    );
    console.log(`Fetching crack records for building detail ID: ${buildingDetailId}, URL: ${url}`);
    const response = await apiInstance.get<CrackRecordResponse>(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching crack records:', error);
    throw error;
  }
};
