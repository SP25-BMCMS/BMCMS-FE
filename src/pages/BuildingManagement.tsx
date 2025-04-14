import React, { useState, useEffect } from 'react';
import Table, { Column } from '@/components/Table';
import { BuildingResponse } from '@/types';
import { getBuildings, deleteBuilding } from '@/services/building';
import { getAreaList } from '@/services/areas';
import { getAllStaff } from '@/services/staff';
import { PiMapPinAreaBold } from 'react-icons/pi';
import { FaRegBuilding } from 'react-icons/fa';
import { User } from 'lucide-react';
import AddBuildingModal from '@/components/BuildingManager/buildings/AddBuilding/AddBuildingModal';
import RemoveBuilding from '@/components/BuildingManager/buildings/DeleteBuilding/RemoveBuilding';
import ViewBuildingModal from '@/components/BuildingManager/buildings/ViewBuilding/ViewBuildingModal';
import EditBuildingModal from '@/components/BuildingManager/buildings/EditBuilding/EditBuildingModal';
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import AddButton from '@/components/AddButton';
import AddAreaModal from '@/components/BuildingManager/areas/addAreas/AddAreaModal';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

const Building: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isRemoveBuildingModalOpen, setIsRemoveBuildingModalOpen] = useState(false);
  const [isViewBuildingModalOpen, setIsViewBuildingModalOpen] = useState(false);
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [managerNames, setManagerNames] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  // Fetch buildings with React Query
  const { data: buildingsData, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings', currentPage, itemsPerPage, searchTerm, selectedStatus],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status:
          selectedStatus === 'all'
            ? undefined
            : (selectedStatus as 'operational' | 'under_construction'),
      };
      const response = await getBuildings(params);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Fetch areas with React Query
  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: getAreaList,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Fetch staff with React Query
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: getAllStaff,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false
  });

  // Process staff data for manager names
  useEffect(() => {
    if (staffData && staffData.data) {
      const managerMapping: Record<string, string> = {};
      staffData.data.forEach(staff => {
        managerMapping[staff.userId] = staff.username;
      });
      setManagerNames(managerMapping);
    }
  }, [staffData]);

  // Delete building mutation
  const deleteBuildingMutation = useMutation({
    mutationFn: (buildingId: string) => deleteBuilding(buildingId),
    onMutate: async buildingId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['buildings'] });

      // Snapshot the previous value
      const previousBuildings = queryClient.getQueryData(['buildings']);

      // Optimistically update to the new value
      queryClient.setQueryData(['buildings'], (old: any) => ({
        ...old,
        data: old.data.filter((building: BuildingResponse) => building.buildingId !== buildingId),
        pagination: {
          ...old.pagination,
          total: old.pagination.total - 1,
        },
      }));

      return { previousBuildings };
    },
    onError: (err, buildingId, context) => {
      // Revert back to the previous value
      if (context?.previousBuildings) {
        queryClient.setQueryData(['buildings'], context.previousBuildings);
      }
      toast.error('Failed to delete building!');
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });

  const getAreaName = (areaId: string): string => {
    const area = areas.find(a => a.areaId === areaId);
    return area ? area.name : 'N/A';
  };

  const getManagerName = (managerId?: string): string => {
    if (!managerId) return 'Not assigned';
    return managerNames[managerId] || 'Unknown';
  };

  const handleViewBuildingDetail = (building: BuildingResponse) => {
    setSelectedBuilding(building);
    setIsViewBuildingModalOpen(true);
  };

  const handleEditBuilding = (building: BuildingResponse) => {
    setSelectedBuilding(building);
    setIsEditBuildingModalOpen(true);
  };

  const handleRemoveBuilding = (building: BuildingResponse) => {
    setSelectedBuilding(building);
    setIsRemoveBuildingModalOpen(true);
  };

  const confirmRemoveBuilding = async () => {
    if (!selectedBuilding) return;

    setIsDeleting(true);
    try {
      await deleteBuildingMutation.mutateAsync(selectedBuilding.buildingId);
      toast.success('Building deleted successfully!');
      setIsRemoveBuildingModalOpen(false);
    } catch (error) {
      console.error('Failed to delete building:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'operational', label: 'Operational' },
    { value: 'under_construction', label: 'Under Construction' },
  ];

  const columns: Column<BuildingResponse>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: 'Building Name',
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
      ),
    },
    {
      key: 'areaId',
      title: 'Area Name',
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{getAreaName(item.areaId)}</div>
      ),
    },
    {
      key: 'manager',
      title: 'Manager',
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <User className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          {getManagerName(item.manager_id)}
        </div>
      ),
    },
    {
      key: 'Floor',
      title: 'Floor',
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.numberFloor}</div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created Date',
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'completion Date',
      title: 'Completion Date',
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {item.completion_date ? new Date(item.completion_date).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: item => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.Status === 'operational'
              ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
              : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
          }`}
        >
          {item.Status}
        </span>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      render: item => (
        <DropdownMenu
          onViewDetail={() => handleViewBuildingDetail(item)}
          onChangeStatus={() => handleEditBuilding(item)}
          onRemove={() => handleRemoveBuilding(item)}
          changeStatusTitle="Edit Building"
        />
      ),
      width: '80px',
    },
  ];

  const handleAddSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
  };

  // Loading animation for standalone use
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  };

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">Loading buildings data...</p>
    </div>
  );

  return (
    <div className="w-full mt-[60px]">
      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput
          placeholder="Search by building name or description"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
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

      {isLoadingBuildings ? (
        <LoadingIndicator />
      ) : (
        <>
          <Table<BuildingResponse>
            data={buildingsData?.data || []}
            columns={columns}
            keyExtractor={item => item.buildingId}
            onRowClick={item => console.log('Row clicked:', item)}
            className="w-[95%] mx-auto"
            tableClassName="w-full"
          />

          <Pagination
            currentPage={currentPage}
            totalPages={buildingsData?.pagination.totalPages || 1}
            onPageChange={setCurrentPage}
            totalItems={buildingsData?.pagination.total || 0}
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

      {/* Edit Building Modal */}
      <EditBuildingModal
        isOpen={isEditBuildingModalOpen}
        onClose={() => setIsEditBuildingModalOpen(false)}
        onSuccess={handleAddSuccess}
        buildingId={selectedBuilding?.buildingId || null}
      />

      {/* Remove Building Modal */}
      <RemoveBuilding
        isOpen={isRemoveBuildingModalOpen}
        onClose={() => setIsRemoveBuildingModalOpen(false)}
        onConfirm={confirmRemoveBuilding}
        isLoading={isDeleting}
        building={selectedBuilding}
      />

      {/* View Building Modal */}
      <ViewBuildingModal
        isOpen={isViewBuildingModalOpen}
        onClose={() => setIsViewBuildingModalOpen(false)}
        buildingId={selectedBuilding?.buildingId || null}
      />
    </div>
  );
};

export default Building;
