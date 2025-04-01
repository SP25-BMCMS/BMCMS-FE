import React, { useState, useEffect } from "react";
import Table, { Column } from "@/components/Table";
import { BuildingResponse, Area } from "@/types";
import { getBuildings, deleteBuilding } from "@/services/building";
import { getAreaList } from "@/services/areas";
import { PiMapPinAreaBold } from "react-icons/pi";
import { FaRegBuilding } from "react-icons/fa";
import AddBuildingModal from "@/components/BuildingManager/buildings/AddBuilding/AddBuildingModal";
import RemoveBuilding from "@/components/BuildingManager/buildings/DeleteBuilding/RemoveBuilding";
import DropdownMenu from "@/components/DropDownMenu";
import SearchInput from "@/components/SearchInput";
import FilterDropdown from "@/components/FilterDropdown";
import AddButton from "@/components/AddButton";
import AddAreaModal from "@/components/BuildingManager/areas/addAreas/AddAreaModal";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";

const Building: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isRemoveBuildingModalOpen, setIsRemoveBuildingModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Handle search without delay
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Fetch buildings with pagination and search
  useEffect(() => {
    const fetchBuildings = async () => {
      setIsLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: selectedStatus === "all" ? undefined : selectedStatus,
        };
        const response = await getBuildings(params);
        setBuildings(response.data);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
        toast.error("Failed to fetch buildings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildings();
  }, [currentPage, itemsPerPage, searchTerm, selectedStatus, refreshTrigger]);

  // Fetch areas when component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasData = await getAreaList();
        setAreas(areasData);
      } catch (error) {
        console.error("Failed to fetch areas:", error);
        toast.error("Failed to fetch areas");
      }
    };
    fetchAreas();
  }, [refreshTrigger]);

  const getAreaName = (areaId: string): string => {
    const area = areas.find((a) => a.areaId === areaId);
    return area ? area.name : "N/A";
  };

  const handleRemoveBuilding = (building: BuildingResponse) => {
    setSelectedBuilding(building);
    setIsRemoveBuildingModalOpen(true);
  };

  const confirmRemoveBuilding = async () => {
    if (!selectedBuilding) return;

    setIsDeleting(true);
    try {
      await deleteBuilding(selectedBuilding.buildingId);
      toast.success("Building deleted successfully!");
      setRefreshTrigger((prev) => prev + 1);
      setIsRemoveBuildingModalOpen(false);
    } catch (error) {
      console.error("Failed to delete building:", error);
      toast.error("Failed to delete building!");
    } finally {
      setIsDeleting(false);
    }
  };

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
      key: "completion Date",
      title: "Completion Date",
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
          onRemove={() => handleRemoveBuilding(item)}
        />
      ),
      width: "80px",
    },
  ];

  const handleAddSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-full mt-[60px]">
      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput
          placeholder="Search by building name or description"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-[20rem] max-w-xs"
        />

        <FilterDropdown
          options={filterOptions}
          selectedValue={selectedStatus}
          onSelect={setSelectedStatus}
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
          onClick={() => setIsAddBuildingModalOpen(true)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading data...</p>
        </div>
      ) : (
        <>
          <Table<BuildingResponse>
            data={buildings}
            columns={columns}
            keyExtractor={(item) => item.buildingId}
            onRowClick={(item) => console.log("Row clicked:", item)}
            className="w-[95%] mx-auto"
            tableClassName="w-full"
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onLimitChange={setItemsPerPage}
            className="w-[95%] mx-auto mt-4"
          />
        </>
      )}

      {/* Add Area Modal */}
      <AddAreaModal
        isOpen={isAddAreaModalOpen}
        onClose={() => setIsAddAreaModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      
      {/* Add Building Modal */}
      <AddBuildingModal
        isOpen={isAddBuildingModalOpen}
        onClose={() => setIsAddBuildingModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      
      {/* Remove Building Modal */}
      <RemoveBuilding
        isOpen={isRemoveBuildingModalOpen}
        onClose={() => setIsRemoveBuildingModalOpen(false)}
        onConfirm={confirmRemoveBuilding}
        isLoading={isDeleting}
        building={selectedBuilding}
      />
    </div>
  );
};

export default Building;
