// services/buildings.ts
import apiInstance from '@/lib/axios'
import {
  BuildingResponse,
  AddBuildingRequest,
  BuildingListParams,
  BuildingListResponse,
  BuildingDetailResponse,
  BuildingDetailByIdResponse,
  AllBuildingDetailsResponse,
} from '@/types'

// Hàm lấy danh sách tòa nhà với pagination và search
export const getBuildings = async (
  params: BuildingListParams = {}
): Promise<BuildingListResponse> => {
  try {
    const response = await apiInstance.get<BuildingListResponse>(
      import.meta.env.VITE_VIEW_BUILDING_LIST,
      { params }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching buildings list:', error)
    throw error
  }
}

export const addBuilding = async (buildingData: AddBuildingRequest): Promise<BuildingResponse> => {
  try {
    const response = await apiInstance.post<{
      statusCode: number
      message: string
      data: BuildingResponse
    }>(import.meta.env.VITE_ADD_BUILDING, buildingData)
    return response.data.data
  } catch (error) {
    console.error('Error adding new building:', error)
    throw error
  }
}

export const updateBuilding = async (
  buildingId: string,
  buildingData: Partial<AddBuildingRequest> & { buildingId: string }
): Promise<BuildingResponse> => {
  try {
    const url = import.meta.env.VITE_EDIT_BUILDING.replace('{id}', buildingId)
    const response = await apiInstance.put<{
      statusCode: number
      message: string
      data: BuildingResponse
    }>(url, buildingData)
    return response.data.data
  } catch (error) {
    console.error('Error updating building:', error)
    throw error
  }
}

export const deleteBuilding = async (buildingId: string): Promise<void> => {
  try {
    const url = import.meta.env.VITE_DELETE_BUIDLING.replace('{id}', buildingId)
    await apiInstance.delete(url)
  } catch (error) {
    console.error('Error deleting building:', error)
    throw error
  }
}

export const getBuildingDetail = async (
  buildingDetailId: string
): Promise<BuildingDetailResponse> => {
  try {
    const url = import.meta.env.VITE_VIEW_BUILDING_DETAIL.replace('{id}', buildingDetailId)
    const response = await apiInstance.get<BuildingDetailResponse>(url)
    return response.data
  } catch (error) {
    console.error('Error fetching building detail:', error)
    throw error
  }
}

export const getBuildingById = async (buildingId: string): Promise<BuildingDetailByIdResponse> => {
  try {
    const url = import.meta.env.VITE_DETAIL_BUILDING.replace('{id}', buildingId)
    const response = await apiInstance.get<BuildingDetailByIdResponse>(url)
    return response.data
  } catch (error) {
    console.error('Error fetching building by id:', error)
    throw error
  }
}

export const getAllBuildingDetails = async (): Promise<AllBuildingDetailsResponse> => {
  try {
    const response = await apiInstance.get<AllBuildingDetailsResponse>(
      import.meta.env.VITE_VIEW_ALL_BUIDLINGS_DETAIL
    )
    return response.data
  } catch (error) {
    console.error('Error fetching all building details:', error)
    throw error
  }
}
