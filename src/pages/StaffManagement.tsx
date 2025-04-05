import React, { useState, useEffect, useCallback } from "react"
import Table, { Column } from "@/components/Table"
import { Staff } from "@/types"
import { FiUserPlus } from "react-icons/fi"
import DropdownMenu from "@/components/DropDownMenu"
import SearchInput from "@/components/SearchInput"
import AddButton from "@/components/AddButton"
import { getAllStaff } from "@/services/staffs"
import { StaffData } from "@/types"
import AddStaff from "@/components/Staff/AddStaff/AddStaff"
import { useAddStaff } from "@/components/Staff/AddStaff/use-add-staff"
import { Toaster } from "react-hot-toast"
import { motion } from "framer-motion"
import DepartmentPositionModal from "@/components/Staff/DepartmentPositionModal"
import ViewDetailStaff from '@/components/Staff/ViewDetailStaff'

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isDeptPosModalOpen, setIsDeptPosModalOpen] = useState(false)
  const [isViewDetailOpen, setIsViewDetailOpen] = useState<boolean>(false)

  const { isModalOpen, isLoading, openModal, closeModal, addNewStaff } = useAddStaff({
    onAddSuccess: () => {
      // Tải lại danh sách nhân viên sau khi thêm thành công
      fetchStaffData(false)
    },
  })

  // Sử dụng useCallback để tránh tạo lại hàm mỗi khi component render
  const fetchStaffData = useCallback(async (shouldSetLoading = true) => {
    if (shouldSetLoading) {
      setLoading(true)
    }

    try {
      const response = await getAllStaff()
      if (response.isSuccess) {
        // Chuyển đổi dữ liệu API sang định dạng Staff
        const formattedStaff: Staff[] = response.data.map((staff: StaffData) => ({
          id: staff.userId,
          name: staff.username,
          email: staff.email,
          phone: staff.phone,
          role: staff.role as Staff['role'],
          dateOfBirth: new Date(staff.dateOfBirth).toLocaleDateString(),
          gender: staff.gender,
          createdDate: new Date().toLocaleDateString(), // Tạo ngày hiện tại cho createdDate
        }))
        setStaffList(formattedStaff)
      }
    } catch (error) {
      console.error("Failed to fetch staff data:", error)
    } finally {
      if (shouldSetLoading) {
        setLoading(false)
      }
    }
  }, [])

  // Chỉ fetch dữ liệu một lần khi component mount và khi searchTerm thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaffData(true)
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(timer)
  }, [fetchStaffData, searchTerm])

  const handleViewDetail = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsViewDetailOpen(true)
  }

  const handleOpenDeptPosModal = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsDeptPosModalOpen(true)
  }

  // Optimistic update for staff changes
  const handleStaffUpdateSuccess = (staffId: string, updatedData: Partial<Staff>) => {
    setStaffList(prevStaffList =>
      prevStaffList.map(staff =>
        staff.id === staffId
          ? { ...staff, ...updatedData }
          : staff
      )
    )

    // Fetch fresh data in the background without showing loading state
    fetchStaffData(false)
  }

  const columns: Column<Staff>[] = [
    {
      key: "index",
      title: "No",
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</div>
      ),
      width: "60px",
    },
    {
      key: "name",
      title: "Staff Name",
      render: (item) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
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
      )
    },
    {
      key: "role",
      title: "Role",
      render: (item) => {
        const roleColors = {
          Leader:
            "bg-[#0eeffe] bg-opacity-30 border border-[#0eeffe] text-[#0084FF]",
          Staff:
            "bg-[#F213FE] bg-opacity-30 border border-[#F213FE] text-[#F213FE]",
          Manager:
            "bg-[#360AFE] bg-opacity-30 border border-[#360AFE] text-[#360AFE]",
          Admin:
            "bg-[#50f186] bg-opacity-30 border border-[#50f186] text-[#00ff90]",
        }
        return (
          <span
            className={`inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-full px-4 py-1 min-w-[82px] text-center ${roleColors[item.role] || "text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
              }`}
          >
            {item.role}
          </span>
        )
      },
    },
    {
      key: "Gender",
      title: "Gender",
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.gender === "Male"
            ? "bg-[#FBCD17] bg-opacity-35 text-[#FBCD17] border border-[#FBCD17]"
            : "bg-[#360AFE] bg-opacity-30 text-[#360AFE] border border-[#360AFE]"
            }`}
        >
          {item.gender}
        </span>
      ),
    },
    {
      key: "dateOfBirth",
      title: "Date Of Birth",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.dateOfBirth}</div>
      ),
    },
    {
      key: "createdDate",
      title: "Created Date",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.createdDate}</div>
      ),
    },
    {
      key: "action",
      title: "Action",
      render: (item) => (
        <DropdownMenu
          onViewDetail={() => handleViewDetail(item)}
          onChangeStatus={() => handleOpenDeptPosModal(item)}
          onRemove={() => console.log("Remove clicked", item)}
          changeStatusTitle="Change Department"
        />
      ),
      width: "80px",
    },
  ]

  // Lọc danh sách nhân viên dựa trên từ khóa tìm kiếm
  const filteredStaff = staffList.filter((staff) =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Loading animation
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
      <p className="text-gray-700 dark:text-gray-300">Loading staff data...</p>
    </div>
  )

  return (
    <div className="w-full mt-[60px]">
      <Toaster position="top-right" />

      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput
          placeholder="Tìm kiếm theo tên hoặc ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[20rem] max-w-xs"
        />

        <AddButton
          label="Add Staff"
          icon={<FiUserPlus />}
          onClick={openModal}
        />
      </div>

      {loading ? (
        <LoadingIndicator />
      ) : (
        <Table<Staff>
          data={filteredStaff}
          columns={columns}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => console.log("Row clicked:", item)}
          className="w-[95%] mx-auto"
          tableClassName="w-full"
          emptyText="Không tìm thấy dữ liệu nhân viên"
        />
      )}

      {/* Component thêm nhân viên */}
      <AddStaff
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={addNewStaff}
        isLoading={isLoading}
      />
      {isDeptPosModalOpen && selectedStaff && (
        <DepartmentPositionModal
          isOpen={isDeptPosModalOpen}
          onClose={() => setIsDeptPosModalOpen(false)}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
          onSaveSuccess={() => {
            // Optimistic update
            if (selectedStaff) {
              handleStaffUpdateSuccess(selectedStaff.id, {})
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
