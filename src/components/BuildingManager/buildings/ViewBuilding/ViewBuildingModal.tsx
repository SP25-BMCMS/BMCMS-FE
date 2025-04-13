import React, { useState, useEffect } from 'react';
import { getBuildingById } from '@/services/building';
import { toast } from 'react-hot-toast';
import { 
  Building, 
  MapPin, 
  Calendar, 
  Home, 
  Layers, 
  ArrowRight,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FORMAT_DATE } from '@/utils/format';

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
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-2xl';
      case 'lg': return 'max-w-4xl';
      case 'xl': return 'max-w-6xl';
      default: return 'max-w-2xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${getMaxWidth()} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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

const ViewBuildingModal: React.FC<ViewBuildingModalProps> = ({
  isOpen,
  onClose,
  buildingId,
}) => {
  const [buildingDetail, setBuildingDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBuildingDetail(null);
    setError(null);

    if (isOpen && buildingId) {
      fetchBuildingDetail();
    }
  }, [isOpen, buildingId]);

  const fetchBuildingDetail = async () => {
    if (!buildingId) return;

    setIsLoading(true);

    try {
      const response = await getBuildingById(buildingId);
      if (response.data) {
        setBuildingDetail(response.data);
      } else {
        setError('Không thể tải thông tin chi tiết tòa nhà');
        toast.error('Không thể tải thông tin chi tiết tòa nhà');
      }
    } catch (error: any) {
      console.error('Error fetching building detail:', error);
      setError(error.message || 'Đã xảy ra lỗi');
      toast.error(error.message || 'Không thể tải thông tin chi tiết tòa nhà');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return FORMAT_DATE(dateString);
  };

  // Define building status styles
  const getStatusStyle = (status: string) => {
    if (status === 'operational') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết tòa nhà" size="xl">
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
            Không thể tải thông tin
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
                    {buildingDetail.Status === 'operational' ? 'Đang hoạt động' : 'Đang xây dựng'}
                  </span>
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">Khu vực</div>
                      <div className="font-medium">{buildingDetail.area.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Số tầng</div>
                      <div className="font-medium">{buildingDetail.numberFloor}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Xây dựng</div>
                      <div className="font-medium">{formatDate(buildingDetail.construction_date)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Hoàn thành</div>
                      <div className="font-medium">{formatDate(buildingDetail.completion_date)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Building Information */}
            <motion.div
              className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Thông tin tòa nhà
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span
                    className="text-gray-900 dark:text-white text-sm font-medium truncate max-w-[200px]"
                    title={buildingDetail.buildingId}
                  >
                    {buildingDetail.buildingId}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Tình trạng</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {buildingDetail.Status === 'operational' ? 'Đang hoạt động' : 'Đang xây dựng'}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Ngày tạo</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {formatDate(buildingDetail.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Cập nhật</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {formatDate(buildingDetail.updatedAt)}
                  </span>
                </div>

                {buildingDetail.Warranty_date && (
                  <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Bảo hành đến</span>
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      {formatDate(buildingDetail.Warranty_date)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Area Information */}
            <motion.div
              className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Thông tin khu vực
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Tên khu vực</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {buildingDetail.area.name}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">ID khu vực</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium truncate max-w-[200px]" title={buildingDetail.area.areaId}>
                    {buildingDetail.area.areaId}
                  </span>
                </div>

                <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Mô tả khu vực</div>
                  <div className="text-gray-900 dark:text-white text-sm">
                    {buildingDetail.area.description}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Ngày tạo khu vực</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {formatDate(buildingDetail.area.createdAt)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Building Details - Only show if there are details */}
          {buildingDetail.buildingDetails && buildingDetail.buildingDetails.length > 0 && (
            <motion.div
              className="mt-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-500" />
                Chi tiết cánh ({buildingDetail.buildingDetails.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildingDetail.buildingDetails.map((detail: any) => (
                  <div
                    key={detail.buildingDetailId}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{detail.name}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {detail.total_apartments} căn hộ
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">ID:</span>{' '}
                          <span className="font-mono text-xs">{detail.buildingDetailId.substring(0, 8)}...</span>
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Tạo:</span> {formatDate(detail.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer button */}
          <motion.div
            className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          >
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Đóng
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </Modal>
  );
};

export default ViewBuildingModal; 