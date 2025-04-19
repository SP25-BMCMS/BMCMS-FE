import apiInstance from '@/lib/axios';
import { InspectionResponse } from '@/types';

/**
 * Get inspections by task assignment ID
 * @param assignmentId - The task assignment ID
 * @returns Promise with the inspection response
 */
const getInspectionsByAssignmentId = async (assignmentId: string): Promise<InspectionResponse> => {
  try {
    console.log(
      `Calling Inspection API: ${import.meta.env.VITE_GET_INSPECTION_BY_TASK_ASSIGNMENT_ID.replace(
        '{task_assignment_id}',
        assignmentId
      )}`
    );
    const endpoint = import.meta.env.VITE_GET_INSPECTION_BY_TASK_ASSIGNMENT_ID.replace(
      '{task_assignment_id}',
      assignmentId
    );
    const { data } = await apiInstance.get<InspectionResponse>(endpoint);

    // Validate response structure
    if (!data) {
      console.error('Invalid response structure from inspections API');
      throw new Error('Invalid response structure from API');
    }

    return data;
  } catch (error: any) {
    console.error('Error in getInspectionsByAssignmentId:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch inspections');
  }
};

const inspectionsApi = {
  getInspectionsByAssignmentId,
};

export default inspectionsApi; 