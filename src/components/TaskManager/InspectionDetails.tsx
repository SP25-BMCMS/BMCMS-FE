import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskAssignment, InspectionResponse, Inspection } from '@/types';
import inspectionsApi from '@/services/inspections';
import { FORMAT_DATE_TIME } from '@/utils/helpers';
import { motion } from 'framer-motion';
import { STATUS_COLORS } from '@/constants/colors';
import {
  FaUser,
  FaCalendarAlt,
  FaClipboardList,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaImages,
  FaEdit,
} from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import InspectionStatusModal from './InspectionStatusModal';

interface InspectionDetailsProps {
  taskAssignments: TaskAssignment[];
}

// Type for report status
type ReportStatus = 'NoPending' | 'Pending' | 'Rejected' | 'Approved';

const InspectionDetails: React.FC<InspectionDetailsProps> = ({ taskAssignments }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    taskAssignments.length > 0 ? taskAssignments[0].assignment_id : null
  );
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Fetch inspections data
  const {
    data: inspectionsData,
    isLoading: isLoadingInspections,
    error: inspectionsError,
  } = useQuery({
    queryKey: ['inspections', selectedAssignmentId],
    queryFn: () => inspectionsApi.getInspectionsByAssignmentId(selectedAssignmentId || ''),
    enabled: !!selectedAssignmentId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Debug log when inspections data changes
  useEffect(() => {
    if (inspectionsData) {
      console.log('Component received inspections data:', inspectionsData);

      // Check if staff names are properly mapped
      if (inspectionsData.data && inspectionsData.data.length > 0) {
        inspectionsData.data.forEach(inspection => {
          console.log(
            `Inspection ${inspection.inspection_id} staff info:`,
            inspection.inspected_by_user
          );
        });
      }
    }
  }, [inspectionsData]);

  const handleAssignmentSelect = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleStatusChange = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedInspection(null);
  };

  // Get current selected assignment
  const selectedAssignment = taskAssignments.find(
    assignment => assignment.assignment_id === selectedAssignmentId
  );

  // Get inspections list
  const inspectionsList = inspectionsData?.data || [];

  // Helper function to display staff name
  const displayStaffName = (inspection: Inspection) => {
    if (inspection.inspected_by_user && inspection.inspected_by_user.username) {
      return inspection.inspected_by_user.username;
    }
    return inspection.inspected_by.substring(0, 8);
  };

  // Helper function to get status display text
  const getStatusDisplayText = (status: ReportStatus): string => {
    if (status === 'NoPending') return 'Approved';
    return status;
  };

  // Helper function to get status colors
  const getStatusColors = (status: ReportStatus) => {
    switch (status) {
      case 'NoPending':
      case 'Approved':
        return {
          bg: STATUS_COLORS.RESOLVED.BG,
          text: STATUS_COLORS.RESOLVED.TEXT,
          border: STATUS_COLORS.RESOLVED.BORDER,
        };
      case 'Pending':
        return {
          bg: STATUS_COLORS.PENDING.BG,
          text: STATUS_COLORS.PENDING.TEXT,
          border: STATUS_COLORS.PENDING.BORDER,
        };
      case 'Rejected':
        return {
          bg: STATUS_COLORS.INACTIVE.BG,
          text: STATUS_COLORS.INACTIVE.TEXT,
          border: STATUS_COLORS.INACTIVE.BORDER,
        };
      default:
        return {
          bg: 'rgba(229, 231, 235, 0.8)',
          text: '#374151',
          border: '#d1d5db',
        };
    }
  };

  if (isLoadingInspections) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 dark:text-white">Inspection Details</h2>

      {/* Assignment selector */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2 dark:text-white">Select Assignment</h3>
        <div className="flex flex-wrap gap-2">
          {taskAssignments.map(assignment => (
            <button
              key={assignment.assignment_id}
              onClick={() => handleAssignmentSelect(assignment.assignment_id)}
              className={`px-3 py-2 text-sm rounded-md transition ${
                selectedAssignmentId === assignment.assignment_id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              {assignment.status} -{' '}
              {assignment.employee_name || assignment.employee_id.substring(0, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Selected assignment info */}
      {selectedAssignment && (
        <div className="p-4 mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-600">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium dark:text-white">{selectedAssignment.description}</h3>
            <span
              className={`px-2 text-xs font-medium rounded-full ${
                selectedAssignment.status === 'Fixed'
                  ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
                  : selectedAssignment.status === 'InFixing'
                    ? 'bg-[rgba(255,193,7,0.3)] text-[#ffc107] border border-[#ffc107]'
                    : selectedAssignment.status === 'Reassigned'
                      ? 'bg-[rgba(88,86,214,0.3)] text-[#5856D6] border border-[#5856D6]'
                      : 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
              }`}
            >
              {selectedAssignment.status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <FaUser className="mr-2 text-gray-400" />
              Staff:{' '}
              {selectedAssignment.employee_name || selectedAssignment.employee_id.substring(0, 8)}
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <FaCalendarAlt className="mr-2 text-gray-400" />
              Updated: {FORMAT_DATE_TIME(selectedAssignment.updated_at)}
            </div>
          </div>
        </div>
      )}

      {/* Inspections list */}
      <div>
        <div className="flex items-center mb-4">
          <FaClipboardList className="mr-2 text-blue-500" />
          <h3 className="text-lg font-medium dark:text-white">
            Inspections ({inspectionsList.length})
          </h3>
        </div>

        {inspectionsError ? (
          <div className="text-center py-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-4xl mb-2" />
            <p className="text-gray-700 dark:text-gray-300">Unable to load inspection data.</p>
            <p className="text-red-500 text-sm mt-2">
              {inspectionsError instanceof Error ? inspectionsError.message : 'Unknown error'}
            </p>
          </div>
        ) : inspectionsList.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FaCheckCircle className="mx-auto text-gray-400 text-4xl mb-2" />
            <p className="text-gray-600 dark:text-gray-300">No inspection data available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {inspectionsList.map((inspection: Inspection) => {
              const status = inspection.report_status as ReportStatus;
              const statusColors = getStatusColors(status);

              return (
                <div
                  key={inspection.inspection_id}
                  className="border dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium dark:text-white">
                        Inspection #{inspection.inspection_id.substring(0, 8)}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {FORMAT_DATE_TIME(inspection.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center text-sm mb-2">
                          <FaUser className="text-gray-400 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Inspected By: {displayStaffName(inspection)}
                          </span>
                        </div>

                        <div className="flex items-center text-sm mb-2">
                          <FaClipboardList className="text-gray-400 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Description: {inspection.description}
                          </span>
                        </div>

                        {Number(inspection.total_cost) > 0 && (
                          <div className="flex items-center text-sm">
                            <FaMoneyBillWave className="text-gray-400 mr-2" />
                            <span className="text-gray-700 dark:text-gray-300">
                              Total Cost:{' '}
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(Number(inspection.total_cost))}
                            </span>
                          </div>
                        )}
                      </div>

                      {inspection.image_urls && inspection.image_urls.length > 0 && (
                        <div>
                          <div className="flex items-center text-sm mb-2">
                            <FaImages className="text-gray-400 mr-2" />
                            <span className="text-gray-700 dark:text-gray-300">
                              Images ({inspection.image_urls.length})
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {inspection.image_urls.map((url, idx) => (
                              <div
                                key={idx}
                                className="cursor-pointer border dark:border-gray-600 rounded-md overflow-hidden h-16 md:h-20"
                                onClick={() => handleImageClick(url)}
                              >
                                <img
                                  src={url}
                                  alt={`Inspection ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Report status and other fields */}
                    <div className="mt-2 pt-2 border-t dark:border-gray-600 flex justify-between items-center">
                      <div className="flex items-center text-sm">
                        {status && status !== 'NoPending' && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.text,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: statusColors.border,
                            }}
                          >
                            {getStatusDisplayText(status)}
                          </span>
                        )}
                        {inspection.isprivateasset && (
                          <span
                            className={`${status && status !== 'NoPending' ? 'ml-2' : ''} px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}
                          >
                            Private Asset
                          </span>
                        )}
                      </div>

                      {/* Status change button - only show for Pending status */}
                      {status === 'Pending' && (
                        <button
                          className="flex items-center text-xs px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                          onClick={() => handleStatusChange(inspection)}
                        >
                          <FaEdit className="mr-1" />
                          Change Status
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {selectedImage && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black bg-opacity-90"
            onClick={() => setSelectedImage(null)}
          ></div>
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="relative max-w-4xl max-h-[90vh]">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <IoClose className="w-8 h-8" />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged inspection"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </div>
        </>
      )}

      {/* Status Modal */}
      {selectedInspection && (
        <InspectionStatusModal
          isOpen={isStatusModalOpen}
          onClose={handleCloseStatusModal}
          inspection={selectedInspection}
        />
      )}
    </div>
  );
};

export default InspectionDetails;
