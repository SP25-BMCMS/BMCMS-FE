import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Table from '@/components/Table'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import FilterDropdown from '@/components/FilterDropdown'
import Pagination from '@/components/Pagination'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { AxiosError } from 'axios'
import { Dialog } from '@headlessui/react'
import { ACTIVE, INACTIVE } from '@/constants/colors'
import materialsApi, {
  Material,
  MaterialListParams,
  CreateMaterialData,
  MaterialResponse,
} from '@/services/materials'
import CreateMaterialModal from '@/components/materialManager/CreateMaterialModal'
import UpdateUnitPriceModal from '@/components/materialManager/UpdateUnitPriceModal'
import UpdateStockQuantityModal from '@/components/materialManager/UpdateStockQuantityModal'
import UpdateStatusModal from '@/components/materialManager/UpdateStatusModal'
import MaterialDetailModal from '@/components/materialManager/MaterialDetailModal'
import AddButton from '@/components/AddButton'
import { Plus } from 'lucide-react'
import Tooltip from '@/components/Tooltip'

// Rename to MaterialColumn to avoid conflict with imported Column
interface MaterialColumn<T> {
  key: keyof T | string
  title: string
  render?: (item: T, index?: number) => React.ReactNode
  width?: string
}

const MaterialManagement: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUnitPriceModalOpen, setIsUnitPriceModalOpen] = useState(false)
  const [isStockQuantityModalOpen, setIsStockQuantityModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const statusOptions = [
    { value: 'all', label: t('materialManagement.filterOptions.status.all') },
    { value: 'ACTIVE', label: t('materialManagement.filterOptions.status.active') },
    { value: 'INACTIVE', label: t('materialManagement.filterOptions.status.inactive') },
  ]

  const priceRangeOptions = [
    { value: 'all', label: t('materialManagement.filterOptions.price.all') },
    { value: '0-100000', label: t('materialManagement.filterOptions.price.under100k') },
    { value: '100000-500000', label: t('materialManagement.filterOptions.price.100k-500k') },
    { value: '500000-1000000', label: t('materialManagement.filterOptions.price.500k-1m') },
    { value: '1000000+', label: t('materialManagement.filterOptions.price.above1m') },
  ]

  // Build query params
  const getQueryParams = (): MaterialListParams => {
    const params: MaterialListParams = {
      page: currentPage,
      limit: itemsPerPage,
    }

    if (searchTerm) {
      params.search = searchTerm
    }

    if (selectedStatus !== 'all') {
      params.status = selectedStatus as 'ACTIVE' | 'INACTIVE'
    }

    return params
  }

  // Function to filter materials by price range
  const filterByPriceRange = (materials: Material[]) => {
    if (selectedPriceRange === 'all') return materials

    return materials.filter(material => {
      const price = parseInt(material.unit_price)

      switch (selectedPriceRange) {
        case '0-100000':
          return price < 100000
        case '100000-500000':
          return price >= 100000 && price < 500000
        case '500000-1000000':
          return price >= 500000 && price < 1000000
        case '1000000+':
          return price >= 1000000
        default:
          return true
      }
    })
  }

  // Fetch materials using React Query
  const {
    data: materialsData,
    isLoading,
    isFetching,
  } = useQuery<MaterialResponse>({
    queryKey: ['materials', currentPage, itemsPerPage, selectedStatus, searchTerm],
    queryFn: async () => {
      const params = getQueryParams()
      return materialsApi.getMaterialList(params)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  // Apply client-side filtering for price ranges
  const filteredMaterials = materialsData ? filterByPriceRange(materialsData.data.data) : []

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: materialsApi.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      setIsCreateModalOpen(false)
      toast.success(t('materialManagement.createSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.createError'))
    },
  })

  // Update unit price mutation
  const updateUnitPriceMutation = useMutation({
    mutationFn: (unitPrice: number) =>
      materialsApi.updateUnitPrice(selectedMaterial?.material_id || '', unitPrice.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      setIsUnitPriceModalOpen(false)
      toast.success(t('materialManagement.unitPriceUpdateSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.unitPriceUpdateError'))
    },
  })

  // Update stock quantity mutation
  const updateStockQuantityMutation = useMutation({
    mutationFn: ({ materialId, stockQuantity }: { materialId: string; stockQuantity: number }) =>
      materialsApi.updateStockQuantity(materialId, stockQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      setIsStockQuantityModalOpen(false)
      toast.success(t('materialManagement.stockQuantityUpdateSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.stockQuantityUpdateError'))
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ materialId, status }: { materialId: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      materialsApi.updateStatus(materialId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      setIsStatusModalOpen(false)
      toast.success(t('materialManagement.statusUpdateSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.statusUpdateError'))
    },
  })

  // Add delete mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: (materialId: string) => materialsApi.deleteMaterial(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      setIsDeleteModalOpen(false)
      toast.success(t('materialManagement.deleteSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.deleteError'))
    },
  })

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
    setCurrentPage(1)
  }

  const handlePriceRangeChange = (value: string) => {
    setSelectedPriceRange(value)
    setCurrentPage(1)
  }

  const handleCreateMaterial = (data: CreateMaterialData) => {
    createMaterialMutation.mutate(data)
  }

  const handleUpdateUnitPrice = (unitPrice: string) => {
    if (selectedMaterial) {
      updateUnitPriceMutation.mutate(parseFloat(unitPrice))
    }
  }

  const handleUpdateStockQuantity = (stockQuantity: number) => {
    if (selectedMaterial) {
      updateStockQuantityMutation.mutate({
        materialId: selectedMaterial.material_id,
        stockQuantity,
      })
    }
  }

  const handleUpdateStatus = (status: 'ACTIVE' | 'INACTIVE') => {
    if (selectedMaterial) {
      updateStatusMutation.mutate({ materialId: selectedMaterial.material_id, status })
    }
  }

  const handleDeleteMaterial = () => {
    if (selectedMaterial) {
      deleteMaterialMutation.mutate(selectedMaterial.material_id)
    }
  }

  const handleViewDetail = (material: Material) => {
    setSelectedMaterial(material)
    setIsDetailModalOpen(true)
  }

  const columns: MaterialColumn<Material>[] = [
    {
      key: 'index',
      title: t('materialManagement.table.no'),
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
      title: t('materialManagement.table.name'),
      render: item => (
        <Tooltip content={item.name}>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
            {item.name}
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'description',
      title: t('materialManagement.table.description'),
      render: item => (
        <Tooltip content={item.description}>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
            {item.description}
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'unit_price',
      title: t('materialManagement.table.unitPrice'),
      render: (item: Material) => {
        const formattedPrice = parseInt(item.unit_price).toLocaleString('vi-VN')
        return (
          <Tooltip content={`${formattedPrice} VND`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formattedPrice} VND
            </div>
          </Tooltip>
        )
      },
      width: 'w-32',
    },
    {
      key: 'stockQuantity',
      title: t('materialManagement.table.stockQuantity'),
      render: item => (
        <Tooltip content={item.stock_quantity.toString()}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {item.stock_quantity}
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'status',
      title: t('materialManagement.table.status'),
      render: item => (
        <span
          className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full
            ${item.status === 'ACTIVE' ? ACTIVE : INACTIVE}`}
        >
          {item.status === 'ACTIVE'
            ? t('materialManagement.filterOptions.status.active')
            : t('materialManagement.filterOptions.status.inactive')}
        </span>
      ),
    },
    {
      key: 'action',
      title: t('materialManagement.table.action'),
      render: item => (
        <DropdownMenu
          onViewDetail={() => handleViewDetail(item)}
          onChangeStatus={() => {
            setSelectedMaterial(item)
            setIsStatusModalOpen(true)
          }}
          onRemove={() => {
            setSelectedMaterial(item)
            setIsDeleteModalOpen(true)
          }}
          changeStatusTitle={t('materialManagement.updateStatus.title')}
          viewDetailDisabled={false}
        />
      ),
      width: '80px',
    },
  ]

  return (
    <div className="w-full mt-[60px] p-4">
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <SearchInput
            placeholder={t('materialManagement.searchPlaceholder')}
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className="w-full lg:w-[280px]"
          />

          <div className="flex flex-wrap gap-2 lg:gap-4">
            <FilterDropdown
              options={priceRangeOptions}
              onSelect={handlePriceRangeChange}
              buttonClassName="w-full sm:w-[200px] lg:w-[250px]"
              selectedValue={selectedPriceRange}
              label={t('materialManagement.filterOptions.price.all')}
            />
            <FilterDropdown
              options={statusOptions}
              onSelect={handleStatusChange}
              buttonClassName="w-full sm:w-[180px]"
              selectedValue={selectedStatus}
              label={t('materialManagement.filterOptions.status.all')}
            />
            <AddButton
              onClick={() => setIsCreateModalOpen(true)}
              label={t('materialManagement.createMaterial')}
              icon={<Plus />}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex flex-wrap gap-4">
            {/* Active Status */}
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('materialManagement.filterOptions.status.active')}
              </span>
            </div>

            {/* Inactive Status */}
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('materialManagement.filterOptions.status.inactive')}
              </span>
            </div>
          </div>

          {/* Total Materials */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {t('materialManagement.totalMaterials', {
              filtered: filteredMaterials.length || 0,
              total: materialsData?.data?.pagination?.total || 0,
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <Table<Material>
            data={filteredMaterials}
            columns={columns}
            keyExtractor={item => item.material_id || Math.random().toString()}
            className="w-full"
            tableClassName="w-full"
            isLoading={isLoading || isFetching}
            emptyText={t('materialManagement.noData')}
          />
        </div>
      </div>

      {!isLoading && materialsData?.data?.pagination && (
        <div className="mt-4">
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
            // @ts-ignore
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
                <Dialog.Title className="text-lg font-medium mb-4">
                  {t('materialManagement.deleteConfirm.title')}
                </Dialog.Title>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('materialManagement.deleteConfirm.message')}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    {t('materialManagement.deleteConfirm.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteMaterial}
                    disabled={deleteMaterialMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteMaterialMutation.isPending
                      ? t('materialManagement.deleteConfirm.deleting')
                      : t('materialManagement.deleteConfirm.delete')}
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
            setIsDetailModalOpen(false)
            setSelectedMaterial(null)
          }}
          material={selectedMaterial}
        />
      )}
    </div>
  )
}

export default MaterialManagement
