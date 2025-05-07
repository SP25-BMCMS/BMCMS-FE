import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table, { Column } from '@/components/Table'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import FilterDropdown from '@/components/FilterDropdown'
import Pagination from '@/components/Pagination'
import { CrackListParams, CrackListPaginationResponse } from '@/types'
import crackApi, { useDeleteCrackReport } from '@/services/cracks'
import StatusCrack from '@/components/crackManager/StatusCrack'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { FORMAT_DATE } from '@/utils/format'
import ConfirmModal from '@/components/ConfirmModal'

interface ErrorResponse {
  message: string
}

// API Response interface
interface CrackReportResponseType {
  crackReportId: string
  buildingDetailId: string
  description: string
  isPrivatesAsset: boolean
  position: string
  status: string
  statusLabel: string
  reportedBy: {
    userId: string
    username: string
  } | string
  verifiedBy: {
    userId: string
    username: string
  } | null
  createdAt: string
  updatedAt: string
  crackDetails: Array<{
    crackDetailsId: string
    photoUrl: string
    aiDetectionUrl: string
    severity: string
    severityLabel: string
  }>
  building: {
    buildingId: string
    name: string
    area: {
      areaId: string
      name: string
    }
  }
  buildingDetail: {
    buildingDetailId: string
    name: string
  }
}

// Define local Crack interface for UI
interface CrackUI {
  id: string
  reportDescription: string
  createdDate: string
  status: string
  residentId: string
  residentName: string
  description: string
  originalImage: string
  aiDetectedImage: string
  buildingInfo: {
    buildingName: string
    buildingDetailName: string
    areaName: string
  }
}

// Map API response to UI model
const mapCrackResponseToCrack = (response: CrackReportResponseType): CrackUI => {
  return {
    id: response.crackReportId,
    reportDescription: response.description,
    createdDate: new Date(response.createdAt).toLocaleDateString(),
    status: response.status,
    residentId:
      typeof response.reportedBy === 'object' ? response.reportedBy.userId : response.reportedBy,
    residentName:
      typeof response.reportedBy === 'object' ? response.reportedBy.username : 'Unknown',
    description: response.description,
    originalImage: response.crackDetails[0]?.photoUrl,
    aiDetectedImage: response.crackDetails[0]?.aiDetectionUrl,
    buildingInfo: {
      buildingName: response.building?.name || 'N/A',
      buildingDetailName: response.buildingDetail?.name || 'N/A',
      areaName: response.building?.area?.name || 'N/A'
    }
  }
}

interface ApiResponse {
  isSuccess: boolean
  message: string
  data: {
    data: CrackReportResponseType[]
    pagination: CrackListPaginationResponse['pagination']
  }
}

interface CracksQueryData {
  cracks: CrackUI[]
  pagination: CrackListPaginationResponse['pagination']
}

const STATUS_COLORS_MAP = {
  Pending: {
    BG: 'rgba(254, 164, 19, 0.35)',
    TEXT: '#FFA500',
    BORDER: '#FFA500'
  },
  InProgress: {
    BG: 'rgba(54, 10, 254, 0.35)',
    TEXT: '#360AFE',
    BORDER: '#360AFE'
  },
  Reviewing: {
    BG: 'rgba(88, 86, 214, 0.35)',
    TEXT: '#5856D6',
    BORDER: '#5856D6'
  },
  Completed: {
    BG: 'rgba(80, 241, 134, 0.35)',
    TEXT: '#50F186',
    BORDER: '#50F186'
  },
  Rejected: {
    BG: 'rgba(248, 8, 8, 0.3)',
    TEXT: '#ff0000',
    BORDER: '#f80808'
  },
  InFixing: {
    BG: 'rgba(254, 164, 19, 0.35)',
    TEXT: '#FFA500',
    BORDER: '#FFA500'
  },
  WaitingConfirm: {
    BG: 'rgba(254, 164, 19, 0.35)',
    TEXT: '#FFA500',
    BORDER: '#FFA500'
  }
}

