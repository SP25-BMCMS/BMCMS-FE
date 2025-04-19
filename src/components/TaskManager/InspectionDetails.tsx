import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskAssignment, InspectionResponse, Inspection } from '@/types';
import inspectionsApi from '@/services/inspections';
import { FORMAT_DATE_TIME } from '@/utils/helpers';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaCalendarAlt,
  FaClipboardList,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaImages,
} from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

interface InspectionDetailsProps {
  taskAssignments: TaskAssignment[];
}

const InspectionDetails: React.FC<InspectionDetailsProps> = ({ taskAssignments }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    taskAssignments.length > 0 ? taskAssignments[0].assignment_id : null
  );

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

  const handleAssignmentSelect = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Get current selected assignment
  const selectedAssignment = taskAssignments.find(
    assignment => assignment.assignment_id === selectedAssignmentId
  );

  // Get inspections list
  const inspectionsList = inspectionsData?.data || [];

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
              {assignment.status} - {assignment.employee_id.substring(0, 8)}
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
                  : 'bg-[rgba(54,10,254,0.3)] text-[#360AFE] border border-[#360AFE]'
              }`}
            >
              {selectedAssignment.status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <FaUser className="mr-2 text-gray-400" />
              Staff ID: {selectedAssignment.employee_id.substring(0, 8)}
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
            {inspectionsList.map((inspection: Inspection) => (
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
                          Inspected By: {inspection.inspected_by.substring(0, 8)}
                        </span>
                      </div>

                      <div className="flex items-center text-sm mb-2">
                        <FaClipboardList className="text-gray-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Description: {inspection.description}
                        </span>
                      </div>

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
                  {(inspection as any).report_status && (
                    <div className="mt-2 pt-2 border-t dark:border-gray-600">
                      <div className="flex items-center text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (inspection as any).report_status === 'NoPending'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : (inspection as any).report_status === 'Rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}
                        >
                          {(inspection as any).report_status}
                        </span>
                        {(inspection as any).isprivateasset && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Private Asset
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default InspectionDetails; 