import axios from 'axios';
import { Residents, ResidentsApiResponse } from '@/types';

const API_SECRET = import.meta.env.VITE_API_SECRET;
const RESIDENTS_LIST_API = import.meta.env.VITE_VIEW_RESIDENTS_LIST;

export const getAllResidents = async (): Promise<Residents[]> => {
  try {
    const response = await axios.get<ResidentsApiResponse>(`${API_SECRET}${RESIDENTS_LIST_API}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch residents data');
  } catch (error) {
    console.error('Error fetching residents:', error);
    throw error;
  }
};

export const getResidentApartments = async (residentId: string) => {
  try {
    const RESIDENT_APARTMENT_API = import.meta.env.VITE_VIEW_RESIDENT_APRTMENT.replace('{id}', residentId);
    const response = await axios.get(`${API_SECRET}${RESIDENT_APARTMENT_API}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resident apartments:', error);
    throw error;
  }
};
