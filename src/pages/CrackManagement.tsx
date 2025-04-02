import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table, { Column } from "@/components/Table";
import DropdownMenu from "@/components/DropDownMenu";
import SearchInput from "@/components/SearchInput";
import FilterDropdown from "@/components/FilterDropdown";
import Pagination from "@/components/Pagination";
import { CrackReportResponse, Crack } from "@/types";
import crackApi from "@/services/cracks";
import StatusCrack from "@/components/crackManager/StatusCrack";


// Map API response to UI model
const mapCrackResponseToCrack = (response: CrackReportResponse): Crack => {
  return {
    id: response.crackReportId,
    reportDescription: response.description,
    createdDate: new Date(response.createdAt).toLocaleDateString(),
    status: response.status === "Pending" 
      ? "pending"
      : response.status === "InProgress"
      ? "InProgress" 
      : "resolved",
    residentId: typeof response.reportedBy === 'object' ? response.reportedBy.userId : response.reportedBy,
    residentName: typeof response.reportedBy === 'object' ? response.reportedBy.username : "Unknown",
    description: response.description,
    originalImage: response.crackDetails[0]?.photoUrl,
    aiDetectedImage: response.crackDetails[0]?.aiDetectionUrl,
  };
};

const CrackManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedCrack, setSelectedCrack] = useState<Crack | null>(null);

  const severityOptions = [
    { value: "all", label: "All Severities" },
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  // Loading animation
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  };

  // Get status animation class
  const getStatusAnimationClass = (status: string) => {
    switch (status) {
      case "resolved":
        return "";
      case "InProgress":
        return "animate-pulse";
      default:
        return "animate-pulse-fast";
    }
  };

  // Fetch cracks based on current filters and pagination
  const fetchCracks = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add search param if provided
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add status filter if not 'all'
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      // Add severity filter if not 'all'
      if (selectedSeverity !== "all") {
        params.severityFilter = selectedSeverity;
      }

      const response = await crackApi.getCrackList(params);

      // Map API response to our UI model
      const mappedCracks = response.data.map(mapCrackResponseToCrack);

      setCracks(mappedCracks);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch cracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters or pagination changes
  useEffect(() => {
    fetchCracks();
  }, [currentPage, itemsPerPage, selectedStatus, selectedSeverity]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchCracks();
      } else {
        setCurrentPage(1); // This will trigger a fetch via the dependency array
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSeverityChange = (value: string) => {
    setSelectedSeverity(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const getNextStatus = (currentStatus: string): "pending" | "InProgress" | "resolved" => {
    switch (currentStatus) {
      case "pending":
        return "InProgress";
      case "InProgress":
        return "resolved";
      default:
        return "pending";
    }
  };

  // Handle status update with staff assignment
  const handleStatusUpdate = async (
    crack: Crack,
    newStatus?: "pending" | "InProgress" | "resolved"
  ) => {
    // Open the status modal instead of directly updating
    setSelectedCrack(crack);
    setIsStatusModalOpen(true);
  };

  const columns: Column<Crack>[] = [
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
      key: "id",
      title: "Crack ID",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.id.substring(0, 8)}...</div>
      ),
    },
    {
      key: "reportDescription",
      title: "Report Description",
      render: (item) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {item.reportDescription}
        </div>
      ),
    },
    {
      key: "residentName",
      title: "Reported By",
      render: (item) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.residentName}</div>
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
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
            item.status === "resolved"
              ? "bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]"
              : item.status === "InProgress"
              ? "bg-[rgba(255,165,0,0.3)] text-[#ff9900] border border-[#ffa500]"
              : "bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]"
          }`}
        >
          <span className="relative mr-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${
              item.status === "resolved"
                ? "bg-[#00ff90]"
                : item.status === "InProgress"
                ? "bg-[#ff9900]"
                : "bg-[#ff0000]"
            } ${getStatusAnimationClass(item.status)}`}></span>
            {item.status !== "resolved" && (
              <span className={`absolute -inset-1 rounded-full ${
                item.status === "InProgress"
                  ? "bg-[#ff9900]"
                  : "bg-[#ff0000]"
              } opacity-30 animate-ping`}></span>
            )}
          </span>
          {item.status === "resolved"
            ? "Resolved"
            : item.status === "InProgress"
            ? "In Progress"
            : "Pending"}
        </span>
      ),
    },
    {
      key: "action",
      title: "Action",
      render: (item) => (
        <DropdownMenu
          onViewDetail={() => navigate(`/crack/detail/${item.id}`)}
          onChangeStatus={() => handleStatusUpdate(item)}
          onRemove={() => console.log("Remove", item)}
        />
      ),
      width: "80px",
    },
  ];

  return (
    <div className="w-full mt-[60px]">
      <div className="flex flex-col space-y-4 mb-4 ml-[90px] mr-[132px]">
        <div className="flex justify-between">
          <SearchInput
            placeholder="Search by ID or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[20rem] max-w-xs"
          />

          <div className="flex space-x-4">
            <FilterDropdown
              options={severityOptions}
              onSelect={handleSeverityChange}
              buttonClassName="w-[160px]"
              selectedValue={selectedSeverity}
              label="Severity"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <span className="relative mr-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#ff0000] animate-pulse-fast"></span>
                <span className="absolute -inset-1 rounded-full bg-[#ff0000] opacity-30 animate-ping"></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Pending</span>
            </div>
            <div className="flex items-center">
              <span className="relative mr-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#ff9900] animate-pulse"></span>
                <span className="absolute -inset-1 rounded-full bg-[#ff9900] opacity-30 animate-ping"></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">In Progress</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00ff90] mr-1.5"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Resolved</span>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total Cracks: {totalItems}
          </div>
        </div>
      </div>

      <Table<Crack>
        data={cracks}
        columns={columns}
        keyExtractor={(item) => item.id}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
        isLoading={isLoading}
        emptyText="No cracks found"
      />

      {!isLoading && (
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
      )}

      {/* Status Change Modal */}
      {selectedCrack && (
        <StatusCrack 
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          crackId={selectedCrack.id}
          crackStatus={selectedCrack.status}
          onUpdateSuccess={fetchCracks}
        />
      )}
    </div>
  );
};

export default CrackManagement;
