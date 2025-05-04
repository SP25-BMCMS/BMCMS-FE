import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table, { Column } from '@/components/Table'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import FilterDropdown from '@/components/FilterDropdown'
import Pagination from '@/components/Pagination'
import { CrackReportResponse, Crack, CrackListParams, CrackListPaginationResponse } from '@/types'
import crackApi from '@/services/cracks'
import StatusCrack from '@/components/crackManager/StatusCrack'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { AxiosError } from 'axios'
import { STATUS_COLORS } from '@/constants/colors'
import { useTranslation } from 'react-i18next'

interface ErrorResponse {
  message: string
}

interface ApiResponse {
  isSuccess: boolean
  message: string
  data: {
    data: CrackReportResponse[]
    pagination: CrackListPaginationResponse['pagination']
  }
}

// Map API response to UI model
const mapCrackResponseToCrack = (response: CrackReportResponse): Crack => {
  return {
    id: response.crackReportId,
    reportDescription: response.description,
    createdDate: new Date(response.createdAt).toLocaleDateString(),
    status:
      response.status === 'Pending'
        ? 'pending'
        : response.status === 'InProgress'
          ? 'InProgress'
          : response.status === 'Reviewing'
            ? 'Reviewing'
            : 'resolved',
    residentId:
      typeof response.reportedBy === 'object' ? response.reportedBy.userId : response.reportedBy,
    residentName:
      typeof response.reportedBy === 'object' ? response.reportedBy.username : 'Unknown',
    description: response.description,
    originalImage: response.crackDetails[0]?.photoUrl,
    aiDetectedImage: response.crackDetails[0]?.aiDetectionUrl,
  }
}

interface CracksQueryData {
  cracks: Crack[]
  pagination: CrackListPaginationResponse['pagination']
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
  const [selectedCrack, setSelectedCrack] = useState<Crack | null>(null)

  const severityOptions = [
    { value: 'all', label: t('crackManagement.filterOptions.all') },
    { value: 'Low', label: t('crackManagement.filterOptions.low') },
    { value: 'Medium', label: t('crackManagement.filterOptions.medium') },
    { value: 'High', label: t('crackManagement.filterOptions.high') },
  ]

  // Get status animation class
  const getStatusAnimationClass = (status: string) => {
    switch (status) {
      case 'resolved':
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
  const handleStatusUpdate = (crack: Crack) => {
    setSelectedCrack(crack)
    setIsStatusModalOpen(true)
  }

  const columns: Column<Crack>[] = [
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
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.createdDate}</div>
      ),
    },
    {
      key: 'status',
      title: t('crackManagement.table.status'),
      render: item => {
        const statusColors =
          item.status === 'resolved'
            ? STATUS_COLORS.RESOLVED
            : item.status === 'InProgress'
              ? STATUS_COLORS.IN_PROGRESS
              : item.status === 'Reviewing'
                ? STATUS_COLORS.REVIEWING
                : STATUS_COLORS.PENDING

        return (
          <span
            className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full"
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
              {item.status !== 'resolved' && (
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{
                    backgroundColor: statusColors.TEXT,
                  }}
                ></span>
              )}
            </span>
            {item.status === 'resolved'
              ? t('crackManagement.status.resolved')
              : item.status === 'InProgress'
                ? t('crackManagement.status.inProgress')
                : item.status === 'Reviewing'
                  ? t('crackManagement.status.reviewing')
                  : t('crackManagement.status.pending')}
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
              ['InProgress', 'resolved', 'Reviewing'].includes(item.status)
                ? undefined
                : () => handleStatusUpdate(item)
            }
            onRemove={() => console.log('Remove', item)}
          />
        </div>
      ),
      width: '80px',
    },
  ]

  return (
    <div className="w-full mt-[60px]">
      <div className="flex flex-col space-y-4 mb-4 ml-[90px] mr-[132px]">
        <div className="flex justify-between">
          <SearchInput
            placeholder={t('crackManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className="w-[20rem] max-w-xs"
          />

          <div className="flex space-x-4">
            <FilterDropdown
              options={severityOptions}
              onSelect={handleSeverityChange}
              buttonClassName="w-[160px]"
              selectedValue={selectedSeverity}
              label={t('crackManagement.severity')}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            {/* Pending */}
            <div className="flex items-center">
              <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse-fast"
                  style={{ backgroundColor: STATUS_COLORS.PENDING.TEXT }}
                ></span>
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{ backgroundColor: STATUS_COLORS.PENDING.TEXT }}
                ></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.pending')}</span>
            </div>

            {/* In Progress */}
            <div className="flex items-center">
              <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: STATUS_COLORS.IN_PROGRESS.TEXT }}
                ></span>
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{ backgroundColor: STATUS_COLORS.IN_PROGRESS.TEXT }}
                ></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.inProgress')}</span>
            </div>

            {/* Reviewing */}
            <div className="flex items-center">
              <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: STATUS_COLORS.REVIEWING.TEXT }}
                ></span>
                <span
                  className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                  style={{ backgroundColor: STATUS_COLORS.REVIEWING.TEXT }}
                ></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.reviewing')}</span>
            </div>

            {/* Resolved */}
            <div className="flex items-center">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: STATUS_COLORS.RESOLVED.TEXT }}
              ></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('crackManagement.status.resolved')}</span>
            </div>
          </div>

          {/* Total Cracks */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {t('crackManagement.totalCracks', { count: cracksData?.pagination.total || 0 })}
          </div>
        </div>
      </div>

      <Table<Crack>
        data={cracksData?.cracks || []}
        columns={columns}
        keyExtractor={item => item.id}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
        isLoading={isLoading || isFetching}
        emptyText={t('crackManagement.noData')}
      />

      {!isLoading && cracksData && (
        <div className="w-[95%] mx-auto">
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
    </div>
  )
}

export default CrackManagement
