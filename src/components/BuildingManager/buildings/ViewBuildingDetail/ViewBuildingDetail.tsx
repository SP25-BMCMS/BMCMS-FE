import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getBuildingDetail } from '@/services/building';
import { toast } from 'react-hot-toast';
import { Building, MapPin, Calendar, Info, Hash, Clock, Home } from 'lucide-react';

interface ViewBuildingDetailProps {
  isOpen: boolean;
  onClose: () => void;
  buildingDetailId: string | null;
}

const ViewBuildingDetail: React.FC<ViewBuildingDetailProps> = ({
  isOpen,
  onClose,
  buildingDetailId
}) => {
  const [buildingDetail, setBuildingDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes or buildingDetailId changes
  useEffect(() => {
    // Đặt lại buildingDetail và error khi đóng modal hoặc buildingDetailId thay đổi
    setBuildingDetail(null);
    setError(null);
    
    // Chỉ fetch khi modal mở và có buildingDetailId
    if (isOpen && buildingDetailId) {
      fetchBuildingDetail();
    }
  }, [isOpen, buildingDetailId]);

  const fetchBuildingDetail = async () => {
    if (!buildingDetailId) return;
    
    setIsLoading(true);
    console.log(`Đang tải thông tin chi tiết cho buildingDetailId: ${buildingDetailId}`);
    
    try {
      const response = await getBuildingDetail(buildingDetailId);
      if (response.data) {
        setBuildingDetail(response.data);
        console.log(`Đã tải thành công thông tin chi tiết cho buildingDetailId: ${buildingDetailId}`);
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
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Define building status styles
  const getStatusStyle = (status: string) => {
    if (status === 'operational') {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-400';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-400';
  };

  if (!buildingDetailId) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tòa nhà"
      size="lg"
    >
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      ) : buildingDetail ? (
        <div className="space-y-6 p-4">
          {/* Header with basic info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden">
              <img
                src={buildingDetail.building.imageCover || "https://via.placeholder.com/96?text=No+Image"}
                alt={buildingDetail.building.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {buildingDetail.building.name}
              </h2>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(buildingDetail.building.Status)}`}>
                  {buildingDetail.building.Status}
                </span>
                
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-400">
                  {buildingDetail.name}
                </span>
              </div>
              
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-center sm:justify-start items-center mt-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  Khu vực: {buildingDetail.building.area.name}
                </div>
                <div className="flex justify-center sm:justify-start items-center mt-1">
                  <Home className="h-4 w-4 mr-2" />
                  Tổng số căn hộ: {buildingDetail.total_apartments}
                </div>
              </div>
            </div>
          </div>
          
          {/* Building Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                Thông tin tòa nhà
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID tòa nhà</p>
                    <p className="text-gray-900 dark:text-white text-xs md:text-sm">{buildingDetail.buildingId}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Số tầng</p>
                    <p className="text-gray-900 dark:text-white">{buildingDetail.building.numberFloor}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả</p>
                    <p className="text-gray-900 dark:text-white">{buildingDetail.building.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày khởi công</p>
                    <p className="text-gray-900 dark:text-white">{buildingDetail.building.construction_date}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày hoàn thành</p>
                    <p className="text-gray-900 dark:text-white">{buildingDetail.building.completion_date}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Area Information */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                Thông tin khu vực
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tên khu vực</p>
                    <p className="text-gray-900 dark:text-white">{buildingDetail.building.area.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả khu vực</p>
                    <p className="text-gray-900 dark:text-white">{buildingDetail.building.area.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tên cánh</p>
                    <p className="text-gray-900 dark:text-white">{buildingDetail.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày tạo khu vực</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(buildingDetail.building.area.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Location Details - Only show if there are location details */}
          {buildingDetail.locationDetails && buildingDetail.locationDetails.length > 0 && (
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                Chi tiết vị trí
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {buildingDetail.locationDetails.map((location: any) => (
                  <div 
                    key={location.locationDetailId} 
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                      <span>Phòng {location.roomNumber}</span>
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Tầng {location.floorNumber}
                      </span>
                    </h4>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium">Vị trí:</span> {location.positionSide}
                    </p>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium">Loại khu vực:</span> {location.areaType}
                    </p>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium">Mô tả:</span> {location.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Footer button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ViewBuildingDetail; 