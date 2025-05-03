import React, { useState, useEffect, useRef } from 'react';
import { getBuildingById, getBuildingDetail, getAllBuildingDetails } from '@/services/building';
import { getAllStaff } from '@/services/staff';
import { getContractsByBuildingDetailId, Contract } from '@/services/contracts';
import { toast } from 'react-hot-toast';
import {
  Building,
  MapPin,
  Calendar,
  Home,
  Layers,
  ArrowRight,
  Clock,
  ShieldCheck,
  GripVertical,
  User,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FORMAT_DATE } from '@/utils/format';
import { useTranslation } from 'react-i18next';

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
        <div className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-rounded-md scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ViewBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string | null;
}

interface BuildingDetailColumn {
  field: string;
  label: string;
  width: number;
  pinned?: boolean;
}

const buildingDetailColumns: BuildingDetailColumn[] = [
  { field: 'buildingName', label: 'Building Name', width: 180, pinned: true },
  { field: 'areaName', label: 'Area', width: 150 },
  { field: 'status', label: 'Status', width: 150 },
  { field: 'constructionDate', label: 'Construction Date', width: 180 },
  { field: 'completionDate', label: 'Completion Date', width: 180 },
  { field: 'warranty_date', label: 'Warranty Date', width: 180 },
  { field: 'numOfFloors', label: 'Number of Floors', width: 150 },
  { field: 'managerName', label: 'Manager', width: 180 },
  { field: 'description', label: 'Description', width: 300 },
];