const CrackManagement: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedCrack, setSelectedCrack] = useState<CrackUI | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [crackToDelete, setCrackToDelete] = useState<CrackUI | null>(null)

  const severityOptions = [
    { value: 'all', label: t('crackManagement.filterOptions.all') },
    { value: 'Low', label: t('crackManagement.filterOptions.low') },
    { value: 'Medium', label: t('crackManagement.filterOptions.medium') },
    { value: 'High', label: t('crackManagement.filterOptions.high') },
  ]

  // Get status animation class
  const getStatusAnimationClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return ''
      case 'InProgress':
        return 'animate-pulse'
      default:
        return 'animate-pulse-fast'
    }
  }

  // Build query params
  const getQueryParams = (): CrackListParams => {
    const params: CrackListParams = {
      page: currentPage,
      limit: itemsPerPage,
    }

    if (searchTerm) {
      params.search = searchTerm
    }

    if (selectedStatus !== 'all') {
      params.status = selectedStatus as 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing'
    }

    if (selectedSeverity !== 'all') {
      params.severityFilter = selectedSeverity as 'Low' | 'Medium' | 'High'
    }

    return params
  }

  // Fetch cracks using React Query
  const queryOptions: UseQueryOptions<CracksQueryData> = {
    queryKey: ['cracks', currentPage, itemsPerPage, selectedStatus, selectedSeverity, searchTerm],
    queryFn: async () => {
      try {
        const params = getQueryParams()
        const response = await crackApi.getCrackList(params) as unknown as ApiResponse

        // Kiểm tra response có thành công không
        if (!response.isSuccess) {
          throw new Error(response.message || 'Failed to fetch cracks')
        }

        return {
          cracks: response.data.data.map(mapCrackResponseToCrack),
          pagination: response.data.pagination,
        }
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>
        const errorMessage = axiosError.response?.data?.message || 'Failed to fetch cracks'
        toast.error(errorMessage)
        throw error // Vẫn throw error để React Query có thể retry
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Chỉ retry 1 lần
  }

  const { data: cracksData, isLoading, isFetching } = useQuery<CracksQueryData>(queryOptions)

  const deleteCrackMutation = useDeleteCrackReport()

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // const handleStatusChange = (value: string) => {
  //   setSelectedStatus(value)
  //   setCurrentPage(1)
  // }

  const handleSeverityChange = (value: string) => {
    setSelectedSeverity(value)
    setCurrentPage(1)
  }

  // Handle status update with staff assignment
  const handleStatusUpdate = (crack: CrackUI) => {
    setSelectedCrack(crack)
    setIsStatusModalOpen(true)
  }

  const handleDeleteClick = (crack: CrackUI) => {
    setCrackToDelete(crack)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!crackToDelete) return

    try {
      await deleteCrackMutation.mutateAsync(crackToDelete.id)
      toast.success(t('crackManagement.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['cracks'] })
      setIsDeleteModalOpen(false)
      setCrackToDelete(null)
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>
      const errorMessage = axiosError.response?.data?.message || t('crackManagement.deleteError')
      toast.error(errorMessage)
    }
  }

  const columns: Column<CrackUI>[] = [
    {
      key: 'index',
      title: t('crackManagement.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'reportDescription',
      title: t('crackManagement.table.description'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {item.reportDescription}
        </div>
      ),
    },
    {
      key: 'buildingInfo',
      title: t('common.building'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div className="font-medium">{item.buildingInfo.buildingDetailName}</div>
          <div className="text-xs opacity-75">
            {item.buildingInfo.buildingName} - {item.buildingInfo.areaName}
          </div>
        </div>
      ),
    },
    {
      key: 'residentName',
      title: t('crackManagement.table.reportedBy'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.residentName}</div>
      ),
    },
    {
      key: 'createdDate',
      title: t('crackManagement.table.createdDate'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{FORMAT_DATE(item.createdDate)}</div>
      ),
    },
    {
      key: 'status',
      title: t('crackManagement.table.status'),
      render: item => {
        const statusColors = STATUS_COLORS_MAP[item.status as keyof typeof STATUS_COLORS_MAP] || STATUS_COLORS_MAP.Pending

        return (
          <span
            className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full`}
            style={{
              backgroundColor: statusColors.BG,
              color: statusColors.TEXT,
              border: `1px solid ${statusColors.BORDER}`,
            }}
          >
            <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: statusColors.TEXT,
                }}
              ></span>
              {item.status !== 'Completed' && (
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{
                    backgroundColor: statusColors.TEXT,
                  }}
                ></span>
              )}
            </span>
            {t(`crackManagement.status.${item.status.toLowerCase()}`)}
          </span>
        )
      },
    },
    {
      key: 'action',
      title: t('crackManagement.table.action'),
      render: item => (
        <div onClick={e => e.stopPropagation()}>
          <DropdownMenu
            onViewDetail={() => navigate(`/crack/detail/${item.id}`)}
            onChangeStatus={
              ['InProgress', 'Completed', 'Reviewing'].includes(item.status)
                ? undefined
                : () => handleStatusUpdate(item)
            }
            onRemove={() => handleDeleteClick(item)}
          />
        </div>
      ),
      width: '80px',
    },
  ]

  return (
    <div className="w-full mt-[60px] px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <SearchInput
            placeholder={t('crackManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className="w-full md:w-[20rem] max-w-full"
          />

          <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
            <FilterDropdown
              options={severityOptions}
              onSelect={handleSeverityChange}
              buttonClassName="w-full sm:w-[160px]"
              selectedValue={selectedSeverity}
              label={t('crackManagement.severity')}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex flex-wrap gap-4">
            {/* Pending */}
            <div className="flex items-center">
              <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse-fast"
                  style={{ backgroundColor: STATUS_COLORS_MAP.Pending.TEXT }}
                ></span>
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{ backgroundColor: STATUS_COLORS_MAP.Pending.TEXT }}
                ></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.pending')}</span>
            </div>

            {/* In Progress */}
            <div className="flex items-center">
              <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: STATUS_COLORS_MAP.InProgress.TEXT }}
                ></span>
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{ backgroundColor: STATUS_COLORS_MAP.InProgress.TEXT }}
                ></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.inProgress')}</span>
            </div>

            {/* Reviewing */}
            <div className="flex items-center">
              <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: STATUS_COLORS_MAP.Reviewing.TEXT }}
                ></span>
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{ backgroundColor: STATUS_COLORS_MAP.Reviewing.TEXT }}
                ></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.reviewing')}</span>
            </div>

            {/* Completed */}
            <div className="flex items-center">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: STATUS_COLORS_MAP.Completed.TEXT }}
              ></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.completed')}</span>
            </div>
          </div>

          {/* Total Cracks */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {t('crackManagement.totalCracks', { count: cracksData?.pagination.total || 0 })}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[1024px] h-[calc(100vh-400px)] overflow-y-auto">
          <Table<CrackUI>
            data={cracksData?.cracks || []}
            columns={columns}
            keyExtractor={item => item.id}
            className="w-full"
            tableClassName="w-full"
            isLoading={isLoading || isFetching}
            emptyText={t('crackManagement.noData')}
          />
        </div>
      </div>

      {!isLoading && cracksData && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={cracksData.pagination.totalPages}
            onPageChange={setCurrentPage}
            totalItems={cracksData.pagination.total}
            itemsPerPage={itemsPerPage}
            onLimitChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Status Change Modal */}
      {selectedCrack && (
        <StatusCrack
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          crackId={selectedCrack.id}
          crackStatus={selectedCrack.status}
          onUpdateSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['cracks'] })
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setCrackToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title={t('crackManagement.deleteConfirmTitle')}
        message={t('crackManagement.deleteConfirmMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteCrackMutation.isPending}
      />

      <style>
        {`
          /* Fix dropdown menu positioning */
          .dropdown-menu {
            position: fixed;
            z-index: 50;
            min-width: 160px;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
            transform: translateY(0);
          }

          .dark .dropdown-menu {
            background: #1f2937;
            border-color: #374151;
          }

          /* Ensure dropdown is visible when near bottom of table */
          .table-container {
            position: relative;
          }

          /* Fix overflow issues */
          .overflow-x-auto {
            overflow-x: auto;
            overflow-y: visible;
          }

          /* Ensure dropdown items are visible */
          .dropdown-item {
            display: block;
            width: 100%;
            padding: 0.5rem 1rem;
            clear: both;
            font-weight: 400;
            color: #374151;
            text-align: inherit;
            white-space: nowrap;
            background-color: transparent;
            border: 0;
            cursor: pointer;
          }

          .dark .dropdown-item {
            color: #e5e7eb;
          }

          .dropdown-item:hover {
            background-color: #f3f4f6;
          }

          .dark .dropdown-item:hover {
            background-color: #374151;
          }

          /* Add styles for dropdown button container */
          .dropdown-button-container {
            position: relative;
            display: inline-block;
          }

          /* Fix table cell positioning */
          td {
            position: relative;
          }

          /* Table scrollbar styles */
          .min-w-\\[1024px\\]::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          .min-w-\\[1024px\\]::-webkit-scrollbar-track {
            background: transparent;
          }

          .min-w-\\[1024px\\]::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }

          .dark .min-w-\\[1024px\\]::-webkit-scrollbar-thumb {
            background-color: rgba(75, 85, 99, 0.5);
          }

          /* Ensure table header stays fixed */
          thead {
            position: sticky;
            top: 0;
            z-index: 10;
            background: white;
          }

          .dark thead {
            background: #1f2937;
          }
        `}
      </style>
    </div>
  )
}

export default CrackManagement
