import apiInstance from '@/lib/axios'
import { InspectionResponse } from '@/types'
import { getStaffDetail } from '@/services/staffs'

/**
 * Get inspections by task assignment ID
 * @param assignmentId - The task assignment ID
 * @returns Promise with the inspection response
 */
const getInspectionsByAssignmentId = async (assignmentId: string): Promise<InspectionResponse> => {
  try {
    const endpoint = import.meta.env.VITE_GET_INSPECTION_BY_TASK_ASSIGNMENT_ID.replace(
      '{task_assignment_id}',
      assignmentId
    )
    const { data } = await apiInstance.get<InspectionResponse>(endpoint)

    // Validate response structure
    if (!data) {
      console.error('Invalid response structure from inspections API')
      throw new Error('Invalid response structure from API')
    }

    // Fetch staff details for each inspection
    if (data.data && data.data.length > 0) {
      try {
        // Get unique staff IDs
        const staffIds = [...new Set(data.data.map(inspection => inspection.inspected_by))].filter(
          Boolean
        )

        // Make parallel requests to get all staff details
        const staffDetailsPromises = staffIds.map(staffId => {
          return getStaffDetail(staffId)
            .then(response => {
              return {
                staffId,
                username: response.data.username,
                success: true,
              }
            })
            .catch(error => {
              return {
                staffId,
                username: staffId.substring(0, 8),
                success: false,
              }
            })
        })

        const staffDetails = await Promise.all(staffDetailsPromises)

        // Create a map of staff IDs to usernames
        const staffMap = staffDetails.reduce(
          (acc, detail) => {
            acc[detail.staffId] = {
              userId: detail.staffId,
              username: detail.success ? detail.username : detail.staffId.substring(0, 8),
            }
            return acc
          },
          {} as Record<string, { userId: string; username: string }>
        )

        // Add user info to each inspection
        data.data = data.data.map(inspection => {
          const staffInfo = staffMap[inspection.inspected_by]

          return {
            ...inspection,
            inspected_by_user: staffInfo,
          }
        })
      } catch (error) {
        console.warn('Error fetching staff details:', error)
        // Continue with the original response if staff details can't be fetched
      }
    }

    return data
  } catch (error: any) {
    console.error('Error in getInspectionsByAssignmentId:', error)
    console.error('Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to fetch inspections')
  }
}

/**
 * Update the report status of an inspection for managers
 * @param inspectionId - The inspection ID
 * @param reportStatus - The new report status ('NoPending' for Approved or 'Rejected')
 * @param userId - The user ID of the manager making the change
 * @param reason - Optional reason for the status change
 * @returns Promise with the updated inspection
 */
const updateInspectionReportStatus = async (
  inspectionId: string,
  reportStatus: 'NoPending' | 'Rejected',
  userId: string,
  reason: string = ''
): Promise<any> => {
  try {
    const endpoint = import.meta.env.VITE_CHANGE_STATUS_FOR_MANAGER

    // Use the proper payload format for the new API
    const payload = {
      inspection_id: inspectionId,
      report_status: reportStatus,
      userId: userId,
      reason: reason
    }

    const { data } = await apiInstance.put(endpoint, payload)
    return data
  } catch (error: any) {
    console.error('Error updating inspection report status:', error)
    console.error('Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to update inspection report status')
  }
}

interface InspectionPdfResponse {
  isSuccess: boolean
  message: string
  data: Array<{
    inspection_id: string
    uploadFile: string | null
    downloadUrl?: string
    viewUrl?: string
  }>
}

export const getInspectionPdf = async (taskAssignmentId: string): Promise<InspectionPdfResponse> => {
  try {
    const response = await apiInstance.get(`/inspections/inspection-pdf/${taskAssignmentId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

const inspectionsApi = {
  getInspectionsByAssignmentId,
  updateInspectionReportStatus,
  getInspectionPdf,
}

export default inspectionsApi
