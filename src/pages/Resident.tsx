import React, { useState } from "react"
import Table, { Column } from "@/components/Table"
import { Residents } from "@/types"
import DropdownMenu from "@/components/DropDownMenu"
import SearchInput from "@/components/SearchInput"
import AddButton from "@/components/AddButton"
import AddResident from "@/components/Residents/AddResidents/AddResidents"
import RemoveResident from "@/components/Residents/RemoveResidents/RemoveResidents"
import ConfirmStatusChangeModal from "@/components/Residents/StatusResidents/ConfirmStatusChangeModal"
import Pagination from "@/components/Pagination"
import { Toaster } from "react-hot-toast"
import { useAddNewResident } from "@/components/Residents/AddResidents/use-add-new-residents"
import { useRemoveResident } from "@/components/Residents/RemoveResidents/use-remove-residents"
import { FiUserPlus } from "react-icons/fi"
import { getAllResidents, updateResidentStatus } from "@/services/residents"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import ViewDetailResident from "@/components/Residents/ViewDetailResident"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import FilterDropdown from "@/components/FilterDropdown"

interface ResidentsCacheData {
  data: Residents[]
  pagination: {
    total: number
    totalPages: number
  }
}

type ResidentStatus = "Active" | "Inactive"

interface AddResidentData {
  fullName: string
  dateOfBirth: Date | null | string
  createdDate: string
  role: string
  area: string
  status: "active" | "inactive"
  gender: string
}

interface ResidentsResponse {
  data: Residents[]
  pagination: {
    total: number
    totalPages: number
  }
}