const ViewBuildingModal: React.FC<ViewBuildingModalProps> = ({ isOpen, onClose, buildingId }) => {
  const { t } = useTranslation();
  const [buildingDetail, setBuildingDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [leftColumnWidth, setLeftColumnWidth] = useState<number>(30); // Default width percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [managerName, setManagerName] = useState<string>('Not assigned');

  // State cho TanStack Query
  const [buildingDetailId, setBuildingDetailId] = useState<string | null>(null);

  // Truy vấn contracts data
  const {
    data: contractsData,
    isLoading: isLoadingContracts,
    isError: isErrorContracts,
  } = useQuery({
    queryKey: ['contracts', buildingDetailId],
    queryFn: () => getContractsByBuildingDetailId(buildingDetailId || ''),
    enabled: !!buildingDetailId, // Chỉ query khi có buildingDetailId
    staleTime: 5 * 60 * 1000, // 5 phút
  });

  useEffect(() => {
    setBuildingDetail(null);
    setError(null);

    if (isOpen && buildingId) {
      fetchBuildingDetail();
    }
  }, [isOpen, buildingId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Add resizer functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate percentage (constrain between 20% and 80%)
      let newWidthPercent = (mouseX / containerWidth) * 100;
      newWidthPercent = Math.max(20, Math.min(newWidthPercent, 80));

      setLeftColumnWidth(newWidthPercent);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const fetchBuildingDetail = async () => {
    if (!buildingId) return;

    setIsLoading(true);

    try {
      // Fetch building detail by buildingId
      const buildingResponse = await getBuildingById(buildingId);

      // Fetch all building details
      const allBuildingDetailsResponse = await getAllBuildingDetails();

      // Find the correct buildingDetailId using buildingId
      const buildingDetail = allBuildingDetailsResponse.data.find(
        (detail: any) => detail.buildingId === buildingId
      );

      if (!buildingDetail) {
        // Trường hợp không tìm thấy buildingDetailId, chỉ hiển thị thông tin cơ bản
        if (buildingResponse.data) {
          setBuildingDetail({
            ...buildingResponse.data,
            // Thêm thông tin giả để hiển thị
            buildingDetailId: null,
            name: buildingResponse.data.name,
            total_apartments: 0,
            // Thông tin tòa nhà
            building: buildingResponse.data,
          });

          // Reset buildingDetailId state để không gọi API contracts
          setBuildingDetailId(null);

          // Kiểm tra manager_id
          const managerId = buildingResponse.data.manager_id;
          if (managerId) {
            fetchManagerInfo(managerId);
          }
          return;
        } else {
          setError('cannot find any information this building');
          toast.error('cannot find any information this building');
          return;
        }
      }

      // Đặt buildingDetailId để TanStack Query có thể gọi API contracts
      setBuildingDetailId(buildingDetail.buildingDetailId);

      // Fetch specific building detail using buildingDetailId
      const buildingDetailResponse = await getBuildingDetail(buildingDetail.buildingDetailId);

      if (buildingResponse.data && buildingDetailResponse.data) {
        // Combine data from both responses
        const combinedData = {
          ...buildingResponse.data,
          ...buildingDetailResponse.data,
        };
        setBuildingDetail(combinedData);

        // Check for manager_id in different possible locations in the data structure
        const managerId =
          (buildingResponse.data && buildingResponse.data.manager_id) ||
          (combinedData.building && combinedData.building.manager_id);

        if (managerId) {
          fetchManagerInfo(managerId);
        }
      } else {
        setError('Unable to load building details');
        toast.error('Unable to load building details');
      }
    } catch (error: any) {
      console.error('Error fetching building detail:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Unable to load building details');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch manager information
  const fetchManagerInfo = async (managerId: string) => {
    try {
      const staffResponse = await getAllStaff();

      if (staffResponse && staffResponse.data) {
        const manager = staffResponse.data.find((staff: any) => staff.userId === managerId);

        if (manager) {
          setManagerName(manager.username);
        }
      }
    } catch (error) {
      console.error('Error fetching manager info:', error);
      // We don't set an error state here to avoid disrupting the main view
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Define building status styles
  const getStatusStyle = (status: string) => {
    if (status === 'operational') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
  };

  // Helper function to get device icon based on type
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'hvac':
        return (
          <svg
            className="h-5 w-5 text-blue-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11h.01M12 11h.01M9 11h.01"
            />
          </svg>
        );
      case 'elevator':
        return (
          <svg
            className="h-5 w-5 text-indigo-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        );
      case 'cctv':
        return (
          <svg
            className="h-5 w-5 text-purple-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case 'plumbing':
        return (
          <svg
            className="h-5 w-5 text-cyan-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
      case 'electrical':
        return (
          <svg
            className="h-5 w-5 text-yellow-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'fireprotection':
        return (
          <svg
            className="h-5 w-5 text-red-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-5 w-5 text-gray-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  if (!buildingId) {
    return null;
  }

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

  const buildingData = {
    buildingName: buildingDetail?.name || '-',
    areaName: buildingDetail?.area.name || '-',
    status: buildingDetail?.Status === 'operational' ? 'Operational' : 'Under Construction',
    constructionDate: formatDate(buildingDetail?.construction_date),
    completionDate: formatDate(buildingDetail?.completion_date),
    warranty_date: buildingDetail?.Warranty_date ? formatDate(buildingDetail.Warranty_date) : '-',
    numOfFloors: buildingDetail?.numberFloor?.toString() || '-',
    managerName: managerName || '-',
    description: buildingDetail?.description || '-',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('buildingManager.viewBuilding.title')} size="xl">
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
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
            {t('buildingManager.viewBuilding.error.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </motion.div>
      ) : buildingDetail ? (
        <motion.div className="p-6" variants={containerVariants} initial="hidden" animate="visible">
          {/* Header with basic info */}
          <motion.div className="mb-8" variants={itemVariants}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-md border-2 border-gray-200 dark:border-gray-700">
                <img
                  src={
                    buildingDetail.imageCover
                      ? `${import.meta.env.VITE_API_SECRET}/uploads/${buildingDetail.imageCover}`
                      : 'https://via.placeholder.com/128?text=No+Image'
                  }
                  alt={buildingDetail.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusStyle(buildingDetail.Status)}`}
                  >
                    {buildingDetail.Status === 'operational' 
                      ? t('buildingManager.viewBuilding.status.operational') 
                      : t('buildingManager.viewBuilding.status.underConstruction')}
                  </span>

                  {buildingDetail.buildingDetailId === null && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold shadow-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      {t('buildingManager.viewBuilding.status.noDetail')}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {buildingDetail.name}
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
                  {buildingDetail.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.header.area')}</div>
                      <div className="font-medium">{buildingDetail.area.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.header.floors')}</div>
                      <div className="font-medium">{buildingDetail.numberFloor}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.header.construction')}</div>
                      <div className="font-medium">
                        {formatDate(buildingDetail.construction_date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.header.completion')}</div>
                      <div className="font-medium">
                        {formatDate(buildingDetail.completion_date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content - Resizable Two Column Layout */}
          <div
            ref={containerRef}
            className="flex relative"
            style={{ minHeight: '400px', maxHeight: 'calc(70vh - 200px)' }}
          >
            {/* Left Column - Building and Area Information with scroll */}
            <motion.div
              className="overflow-y-auto pr-3 min-w-[250px] h-full scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-rounded-md scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
              style={{
                width: `${leftColumnWidth}%`,
              }}
              variants={itemVariants}
            >
              {/* Building Details Section */}
              {buildingDetail.buildingDetails && buildingDetail.buildingDetails.length > 0 ? (
                <motion.div
                  className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-6"
                  variants={itemVariants}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-500" />
                    {t('buildingManager.viewBuilding.details.areaDetails')} ({buildingDetail.buildingDetails.length})
                  </h3>

                  <div className="space-y-4">
                    {buildingDetail.buildingDetails.map((detail: any) => (
                      <div
                        key={detail.buildingDetailId}
                        className="py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-base text-gray-900 dark:text-white">
                            {detail.name}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {detail.total_apartments} {t('buildingManager.viewBuilding.details.apartments')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                            <span className="truncate">
                              {t('buildingManager.viewBuilding.header.area')}: <span className="font-medium">{buildingDetail.area.name}</span>
                            </span>
                          </div>

                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                            <span className="truncate">
                              {t('buildingManager.viewBuilding.details.createdDate')}:{' '}
                              <span className="font-medium">{formatDate(detail.createdAt)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm flex items-center justify-center mb-6"
                  variants={itemVariants}
                >
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Home className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>{t('buildingManager.viewBuilding.details.noAreasAvailable')}</p>
                  </div>
                </motion.div>
              )}
              {/* Building Information */}
              <motion.div
                className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-6"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-500" />
                  {t('buildingManager.viewBuilding.details.buildingInfo')}
                </h3>

                <div className="space-y-3">
                  {/* Building basic info */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.buildingName')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                      {buildingData.buildingName}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.status')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                      {buildingData.status}
                    </span>
                  </div>

                  {/* Floor count */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.numOfFloors')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                      {buildingData.numOfFloors}
                    </span>
                  </div>

                  {/* Building manager info - always displayed */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.buildingManager')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-1 text-blue-500" />
                      {buildingData.managerName}
                    </span>
                  </div>

                  {/* Created date */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.createdDate')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                      {formatDate(buildingDetail.createdAt)}
                    </span>
                  </div>

                  {/* Last updated date */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.lastUpdated')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                      {formatDate(buildingDetail.updatedAt)}
                    </span>
                  </div>

                  {/* Construction start date */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.constructionStart')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                      {formatDate(buildingDetail.construction_date)}
                    </span>
                  </div>

                  {/* Completion date */}
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.completionDate')}</span>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">
                      {formatDate(buildingDetail.completion_date)}
                    </span>
                  </div>

                  {/* Warranty date */}
                  {buildingDetail.Warranty_date && (
                    <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">{t('buildingManager.viewBuilding.details.warrantyUntil')}</span>
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        {formatDate(buildingDetail.Warranty_date)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Resizer */}
            <div
              className={`flex items-center justify-center cursor-col-resize w-4 mx-1 transition-colors group ${isResizing ? 'bg-blue-200 dark:bg-blue-900' : ''}`}
              onMouseDown={handleMouseDown}
            >
              <div className="h-24 w-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-blue-400 dark:group-hover:bg-blue-600 transition-all group-hover:h-32"></div>
            </div>

            {/* Right Column - Building Details */}
            <motion.div
              className="overflow-y-auto pl-3 min-w-[250px] h-full scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-rounded-md scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
              style={{
                width: `${100 - leftColumnWidth - 2}%`, // 2% for resizer
              }}
              variants={itemVariants}
            >
              {/* Device Information Section */}
              {buildingDetail.device && buildingDetail.device.length > 0 ? (
                <motion.div
                  className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm mb-6"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {t('buildingManager.viewBuilding.devices.title')}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {t('buildingManager.viewBuilding.devices.count', {
                        count: buildingDetail.device.length,
                        deviceLabel: buildingDetail.device.length === 1 
                          ? t('buildingManager.viewBuilding.devices.device') 
                          : t('buildingManager.viewBuilding.devices.devices')
                      })}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {buildingDetail.device.map((device: any) => (
                      <motion.div
                        key={device.device_id}
                        className="py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700"
                        whileHover={{
                          scale: 1.01,
                          boxShadow:
                            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            {getDeviceIcon(device.type)}
                            <span className="font-medium text-base text-gray-900 dark:text-white ml-2">
                              {device.name}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 font-medium">
                            {device.type}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300 mt-3">
                          <div className="flex items-center bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-100 dark:border-gray-600">
                            <span className="font-medium mr-2 text-gray-500 dark:text-gray-400">
                              {t('buildingManager.viewBuilding.devices.model')}:
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">{device.model}</span>
                          </div>
                          <div className="flex items-center bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-100 dark:border-gray-600">
                            <span className="font-medium mr-2 text-gray-500 dark:text-gray-400">
                              {t('buildingManager.viewBuilding.devices.manufacturer')}:
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {device.manufacturer}
                            </span>
                          </div>
                          {device.contract_id && (
                            <div className="flex items-center bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-100 dark:border-gray-600 col-span-2">
                              
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm flex flex-col items-center justify-center mb-6"
                  variants={itemVariants}
                >
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4 inline-flex">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2 dark:text-gray-300">
                      {t('buildingManager.viewBuilding.devices.noDevices')}
                    </p>
                    <p className="text-sm max-w-md">
                      {t('buildingManager.viewBuilding.devices.noDevicesMessage')}
                    </p>
                  </div>
                </motion.div>
              )}
              {/* Contracts Section */}
              <motion.div
                className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  {t('buildingManager.viewBuilding.contracts.title')}
                </h3>

                {isLoadingContracts ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : isErrorContracts ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-2">{t('buildingManager.viewBuilding.contracts.error')}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('buildingManager.viewBuilding.contracts.errorMessage')}
                    </p>
                  </div>
                ) : contractsData && contractsData.length > 0 ? (
                  <div className="space-y-4">
                    {contractsData.map(contract => (
                      <div
                        key={contract.contract_id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex flex-wrap justify-between items-center mb-3">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white">
                            {contract.vendor}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(contract.start_date).toLocaleDateString()} -{' '}
                            {new Date(contract.end_date).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Devices Information */}
                        <div className="mt-2 mb-3">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1 text-blue-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {t('buildingManager.viewBuilding.contracts.devices')} ({contract.devices.length})
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                            {contract.devices.map(device => (
                              <div
                                key={device.device_id}
                                className={`text-xs p-2 mb-1 last:mb-0 rounded border-l-2 ${
                                  device.buildingDetailId === buildingDetailId
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{device.name}</span>
                                  <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                                    {device.type}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <a
                            href={`${import.meta.env.VITE_API_SECRET}${contract.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            {t('buildingManager.viewBuilding.contracts.actions.download')}
                          </a>
                          <a
                            href={`${import.meta.env.VITE_API_SECRET}${contract.viewUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            {t('buildingManager.viewBuilding.contracts.actions.view')}
                          </a>
                          <a
                            href={`${import.meta.env.VITE_API_SECRET}${contract.directFileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            {t('buildingManager.viewBuilding.contracts.actions.directFile')}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {buildingDetail.buildingDetailId
                        ? t('buildingManager.viewBuilding.contracts.noContracts')
                        : t('buildingManager.viewBuilding.contracts.noContractInfo')}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Footer button */}
          <motion.div
            className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          ></motion.div>
        </motion.div>
      ) : null}
    </Modal>
  );
};

export default ViewBuildingModal;
