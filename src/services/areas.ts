import axios from 'axios';
import { Area, AddAreaRequest } from '@/types';

export const getAreaList = async (): Promise<Area[]> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_SECRET}${import.meta.env.VITE_VIEW_AREA_LIST}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching area list:', error);
    throw error;
  }
};

export const addNewArea = async (areaData: AddAreaRequest): Promise<Area> => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_SECRET}${import.meta.env.VITE_ADD_NEW_AREA}`,
      areaData
    );
    return response.data.data;
  } catch (error) {
    console.error('Error adding new area:', error);
    throw error;
  }
};

export const getAreaById = async (id: string): Promise<Area> => {
  try {
    const url = `${import.meta.env.VITE_API_SECRET}${import.meta.env.VITE_GET_AREA_ID}`.replace(
      '{id}',
      id
    );
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching area with ID ${id}:`, error);
    throw error;
  }
};