const Resident: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState<boolean>(false)
  const [residentToChangeStatus, setResidentToChangeStatus] = useState<Residents | null>(null)
  const [isViewDetailOpen, setIsViewDetailOpen] = useState<boolean>(false)
  const [selectedResident, setSelectedResident] = useState<Residents | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [selectedStatus, setSelectedStatus] = useState<ResidentStatus | "all">("all")

  const queryClient = useQueryClient()

  // Fetch residents with React Query
  const { data: residentsData, isLoading: isLoadingResidents } = useQuery<ResidentsResponse>({
    queryKey: ['residents', currentPage, itemsPerPage, searchTerm, selectedStatus],
    queryFn: async () => {
      const params = {
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        status: selectedStatus !== "all" ? selectedStatus : undefined
      }
      const response = await getAllResidents(params)
      return response
    },
    initialData: {
      data: [],
      pagination: {
        total: 0,
        totalPages: 1
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false
  })

  // Update resident status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string, newStatus: ResidentStatus }) => {
      await updateResidentStatus(userId, newStatus)
      return { userId, newStatus }
    },
    onMutate: async ({ userId, newStatus }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['residents'] })

      // Snapshot the previous value
      const previousResidents = queryClient.getQueryData(['residents'])

      // Optimistically update to the new value
      queryClient.setQueryData(['residents'], (old: ResidentsCacheData) => ({
        ...old,
        data: old.data.map((resident: Residents) =>
          resident.userId === userId
            ? { ...resident, accountStatus: newStatus }
            : resident
        )
      }))

      return { previousResidents }
    },
    onError: (err, variables, context) => {
      // Revert back to the previous value
      if (context?.previousResidents) {
        queryClient.setQueryData(['residents'], context.previousResidents)
      }
      toast.error('Failed to update resident status!')
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['residents'] })
    },
  })

  const openStatusChangeModal = (resident: Residents) => {
    setResidentToChangeStatus(resident)
    setIsStatusChangeModalOpen(true)
  }

  const handleChangeStatus = async () => {
    if (!residentToChangeStatus) return

    const newStatus: ResidentStatus = residentToChangeStatus.accountStatus === 'Active' ? 'Inactive' : 'Active'
    updateStatusMutation.mutate({
      userId: residentToChangeStatus.userId,
      newStatus
    })
    setIsStatusChangeModalOpen(false)
    setResidentToChangeStatus(null)
  }

  const { isLoading: isAdding, isModalOpen, openModal, closeModal, addResident } =
    useAddNewResident({
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

  const filterOptions: { value: ResidentStatus | "all"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "Active", label: "Hoạt động" },
    { value: "Inactive", label: "Không hoạt động" },
  ]

  const columns: Column<Residents>[] = [
    {
      key: "index",
      title: "No",
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: "60px",
    },
    {
      key: "name",
      title: "Resident Name",
      render: (item) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {item.username}
        </div>
      ),
    },
    {
      key: "email",
      title: "Email",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.email}</div>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.phone}</div>
      ),
    },
    {
      key: "Gender",
      title: "Gender",
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.gender === "Male"
            ? "bg-[#FBCD17] bg-opacity-35 text-[#FBCD17] border border-[#FBCD17]"
            : "bg-[#FF6B98] bg-opacity-30 text-[#FF6B98] border border-[#FF6B98]"
            }`}
        >
          {item.gender}
        </span>
      ),
    },
    {
      key: "Date Of Birth",
      title: "Date Of Birth",
      render: (item) => {
        try {
          // Kiểm tra nếu dateOfBirth là undefined hoặc null
          if (!item.dateOfBirth) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>
          }

          // Tạo đối tượng Date từ chuỗi ngày tháng
          const date = new Date(item.dateOfBirth)

          // Kiểm tra xem date có hợp lệ không
          if (isNaN(date.getTime())) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">Invalid date</div>
          }

          // Format ngày tháng theo định dạng dd/mm/yyyy
          const day = date.getDate().toString().padStart(2, "0")
          const month = (date.getMonth() + 1).toString().padStart(2, "0")
          const year = date.getFullYear()

          const formattedDate = `${day}/${month}/${year}`
          return <div className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</div>
        } catch (error) {
          console.error("Error formatting date:", error)
          return <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>
        }
      },
    },

    {
      key: "createdDate",
      title: "Created Date",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.createdDate}</div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.accountStatus === "Active"
            ? "bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]"
            : "bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]"
            }`}
        >
          {item.accountStatus}
        </span>
      ),
    },
    {
      key: "action",
      title: "Action",
      render: (item) => (
        <DropdownMenu
          onViewDetail={() => handleViewDetail(item)}
          onChangeStatus={() => openStatusChangeModal(item)}
          onRemove={() => openRemoveModal(item)}
        />
      ),
      width: "80px",
    },
  ]

  const handleAddResident = async (residentData: AddResidentData) => {
    await addResident(residentData)
  }

  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">Loading residents data...</p>
    </div>
  )

  const handleViewDetail = (resident: Residents) => {
    setSelectedResident(resident)
    setIsViewDetailOpen(true)
  }

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value as ResidentStatus | "all")
    setCurrentPage(1)
  }

  if (isLoadingResidents && (!residentsData?.data || residentsData.data.length === 0)) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-full mt-[60px]">
      <Toaster position="top-right" />

      <div className="flex flex-col gap-4 mb-4 ml-[90px] mr-[132px]">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <SearchInput
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[30rem] max-w-xs"
            />
            <FilterDropdown
              options={filterOptions}
              onSelect={handleStatusFilter}
              selectedValue={selectedStatus}
            />
          </div>

          <div className="flex gap-4">
            <AddButton label="Add User" icon={<FiUserPlus />} onClick={openModal} />
          </div>
        </div>
      </div>

      <Table<Residents>
        data={(residentsData as ResidentsResponse)?.data || []}
        columns={columns}
        keyExtractor={(item) => item.userId}
        onRowClick={(item) => console.log("Row clicked:", item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
        isLoading={isLoadingResidents}
        emptyText="Không tìm thấy dữ liệu"
      />

      <div className="w-[95%] mx-auto">
        <Pagination
          currentPage={currentPage}
          totalPages={(residentsData as ResidentsResponse)?.pagination.totalPages || 1}
          onPageChange={setCurrentPage}
          totalItems={(residentsData as ResidentsResponse)?.pagination.total || 0}
          itemsPerPage={itemsPerPage}
          onLimitChange={setItemsPerPage}
        />
      </div>

      <AddResident
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={handleAddResident}
        isLoading={isAdding}
      />
      <ConfirmStatusChangeModal
        isOpen={isStatusChangeModalOpen}
        onClose={() => setIsStatusChangeModalOpen(false)}
        onConfirm={handleChangeStatus}
        resident={residentToChangeStatus}
      />
      <RemoveResident
        isOpen={isRemoveModalOpen}
        onClose={closeRemoveModal}
        onConfirm={removeResident}
        isLoading={isRemoving}
        resident={residentToRemove}
      />
      <ViewDetailResident
        isOpen={isViewDetailOpen}
        onClose={() => setIsViewDetailOpen(false)}
        resident={selectedResident}
      />
    </div>
  )
}

export default Resident