import React, { useState, useEffect } from 'react';
import { FORMAT_DATE_TIME } from '@/utils/helpers';
import { InspectionResponse, Inspection } from '@/types';
import { STATUS_COLORS } from '@/constants/colors';
import { IoClose } from 'react-icons/io5';
import {
  FaUser,
  FaCalendarAlt,
  FaClipboardList,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaImages,
} from 'react-icons/fa';

interface SimpleInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    assignment_id: string;
    task_id: string;
    employee_id: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  inspections?: InspectionResponse;
  isLoading: boolean;
  error?: string;
}

const SimpleInspectionModal: React.FC<SimpleInspectionModalProps> = ({
  isOpen,
  onClose,
  assignment,
  inspections,
  isLoading,
  error,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return STATUS_COLORS.IN_PROGRESS;
      case 'Reassigned':
        return STATUS_COLORS.REVIEWING;
      case 'InFixing':
        return STATUS_COLORS.PENDING;
      case 'Fixed':
        return STATUS_COLORS.RESOLVED;
      default:
        return STATUS_COLORS.PENDING;
    }
  };

  const statusColor = getStatusColor(assignment.status);
  const inspectionsList = inspections?.data || [];

  // Handle image click to show full image
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl">
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Inspection Detail</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            {/* Assignment Information */}
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {assignment.description}
                </h3>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: statusColor.BG,
                    color: statusColor.TEXT,
                    border: '1px solid',
                    borderColor: statusColor.BORDER,
                  }}
                >
                  {assignment.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center mb-2">
                    <FaUser className="text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      ID: {assignment.assignment_id.substring(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaUser className="text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Staff Id: {assignment.employee_id.substring(0, 8)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <FaCalendarAlt className="text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Created: {FORMAT_DATE_TIME(assignment.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Updated: {FORMAT_DATE_TIME(assignment.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspections */}
            <div className="p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FaClipboardList className="mr-2" />
                Inspection ({inspectionsList.length})
              </h4>

              {error ? (
                <div className="text-center py-6">
                  <FaExclamationTriangle className="mx-auto text-yellow-500 text-4xl mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Unable to load Inspection data.
                  </p>
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                </div>
              ) : inspectionsList.length === 0 ? (
                <div className="text-center py-6">
                  <FaCheckCircle className="mx-auto text-gray-400 text-4xl mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No Inspection data available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {inspectionsList.map((inspection: Inspection) => (
                    <div
                      key={inspection.inspection_id}
                      className="border dark:border-gray-600 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900 dark:text-white">
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
                                Staff Id: {inspection.inspected_by.substring(0, 8)}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
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
    </>
  );
};

export default SimpleInspectionModal;
