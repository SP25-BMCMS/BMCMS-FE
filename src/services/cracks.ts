import apiInstance from '@/lib/axios'
import { CrackListParams, CrackListPaginationResponse, CrackReportResponse } from '@/types'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const getCrackList = async (params: CrackListParams = {}): Promise<CrackListPaginationResponse> => {
  try {
    const { data } = await apiInstance.get<CrackListPaginationResponse>(
      import.meta.env.VITE_VIEW_CRACK_LIST,
      { params }
    )
    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch crack list')
  }
}

const getCrackDetail = async (id: string) => {
  try {
    const { data } = await apiInstance.get(
      import.meta.env.VITE_VIEW_DETAIL_CRACK.replace('{id}', id)
    )
    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch crack detail')
  }
}

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
    )
    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update crack status')
  }
}

const getStaffLeaderByCrackId = async (crackReportId: string) => {
  try {
    const { data } = await apiInstance.get(
      import.meta.env.VITE_GET_STAFF_LEADER_BY_CRACK_ID.replace('{crackReportId}', crackReportId)
    )
    return data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch staff leader')
  }
}

const crackApi = {
  getCrackList,
  getCrackDetail,
  updateCrackStatus,
  getStaffLeaderByCrackId,
}

export default crackApi

export const useUpdateCrackStatus = () => {
  return useMutation({
    mutationFn: ({
      crackId,
      status,
      staffId,
    }: {
      crackId: string
      status: 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing'
      staffId: string
    }) => {
      return updateCrackStatus(crackId, status, staffId)
    },
  })
}
