import React, { useState } from "react";
import Table, { Column } from "@/components/Table";
import { Staff } from "@/types";
import { mockStaff } from "@/mock/mockDataStaff";
import { FiUserPlus } from "react-icons/fi";
import DropdownMenu from "@/components/DropDownMenu";
import SearchInput from "@/components/SearchInput";
import FilterDropdown from "@/components/FilterDropdown";
import AddButton from "@/components/AddButton";

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [staffList, setStaffList] = useState<Staff[]>(mockStaff);

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

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
      key: "id",
      title: "Staff ID",
      render: (item) => (
        <span className="text-sm text-gray-500">{item.id}</span>
      ),
    },
    {
      key: "name",
      title: "Staff Name",
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
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
        };
        return (
          <span
            className={`inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-full px-4 py-1 min-w-[82px] text-center ${
              roleColors[item.role] || "text-gray-700 border border-gray-300"
            }`}
          >
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </span>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.status === "active"
              ? "bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]"
              : "bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]"
          }`}
        >
          {item.status === "active" ? "Active" : "Inactive"}
        </span>
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

  return (
    <div className="w-full mt-[60px]">
      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput
          placeholder="Search by ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[20rem] max-w-xs"
        />

        <FilterDropdown
          options={filterOptions}
          onSelect={(value) => console.log("Selected filter:", value)}
        />

        <AddButton
          label="Add Staff"
          icon={<FiUserPlus />}
          onClick={() => console.log("Add staff button clicked")}
        />
      </div>

      <Table<Staff>
        data={staffList}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => console.log("Row clicked:", item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
      />
    </div>
  );
};

export default StaffManagement;
