import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TechnicalRecord } from '@/services/technicalRecord';
import { Download, Eye, FileText, FileIcon, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import apiInstance from '@/lib/axios';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null;

  const getMaxWidth = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-2xl';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${getMaxWidth()} flex flex-col max-h-[90vh]`}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-6 scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-rounded-md scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

interface TechnicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  buildingDetailId: string | null;
  buildingName: string;
}

// Response type for the technical records API
interface TechnicalRecordsByBuildingResponse {
  data: TechnicalRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const TechnicalRecordModal: React.FC<TechnicalRecordModalProps> = ({
  isOpen,
  onClose,
  buildingId,
  buildingDetailId,
  buildingName,
}) => {
  // Function to fetch technical records by building ID using the new API endpoint
  const fetchTechnicalRecordsByBuildingId = async (buildingId: string) => {
    try {
      const url = import.meta.env.VITE_GET_TECHNICAL_RECORD_BY_BUILDING_ID.replace(
        '{buildingId}',
        buildingId
      );
      const response = await apiInstance.get<TechnicalRecordsByBuildingResponse>(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching technical records for building:', error);
      throw error;
    }
  };

  // Get technical records for the building
  const {
    data: technicalRecords,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['technicalRecordsByBuilding', buildingId],
    queryFn: () => fetchTechnicalRecordsByBuildingId(buildingId),
    enabled: !!buildingId && isOpen,
  });

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('manual')) {
      return <BookOpen className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('technical') || type.includes('specification')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else if (type.includes('certificate')) {
      return <FileIcon className="h-5 w-5 text-yellow-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  // Extract filename from URL
  const extractFilename = (path: string) => {
    // Try to extract filename from URL or path
    if (!path) return 'Unnamed Document';

    // Check if it contains a slash and get the part after the last slash
    if (path.includes('/')) {
      const parts = path.split('/');
      return parts[parts.length - 1];
    }

    return path;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Technical Records - ${buildingName}`}
      size="lg"
    >
      {!buildingId ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="inline-flex justify-center items-center p-4 mb-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500 dark:text-red-400">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Building ID Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            A building ID is required to view the technical records.
          </p>
        </motion.div>
      ) : isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6 px-4"
        >
          <div className="inline-flex justify-center items-center p-3 mb-3 bg-red-100 rounded-full text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Unable to load technical records
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </p>
        </motion.div>
      ) : !technicalRecords || technicalRecords.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="inline-flex justify-center items-center p-4 mb-4 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Technical Records
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            There are no technical records available for this building at the moment.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Found {technicalRecords.length} Technical Document
              {technicalRecords.length !== 1 ? 's' : ''}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {technicalRecords.map((record: TechnicalRecord) => (
              <motion.div
                key={record.record_id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
                variants={itemVariants}
              >
                <div className="flex flex-wrap justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(record.file_type)}
                    <div>
                      <h5 className="text-base font-medium text-gray-900 dark:text-white">
                        {extractFilename(record.file_name)}
                      </h5>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md text-xs font-medium mr-2">
                          {record.file_type}
                        </span>
                        <span>Uploaded on {formatDate(record.upload_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 mr-2">Device:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {record.device.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 mr-2">Type:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {record.device.type}
                      </span>
                    </div>
                    <div className="flex items-center md:col-span-2">
                      <span className="text-gray-500 dark:text-gray-400 mr-2">Building:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {record.device.buildingDetail.building.name} (
                        {record.device.buildingDetail.name})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={record.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </Modal>
  );
};

export default TechnicalRecordModal;
