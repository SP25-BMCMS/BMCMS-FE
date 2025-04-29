import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Building2, MapPin, FileText } from 'lucide-react'
import Table, { Column } from '@/components/Table'
import { BuildingResponse } from '@/types'
import apiInstance from '@/lib/axios'
import { toast } from 'react-hot-toast'
import { STATUS_COLORS } from '@/constants/colors'
import Pagination from '@/components/Pagination'
import SearchInput from '@/components/SearchInput'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import TechnicalRecordModal from '@/components/BuildingManager/buildings/TechnicalRecordModal'
import { useTranslation } from 'react-i18next'

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

  const handleOpenTechnicalRecordModal = (building: BuildingWithArea) => {
    setSelectedBuildingForTechnicalRecord({
      id: building.buildingId,
      name: building.name,
      detailId:
        building.buildingDetails && building.buildingDetails.length > 0
          ? building.buildingDetails[0].buildingDetailId
          : null,
    })
    setIsTechnicalRecordModalOpen(true)
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

  const columns: Column<BuildingWithArea>[] = [
    {
      key: 'index',
      title: t('buildingManagement.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: t('buildingManagement.table.buildingName'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Building2 className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          {item.name}
        </div>
      ),
    },
    {
      key: 'area',
      title: t('buildingManagement.table.areaName'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <MapPin className="h-3.5 w-3.5 mr-1.5 text-green-500" />
          {item.area?.name || t('buildingManagement.notAssigned')}
        </div>
      ),
    },
    {
      key: 'numberFloor',
      title: t('buildingManagement.table.floor'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.numberFloor}</div>
      ),
    },
    {
      key: 'Status',
      title: t('buildingManagement.table.status'),
      render: item => {
        const statusStyle = getStatusStyle(item.Status)
        return (
          <span
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              borderColor: statusStyle.border,
            }}
            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border"
          >
            {statusStyle.label}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      title: t('buildingManagement.table.createdDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'completion_date',
      title: t('buildingManagement.table.completionDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(item.completion_date).toLocaleDateString('vi-VN')}
        </div>
      ),
    },
    {
      key: 'actions',
      title: t('buildingManagement.table.action'),
      render: item => (
        <div className="flex justify-center gap-2">
          <button
            onClick={e => {
              e.stopPropagation()
              handleViewDetail(item)
            }}
            className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title={t('buildingManagement.viewDetails')}
          >
            <Eye size={16} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              handleOpenTechnicalRecordModal(item)
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
    <div className="w-full mt-[60px]">
      <div className="flex justify-between mb-4 mx-auto w-[95%]">
        <div className="flex items-center">
          <SearchInput
            placeholder={t('buildingManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={handleSearch}
            onSearch={handleSearchSubmit}
            className="w-[20rem] max-w-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          <Table
            data={buildingsData?.data || []}
            columns={columns}
            keyExtractor={item => item.buildingId}
            isLoading={isLoading}
            emptyText={t('buildingManagement.noData')}
            onRowClick={item => handleViewDetail(item)}
            animated={true}
            tableClassName="w-full"
            className="w-[95%] mx-auto"
          />

          {(buildingsData?.data?.length || 0) > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onLimitChange={handleLimitChange}
              className="w-[95%] mx-auto mt-4"
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
