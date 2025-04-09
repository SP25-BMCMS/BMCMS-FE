import apiInstance from '@/lib/axios';
import { CrackListParams, CrackListPaginationResponse } from '@/types';

const getCrackList = async (params: CrackListParams = {}): Promise<CrackListPaginationResponse> => {
  try {
    const { data } = await apiInstance.get<CrackListPaginationResponse>(
      import.meta.env.VITE_VIEW_CRACK_LIST,
      { params }
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch crack list');
  }
};

const getCrackDetail = async (id: string) => {
  try {
    const { data } = await apiInstance.get(
      import.meta.env.VITE_VIEW_DETAIL_CRACK.replace('{id}', id)
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch crack detail');
  }
};

const updateCrackStatus = async (
  id: string,
  status: 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing',
  staffId: string
) => {
  try {
    const { data } = await apiInstance.patch(
      import.meta.env.VITE_CHANGE_STATUS_CRACK.replace('{id}', id),
      { staffId: staffId }
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update crack status');
  }
};

const crackApi = {
  getCrackList,
  getCrackDetail,
  updateCrackStatus,
};

export default crackApi;
