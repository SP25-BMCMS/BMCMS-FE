import React, { useState, useEffect, useCallback, useRef } from "react"
import Table, { Column } from "@/components/Table"
import { BuildingResponse, Area } from "@/types"
import { getBuildings, deleteBuilding } from "@/services/building"
import { getAreaList } from "@/services/areas"
import { PiMapPinAreaBold } from "react-icons/pi"
import { FaRegBuilding } from "react-icons/fa"
import AddBuildingModal from "@/components/BuildingManager/buildings/AddBuilding/AddBuildingModal"
import RemoveBuilding from "@/components/BuildingManager/buildings/DeleteBuilding/RemoveBuilding"
import DropdownMenu from "@/components/DropDownMenu"
import SearchInput from "@/components/SearchInput"
import FilterDropdown from "@/components/FilterDropdown"
import AddButton from "@/components/AddButton"
import AddAreaModal from "@/components/BuildingManager/areas/addAreas/AddAreaModal"
import Pagination from "@/components/Pagination"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

const Building: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [buildings, setBuildings] = useState<BuildingResponse[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false)
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false)
  const [isRemoveBuildingModalOpen, setIsRemoveBuildingModalOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const areasFetchedRef = useRef(false)


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Sử dụng useCallback để tránh tạo lại hàm mỗi khi component render
  const fetchBuildings = useCallback(async (shouldSetLoading = true) => {
    if (shouldSetLoading) {
      setIsLoading(true)
    }

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: selectedStatus === "all" ? undefined :
          (selectedStatus as "operational" | "under_construction"),
      }
      const response = await getBuildings(params)
      setBuildings(response.data)
      setTotalItems(response.pagination.total)
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      console.error("Failed to fetch buildings:", error)
      toast.error("Failed to fetch buildings")
    } finally {
      if (shouldSetLoading) {
        setIsLoading(false)
      }
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedStatus])

  // Sử dụng useCallback để tránh tạo lại hàm mỗi khi component render
  const fetchAreas = useCallback(async () => {
    try {
      const areasData = await getAreaList()
      setAreas(areasData)
    } catch (error) {
      console.error("Failed to fetch areas:", error)
      toast.error("Failed to fetch areas")
    }
  }, [])

  // Chỉ fetch dữ liệu một lần khi component mount và khi các dependencies thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBuildings(true)
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(timer)
  }, [fetchBuildings, currentPage, itemsPerPage, selectedStatus, searchTerm])

  // Fetch areas chỉ một lần khi component mount
  useEffect(() => {
    if (!areasFetchedRef.current) {
      fetchAreas()
      areasFetchedRef.current = true
    }
  }, [fetchAreas])

  const getAreaName = (areaId: string): string => {
    const area = areas.find((a) => a.areaId === areaId)
    return area ? area.name : "N/A"
  }

  const handleRemoveBuilding = (building: BuildingResponse) => {
    setSelectedBuilding(building)
    setIsRemoveBuildingModalOpen(true)
  }

  const confirmRemoveBuilding = async () => {
    if (!selectedBuilding) return

    setIsDeleting(true)
    try {
      await deleteBuilding(selectedBuilding.buildingId)
      toast.success("Building deleted successfully!")

      // Optimistic update
      setBuildings(prevBuildings =>
        prevBuildings.filter(building => building.buildingId !== selectedBuilding.buildingId)
      )

      // Update total items
      setTotalItems(prev => prev - 1)

      // Fetch fresh data in the background without showing loading state
      fetchBuildings(false)

      setIsRemoveBuildingModalOpen(false)
    } catch (error) {
      console.error("Failed to delete building:", error)
      toast.error("Failed to delete building!")
    } finally {
      setIsDeleting(false)
    }
  }

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "operational", label: "Operational" },
    { value: "under_construction", label: "Under Construction" },
  ]

  const handleViewDetail = (building: BuildingResponse) => {
    // Don't allow viewing details for buildings under construction
    if (building.Status === "under_construction") {
      toast.error("Không thể xem chi tiết của tòa nhà đang trong quá trình xây dựng");
      return;
    }
    
    // Đóng modal trước khi fetch dữ liệu mới để tránh hiển thị dữ liệu cũ
    if (isViewDetailOpen) {
      setIsViewDetailOpen(false);
      // Set timeout để đảm bảo modal đã đóng trước khi mở lại
      setTimeout(() => {
        fetchBuildingDetailId(building.buildingId).then(() => {
          setIsViewDetailOpen(true);
        });
      }, 300); // 300ms là đủ để modal đóng hoàn toàn
    } else {
      fetchBuildingDetailId(building.buildingId).then(() => {
        setIsViewDetailOpen(true);
      });
    }
  };
  
  // Hiển thị thông tin các building details có cùng buildingId
  const logBuildingDetailOptions = (details: any[]) => {
    if (details.length <= 1) return;
    
    console.group(`Danh sách các chi tiết tòa nhà (tổng ${details.length} chi tiết):`);
    details.forEach((detail, index) => {
      console.log(`${index + 1}. ID: ${detail.buildingDetailId}, Tên: ${detail.name}, Số căn hộ: ${detail.total_apartments}`);
    });
    console.groupEnd();
  };

  // Fetch building detail ID for the selected building
  const fetchBuildingDetailId = async (buildingId: string) => {
    setIsLoading(true);
    // Reset selectedBuildingDetail để tránh hiển thị dữ liệu cũ
    setSelectedBuildingDetail(null);
    // Reset buildingDetailOptions
    setBuildingDetailOptions([]);
    
    try {
      // Sử dụng service để lấy tất cả building details
      const result = await getAllBuildingDetails();
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Lọc building details theo buildingId
        const matchingDetails = result.data.filter(detail => detail.buildingId === buildingId);
        
        if (matchingDetails.length > 0) {
          // Lưu tất cả các tùy chọn để có thể chọn sau này nếu cần
          setBuildingDetailOptions(matchingDetails);
          
          // Chỉ lấy detail đầu tiên tìm thấy để tránh trùng lặp
          const firstDetail = matchingDetails[0];
          setSelectedBuildingDetail(firstDetail.buildingDetailId);
          console.log(`Tìm thấy buildingDetailId: ${firstDetail.buildingDetailId} cho tòa nhà có ID: ${buildingId}`);
          
          // Log danh sách các chi tiết nếu có nhiều hơn 1
          if (matchingDetails.length > 1) {
            console.log(`Lưu ý: Có ${matchingDetails.length} chi tiết cho tòa nhà này, đang sử dụng chi tiết đầu tiên.`);
            logBuildingDetailOptions(matchingDetails);
          }
        } else {
          toast.error('Không tìm thấy chi tiết cho tòa nhà này');
          console.error(`Không tìm thấy chi tiết nào cho tòa nhà có ID: ${buildingId}`);
        }
      } else {
        toast.error('Không thể tải danh sách chi tiết tòa nhà');
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin chi tiết tòa nhà:", error);
      toast.error("Lỗi khi tải thông tin chi tiết tòa nhà");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing the view detail modal
  const handleCloseViewDetail = () => {
    setIsViewDetailOpen(false);
    // Đặt selectedBuildingDetail về null sau khi đóng modal
    // để tránh hiển thị dữ liệu cũ khi mở modal cho tòa nhà khác
    setTimeout(() => {
      setSelectedBuildingDetail(null);
    }, 300);
  };

  // Handle changing building detail
  const handleChangeDetail = (buildingDetailId: string) => {
    if (buildingDetailId !== selectedBuildingDetail) {
      setSelectedBuildingDetail(buildingDetailId);
    }
  };

  const columns: Column<BuildingResponse>[] = [
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
      title: "Building Name",
      render: (item) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
      ),
    },
    {
      key: "areaId",
      title: "Area Name",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {getAreaName(item.areaId)}
        </div>
      ),
    },
    {
      key: "Floor",
      title: "Floor",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.numberFloor}</div>
      ),
    },
    {
      key: "createdAt",
      title: "Created Date",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "completion Date",
      title: "Completion Date",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.completion_date}</div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.Status === "operational"
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
          onViewDetail={() => handleViewDetail(item)}
          onChangeStatus={() => console.log("Change Status", item)}
          onRemove={() => handleRemoveBuilding(item)}
          viewDetailDisabled={item.Status === "under_construction"}
        />
      ),
      width: "80px",
    },
  ]

  const handleAddSuccess = () => {
    // Fetch fresh data in the background without showing loading state
    fetchBuildings(false)
    // Chỉ fetch areas nếu cần thiết
    if (areas.length === 0) {
      fetchAreas()
    }
  }

  // Loading animation for standalone use
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
      <p className="text-gray-700 dark:text-gray-300">Loading buildings data...</p>
    </div>
  )

  return (
    <div className="w-full mt-[60px]">
      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput
          placeholder="Search by building name or description"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        <LoadingIndicator />
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

      {/* View Detail Modal */}
      <ViewBuildingDetail
        isOpen={isViewDetailOpen}
        onClose={handleCloseViewDetail}
        buildingDetailId={selectedBuildingDetail}
        buildingDetailOptions={buildingDetailOptions}
        onChangeDetail={handleChangeDetail}
      />
    </div>
  )
}

export default Building
