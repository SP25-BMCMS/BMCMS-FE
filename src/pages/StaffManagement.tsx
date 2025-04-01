import React, { useState, useEffect } from "react";
import Table, { Column } from "@/components/Table";
import { Staff } from "@/types";
import { FiUserPlus } from "react-icons/fi";
import DropdownMenu from "@/components/DropDownMenu";
import SearchInput from "@/components/SearchInput";
import AddButton from "@/components/AddButton";
import { getAllStaff } from "@/services/staffs";
import { StaffData } from "@/types";
import AddStaff from "@/components/Staff/AddStaff/AddStaff";
import { useAddStaff } from "@/components/Staff/AddStaff/use-add-staff";
import { Toaster } from "react-hot-toast";

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { isModalOpen, isLoading, openModal, closeModal, addNewStaff } = useAddStaff({
    onAddSuccess: () => {
      // Tải lại danh sách nhân viên sau khi thêm thành công
      fetchStaffData();
    },
  });

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await getAllStaff();
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
        }));
        setStaffList(formattedStaff);
      }
    } catch (error) {
      console.error("Failed to fetch staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const columns: Column<Staff>[] = [
    {
      key: "index",
      title: "No",
      render: (_, index) => (
        <span className="text-sm text-gray-500">{index + 1}</span>
      ),
      width: "60px",
    },
    {
      key: "name",
      title: "Staff Name",
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
      ),
    },
    {
      key: "email",
      title: "Email",
      render: (item) => (
        <span className="text-sm text-gray-500">{item.email}</span>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (item) => (
        <span className="text-sm text-gray-500">{item.phone}</span>
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
        };
        return (
          <span
            className={`inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-full px-4 py-1 min-w-[82px] text-center ${
              roleColors[item.role] || "text-gray-700 border border-gray-300"
            }`}
          >
            {item.role}
          </span>
        );
      },
    },
    {
      key: "Gender",
      title: "Gender",
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.gender === "Male"
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
        <span className="text-sm text-gray-500">{item.dateOfBirth}</span>
      ),
    },
    {
      key: "createdDate",
      title: "Created Date",
      render: (item) => (
        <span className="text-sm text-gray-500">{item.createdDate}</span>
      ),
    },
    {
      key: "action",
      title: "Action",
      render: (item) => (
        <DropdownMenu
          onViewDetail={() => console.log("View detail clicked")}
          onChangeStatus={() => console.log("Change Status", item)}
          onRemove={() => console.log("Remove clicked", item)}
        />
      ),
      width: "80px",
    },
  ];

  // Lọc danh sách nhân viên dựa trên từ khóa tìm kiếm
  const filteredStaff = staffList.filter((staff) =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="text-center py-4">Đang tải dữ liệu...</div>
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
    </div>
  );
};

export default StaffManagement;
