import React, { useState, useEffect } from "react";
import Table, { Column } from "@/components/Table";
import { BuildingResponse, Area } from "@/types";
import { getBuildings } from "@/services/building";
import { getAreaList } from "@/services/areas";
import { PiMapPinAreaBold } from "react-icons/pi";
import { FaRegBuilding } from "react-icons/fa";
import DropdownMenu from "@/components/DropDownMenu";
import SearchInput from "@/components/SearchInput";
import FilterDropdown from "@/components/FilterDropdown";
import AddButton from "@/components/AddButton";
import AddAreaModal from "@/components/BuildingManager/areas/addAreas/AddAreaModal";

const Building: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch buildings when component mounts
  useEffect(() => {
    const fetchBuildings = async () => {
      setIsLoading(true);
      try {
        const buildingsData = await getBuildings();
        setBuildings(buildingsData);
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildings();
  }, [refreshTrigger]);

  // Fetch areas when component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasData = await getAreaList();
        setAreas(areasData);
      } catch (error) {
        console.error("Failed to fetch areas:", error);
      }
    };
    fetchAreas();
  }, [refreshTrigger]);

  const getAreaName = (areaId: string): string => {
    const area = areas.find((a) => a.areaId === areaId);
    return area ? area.name : "N/A";
  };
  useEffect(() => {
    console.log("Areas:", areas);
    console.log("Buildings:", buildings);
  }, [areas, buildings]);

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "operational", label: "Operational" },
    { value: "under_construction", label: "Under Construction" },
  ];

  const columns: Column<BuildingResponse>[] = [
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
      title: "Building Name",
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
      ),
    },
    {
      key: "areaId",
      title: "Area Name",
      render: (item) => (
        <span className="text-sm text-gray-500">
          {getAreaName(item.areaId)}
        </span>
      ),
    },
    {
      key: "Floor",
      title: "Floor",
      render: (item) => (
        <span className="text-sm text-gray-500">{item.numberFloor}</span>
      ),
    },
    {
      key: "createdAt",
      title: "Created Date",
      render: (item) => (
        <span className="text-sm text-gray-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "construction date",
      title: "Construction Date",
      render: (item) => (
        <span className="text-sm text-gray-500">{item.construction_date}</span>
      ),
    },
    {
      key: "completion Date",
      title: "completion Date",
      render: (item) => (
        <span className="text-sm text-gray-500">{item.completion_date}</span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.Status === "operational"
              ? "bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]"
              : "bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]"
          }`}
        >
          {item.Status}
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
          onRemove={() => console.log("Remove", item)}
        />
      ),
      width: "80px",
    },
  ];

  const handleAddAreaSuccess = () => {
    // Trigger a refresh of the area list
    setRefreshTrigger((prev) => prev + 1);
  };

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
          label="Add Area"
          className="w-[154px]"
          icon={<PiMapPinAreaBold />}
          onClick={() => setIsAddAreaModalOpen(true)}
        />
        <AddButton
          label="Add Building"
          icon={<FaRegBuilding />}
          className="w-[154px]"
          onClick={() => console.log("Add Building clicked")}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <Table<BuildingResponse>
          data={buildings}
          columns={columns}
          keyExtractor={(item) => item.buildingId}
          onRowClick={(item) => console.log("Row clicked:", item)}
          className="w-[95%] mx-auto"
          tableClassName="w-full"
        />
      )}

      {/* Add Area Modal */}
      <AddAreaModal
        isOpen={isAddAreaModalOpen}
        onClose={() => setIsAddAreaModalOpen(false)}
        onSuccess={handleAddAreaSuccess}
      />
    </div>
  );
};

export default Building;
