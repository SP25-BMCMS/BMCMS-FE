import apiInstance from '@/lib/axios';
import { InspectionResponse } from '@/types';
import { getStaffDetail } from '@/services/staffs';

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

    console.log('Raw inspection data before processing:', JSON.stringify(data, null, 2));

    // Fetch staff details for each inspection
    if (data.data && data.data.length > 0) {
      try {
        // Get unique staff IDs
        const staffIds = [...new Set(data.data.map(inspection => inspection.inspected_by))].filter(
          Boolean
        );
        console.log('Staff IDs to fetch:', staffIds);

        // Make parallel requests to get all staff details
        const staffDetailsPromises = staffIds.map(staffId => {
          console.log(`Fetching details for staff ID: ${staffId}`);
          return getStaffDetail(staffId)
            .then(response => {
              console.log(`Staff details success for ${staffId}:`, response.data);
              return {
                staffId,
                username: response.data.username,
                success: true,
              };
            })
            .catch(error => {
              console.error(`Error fetching staff details for ${staffId}:`, error);
              return {
                staffId,
                username: staffId.substring(0, 8),
                success: false,
              };
            });
        });

        const staffDetails = await Promise.all(staffDetailsPromises);
        console.log('All staff details results:', staffDetails);

        // Create a map of staff IDs to usernames
        const staffMap = staffDetails.reduce(
          (acc, detail) => {
            acc[detail.staffId] = {
              userId: detail.staffId,
              username: detail.success ? detail.username : detail.staffId.substring(0, 8),
            };
            return acc;
          },
          {} as Record<string, { userId: string; username: string }>
        );

        console.log('Staff ID to username map:', staffMap);

        // Add user info to each inspection
        data.data = data.data.map(inspection => {
          const staffInfo = staffMap[inspection.inspected_by];
          console.log(
            `Mapping staff for inspection ${inspection.inspection_id}:`,
            `Staff ID: ${inspection.inspected_by}`,
            `Found info:`,
            staffInfo
          );

          return {
            ...inspection,
            inspected_by_user: staffInfo,
          };
        });
      } catch (error) {
        console.warn('Error fetching staff details:', error);
        // Continue with the original response if staff details can't be fetched
      }
    }

    console.log('Final processed inspection data:', JSON.stringify(data.data, null, 2));
    return data;
  } catch (error: any) {
    console.error('Error in getInspectionsByAssignmentId:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch inspections');
  }
};

/**
 * Update the report status of an inspection
 * @param inspectionId - The inspection ID
 * @param reportStatus - The new report status
 * @returns Promise with the updated inspection
 */
const updateInspectionReportStatus = async (
  inspectionId: string,
  reportStatus: 'NoPending' | 'Pending' | 'Rejected'
): Promise<any> => {
  try {
    console.log(`Updating inspection ${inspectionId} status to ${reportStatus}`);
    const endpoint = import.meta.env.VITE_CHANGE_STATUS_INSPECTION_ID.replace(
      '{inspection_id}',
      inspectionId
    );

    // Use the proper payload format as required by the API
    const payload = { report_status: reportStatus === 'NoPending' ? 'Approved' : reportStatus };
    console.log('Sending payload:', payload);

    const { data } = await apiInstance.patch(endpoint, payload);
    console.log('Update status response:', data);
    return data;
  } catch (error: any) {
    console.error('Error updating inspection report status:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to update inspection report status');
  }
};

const inspectionsApi = {
  getInspectionsByAssignmentId,
  updateInspectionReportStatus,
};

export default inspectionsApi;
