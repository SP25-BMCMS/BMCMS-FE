import React, { useState } from 'react'
import Table, { Column } from '@/components/Table'
import { Staff, StaffData } from '@/types'
import { FiUserPlus } from 'react-icons/fi'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import AddButton from '@/components/AddButton'
import { getAllStaff } from '@/services/staffs'
import AddStaff from '@/components/Staff/AddStaff/AddStaff'
import { useAddStaff } from '@/components/Staff/AddStaff/use-add-staff'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import DepartmentPositionModal from '@/components/Staff/DepartmentPositionModal'
import ViewDetailStaff from '@/components/Staff/ViewDetailStaff'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Pagination from '@/components/Pagination'
import FilterDropdown from '@/components/FilterDropdown'
import { useTranslation } from 'react-i18next'

interface StaffResponse {
  isSuccess: boolean
  data: StaffData[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const StaffManagement: React.FC = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isDeptPosModalOpen, setIsDeptPosModalOpen] = useState(false)
  const [isViewDetailOpen, setIsViewDetailOpen] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedRole, setSelectedRole] = useState<string>('all')

  const queryClient = useQueryClient()

  // Define role filter options
  const roleOptions = [
    { value: 'all', label: t('staffManagement.filterOptions.all') },
    { value: 'Staff', label: t('staffManagement.filterOptions.staff') },
    { value: 'Manager', label: t('staffManagement.filterOptions.manager') },
    { value: 'Admin', label: t('staffManagement.filterOptions.admin') },
  ]

  // Fetch staff with React Query
  const { data: staffResponse, isLoading: isLoadingStaff } = useQuery<StaffResponse>({
    queryKey: ['staff', searchTerm, currentPage, itemsPerPage, selectedRole],
    queryFn: async () => {
      const response = await getAllStaff()
      return {
        ...response,
        pagination: response.pagination || {
          total: response.data.length,
          page: currentPage,
          limit: itemsPerPage,
          totalPages: Math.ceil(response.data.length / itemsPerPage),
        },
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  // Format staff data
  const allStaffList =
    staffResponse?.data.map((staff: StaffData) => ({
      id: staff.userId,
      name: staff.username,
      email: staff.email,
      phone: staff.phone,
      role: staff.role as Staff['role'],
      dateOfBirth: new Date(staff.dateOfBirth).toLocaleDateString(),
      gender: staff.gender,
      createdDate: new Date().toLocaleDateString(),
      userDetails: staff.userDetails,
    })) || []

  const {
    isModalOpen,
    isLoading: isAdding,
    openModal,
    closeModal,
    addNewStaff,
  } = useAddStaff({
    onAddSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const handleViewDetail = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsViewDetailOpen(true)
  }

  const handleOpenDeptPosModal = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsDeptPosModalOpen(true)
  }

  const handleRoleChange = (role: string) => {
    setSelectedRole(role)
    setCurrentPage(1) // Reset to first page when changing filter
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({
      staffId,
      updatedData,
    }: {
      staffId: string
      updatedData: Partial<Staff>
    }) => {
      return { staffId, updatedData }
    },
    onMutate: async ({ staffId, updatedData }) => {
      await queryClient.cancelQueries({ queryKey: ['staff'] })
      const previousStaff = queryClient.getQueryData(['staff'])
      queryClient.setQueryData(['staff'], (old: StaffResponse) => ({
        ...old,
        data: old.data.map((staff: StaffData) =>
          staff.userId === staffId ? { ...staff, ...updatedData } : staff
        ),
      }))
      return { previousStaff }
    },
    onError: (err, variables, context) => {
      if (context?.previousStaff) {
        queryClient.setQueryData(['staff'], context.previousStaff)
      }
      toast.error(t('staffManagement.updateError'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const columns: Column<Staff>[] = [
    {
      key: 'index',
      title: t('staffManagement.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: t('staffManagement.table.name'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
      ),
    },
    {
      key: 'email',
      title: t('staffManagement.table.email'),
      render: item => <div className="text-sm text-gray-500 dark:text-gray-400">{item.email}</div>,
    },
    {
      key: 'phone',
      title: t('staffManagement.table.phone'),
      render: item => <div className="text-sm text-gray-500 dark:text-gray-400">{item.phone}</div>,
    },
    {
      key: 'role',
      title: t('staffManagement.table.role'),
      render: item => {
        const roleColors = {
          Leader: 'bg-[#0eeffe] bg-opacity-30 border border-[#0eeffe] text-[#0084FF]',
          Staff: 'bg-[#F213FE] bg-opacity-30 border border-[#F213FE] text-[#F213FE]',
          Manager: 'bg-[#360AFE] bg-opacity-30 border border-[#360AFE] text-[#360AFE]',
          Admin: 'bg-[#50f186] bg-opacity-30 border border-[#50f186] text-[#00ff90]',
        }
        return (
          <span
            className={`inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-full px-4 py-1 min-w-[82px] text-center ${roleColors[item.role] ||
              'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
          >
            {item.role}
          </span>
        )
      },
    },
    {
      key: 'department',
      title: t('staffManagement.table.department'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {item.userDetails?.department?.departmentName || '-'}
        </div>
      ),
    },
    {
      key: 'Gender',
      title: t('staffManagement.table.gender'),
      render: item => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.gender === 'Male'
            ? 'bg-[#FBCD17] bg-opacity-35 text-[#FBCD17] border border-[#FBCD17]'
            : 'bg-[#360AFE] bg-opacity-30 text-[#360AFE] border border-[#360AFE]'
            }`}
        >
          {item.gender}
        </span>
      ),
    },
    {
      key: 'dateOfBirth',
      title: t('staffManagement.table.dateOfBirth'),
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.dateOfBirth}</div>
      ),
    },
    {
      key: 'action',
      title: t('staffManagement.table.action'),
      render: item => (
        <div onClick={e => e.stopPropagation()}>
          <DropdownMenu
            onViewDetail={() => handleViewDetail(item)}
            onChangeStatus={() => handleOpenDeptPosModal(item)}
            onRemove={() => console.log('Remove clicked', item)}
            changeStatusTitle={t('staffManagement.changeDepartment')}
          />
        </div>
      ),
      width: '80px',
    },
  ]

  // Lọc danh sách nhân viên dựa trên từ khóa tìm kiếm và role
  const filteredStaffList = allStaffList.filter(
    staff =>
      (staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedRole === 'all' || staff.role === selectedRole)
  )

  // Apply pagination to filtered staff
  const paginatedStaff = filteredStaffList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculate total pages
  const totalPages = Math.ceil(filteredStaffList.length / itemsPerPage)

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
      <p className="text-gray-700 dark:text-gray-300">{t('staffManagement.loading')}</p>
    </div>
  )

  if (isLoadingStaff && allStaffList.length === 0) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-full mt-[60px]">
      <Toaster position="top-right" />

      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput
          placeholder={t('staffManagement.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-[20rem] max-w-xs"
        />

        <div className="flex items-center space-x-4">
          <FilterDropdown
            options={roleOptions}
            onSelect={handleRoleChange}
            selectedValue={selectedRole}
            label={t('staffManagement.filterByRole')}
            buttonClassName="w-[150px]"
          />
          <AddButton label={t('staffManagement.addStaff')} icon={<FiUserPlus />} onClick={openModal} />
        </div>
      </div>

      <Table<Staff>
        data={paginatedStaff}
        columns={columns}
        keyExtractor={item => item.id}
        onRowClick={item => console.log('Row clicked:', item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
        isLoading={isLoadingStaff}
        emptyText={t('staffManagement.noData')}
      />

      <div className="w-[95%] mx-auto mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredStaffList.length}
          itemsPerPage={itemsPerPage}
          onLimitChange={handleLimitChange}
          limitOptions={[5, 10, 20, 50]}
        />
      </div>

      <AddStaff
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={addNewStaff}
        isLoading={isAdding}
      />
      {isDeptPosModalOpen && selectedStaff && (
        <DepartmentPositionModal
          isOpen={isDeptPosModalOpen}
          onClose={() => setIsDeptPosModalOpen(false)}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
          onSaveSuccess={() => {
            if (selectedStaff) {
              updateStaffMutation.mutate({
                staffId: selectedStaff.id,
                updatedData: {},
              })
            }
          }}
        />
      )}
      {isViewDetailOpen && selectedStaff && (
        <ViewDetailStaff
          isOpen={isViewDetailOpen}
          onClose={() => setIsViewDetailOpen(false)}
          staffId={selectedStaff.id}
        />
      )}
    </div>
  )
}

export default StaffManagement
