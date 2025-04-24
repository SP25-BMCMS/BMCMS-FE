import apiInstance from '@/lib/axios';
import { CrackListParams, CrackListPaginationResponse } from '@/types';
import { useMutation } from '@tanstack/react-query';

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
      {
        staffId: staffId,
        status: status,
      }
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

export const useUpdateCrackStatus = () => {
  return useMutation({
    mutationFn: ({
      crackId,
      status,
      staffId,
    }: {
      crackId: string;
      status: 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing';
      staffId: string;
    }) => {
      return updateCrackStatus(crackId, status, staffId);
    },
  });
};
