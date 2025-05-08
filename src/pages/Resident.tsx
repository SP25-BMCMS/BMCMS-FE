import React, { useState } from 'react'
import Table, { Column } from '@/components/Table'
import { Residents } from '@/types'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import AddButton from '@/components/AddButton'
import AddResident from '@/components/Residents/AddResidents/AddResidents'
import RemoveResident from '@/components/Residents/RemoveResidents/RemoveResidents'
import ConfirmStatusChangeModal from '@/components/Residents/StatusResidents/ConfirmStatusChangeModal'
import Pagination from '@/components/Pagination'
import { Toaster } from 'react-hot-toast'
import { useAddNewResident } from '@/components/Residents/AddResidents/use-add-new-residents'
import { useRemoveResident } from '@/components/Residents/RemoveResidents/use-remove-residents'
import { FiUserPlus } from 'react-icons/fi'
import { getAllResidents, updateResidentStatus } from '@/services/residents'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import ViewDetailResident from '@/components/Residents/ViewDetailResident'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Tooltip from '@/components/Tooltip'
import { useDebounce } from '@/hooks/useDebounce'

interface ResidentsResponse {
  data: Residents[]
  pagination: {
    total: number
    totalPages: number
  }
}

const Resident: React.FC = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState<boolean>(false)
  const [residentToChangeStatus, setResidentToChangeStatus] = useState<Residents | null>(null)
  const [isViewDetailOpen, setIsViewDetailOpen] = useState<boolean>(false)
  const [selectedResident, setSelectedResident] = useState<Residents | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const queryClient = useQueryClient()
  const debouncedSearchTerm = useDebounce(searchTerm, 1500)

  // Fetch residents with React Query
  const { data: residentsResponse, isLoading: isLoadingResidents } = useQuery<ResidentsResponse>({
    queryKey: ['residents', debouncedSearchTerm, currentPage, itemsPerPage, selectedStatus],
    queryFn: async () => {
      try {
        const result = await getAllResidents({
          search: debouncedSearchTerm.trim() || undefined,
          page: currentPage,
          limit: itemsPerPage,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
        })
        return result
      } catch (error) {
        console.error('Error fetching residents:', error)
        return {
          data: [],
          pagination: {
            total: 0,
            totalPages: 0
          }
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  // Format residents data with safe default
  const residentsList = React.useMemo(() => {
    if (!residentsResponse?.data) return []
    return residentsResponse.data
  }, [residentsResponse?.data])

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      newStatus,
    }: {
      userId: string
      newStatus: 'Active' | 'Inactive'
    }) => {
      try {
        const result = await updateResidentStatus(userId, newStatus)
        return { userId, newStatus, result }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || t('residentManagement.statusUpdateError')
        throw new Error(errorMessage)
      }
    },
    onMutate: async ({ userId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['residents'] })
      const previousResidents = queryClient.getQueryData(['residents'])
      queryClient.setQueryData(['residents'], (old: any) => {
        if (!old || !old.data) return old
        return {
          ...old,
          data: old.data.map((resident: Residents) =>
            resident.userId === userId ? { ...resident, accountStatus: newStatus } : resident
          ),
        }
      })
      return { previousResidents }
    },
    onError: (error: any, variables, context) => {
      if (context?.previousResidents) {
        queryClient.setQueryData(['residents'], context.previousResidents)
      }
      toast.error(error.message || t('residentManagement.statusUpdateError'))
    },
    onSuccess: data => {
      toast.success(t('residentManagement.statusUpdateSuccess', { status: data.newStatus }))
      queryClient.invalidateQueries({ queryKey: ['residents'] })
    },
  })

  const openStatusChangeModal = (resident: Residents) => {
    setResidentToChangeStatus(resident)
    setIsStatusChangeModalOpen(true)
  }

  const handleChangeStatus = async () => {
    if (!residentToChangeStatus) return

    const newStatus = residentToChangeStatus.accountStatus === 'Active' ? 'Inactive' : 'Active'
    updateStatusMutation.mutate({
      userId: residentToChangeStatus.userId,
      newStatus: newStatus as 'Active' | 'Inactive',
    })
    setIsStatusChangeModalOpen(false)
    setResidentToChangeStatus(null)
  }

  const {
    isLoading: isAdding,
    isModalOpen,
    openModal,
    closeModal,
    addResident,
  } = useAddNewResident({
    onAddSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] })
    },
  })

  const {
    isModalOpen: isRemoveModalOpen,
    isLoading: isRemoving,
    residentToRemove,
    openModal: openRemoveModal,
    closeModal: closeRemoveModal,
    removeResident,
  } = useRemoveResident({
    onRemoveSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] })
    },
  })

  const filterOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'Active', label: t('residentManagement.status.active') },
    { value: 'Inactive', label: t('residentManagement.status.inactive') }
  ]

  const columns: Column<Residents>[] = [
    {
      key: 'index',
      title: t('residentManagement.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: t('residentManagement.table.name'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.username}</div>
      ),
    },
    {
      key: 'email',
      title: t('residentManagement.table.email'),
      render: item => {
        const email = item.email
        if (email.length > 8) {
          return (
            <Tooltip content={email} position="top">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {email.substring(0, 8)}...
              </div>
            </Tooltip>
          )
        }
        return <div className="text-sm text-gray-500 dark:text-gray-400">{email}</div>
      },
    },
    {
      key: 'phone',
      title: t('residentManagement.table.phone'),
      render: item => <div className="text-sm text-gray-500 dark:text-gray-400">{item.phone}</div>,
    },
    {
      key: 'Gender',
      title: t('residentManagement.table.gender'),
      render: item => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.gender === 'Male'
            ? 'bg-[#FBCD17] bg-opacity-35 text-[#FBCD17] border border-[#FBCD17]'
            : 'bg-[#FF6B98] bg-opacity-30 text-[#FF6B98] border border-[#FF6B98]'
            }`}
        >
          {t(`residentManagement.genderOptions.${item.gender.toLowerCase()}`)}
        </span>
      ),
    },
    {
      key: 'Date Of Birth',
      title: t('residentManagement.table.dateOfBirth'),
      render: item => {
        try {
          if (!item.dateOfBirth) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>
          }

          const date = new Date(item.dateOfBirth)

          if (isNaN(date.getTime())) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">Invalid date</div>
          }

          const day = date.getDate().toString().padStart(2, '0')
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const year = date.getFullYear()

          const formattedDate = `${day}/${month}/${year}`
          return <div className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</div>
        } catch (error) {
          console.error('Error formatting date:', error)
          return <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>
        }
      },
    },
    {
      key: 'createdDate',
      title: t('residentManagement.table.createdDate'),
      render: item => {
        try {
          if (!item.createdDate) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>
          }

          const date = new Date(item.createdDate)

          if (isNaN(date.getTime())) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">Invalid date</div>
          }

          const day = date.getDate().toString().padStart(2, '0')
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const year = date.getFullYear()

          const formattedDate = `${day}/${month}/${year}`
          return <div className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</div>
        } catch (error) {
          console.error('Error formatting date:', error)
          return <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>
        }
      },
    },
    {
      key: 'status',
      title: t('residentManagement.table.status'),
      render: item => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.accountStatus === 'Active'
            ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
            : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
            }`}
        >
          {item.accountStatus}
        </span>
      ),
    },
    {
      key: 'action',
      title: t('residentManagement.table.action'),
      render: item => (
        <DropdownMenu
          onViewDetail={() => handleViewDetail(item)}
          onChangeStatus={() => openStatusChangeModal(item)}
        // onRemove={() => openRemoveModal(item)}
        />
      ),
      width: '80px',
    },
  ]

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
      <p className="text-gray-700 dark:text-gray-300">{t('residentManagement.loading')}</p>
    </div>
  )

  const handleViewDetail = (resident: Residents) => {
    setSelectedResident(resident)
    setIsViewDetailOpen(true)
  }

  if (isLoadingResidents) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-full mt-[30px] md:mt-[60px] px-3 sm:px-4 md:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <SearchInput
          placeholder={t('residentManagement.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-[20rem] max-w-full md:max-w-xs"
        />
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[750px] h-[calc(100vh-340px)] overflow-y-auto">
          <Table<Residents>
            data={residentsList}
            columns={columns}
            keyExtractor={item => item.userId}
            onRowClick={item => { }}
            className="w-full"
            tableClassName="w-full"
            isLoading={isLoadingResidents}
            emptyText={t('residentManagement.noData')}
          />
        </div>
      </div>

      {residentsResponse?.pagination?.total > 0 && (
        <div className="w-full mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={residentsResponse.pagination.totalPages || 1}
            onPageChange={setCurrentPage}
            totalItems={residentsResponse.pagination.total || 0}
            itemsPerPage={itemsPerPage}
            onLimitChange={setItemsPerPage}
          />
        </div>
      )}

      <style>
        {`
          /* Table scrollbar styles */
          .min-w-\\[750px\\]::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          .min-w-\\[750px\\]::-webkit-scrollbar-track {
            background: transparent;
          }

          .min-w-\\[750px\\]::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }

          .dark .min-w-\\[750px\\]::-webkit-scrollbar-thumb {
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

      {/* <AddResident
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={handleAddResident}
        isLoading={isAdding}
      /> */}
      <ConfirmStatusChangeModal
        isOpen={isStatusChangeModalOpen}
        onClose={() => setIsStatusChangeModalOpen(false)}
        onConfirm={handleChangeStatus}
        resident={residentToChangeStatus}
      />
      {/* <RemoveResident
        isOpen={isRemoveModalOpen}
        onClose={closeRemoveModal}
        onConfirm={removeResident}
        isLoading={isRemoving}
        resident={residentToRemove}
      /> */}
      <ViewDetailResident
        isOpen={isViewDetailOpen}
        onClose={() => setIsViewDetailOpen(false)}
        resident={selectedResident}
      />
    </div>
  )
}

export default Resident
