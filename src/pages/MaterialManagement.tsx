import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@/components/Table';
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import Pagination from '@/components/Pagination';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { Dialog } from '@headlessui/react';
import { ACTIVE, INACTIVE } from '@/constants/colors';
import materialsApi, {
  Material,
  MaterialListParams,
  CreateMaterialData,
  MaterialResponse,
} from '@/services/materials';
import CreateMaterialModal from '@/components/materialManager/CreateMaterialModal';
import UpdateUnitPriceModal from '@/components/materialManager/UpdateUnitPriceModal';
import UpdateStockQuantityModal from '@/components/materialManager/UpdateStockQuantityModal';
import UpdateStatusModal from '@/components/materialManager/UpdateStatusModal';
import MaterialDetailModal from '@/components/materialManager/MaterialDetailModal';
import AddButton from '@/components/AddButton';
import { Plus } from 'lucide-react';

// Rename to MaterialColumn to avoid conflict with imported Column
interface MaterialColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T, index?: number) => React.ReactNode;
  width?: string;
}

const MaterialManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUnitPriceModalOpen, setIsUnitPriceModalOpen] = useState(false);
  const [isStockQuantityModalOpen, setIsStockQuantityModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  const priceRangeOptions = [
    { value: 'all', label: 'Tất cả giá' },
    { value: '0-100000', label: 'Dưới 100,000 VND' },
    { value: '100000-500000', label: 'Từ 100,000 - 500,000 VND' },
    { value: '500000-1000000', label: 'Từ 500,000 - 1,000,000 VND' },
    { value: '1000000+', label: 'Trên 1,000,000 VND' },
  ];

  // Build query params
  const getQueryParams = (): MaterialListParams => {
    const params: MaterialListParams = {
      page: currentPage,
      limit: itemsPerPage,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedStatus !== 'all') {
      params.status = selectedStatus as 'ACTIVE' | 'INACTIVE';
    }

    return params;
  };

  // Function to filter materials by price range
  const filterByPriceRange = (materials: Material[]) => {
    if (selectedPriceRange === 'all') return materials;

    return materials.filter(material => {
      const price = parseInt(material.unit_price);

      switch (selectedPriceRange) {
        case '0-100000':
          return price < 100000;
        case '100000-500000':
          return price >= 100000 && price < 500000;
        case '500000-1000000':
          return price >= 500000 && price < 1000000;
        case '1000000+':
          return price >= 1000000;
        default:
          return true;
      }
    });
  };

  // Fetch materials using React Query
  const {
    data: materialsData,
    isLoading,
    isFetching,
  } = useQuery<MaterialResponse>({
    queryKey: ['materials', currentPage, itemsPerPage, selectedStatus, searchTerm],
    queryFn: async () => {
      const params = getQueryParams();
      return materialsApi.getMaterialList(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Apply client-side filtering for price ranges
  const filteredMaterials = materialsData ? filterByPriceRange(materialsData.data.data) : [];

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: materialsApi.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsCreateModalOpen(false);
      toast.success('Material created successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to create material');
    },
  });

  // Update unit price mutation
  const updateUnitPriceMutation = useMutation({
    mutationFn: (unitPrice: number) =>
      materialsApi.updateUnitPrice(selectedMaterial?.material_id || '', unitPrice.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsUnitPriceModalOpen(false);
      toast.success('Unit price updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update unit price');
    },
  });

  // Update stock quantity mutation
  const updateStockQuantityMutation = useMutation({
    mutationFn: ({ materialId, stockQuantity }: { materialId: string; stockQuantity: number }) =>
      materialsApi.updateStockQuantity(materialId, stockQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsStockQuantityModalOpen(false);
      toast.success('Stock quantity updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update stock quantity');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ materialId, status }: { materialId: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      materialsApi.updateStatus(materialId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsStatusModalOpen(false);
      toast.success('Status updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Add delete mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: (materialId: string) => materialsApi.deleteMaterial(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsDeleteModalOpen(false);
      toast.success('Material deleted successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to delete material');
    },
  });

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (value: string) => {
    setSelectedPriceRange(value);
    setCurrentPage(1);
  };

  const handleCreateMaterial = (data: CreateMaterialData) => {
    createMaterialMutation.mutate(data);
  };

  const handleUpdateUnitPrice = (unitPrice: string) => {
    if (selectedMaterial) {
      updateUnitPriceMutation.mutate(parseFloat(unitPrice));
    }
  };

  const handleUpdateStockQuantity = (stockQuantity: number) => {
    if (selectedMaterial) {
      updateStockQuantityMutation.mutate({
        materialId: selectedMaterial.material_id,
        stockQuantity,
      });
    }
  };

  const handleUpdateStatus = (status: 'ACTIVE' | 'INACTIVE') => {
    if (selectedMaterial) {
      updateStatusMutation.mutate({ materialId: selectedMaterial.material_id, status });
    }
  };

  const handleDeleteMaterial = () => {
    if (selectedMaterial) {
      deleteMaterialMutation.mutate(selectedMaterial.material_id);
    }
  };

  const handleViewDetail = (material: Material) => {
    setSelectedMaterial(material);
    setIsDetailModalOpen(true);
  };

  const columns: MaterialColumn<Material>[] = [
    {
      key: 'index',
      title: 'No',
      render: (item: Material, index = 0) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    // {
    //     key: "materialId",
    //     title: "Material ID",
    //     render: (item) => (
    //         <div className="text-sm text-gray-500 dark:text-gray-400">
    //             {item.material_id ? item.material_id.substring(0, 8) + "..." : "N/A"}
    //         </div>
    //     ),
    // },
    {
      key: 'name',
      title: 'Name',
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
      ),
    },
    {
      key: 'unit_price',
      title: 'Unit Price',
      render: (item: Material) => {
        // Format giá tiền VND với dấu phân cách hàng nghìn
        const formattedPrice = parseInt(item.unit_price).toLocaleString('vi-VN');
        return `${formattedPrice} VND`;
      },
      width: 'w-32',
    },
    {
      key: 'stockQuantity',
      title: 'Stock Quantity',
      render: item => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{item.stock_quantity}</div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: item => (
        <span
          className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full
            ${item.status === 'ACTIVE' ? ACTIVE : INACTIVE}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      render: item => (
        <DropdownMenu
          onViewDetail={() => handleViewDetail(item)}
          onChangeStatus={() => {
            setSelectedMaterial(item);
            setIsStatusModalOpen(true);
          }}
          onRemove={() => {
            setSelectedMaterial(item);
            setIsDeleteModalOpen(true);
          }}
          changeStatusTitle="Update Status"
          viewDetailDisabled={false}
        />
      ),
      width: '80px',
    },
  ];

  return (
    <div className="w-full mt-[60px]">
      <div className="flex flex-col space-y-4 mb-4 ml-[90px] mr-[132px]">
        <div className="flex justify-between">
          <SearchInput
            placeholder="Search by name or description"
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className="w-[20rem] max-w-xs"
          />

          <div className="flex space-x-4">
            <FilterDropdown
              options={priceRangeOptions}
              onSelect={handlePriceRangeChange}
              buttonClassName="w-[220px]"
              selectedValue={selectedPriceRange}
              label="Giá tiền"
            />
            <FilterDropdown
              options={statusOptions}
              onSelect={handleStatusChange}
              buttonClassName="w-[160px]"
              selectedValue={selectedStatus}
              label="Status"
            />
            <AddButton
              onClick={() => setIsCreateModalOpen(true)}
              label="Create Material"
              icon={<Plus />}
              className="w-auto"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            {/* Active Status */}
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
            </div>

            {/* Inactive Status */}
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Inactive</span>
            </div>
          </div>

          {/* Total Materials */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total Materials: {filteredMaterials.length || 0} /{' '}
            {materialsData?.data?.pagination?.total || 0}
          </div>
        </div>
      </div>

      <Table<Material>
        data={filteredMaterials}
        columns={columns}
        keyExtractor={item => item.material_id || Math.random().toString()}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
        isLoading={isLoading || isFetching}
        emptyText="No materials found"
      />

      {!isLoading && materialsData?.data?.pagination && (
        <div className="w-[95%] mx-auto">
          <Pagination
            currentPage={currentPage}
            totalPages={materialsData.data.pagination.totalPages}
            onPageChange={setCurrentPage}
            totalItems={materialsData.data.pagination.total}
            itemsPerPage={itemsPerPage}
            onLimitChange={setItemsPerPage}
          />
        </div>
      )}

      <CreateMaterialModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateMaterial}
        isLoading={createMaterialMutation.isPending}
      />

      {/* Update Material Modal */}
      {selectedMaterial && (
        <>
          <UpdateUnitPriceModal
            isOpen={isUnitPriceModalOpen}
            onClose={() => setIsUnitPriceModalOpen(false)}
            onSubmit={handleUpdateUnitPrice}
            material={selectedMaterial}
            isLoading={updateUnitPriceMutation.isPending}
          />

          <UpdateStockQuantityModal
            isOpen={isStockQuantityModalOpen}
            onClose={() => setIsStockQuantityModalOpen(false)}
            onSubmit={handleUpdateStockQuantity}
            material={selectedMaterial}
            isLoading={updateStockQuantityMutation.isPending}
          />

          <UpdateStatusModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            onSubmit={handleUpdateStatus}
            material={selectedMaterial}
            isLoading={updateStatusMutation.isPending}
          />

          <Dialog
            open={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="mx-auto max-w-sm rounded bg-white dark:bg-gray-800 p-6">
                <Dialog.Title className="text-lg font-medium mb-4">Delete Material</Dialog.Title>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to delete this material? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteMaterial}
                    disabled={deleteMaterialMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteMaterialMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </>
      )}

      {selectedMaterial && (
        <MaterialDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedMaterial(null);
          }}
          material={selectedMaterial}
        />
      )}
    </div>
  );
};

export default MaterialManagement;
