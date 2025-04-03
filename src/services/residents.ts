import axios from 'axios';
import { Residents, ResidentsApiResponse } from '@/types';

const API_SECRET = import.meta.env.VITE_API_SECRET;
const RESIDENTS_LIST_API = import.meta.env.VITE_VIEW_RESIDENTS_LIST;
const STATUS_RESIDENT_API = import.meta.env.VITE_STATUS_RESIDENT;
const RESIDENT_APARTMENT_API = import.meta.env.VITE_VIEW_RESIDENT_APRTMENT;
const ADD_APARTMENT_API = import.meta.env.VITE_ADD_APARTMENT;
const BUILDING_DETAILS_API = import.meta.env.VITE_VIEW_ALL_BUIDLINGS_DETAIL;

export const getAllResidents = async (params?: { 
  search?: string; 
  page?: number; 
  limit?: number;
  status?: string;
}): Promise<{
  data: Residents[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}> => {
  try {
    // Tạo url với các query params
    let url = `${API_SECRET}${RESIDENTS_LIST_API}`;
    
    // Thêm query params nếu có
    if (params) {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const token = localStorage.getItem('bmcms_token');
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Xử lý response
    if (response.data && response.data.data) {
      // Chuyển đổi dữ liệu từ API sang định dạng hiển thị
      const formattedResidents = response.data.data.map((resident: any) => ({
        ...resident,
        id: resident.userId,
        name: resident.username,
        createdDate: new Date(resident.createdAt || Date.now()).toLocaleDateString(),
        accountStatus: resident.accountStatus || 'Inactive'
      }));
      
      return {
        data: formattedResidents,
        pagination: response.data.pagination || {
          total: formattedResidents.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: Math.ceil(formattedResidents.length / (params?.limit || 10))
        }
      };
    }
    
    throw new Error('Failed to fetch residents data');
  } catch (error) {
    console.error('Error fetching residents:', error);
    throw error;
  }
};


export const getResidentApartments = async (residentId: string) => {
  try {
    const url = `${API_SECRET}${RESIDENT_APARTMENT_API.replace('{id}', residentId)}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('bmcms_token')}`,
      },
    });
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
export const getAllBuildingDetails = async () => {
  try {
    const url = `${API_SECRET}${BUILDING_DETAILS_API}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('bmcms_token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching building details:', error);
    throw error;
  }
};
export const addApartmentForResident = async (residentId: string, apartmentData: { apartments: Array<{ apartmentName: string; buildingDetailId: string }> }) => {
  try {
    const url = `${API_SECRET}${ADD_APARTMENT_API.replace('{residentId}', residentId)}`;
    console.log('API URL for adding apartment:', url);
    console.log('Request body:', JSON.stringify(apartmentData));
    const token = localStorage.getItem('bmcms_token');
    const response = await axios.post(url, apartmentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error adding apartment for resident:', error);
    throw error;
  }
};

