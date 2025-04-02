import React, { useState, useEffect } from "react";
import Table, { Column } from "@/components/Table";
import { Residents } from "@/types";
import DropdownMenu from "@/components/DropDownMenu";
import SearchInput from "@/components/SearchInput";
import AddButton from "@/components/AddButton";
import AddResident from "@/components/Residents/AddResidents/AddResidents";
import RemoveResident from "@/components/Residents/RemoveResidents/RemoveResidents";
import ConfirmStatusChangeModal from "@/components/Residents/StatusResidents/ConfirmStatusChangeModal";
import Pagination from "@/components/Pagination";
import { Toaster } from "react-hot-toast";
import { useAddNewResident } from "@/components/Residents/AddResidents/use-add-new-residents";
import { useRemoveResident } from "@/components/Residents/RemoveResidents/use-remove-residents";
import { FiUserPlus } from "react-icons/fi";
import { getAllResidents, updateResidentStatus } from "@/services/residents";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const Resident: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [residents, setResidents] = useState<Residents[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState<boolean>(false);
  const [residentToChangeStatus, setResidentToChangeStatus] = useState<Residents | null>(null);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch residents data
  const fetchResidents = async () => {
    try {
      setLoading(true);
      const result = await getAllResidents({
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        status: selectedStatus
      });

      setResidents(result.data);
      setTotalItems(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError("Failed to fetch residents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API mỗi khi thay đổi các tham số
  useEffect(() => {
    fetchResidents();
  }, [currentPage, itemsPerPage, selectedStatus]);

  // Xử lý tìm kiếm với debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchResidents();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const openStatusChangeModal = (resident: Residents) => {
    setResidentToChangeStatus(resident);
    setIsStatusChangeModalOpen(true);
  };

  // Xử lý thay đổi trạng thái resident
  const handleChangeStatus = async () => {
    if (!residentToChangeStatus) return;
    
    try {
      // Xác định trạng thái mới
      const newStatus = residentToChangeStatus.accountStatus === 'Active' ? 'Inactive' : 'Active';
      
      // Gọi API để cập nhật trạng thái
      await updateResidentStatus(residentToChangeStatus.userId, newStatus);
      
      // Tải lại dữ liệu sau khi cập nhật
      fetchResidents();
      
      // Hiển thị thông báo thành công
      toast.success(`Trạng thái của ${residentToChangeStatus.username} đã được thay đổi thành ${newStatus}`);
      
      // Đóng modal
      setIsStatusChangeModalOpen(false);
      setResidentToChangeStatus(null);
    } catch (error) {
      console.error('Không thể thay đổi trạng thái của resident:', error);
      toast.error('Không thể thay đổi trạng thái của resident');
    }
  };

  const { isLoading, isModalOpen, openModal, closeModal, addResident } =
    useAddNewResident({
      onAddSuccess: (newResident) => {
        // Tải lại dữ liệu sau khi thêm thành công
        fetchResidents();
      },
    });

  const {
    isModalOpen: isRemoveModalOpen,
    isLoading: isRemoving,
    residentToRemove,
    openModal: openRemoveModal,
    closeModal: closeRemoveModal,
    removeResident,
  } = useRemoveResident({
    onRemoveSuccess: () => {
      // Tải lại dữ liệu sau khi xóa thành công
      fetchResidents();
    },
  });

  // Xử lý thay đổi filter
  // const handleStatusFilter = (value: string) => {
  //   setSelectedStatus(value);
  //   setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi filter
  // };
  
  const filterOptions = [
    { value: "all", label: "Tất cả" },
    { value: "Active", label: "Hoạt động" },
    { value: "Inactive", label: "Không hoạt động" },
  ];

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
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.gender === "Male"
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
            return <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>;
          }

          // Tạo đối tượng Date từ chuỗi ngày tháng
          const date = new Date(item.dateOfBirth);

          // Kiểm tra xem date có hợp lệ không
          if (isNaN(date.getTime())) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">Invalid date</div>;
          }

          // Format ngày tháng theo định dạng dd/mm/yyyy
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const year = date.getFullYear();

          const formattedDate = `${day}/${month}/${year}`;
          return <div className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</div>;
        } catch (error) {
          console.error("Error formatting date:", error);
          return <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>;
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
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.accountStatus === "Active"
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
          onViewDetail={() => console.log("View detail clicked")}
          onChangeStatus={() => openStatusChangeModal(item)}
          onRemove={() => openRemoveModal(item)}
        />
      ),
      width: "80px",
    },
  ];

  // Handle submission from the AddResident component
  const handleAddResident = async (residentData: any) => {
    await addResident(residentData);
  };

  // Loading animation
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  };

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">Loading residents data...</p>
    </div>
  );

  if (loading && residents.length === 0) {
    return <LoadingIndicator />;
  }

  if (error && residents.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full mt-[60px]">
      <Toaster position="top-right" />

      <div className="flex flex-col gap-4 mb-4 ml-[90px] mr-[132px]">
        <div className="flex justify-between items-center">
          <SearchInput
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[30rem] max-w-xs"
          />

          <div className="flex gap-4">

            <AddButton label="Add User" icon={<FiUserPlus />} onClick={openModal} />
          </div>
        </div>
      </div>

      <Table<Residents>
        data={residents}
        columns={columns}
        keyExtractor={(item) => item.userId}
        onRowClick={(item) => console.log("Row clicked:", item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
        isLoading={loading}
        emptyText="Không tìm thấy dữ liệu"
      />

      {/* Thêm component phân trang */}
      <div className="w-[95%] mx-auto">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onLimitChange={setItemsPerPage}
        />
      </div>

      <AddResident
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={handleAddResident}
        isLoading={isLoading}
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
    </div>
  );
};

export default Resident;
