import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBuildingDetail } from '@/services/building'
import { getCrackRecordsByBuildingDetailId, CrackRecord } from '@/services/crackRecord'
import {
  getMaintenanceHistoryByBuildingId,
  MaintenanceHistory,
} from '@/services/maintenanceHistory'
import Table, { Column } from '@/components/Table'
import { motion } from 'framer-motion'
import {
  Building2,
  Calendar,
  ChevronRight,
  Info,
  MapPin,
  Layers,
  Clock,
  ArrowUpDown,
  ShieldCheck,
  FileWarning,
  Ruler,
  TextIcon,
  AlertCircle,
  WrenchIcon,
  DollarSign,
  Calendar as CalendarIcon,
  Tv,
  Cpu,
  ToyBrick,
  Cog,
} from 'lucide-react'
import Pagination from '@/components/Pagination'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

// Define device interface
interface Device {
  device_id: string
  name: string
  type: string
  manufacturer: string
  model: string
  buildingDetailId: string
  contract_id: string | null
}

// Update BuildingDetailResponse interface
interface BuildingDetailResponseData {
  buildingDetailId: string
  buildingId: string
  name: string
  total_apartments: number
  createdAt: string
  updatedAt: string
  building: {
    buildingId: string
    name: string
    description: string
    numberFloor: number
    imageCover: string
    areaId: string
    manager_id?: string
    Status: string
    construction_date: string
    completion_date: string
    Warranty_date?: string
    createdAt: string
    updatedAt: string
    area: {
      areaId: string
      name: string
      description: string
      createdAt: string
      updatedAt: string
    }
  }
  device?: Device[]
}

