import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { getBuildingDetail } from '@/services/building'
import { toast } from 'react-hot-toast'
import { Building, MapPin, Calendar, Home, Layers, ArrowRight, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface ViewBuildingDetailProps {
  isOpen: boolean
  onClose: () => void
  buildingDetailId: string | null
  buildingDetailOptions?: any[]
  onChangeDetail?: (buildingDetailId: string) => void
}

const ViewBuildingDetail: React.FC<ViewBuildingDetailProps> = ({
  isOpen,
  onClose,
  buildingDetailId,
  buildingDetailOptions = [],
  onChangeDetail,
}) => {
  const { t } = useTranslation()
  const [buildingDetail, setBuildingDetail] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination states
  const [currentDevicePage, setCurrentDevicePage] = useState(1)
  const [currentContractPage, setCurrentContractPage] = useState(1)
  const itemsPerPage = 6

  // New state for device search
  const [deviceSearch, setDeviceSearch] = useState<string>('')

  // Reset state when modal closes or buildingDetailId changes
  useEffect(() => {
    setBuildingDetail(null)
    setError(null)

    // Chỉ fetch khi modal mở và có buildingDetailId
    if (isOpen && buildingDetailId) {
      fetchBuildingDetail()
    }
  }, [isOpen, buildingDetailId])

  const fetchBuildingDetail = async () => {
    if (!buildingDetailId) return

    setIsLoading(true)

    try {
      const response = await getBuildingDetail(buildingDetailId)
      if (response.data) {
        setBuildingDetail(response.data)
      } else {
        setError('An error occurred')
        toast.error('An error occurred')
      }
    } catch (error: any) {
      console.error('Error fetching building detail:', error)
      setError(error.message || 'An error occurred')
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  // Define building status styles
  const getStatusStyle = (status: string) => {
    if (status === 'operational') {
      return 'bg-green-500 text-white'
    }
    return 'bg-amber-500 text-white'
  }

  // Pagination functions
  const handleDevicePageChange = (page: number) => {
    setCurrentDevicePage(page)
  }

  const handleContractPageChange = (page: number) => {
    setCurrentContractPage(page)
  }

  // Add function to filter devices
  const getFilteredDevices = () => {
    const devices = buildingDetail?.devices || []
    const searchTerm = deviceSearch.toLowerCase()

    if (!searchTerm) return devices

    return devices.filter(device =>
      device.name.toLowerCase().includes(searchTerm) ||
      device.type.toLowerCase().includes(searchTerm) ||
      device.model.toLowerCase().includes(searchTerm) ||
      device.manufacturer.toLowerCase().includes(searchTerm)
    )
  }

  // Update getDevicesPagination function
  const getDevicesPagination = () => {
    const filteredDevices = getFilteredDevices()
    const totalDevices = filteredDevices.length
    const totalDevicePages = Math.ceil(totalDevices / itemsPerPage)
    const startIndex = (currentDevicePage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentDevices = filteredDevices.slice(startIndex, endIndex)

    return {
      currentDevices,
      totalDevices,
      totalDevicePages,
      startIndex,
      endIndex
    }
  }

  // Calculate pagination for contracts
  const getContractsPagination = () => {
    const contracts = buildingDetail?.contracts || []
    const totalContracts = contracts.length
    const totalContractPages = Math.ceil(totalContracts / itemsPerPage)
    const startIndex = (currentContractPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentContracts = contracts.slice(startIndex, endIndex)

    return {
      currentContracts,
      totalContracts,
      totalContractPages,
      startIndex,
      endIndex
    }
  }

  if (!buildingDetailId) {
    return null
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
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  }

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
            An error occurred
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
                    buildingDetail.building.imageCover ||
                    'https://via.placeholder.com/128?text=No+Image'
                  }
                  alt={buildingDetail.building.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusStyle(buildingDetail.building.Status)}`}
                  >
                    {buildingDetail.building.Status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-500 text-white shadow-sm">
                    {buildingDetail.name}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {buildingDetail.building.name}
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
                  {buildingDetail.building.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Khu vực</div>
                      <div className="font-medium">{buildingDetail.building.area.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Số căn hộ</div>
                      <div className="font-medium">{buildingDetail.total_apartments}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Số tầng</div>
                      <div className="font-medium">{buildingDetail.building.numberFloor}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Hoàn thành</div>
                      <div className="font-medium">{buildingDetail.building.completion_date}</div>
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
                  <span className="text-gray-500 dark:text-gray-400">Khởi công</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {buildingDetail.building.construction_date}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Ngày tạo</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {formatDate(buildingDetail.building.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Cập nhật</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {formatDate(buildingDetail.building.updatedAt)}
                  </span>
                </div>
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
                    {buildingDetail.building.area.name}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Tên cánh</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {buildingDetail.name}
                  </span>
                </div>

                <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Mô tả khu vực</div>
                  <div className="text-gray-900 dark:text-white text-sm">
                    {buildingDetail.building.area.description}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Ngày tạo khu vực</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {formatDate(buildingDetail.building.area.createdAt)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Location Details - Only show if there are location details */}
          {buildingDetail.locationDetails && buildingDetail.locationDetails.length > 0 && (
            <motion.div
              className="mt-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Chi tiết vị trí ({buildingDetail.locationDetails.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildingDetail.locationDetails.map((location: any) => (
                  <div
                    key={location.locationDetailId}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Phòng {location.roomNumber}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Tầng {location.floorNumber}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Vị trí:</span> {location.positionSide}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Loại:</span> {location.areaType}
                        </span>
                      </div>

                      {location.description && (
                        <div className="flex">
                          <ArrowRight className="h-3 w-3 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Mô tả:</span> {location.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Devices Section */}
          {buildingDetail?.devices && buildingDetail.devices.length > 0 && (
            <motion.div
              className="mt-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm"
              variants={itemVariants}
            >
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    Thiết bị ({buildingDetail.devices.length})
                  </h3>
                </div>

                {/* Search input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={deviceSearch}
                    onChange={(e) => {
                      setDeviceSearch(e.target.value)
                      setCurrentDevicePage(1) // Reset to first page when searching
                    }}
                    placeholder={t('buildingManager.searchDevices')}
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {getDevicesPagination().currentDevices.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {deviceSearch ? t('buildingManager.noDevicesFound') : t('buildingManager.noDevices')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getDevicesPagination().currentDevices.map((device: any) => (
                      <div
                        key={device.id}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{device.name}</span>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Loại:</span> {device.type}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Model:</span> {device.model}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Nhà sản xuất:</span> {device.manufacturer}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Devices Pagination */}
                {getDevicesPagination().totalDevices > itemsPerPage && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('common.pagination.showing')} {getDevicesPagination().startIndex + 1}-
                      {Math.min(getDevicesPagination().endIndex, getDevicesPagination().totalDevices)} {t('common.pagination.of')}{' '}
                      {getDevicesPagination().totalDevices} {t('common.items')}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDevicePageChange(currentDevicePage - 1)}
                        disabled={currentDevicePage === 1}
                        aria-label={t('common.previous')}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentDevicePage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {[...Array(getDevicesPagination().totalDevicePages)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleDevicePageChange(index + 1)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${currentDevicePage === index + 1
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => handleDevicePageChange(currentDevicePage + 1)}
                        disabled={currentDevicePage === getDevicesPagination().totalDevicePages}
                        aria-label={t('common.next')}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentDevicePage === getDevicesPagination().totalDevicePages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Contracts Section */}
          {buildingDetail?.contracts && buildingDetail.contracts.length > 0 && (
            <motion.div
              className="mt-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Hợp đồng ({buildingDetail.contracts.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getContractsPagination().currentContracts.map((contract: any) => (
                  <div
                    key={contract.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{contract.title}</span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Ngày bắt đầu:</span>{' '}
                          {formatDate(contract.startDate)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Ngày kết thúc:</span>{' '}
                          {formatDate(contract.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <ArrowRight className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Trạng thái:</span> {contract.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contracts Pagination */}
              {buildingDetail.contracts.length > itemsPerPage && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('common.pagination.showing')} {getContractsPagination().startIndex + 1}-
                    {Math.min(getContractsPagination().endIndex, buildingDetail.contracts.length)}{' '}
                    {t('common.pagination.of')} {buildingDetail.contracts.length} {t('common.pagination.items')}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleContractPageChange(currentContractPage - 1)}
                      disabled={currentContractPage === 1}
                      aria-label={t('common.previous')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${currentContractPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {[...Array(getContractsPagination().totalContractPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleContractPageChange(index + 1)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentContractPage === index + 1
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handleContractPageChange(currentContractPage + 1)}
                      disabled={currentContractPage === getContractsPagination().totalContractPages}
                      aria-label={t('common.next')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${currentContractPage === getContractsPagination().totalContractPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
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
  )
}

export default ViewBuildingDetail
