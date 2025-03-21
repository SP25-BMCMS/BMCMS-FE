import axios from 'axios';
import { Residents, ResidentsApiResponse } from '@/types';

const API_SECRET = import.meta.env.VITE_API_SECRET;
const RESIDENTS_LIST_API = import.meta.env.VITE_VIEW_RESIDENTS_LIST;
const STATUS_RESIDENT_API = import.meta.env.VITE_STATUS_RESIDENT;

export const getAllResidents = async (): Promise<Residents[]> => {
  try {
    const response = await axios.get<{message: string, data: any[]}>(`${API_SECRET}${RESIDENTS_LIST_API}`);
    
    if (response.data && response.data.data) {
      // Chuyển đổi dữ liệu từ API sang định dạng hiển thị
      const formattedResidents = response.data.data.map(resident => ({
        ...resident,
        id: resident.userId,
        name: resident.username,
        createdDate: new Date().toLocaleDateString(),
        // Đảm bảo accountStatus được lấy từ API
        accountStatus: resident.accountStatus || 'Inactive'
      }));
      
      return formattedResidents;
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

export const updateResidentStatus = async (residentId: string, newStatus: 'Active' | 'Inactive') => {
  try {
    const url = `${API_SECRET}${STATUS_RESIDENT_API.replace('{id}', residentId)}`;
    const response = await axios.patch(url, {
      accountStatus: newStatus
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('bmcms_token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating resident status:', error);
    throw error;
  }
};

