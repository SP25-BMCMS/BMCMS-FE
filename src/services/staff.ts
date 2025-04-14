import apiInstance from '@/lib/axios';
import { StaffResponse } from '@/types';

export const getAllStaff = async (): Promise<StaffResponse> => {
  try {
    const response = await apiInstance.get<StaffResponse>(
      import.meta.env.VITE_VIEW_STAFF_LIST
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching staff list:', error);
    throw error;
  }
}; 