import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Trash2, Edit, Plus, AlertTriangle, X } from 'lucide-react';
import Table, { Column } from '@/components/Table';
import Pagination from '@/components/Pagination';
import { MaintenanceCycle } from '@/types';
import { getMaintenanceCycles, deleteMaintenanceCycle } from '@/services/maintenanceCycle';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import MaintenanceCycleFilter from '@/components/MaintenanceCycle/MaintenanceCycleFilter';
import AddButton from '@/components/AddButton';
import MaintenanceCycleModal from '@/components/MaintenanceCycle/AddMaintenanceCycle/MaintenanceCycleModal';

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  cycleName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cycleName: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Confirm Deletion</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the maintenance cycle for{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{cycleName}</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const MaintenanceCycleManagement: React.FC = () => {
  // State for pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Filter states
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [basisFilter, setBasisFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<MaintenanceCycle | undefined>(undefined);

  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<{ id: string; name: string } | null>(null);

  // Apply filters
  const handleFilterApply = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setIsFilterApplied(true);
    refetch();
  };

  // Reset filters
  const handleFilterReset = () => {
    setFrequencyFilter('');
    setBasisFilter('');
    setDeviceTypeFilter('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setIsFilterApplied(false);
    refetch();
  };

  // Use React Query for data fetching
  const {
    data: maintenanceCyclesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'maintenanceCycles',
      pagination.currentPage,
      pagination.itemsPerPage,
      isFilterApplied,
      frequencyFilter,
      basisFilter,
      deviceTypeFilter,
    ],
    queryFn: () =>
      getMaintenanceCycles({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        frequency: frequencyFilter || undefined,
        basis: basisFilter || undefined,
        device_type: deviceTypeFilter || undefined,
      }),
  });

  // Update pagination when data changes
  useEffect(() => {
    if (maintenanceCyclesData?.pagination) {
      setPagination(prev => ({
        ...prev,
        totalPages: maintenanceCyclesData.pagination.totalPages || 1,
        totalItems: maintenanceCyclesData.pagination.total || 0,
      }));
    }
  }, [maintenanceCyclesData]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page,
    }));
  };

  // Handle items per page change
  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      itemsPerPage: limit,
    }));
  };

  // Open delete confirmation modal
  const openDeleteModal = (cycle: MaintenanceCycle) => {
    setCycleToDelete({
      id: cycle.cycle_id,
      name: `${cycle.device_type} (${cycle.frequency})`,
    });
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCycleToDelete(null);
  };

  // Delete maintenance cycle
  const handleDeleteCycle = async () => {
    if (!cycleToDelete) return;

    try {
      await deleteMaintenanceCycle(cycleToDelete.id);
      toast.success('Maintenance cycle deleted successfully');
      closeDeleteModal();
      refetch();
    } catch (error) {
      toast.error('Failed to delete maintenance cycle');
      console.error('Error deleting maintenance cycle:', error);
    }
  };

  // Edit maintenance cycle
  const handleEditCycle = (cycle: MaintenanceCycle) => {
    setSelectedCycle(cycle);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Open create cycle modal
  const handleCreateCycle = () => {
    setSelectedCycle(undefined);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Close modal and refresh data if needed
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCycle(undefined);
    setIsEditMode(false);
  };

  // Handle successful creation or update
  const handleCycleCreated = () => {
    refetch();
  };

  // Table columns definition
  const columns: Column<MaintenanceCycle>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'frequency',
      title: 'Frequency',
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Settings className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          {item.frequency}
        </div>
      ),
    },
    {
      key: 'basis',
      title: 'Basis',
      render: item => {
        // Format the basis string to be more readable
        const formattedBasis = item.basis.replace(/([A-Z])/g, ' $1').trim();

        return <div className="text-sm text-gray-700 dark:text-gray-300">{formattedBasis}</div>;
      },
    },
    {
      key: 'device_type',
      title: 'Device Type',
      render: item => (
        <div className="text-sm text-gray-700 dark:text-gray-300">{item.device_type}</div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: item => (
        <div className="flex justify-center gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              handleEditCycle(item);
            }}
            className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title="Edit Cycle"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              openDeleteModal(item);
            }}
            className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            title="Delete Cycle"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      width: '120px',
    },
  ];

  // Loading animation
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
      <p className="text-gray-700 dark:text-gray-300">Loading maintenance cycles...</p>
    </div>
  );

  return (
    <div className="w-full mt-[60px]">
      <div className="w-[95%] mx-auto mb-4">
        <div className="flex justify-end mb-6">
          <AddButton
            onClick={handleCreateCycle}
            label="Create Cycle"
            icon={<Plus />}
            className="w-auto"
          />
        </div>

        <MaintenanceCycleFilter
          frequencyFilter={frequencyFilter}
          setFrequencyFilter={setFrequencyFilter}
          basisFilter={basisFilter}
          setBasisFilter={setBasisFilter}
          deviceTypeFilter={deviceTypeFilter}
          setDeviceTypeFilter={setDeviceTypeFilter}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
        />

        <div className="mt-6">
          {isLoading ? (
            <LoadingIndicator />
          ) : isError ? (
            <div className="text-center py-8 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <p>Error loading maintenance cycles. Please try again.</p>
            </div>
          ) : (
            <>
              <Table
                data={maintenanceCyclesData?.data || []}
                columns={columns}
                keyExtractor={item => item.cycle_id}
                isLoading={isLoading}
                emptyText="No maintenance cycles found"
                animated={true}
                tableClassName="w-full"
                className="w-full mx-auto"
              />

              {(maintenanceCyclesData?.data?.length || 0) > 0 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  totalItems={pagination.totalItems}
                  itemsPerPage={pagination.itemsPerPage}
                  onLimitChange={handleLimitChange}
                  className="w-full mx-auto mt-4"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Maintenance Cycle Modal (Create/Edit) */}
      <MaintenanceCycleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleCycleCreated}
        editMode={isEditMode}
        cycleData={selectedCycle}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteCycle}
        cycleName={cycleToDelete?.name || ''}
      />
    </div>
  );
};

export default MaintenanceCycleManagement;
