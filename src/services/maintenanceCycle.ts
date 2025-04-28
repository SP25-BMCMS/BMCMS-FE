import apiInstance from '@/lib/axios'
import { MaintenanceCycleResponse, MaintenanceCycleParams, MaintenanceCycle } from '@/types'
import { toast } from 'react-hot-toast'

// Get all maintenance cycles with optional filtering and pagination
export const getMaintenanceCycles = async (
  params?: MaintenanceCycleParams
): Promise<MaintenanceCycleResponse> => {
  try {
    const response = await apiInstance.get<MaintenanceCycleResponse>(
      import.meta.env.VITE_GET_MAINTENANCE_CYCLE_LIST,
      { params }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching maintenance cycles:', error)
    throw error
  }
}

// Get maintenance cycle by ID
export const getMaintenanceCycleById = async (id: string): Promise<MaintenanceCycle> => {
  try {
    const url = import.meta.env.VITE_GET_MAINTENANCE_CYCLE_BY_ID.replace('{id}', id)
    const response = await apiInstance.get<{ data: MaintenanceCycle }>(url)
    return response.data.data
  } catch (error) {
    console.error('Error fetching maintenance cycle by ID:', error)
    throw error
  }
}

// Create a new maintenance cycle
export const createMaintenanceCycle = async (data: {
  device_type: string
  frequency: string
  basis: string
}): Promise<MaintenanceCycle> => {
  try {
    const response = await apiInstance.post<{ data: MaintenanceCycle }>(
      import.meta.env.VITE_POST_MAINTENANCE_CYCLE,
      data
    )
    return response.data.data
  } catch (error) {
    console.error('Error creating maintenance cycle:', error)
    throw error
  }
}

// Update a maintenance cycle
export const updateMaintenanceCycle = async (
  id: string,
  data: {
    device_type: string
    frequency: string
    basis: string
    reason: string
    updated_by: string
  }
): Promise<MaintenanceCycle> => {
  try {
    const url = import.meta.env.VITE_PATCH_MAINTENANCE_CYCLE.replace('{id}', id)
    const response = await apiInstance.patch<{ data: MaintenanceCycle }>(url, data)
    return response.data.data
  } catch (error) {
    console.error('Error updating maintenance cycle:', error)
    throw error
  }
}

// Delete a maintenance cycle
export const deleteMaintenanceCycle = async (id: string): Promise<void> => {
  try {
    const url = import.meta.env.VITE_DELETE_MAINTENANCE_CYCLE.replace('{id}', id)
    const response = await apiInstance.delete(url)
    return response.data
  } catch (error) {
    console.error('Error deleting maintenance cycle:', error)
    throw error
  }
}

// Add interface for maintenance cycle history
export interface MaintenanceCycleHistory {
  history_id: string
  cycle_id: string
  frequency: string
  basis: string
  device_type: string
  changed_at: string
  updated_by: string
  reason: string
}

export interface MaintenanceCycleHistoryResponse {
  isSuccess: boolean
  message: string
  data: MaintenanceCycleHistory[]
}

// Add function to get maintenance cycle history
export const getMaintenanceCycleHistory = async (cycleId: string): Promise<MaintenanceCycleHistoryResponse> => {
  try {
    const response = await apiInstance.get<MaintenanceCycleHistoryResponse>(
      `/maintenance-cycles/${cycleId}/history`
    )
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch maintenance cycle history')
  }
}

