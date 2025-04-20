import apiInstance from '@/lib/axios';

export interface TechnicalRecordDevice {
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

export interface TechnicalRecord {
  record_id: string;
  device_id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  device: TechnicalRecordDevice;
  directUrl: string;
  fileUrl: string;
  viewUrl: string;
}

export interface TechnicalRecordResponse {
  data: TechnicalRecord[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TechnicalRecordParams {
  page?: number;
  limit?: number;
}

// Get all technical records
export const getAllTechnicalRecords = async (
  params: TechnicalRecordParams = {}
): Promise<TechnicalRecordResponse> => {
  try {
    const response = await apiInstance.get<TechnicalRecordResponse>(
      import.meta.env.VITE_GET_TECHNICAL_RECORD_LIST,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching technical records:', error);
    throw error;
  }
};

// Get technical record by record ID
export const getTechnicalRecordById = async (recordId: string): Promise<TechnicalRecord> => {
  try {
    const url = import.meta.env.VITE_GET_TECHNICAL_RECORD_BY_ID.replace('{id}', recordId);

    const response = await apiInstance.get<{ data: TechnicalRecord }>(url);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching technical record by ID:', error);
    throw error;
  }
};

// Helper function to get technical records for a specific buildingDetailId
export const getTechnicalRecordsByBuildingDetailId = async (
  buildingDetailId: string | null,
  params: TechnicalRecordParams = {}
): Promise<TechnicalRecord[]> => {
  if (!buildingDetailId) {
    return [];
  }

  try {
    // Get technical records directly using the list API with the buildingDetailId as a parameter
    const allParams = { ...params, buildingDetailId };
    const response = await apiInstance.get<TechnicalRecordResponse>(
      import.meta.env.VITE_GET_TECHNICAL_RECORD_LIST,
      { params: allParams }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching technical records for building detail:', error);
    throw error;
  }
};

// Get technical records by building ID (new function)
export const getTechnicalRecordsByBuildingId = async (
  buildingId: string,
  params: TechnicalRecordParams = {}
): Promise<TechnicalRecord[]> => {
  if (!buildingId) {
    return [];
  }

  try {
    // Get technical records directly using the list API with the buildingId as a parameter
    const allParams = { ...params, buildingId };
    const response = await apiInstance.get<TechnicalRecordResponse>(
      import.meta.env.VITE_GET_TECHNICAL_RECORD_LIST,
      { params: allParams }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching technical records for building:', error);
    throw error;
  }
};
