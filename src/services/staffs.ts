import apiInstance from '@/lib/axios';
import { StaffResponse, StaffDetailResponse } from '@/types';

export const getAllStaff = async (params?: { 
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<StaffResponse> => {
    try {
      let url = import.meta.env.VITE_VIEW_STAFF_LIST;
      
      // Add query parameters if provided
      if (params) {
        const queryParams = new URLSearchParams();
        
        if (params.search) queryParams.append('search', params.search);
        if (params.role) queryParams.append('role', params.role);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      
      const response = await apiInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff data:', error);
      throw error;
    }
  };

export type AddStaffData = {
  username: string;
  email: string;
  password: string;
  phone: string;
  role: 'Staff' | 'Leader' | 'Manager';
  dateOfBirth: string;
  gender: 'Male' | 'Female';
}

export const addStaff = async (staffData: AddStaffData): Promise<any> => {
  try {
    const response = await apiInstance.post(import.meta.env.VITE_SIGNUP_API, staffData);
    return response.data;
  } catch (error) {
    console.error('Error creating staff account:', error);
    throw error;
  }
};

export const getStaffDetail = async (staffId: string): Promise<StaffDetailResponse> => {
  try {
    const response = await apiInstance.get(import.meta.env.VITE_VIEW_STAFF_DETAIL.replace('{staffId}', staffId));
    return response.data;
  } catch (error) {
    console.error('Error fetching staff detail:', error);
    throw error;
  }
};