import React, { useState, useEffect } from 'react'
import Table, { Column } from '@/components/Table'
import { BuildingResponse } from '@/types'
import { getBuildings, deleteBuilding } from '@/services/building'
import { getAreaList } from '@/services/areas'
import { getAllStaff } from '@/services/staff'
import { PiMapPinAreaBold } from 'react-icons/pi'
import { FaRegBuilding } from 'react-icons/fa'
import { User } from 'lucide-react'
import AddBuildingModal from '@/components/BuildingManager/buildings/AddBuilding/AddBuildingModal'
import RemoveBuilding from '@/components/BuildingManager/buildings/DeleteBuilding/RemoveBuilding'
import ViewBuildingModal from '@/components/BuildingManager/buildings/ViewBuilding/ViewBuildingModal'
import EditBuildingModal from '@/components/BuildingManager/buildings/EditBuilding/EditBuildingModal'
import DropdownMenu from '@/components/DropDownMenu'
import SearchInput from '@/components/SearchInput'
import FilterDropdown from '@/components/FilterDropdown'
import AddButton from '@/components/AddButton'
import AddAreaModal from '@/components/BuildingManager/areas/addAreas/AddAreaModal'
import Pagination from '@/components/Pagination'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Tooltip from '@/components/Tooltip'

const Building: React.FC = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false)
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false)
  const [isRemoveBuildingModalOpen, setIsRemoveBuildingModalOpen] = useState(false)
  const [isViewBuildingModalOpen, setIsViewBuildingModalOpen] = useState(false)
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [managerNames, setManagerNames] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

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
      }
      const response = await getBuildings(params)
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

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
  })

  // Fetch staff with React Query
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: getAllStaff,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  // Process staff data for manager names
  useEffect(() => {
    if (staffData && staffData.data) {
      const managerMapping: Record<string, string> = {}
      staffData.data.forEach(staff => {
        managerMapping[staff.userId] = staff.username
      })
      setManagerNames(managerMapping)
    }
  }, [staffData])

  // Delete building mutation
  const deleteBuildingMutation = useMutation({
    mutationFn: (buildingId: string) => deleteBuilding(buildingId),
    onMutate: async buildingId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['buildings'] })

      // Snapshot the previous value
      const previousBuildings = queryClient.getQueryData(['buildings'])

      // Optimistically update to the new value
      queryClient.setQueryData(['buildings'], (old: any) => ({
        ...old,
        data: old.data.filter((building: BuildingResponse) => building.buildingId !== buildingId),
        pagination: {
          ...old.pagination,
          total: old.pagination.total - 1,
        },
      }))

      return { previousBuildings }
    },
    onError: (err, buildingId, context) => {
      // Revert back to the previous value
      if (context?.previousBuildings) {
        queryClient.setQueryData(['buildings'], context.previousBuildings)
      }
      toast.error('Failed to delete building!')
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
    },
  })

  const getAreaName = (areaId: string): string => {
    const area = areas.find(a => a.areaId === areaId)
    return area ? area.name : 'N/A'
  }

  const getManagerName = (managerId?: string): string => {
    if (!managerId) return t('buildingManagement.notAssigned')
    return managerNames[managerId] || t('buildingManagement.unknown')
  }

  const getTruncatedManagerName = (managerId?: string): string => {
    const fullName = getManagerName(managerId)
    if (fullName.length > 10) {
      return `${fullName.substring(0, 8)}...`
    }
    return fullName
  }

  const handleViewBuildingDetail = (building: BuildingResponse) => {
    setSelectedBuilding(building)
    setIsViewBuildingModalOpen(true)
  }

  const handleEditBuilding = (building: BuildingResponse) => {
    setSelectedBuilding(building)
    setIsEditBuildingModalOpen(true)
  }

  const handleRemoveBuilding = (building: BuildingResponse) => {
    setSelectedBuilding(building)
    setIsRemoveBuildingModalOpen(true)
  }

  const confirmRemoveBuilding = async () => {
    if (!selectedBuilding) return

    setIsDeleting(true)
    try {
      await deleteBuildingMutation.mutateAsync(selectedBuilding.buildingId)
      toast.success(t('buildingManagement.deleteSuccess'))
      setIsRemoveBuildingModalOpen(false)
    } catch (error) {
      console.error('Failed to delete building:', error)
      toast.error(t('buildingManagement.deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  const filterOptions = [
    { value: 'all', label: t('buildingManagement.filterOptions.all') },
    { value: 'operational', label: t('buildingManagement.filterOptions.operational') },
    { value: 'under_construction', label: t('buildingManagement.filterOptions.under_construction') },
  ]

  const columns: Column<BuildingResponse>[] = [
    {
      key: 'index',
      title: t('buildingManagement.table1.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: t('buildingManagement.table1.buildingName'),
      render: item => (
        <Tooltip content={item.name} position="bottom" delay={200}>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
            {item.name}
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'areaId',
      title: t('buildingManagement.table1.areaName'),
      render: item => (
        <Tooltip content={getAreaName(item.areaId)} position="bottom" delay={200}>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
            {getAreaName(item.areaId)}
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'manager',
      title: t('buildingManagement.table1.manager'),
      render: item => (
        <Tooltip content={getManagerName(item.manager_id)} position="bottom" delay={200}>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center truncate max-w-[100px]">
            <User className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" />
            <span className="truncate">{getTruncatedManagerName(item.manager_id)}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'Floor',
      title: t('buildingManagement.table1.floor'),
      render: item => (
        <Tooltip content={item.numberFloor.toString()} position="bottom" delay={200}>
          <div className="text-sm text-gray-500 dark:text-gray-400">{item.numberFloor}</div>
        </Tooltip>
      ),
    },
    {
      key: 'createdAt',
      title: t('buildingManagement.table1.createdDate'),
      render: item => (
        <Tooltip content={new Date(item.createdAt).toLocaleDateString()} position="bottom" delay={200}>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
            {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'completion Date',
      title: t('buildingManagement.table1.completionDate'),
      render: item => (
        <Tooltip
          content={item.completion_date ? new Date(item.completion_date).toLocaleDateString() : 'N/A'}
          position="bottom"
          delay={200}
        >
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
            {item.completion_date ? new Date(item.completion_date).toLocaleDateString() : 'N/A'}
          </div>
        </Tooltip>
      ),
    },
    {
      key: 'status',
      title: t('buildingManagement.table1.status'),
      render: item => (
        <Tooltip content={t(`buildingManagement.status.${item.Status}`)} position="bottom" delay={200}>
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.Status === 'operational'
              ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
              : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
              }`}
          >
            {t(`buildingManagement.status.${item.Status}`)}
          </span>
        </Tooltip>
      ),
    },
    {
      key: 'action',
      title: t('buildingManagement.table1.action'),
      render: item => (
        <div onClick={e => e.stopPropagation()}>
          <DropdownMenu
            onViewDetail={() => handleViewBuildingDetail(item)}
            onChangeStatus={() => handleEditBuilding(item)}
            onRemove={() => handleRemoveBuilding(item)}
            changeStatusTitle={t('buildingManagement.editBuilding')}
          />
        </div>
      ),
      width: '80px',
    },
  ]

  const handleAddSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['buildings'] })
  }

  // Loading animation for standalone use
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  }

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">{t('buildingManagement.loading')}</p>
    </div>
  )

  return (
    <div className="w-full mt-[30px] md:mt-[60px] px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <SearchInput
          placeholder={t('buildingManagement.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-[20rem] max-w-full md:max-w-xs"
        />

        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-start md:justify-end">
          <FilterDropdown
            options={filterOptions}
            selectedValue={selectedStatus}
            onSelect={setSelectedStatus}
          />

          <AddButton
            label={t('buildingManagement.addArea')}
            className="w-auto min-w-[120px] md:min-w-[154px] whitespace-nowrap"
            icon={<PiMapPinAreaBold />}
            onClick={() => setIsAddAreaModalOpen(true)}
          />
          <AddButton
            label={t('buildingManagement.addBuilding')}
            icon={<FaRegBuilding />}
            className="w-auto min-w-[120px] md:min-w-[154px] whitespace-nowrap"
            onClick={() => setIsAddBuildingModalOpen(true)}
          />
        </div>
      </div>

      {isLoadingBuildings ? (
        <LoadingIndicator />
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <Table<BuildingResponse>
              data={buildingsData?.data || []}
              columns={columns}
              keyExtractor={item => item.buildingId}
              onRowClick={() => { }}
              className="w-full"
              tableClassName="w-full min-w-[750px]"
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={buildingsData?.pagination.totalPages || 1}
            onPageChange={setCurrentPage}
            totalItems={buildingsData?.pagination.total || 0}
            itemsPerPage={itemsPerPage}
            onLimitChange={setItemsPerPage}
            className="w-full mt-4"
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
  )
}

export default Building
