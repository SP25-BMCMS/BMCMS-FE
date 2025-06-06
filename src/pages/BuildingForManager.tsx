import TechnicalRecordModal from '@/components/BuildingManager/buildings/TechnicalRecordModal'
import Pagination from '@/components/Pagination'
import SearchInput from '@/components/SearchInput'
import Table, { Column } from '@/components/Table'
import { STATUS_COLORS } from '@/constants/colors'
import apiInstance from '@/lib/axios'
import { BuildingResponse } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Calendar, Clock, Eye, FileText, Home, MapPin } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

interface BuildingWithArea extends BuildingResponse {
  area?: {
    areaId: string
    name: string
    description: string
    createdAt: string
    updatedAt: string
  }
  buildingDetails?: Array<{
    buildingDetailId: string
    buildingId: string
    name: string
    total_apartments: number
    createdAt: string
    updatedAt: string
  }>
}

interface BuildingManagerResponse {
  statusCode: number
  message: string
  data: BuildingWithArea[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const BuildingForManager: React.FC = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  })
  const navigate = useNavigate()
  const [isTechnicalRecordModalOpen, setIsTechnicalRecordModalOpen] = useState(false)
  const [selectedBuildingForTechnicalRecord, setSelectedBuildingForTechnicalRecord] = useState<{
    id: string
    name: string
    detailId: string | null
  } | null>(null)

  // Function to fetch buildings data
  const fetchBuildingsData = async ({ pageParam = 1 }) => {
    const user = JSON.parse(localStorage.getItem('bmcms_user') || '{}')
    const params = new URLSearchParams()

    params.append('page', pageParam.toString())
    params.append('limit', pagination.itemsPerPage.toString())
    if (searchQuery) params.append('search', searchQuery)

    const url = `${import.meta.env.VITE_VIEW_BUILDING_LIST_FOR_MANAGER.replace('{managerId}', user.userId)}?${params.toString()}`

    const { data } = await apiInstance.get<BuildingManagerResponse>(url)
    return data
  }

  // Use TanStack Query for data fetching
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['buildings', pagination.currentPage, pagination.itemsPerPage, searchQuery],
    queryFn: () => fetchBuildingsData({ pageParam: pagination.currentPage }),
  })

  // Extract data and update pagination when data changes
  const buildingsData = data as BuildingManagerResponse | undefined

  React.useEffect(() => {
    if (buildingsData?.meta) {
      setPagination(prev => ({
        ...prev,
        totalPages: buildingsData.meta?.totalPages || 1,
        totalItems: buildingsData.meta?.total || 0,
      }))
    }
  }, [buildingsData])

  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page,
    }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      itemsPerPage: limit,
    }))
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = () => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }))
    refetch()
  }

  const handleViewDetail = (building: BuildingWithArea) => {
    if (building.buildingDetails && building.buildingDetails.length > 0) {
      const buildingDetailId = building.buildingDetails[0].buildingDetailId
      navigate(`/buildingdetails/${buildingDetailId}`)
    } else {
      toast.error(t('buildingManagement.noBuildingDetails'))
    }
  }

  const handleOpenTechnicalRecordModal = (buildingDetail: BuildingWithArea['buildingDetails'][0], building: BuildingWithArea) => {
    setSelectedBuildingForTechnicalRecord({
      id: building.buildingId,
      name: buildingDetail.name,
      detailId: buildingDetail.buildingDetailId
    })
    setIsTechnicalRecordModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusStyle = (status: string) => {
    if (status === 'operational') {
      return {
        bg: STATUS_COLORS.ACTIVE.BG,
        text: STATUS_COLORS.ACTIVE.TEXT,
        border: STATUS_COLORS.ACTIVE.BORDER,
        label: t('buildingManagement.status.operational'),
      }
    }
    return {
      bg: STATUS_COLORS.IN_PROGRESS.BG,
      text: STATUS_COLORS.IN_PROGRESS.TEXT,
      border: STATUS_COLORS.IN_PROGRESS.BORDER,
      label: t('buildingManagement.status.under_construction'),
    }
  }

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
      <p className="text-gray-700 dark:text-gray-300">{t('buildingManagement.loading')}</p>
    </div>
  )

  const columns: Column<BuildingWithArea['buildingDetails'][0]>[] = [
    {
      key: 'index',
      title: t('buildingManagement.table1.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: t('buildingManagement.table1.buildingName'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Home className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          {item.name}
        </div>
      ),
    },
    {
      key: 'total_apartments',
      title: t('buildingManagement.table.totalApartments'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.total_apartments}</div>
      ),
    },
    {
      key: 'createdAt',
      title: t('buildingManagement.table1.createdDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(item.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      title: t('buildingManagement.table.action'),
      render: (item) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={e => {
              e.stopPropagation()
              navigate(`/buildingdetails/${item.buildingDetailId}`)
            }}
            className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title={t('buildingManagement.viewDetails')}
          >
            <Eye size={16} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              const building = buildingsData?.data.find(b => b.buildingId === item.buildingId)
              if (building) {
                handleOpenTechnicalRecordModal(item, building)
              }
            }}
            className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            title={t('buildingManagement.technicalRecords')}
          >
            <FileText size={16} />
          </button>
        </div>
      ),
      width: '120px',
    },
  ]

  return (
    <div className="w-full mt-[60px] px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="flex justify-between mb-4">
        <div className="flex items-center">
          <SearchInput
            placeholder={t('buildingManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={handleSearch}
            onSearch={handleSearchSubmit}
            className="w-full md:w-[20rem] max-w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          {buildingsData?.data.map((building) => (
            <div key={building.buildingId} className="mb-8">
              {/* Building Information Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
                <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                  <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={building.imageCover}
                      alt={building.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-500" />
                        {building.name}
                      </h2>
                      <span
                        style={{
                          backgroundColor: getStatusStyle(building.Status).bg,
                          color: getStatusStyle(building.Status).text,
                          borderColor: getStatusStyle(building.Status).border,
                        }}
                        className="px-3 py-1 text-sm font-semibold rounded-full border whitespace-nowrap"
                      >
                        {getStatusStyle(building.Status).label}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{building.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="h-5 w-5 mr-2 text-green-500" />
                        <span>{building.area?.name || t('buildingManagement.notAssigned')}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                        <span>{t('buildingManagement.completionDate')}: {formatDate(building.completion_date)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="h-5 w-5 mr-2 text-purple-500" />
                        <span>{t('buildingManagement.warrantyDate')}: {formatDate(building.Warranty_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Building Details Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('buildingManagement.buildingDetails')}
                  </h3>
                </div>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table<BuildingWithArea['buildingDetails'][0]>
                      data={building.buildingDetails || []}
                      columns={columns}
                      keyExtractor={item => item.buildingDetailId}
                      isLoading={isLoading}
                      emptyText={t('buildingManagement.noData')}
                      animated={true}
                      tableClassName="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(buildingsData?.data?.length || 0) > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onLimitChange={handleLimitChange}
              className="mt-4"
            />
          )}
        </>
      )}

      {/* Technical Record Modal */}
      {selectedBuildingForTechnicalRecord && (
        <TechnicalRecordModal
          isOpen={isTechnicalRecordModalOpen}
          onClose={() => setIsTechnicalRecordModalOpen(false)}
          buildingId={selectedBuildingForTechnicalRecord.id}
          buildingDetailId={selectedBuildingForTechnicalRecord.detailId}
          buildingName={selectedBuildingForTechnicalRecord.name}
        />
      )}
    </div>
  )
}

export default BuildingForManager
