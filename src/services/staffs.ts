import apiInstance from '@/lib/axios';
import { StaffResponse } from '@/types';

export const getAllStaff = async (): Promise<StaffResponse> => {
    try {
      const response = await apiInstance.get(import.meta.env.VITE_VIEW_STAFF_LIST);
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