const BuildingDetail: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [maintenanceCurrentPage, setMaintenanceCurrentPage] = useState<number>(1)
  const [maintenanceItemsPerPage, setMaintenanceItemsPerPage] = useState<number>(10)

  // Fetch building detail
  const {
    data: buildingDetailData,
    isLoading: isLoadingBuildingDetail,
    error: buildingDetailError,
  } = useQuery({
    queryKey: ['buildingDetail', id],
    queryFn: () => getBuildingDetail(id!),
    enabled: !!id,
  })

  // Fetch crack records for this building detail
  const {
    data: crackRecordsData,
    isLoading: isLoadingCrackRecords,
    error: crackRecordsError,
  } = useQuery({
    queryKey: ['crackRecords', id, currentPage, itemsPerPage],
    queryFn: () =>
      getCrackRecordsByBuildingDetailId(id!, { page: currentPage, limit: itemsPerPage }),
    enabled: !!id,
  })

  // Fetch maintenance history
  const {
    data: maintenanceHistoryData,
    isLoading: isLoadingMaintenanceHistory,
    error: maintenanceHistoryError,
  } = useQuery({
    queryKey: [
      'maintenanceHistory',
      buildingDetailData?.data?.building?.buildingId,
      maintenanceCurrentPage,
      maintenanceItemsPerPage,
    ],
    queryFn: () =>
      getMaintenanceHistoryByBuildingId(buildingDetailData?.data?.building?.buildingId || '', {
        page: maintenanceCurrentPage,
        limit: maintenanceItemsPerPage,
      }),
    enabled: !!buildingDetailData?.data?.building?.buildingId,
  })

  const buildingDetail = buildingDetailData?.data as BuildingDetailResponseData
  const crackRecords = crackRecordsData?.data || []
  const pagination = crackRecordsData?.pagination
  const maintenanceHistory = maintenanceHistoryData?.data || []
  const maintenancePagination = maintenanceHistoryData?.meta

  // Loading animation
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  }

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">{t('buildingDetail.loading')}</p>
    </div>
  )

  const handleGoBack = () => {
    navigate(-1)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'

      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount))
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  const crackColumns: Column<CrackRecord>[] = [
    {
      key: 'index',
      title: t('buildingDetail.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'crackType',
      title: t('buildingDetail.table.crackType'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <FileWarning className="h-3.5 w-3.5 mr-1.5 text-amber-500 dark:text-amber-400" />
          {item.crackType}
        </div>
      ),
    },
    {
      key: 'dimensions',
      title: t('buildingDetail.table.dimensions'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Ruler className="h-3.5 w-3.5 mr-1.5 text-blue-500 dark:text-blue-400" />
          {item.length} × {item.width} × {item.depth} m
        </div>
      ),
    },
    {
      key: 'description',
      title: t('buildingDetail.table.description'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <TextIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
          {item.description}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: t('buildingDetail.table.recordedDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-green-500 dark:text-green-400" />
          {formatDate(item.createdAt)}
        </div>
      ),
    },
  ]

  // Define columns for device table
  const deviceColumns: Column<Device>[] = [
    {
      key: 'index',
      title: t('buildingDetail.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: t('buildingDetail.table.deviceName'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
          {getDeviceIcon(item.type)}
          {item.name}
        </div>
      ),
    },
    {
      key: 'type',
      title: t('buildingDetail.table.type'),
      render: item => <div className="text-sm text-gray-500 dark:text-gray-400">{item.type}</div>,
    },
    {
      key: 'manufacturer',
      title: t('buildingDetail.table.manufacturer'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.manufacturer}</div>
      ),
    },
    {
      key: 'model',
      title: t('buildingDetail.table.model'),
      render: item => <div className="text-sm text-gray-500 dark:text-gray-400">{item.model}</div>,
    },
  ]

  // Define columns for maintenance history table
  const maintenanceColumns: Column<MaintenanceHistory>[] = [
    {
      key: 'index',
      title: t('buildingDetail.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(maintenanceCurrentPage - 1) * maintenanceItemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'device',
      title: t('buildingDetail.table.deviceName'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Tv className="h-3.5 w-3.5 mr-1.5 text-blue-500 dark:text-blue-400" />
          {item.device.name} ({item.device.type})
        </div>
      ),
    },
    {
      key: 'date_performed',
      title: t('buildingDetail.table.maintenanceDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-green-500 dark:text-green-400" />
          {formatDate(item.date_performed)}
        </div>
      ),
    },
    {
      key: 'description',
      title: t('buildingDetail.table.description'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <WrenchIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
          {item.description}
        </div>
      ),
    },
    {
      key: 'cost',
      title: t('buildingDetail.table.cost'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <DollarSign className="h-3.5 w-3.5 mr-1.5 text-yellow-500 dark:text-yellow-400" />
          {formatCurrency(item.cost)}
        </div>
      ),
    },
  ]

  // Helper function to get icon based on device type
  const getDeviceIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'HVAC':
        return <Tv className="h-3.5 w-3.5 mr-1.5 text-blue-500 dark:text-blue-400" />
      case 'ELECTRICAL':
        return <Cpu className="h-3.5 w-3.5 mr-1.5 text-yellow-500 dark:text-yellow-400" />
      case 'PLUMBING':
        return <ToyBrick className="h-3.5 w-3.5 mr-1.5 text-green-500 dark:text-green-400" />
      default:
        return <Cog className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
    }
  }

  if (isLoadingBuildingDetail) {
    return <LoadingIndicator />
  }

  if (buildingDetailError || !buildingDetail) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-500">{t('buildingDetail.error')}</h2>
        <p className="mt-2">
          {t('buildingDetail.notFound')} {id}
        </p>
        <button
          onClick={handleGoBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center"
        >
          <ChevronRight size={16} className="mr-2" />
          {t('buildingDetail.goBack')}
        </button>
      </div>
    )
  }

  if (crackRecordsError) {
    toast.error(`${t('buildingDetail.errorLoadingCracks')} ${crackRecordsError.message || t('buildingDetail.unknownError')}`)
  }

  if (maintenanceHistoryError) {
    toast.error(
      `${t('buildingDetail.errorLoadingMaintenance')} ${maintenanceHistoryError.message || t('buildingDetail.unknownError')}`
    )
  }

  // Get status color class
  const getStatusStyle = (status: string) => {
    if (status === 'operational') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
  }

  return (
    <div className="w-full">
      <div className="bg-white-900 dark:bg-gray-800 dark:text-white p-4 flex items-center">
        <Link to="/buildings-for-manager" className="hover:text-blue-400 transition-colors mr-2">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 mr-1" />
            {t('buildingManagement.title')}
          </div>
        </Link>
        <ChevronRight size={16} className="mx-1" />
        <span className="font-medium">{buildingDetail?.name || t('buildingDetail.title')}</span>
      </div>

      <div className="p-6">
        {/* Header with overview information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Building2 className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {buildingDetail.name}
              {buildingDetail.building?.area?.name && ` (${buildingDetail.building.area.name})`}
            </h1>
            {buildingDetail.building?.Status && (
              <span
                className={`ml-4 px-3 py-1 text-xs font-medium rounded-full ${getStatusStyle(buildingDetail.building.Status)}`}
              >
                {getStatusLabel(buildingDetail.building.Status)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingDetail.area')}</div>
                <div className="font-medium text-gray-900 dark:text-white">{buildingDetail.building?.area?.name || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingDetail.floors')}</div>
                <div className="font-medium text-gray-900 dark:text-white">{buildingDetail.building?.numberFloor || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingDetail.construction')}</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDate(buildingDetail.building?.construction_date)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('buildingDetail.completion')}</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDate(buildingDetail.building?.completion_date)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center text-gray-900 dark:text-white">
                <Info className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                {t('buildingDetail.buildingInfo')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span className="font-medium">{t('buildingDetail.floors')}:</span>{' '}
                {buildingDetail.building?.numberFloor || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span className="font-medium">{t('buildingDetail.apartments')}:</span>{' '}
                {buildingDetail.total_apartments || 0}
              </p>
              {buildingDetail.building?.Status && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span className="font-medium">{t('buildingDetail.status')}:</span>{' '}
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${buildingDetail.building.Status === 'operational'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}
                  >
                    {getStatusLabel(buildingDetail.building.Status)}
                  </span>
                </p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center text-gray-900 dark:text-white">
                <Calendar className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                {t('buildingDetail.dates')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">{t('buildingDetail.created')}: {formatDate(buildingDetail.createdAt)}</span>
              </p>
              {buildingDetail.building?.construction_date && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-orange-500 dark:text-orange-400" />
                  <span className="font-medium">{t('buildingDetail.construction')}: {formatDate(buildingDetail.building.construction_date)}</span>
                </p>
              )}
              {buildingDetail.building?.completion_date && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-green-500 dark:text-green-400" />
                  <span className="font-medium">{t('buildingDetail.completion')}: {formatDate(buildingDetail.building.completion_date)}</span>
                </p>
              )}
              {buildingDetail.building?.Warranty_date && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-blue-500 dark:text-blue-400" />
                  <span className="font-medium">{t('buildingDetail.warrantyUntil')}: {formatDate(buildingDetail.building.Warranty_date)}</span>
                </p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center text-gray-900 dark:text-white">
                <TextIcon className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                {t('buildingDetail.description')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {buildingDetail.building?.description || t('buildingDetail.noDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Device Table Section */}
        {buildingDetail.device && buildingDetail.device.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
              <Cpu className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
              {t('buildingDetail.devices')} ({buildingDetail.device.length})
            </h2>

            <Table<Device>
              data={buildingDetail.device}
              columns={deviceColumns}
              keyExtractor={item => item.device_id}
              isLoading={false}
              emptyText={t('buildingDetail.noDevices')}
              tableClassName="w-full"
              className="w-full"
            />
          </div>
        )}

        {/* Maintenance History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <WrenchIcon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
            {t('buildingDetail.maintenanceHistory')}
          </h2>

          {isLoadingMaintenanceHistory ? (
            <LoadingIndicator />
          ) : maintenanceHistoryError ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{t('buildingDetail.errorLoadingMaintenance')}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {t('buildingDetail.errorLoadingMaintenance')}
              </p>
            </div>
          ) : maintenanceHistory.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <WrenchIcon className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('buildingDetail.noMaintenance')}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-1.5" />
                  {t('buildingDetail.showingRecords')}: { maintenanceHistory.length }
                </p>
              </div>

              <Table<MaintenanceHistory>
                data={maintenanceHistory}
                columns={maintenanceColumns}
                keyExtractor={item => item.maintenance_id}
                isLoading={isLoadingMaintenanceHistory}
                emptyText={t('buildingDetail.noMaintenance')}
                tableClassName="w-full"
                className="w-full"
              />

              {maintenancePagination && (
                <Pagination
                  currentPage={maintenanceCurrentPage}
                  totalPages={maintenancePagination.totalPages}
                  onPageChange={setMaintenanceCurrentPage}
                  totalItems={maintenancePagination.total}
                  itemsPerPage={maintenanceItemsPerPage}
                  onLimitChange={setMaintenanceItemsPerPage}
                  className="mt-4"
                />
              )}
            </>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500 dark:text-red-400" />
            {t('buildingDetail.crackRecords')}
          </h2>

          {isLoadingCrackRecords ? (
            <LoadingIndicator />
          ) : crackRecordsError ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{t('buildingDetail.errorLoadingCracks')}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {t('buildingDetail.errorLoadingCracks')}
              </p>
            </div>
          ) : crackRecords.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <FileWarning className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('buildingDetail.noCracks')}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-1.5" />
                  {t('buildingDetail.showingRecords', { count: crackRecords.length })}
                </p>
              </div>

              <Table<CrackRecord>
                data={crackRecords}
                columns={crackColumns}
                keyExtractor={item => item.crackRecordId}
                isLoading={isLoadingCrackRecords}
                emptyText={t('buildingDetail.noCracks')}
                tableClassName="w-full"
                className="w-full"
              />

              {pagination && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={pagination.total}
                  itemsPerPage={itemsPerPage}
                  onLimitChange={setItemsPerPage}
                  className="mt-4"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildingDetail
