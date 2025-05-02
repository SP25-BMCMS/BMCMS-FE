import AddButton from '@/components/AddButton'
import MaintenanceCycleModal from '@/components/MaintenanceCycle/AddMaintenanceCycle/MaintenanceCycleModal'
import GenerateScheduleModal from '@/components/MaintenanceCycle/GenerateScheduleModal'
import MaintenanceCycleFilter from '@/components/MaintenanceCycle/MaintenanceCycleFilter'
import Pagination from '@/components/Pagination'
import Table, { Column } from '@/components/Table'
import buildingDetailsApi from '@/services/buildingDetails'
import { deleteMaintenanceCycle, getMaintenanceCycles, getMaintenanceCycleHistory } from '@/services/maintenanceCycle'
import schedulesApi, { CycleConfig } from '@/services/schedules'
import { MaintenanceCycle } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { AlertTriangle, Calendar, Edit, Plus, Settings, Trash2, X, History } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { AxiosError } from 'axios'

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  cycleName,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  cycleName: string
}) => {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title={t('common.close')}
        >
          <X size={20} />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('maintenanceCycle.confirmDeletion')}</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('maintenanceCycle.deleteConfirmation', { cycleName })}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

const MaintenanceCycleManagement: React.FC = () => {
  const { t } = useTranslation()
  // State for pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  })

  // Filter states
  const [frequencyFilter, setFrequencyFilter] = useState('')
  const [basisFilter, setBasisFilter] = useState('')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('')
  const [isFilterApplied, setIsFilterApplied] = useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<MaintenanceCycle | undefined>(undefined)

  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [cycleToDelete, setCycleToDelete] = useState<{ id: string; name: string } | null>(null)

  // Generate Schedule modal states
  const [isGenerateScheduleModalOpen, setIsGenerateScheduleModalOpen] = useState(false)
  const [selectedCycles, setSelectedCycles] = useState<CycleConfig[]>([])
  const [selectedBuildingDetails, setSelectedBuildingDetails] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add state for history modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedCycleId, setSelectedCycleId] = useState<string>('')

  // Apply filters
  const handleFilterApply = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    setIsFilterApplied(true)
    refetch()
  }

  // Reset filters
  const handleFilterReset = () => {
    setFrequencyFilter('')
    setBasisFilter('')
    setDeviceTypeFilter('')
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    setIsFilterApplied(false)
    refetch()
  }

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
  })

  // Fetch building details
  const { data: buildingDetails, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildingDetails'],
    queryFn: () => {
      const userStr = localStorage.getItem('bmcms_user')
      const user = userStr ? JSON.parse(userStr) : null
      const userId = user?.userId

      if (!userId) {
        throw new Error('User ID not found')
      }

      return buildingDetailsApi.getBuildingDetailsForManager(userId)
    },
    enabled: !!localStorage.getItem('bmcms_user'), // Only run query if user exists
  })

  // Add query for fetching history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['maintenanceCycleHistory', selectedCycleId],
    queryFn: () => getMaintenanceCycleHistory(selectedCycleId),
    enabled: !!selectedCycleId && isHistoryModalOpen,
  })

  // Update pagination when data changes
  useEffect(() => {
    if (maintenanceCyclesData?.pagination) {
      setPagination(prev => ({
        ...prev,
        totalPages: maintenanceCyclesData.pagination.totalPages || 1,
        totalItems: maintenanceCyclesData.pagination.total || 0,
      }))
    }
  }, [maintenanceCyclesData])

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page,
    }))
  }

  // Handle items per page change
  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      itemsPerPage: limit,
    }))
  }

  // Open delete confirmation modal
  const openDeleteModal = (cycle: MaintenanceCycle) => {
    setCycleToDelete({
      id: cycle.cycle_id,
      name: `${cycle.device_type} (${cycle.frequency})`,
    })
    setIsDeleteModalOpen(true)
  }

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCycleToDelete(null)
  }

  // Delete maintenance cycle
  const handleDeleteCycle = async () => {
    if (!cycleToDelete) return

    try {
      await deleteMaintenanceCycle(cycleToDelete.id)
      toast.success('Maintenance cycle deleted successfully')
      closeDeleteModal()
      refetch()
    } catch (error) {
      toast.error('Failed to delete maintenance cycle')
      console.error('Error deleting maintenance cycle:', error)
    }
  }

  // Edit maintenance cycle
  const handleEditCycle = (cycle: MaintenanceCycle) => {
    setSelectedCycle(cycle)
    setIsEditMode(true)
    setIsModalOpen(true)
  }

  // Open create cycle modal
  const handleCreateCycle = () => {
    setSelectedCycle(undefined)
    setIsEditMode(false)
    setIsModalOpen(true)
  }

  // Close modal and refresh data if needed
  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCycle(undefined)
    setIsEditMode(false)
  }

  // Handle successful creation or update
  const handleCycleCreated = () => {
    refetch()
  }

  const handleOpenGenerateScheduleModal = () => {
    setIsGenerateScheduleModalOpen(true)
  }

  const handleCloseGenerateScheduleModal = () => {
    setIsGenerateScheduleModalOpen(false)
    setSelectedCycles([])
    setSelectedBuildingDetails([])
  }

  const handleCycleSelect = (cycle: MaintenanceCycle) => {
    setSelectedCycles(prev => {
      const exists = prev.find(c => c.cycle_id === cycle.cycle_id)
      if (exists) {
        return prev.filter(c => c.cycle_id !== cycle.cycle_id)
      }
      return [
        ...prev,
        {
          cycle_id: cycle.cycle_id,
          duration_days: 1,
          auto_create_tasks: true,
          start_date: format(new Date(), 'yyyy-MM-dd'),
        },
      ]
    })
  }

  const handleDurationChange = (cycleId: string, duration: number) => {
    setSelectedCycles(prev =>
      prev.map(c =>
        c.cycle_id === cycleId ? { ...c, duration_days: duration } : c
      )
    )
  }

  const handleStartDateChange = (cycleId: string, date: string) => {
    setSelectedCycles(prev =>
      prev.map(c =>
        c.cycle_id === cycleId ? { ...c, start_date: date } : c
      )
    )
  }

  const handleAutoCreateChange = (cycleId: string, checked: boolean) => {
    setSelectedCycles(prev =>
      prev.map(c =>
        c.cycle_id === cycleId ? { ...c, auto_create_tasks: checked } : c
      )
    )
  }

  const handleBuildingDetailSelect = (buildingDetailId: string) => {
    setSelectedBuildingDetails(prev => {
      if (prev.includes(buildingDetailId)) {
        return prev.filter(id => id !== buildingDetailId)
      }
      return [...prev, buildingDetailId]
    })
  }

  const handleGenerateSchedule = async () => {
    if (selectedCycles.length === 0) {
      toast.error(t('maintenanceCycle.schedule.selectAtLeastOneCycle'))
      return
    }

    if (selectedBuildingDetails.length === 0) {
      toast.error(t('maintenanceCycle.schedule.selectAtLeastOneBuilding'))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await schedulesApi.generateSchedules({
        cycle_configs: selectedCycles,
        buildingDetails: selectedBuildingDetails,
      })

      if (response.isSuccess) {
        toast.success(t('maintenanceCycle.schedule.success'))
        handleCloseGenerateScheduleModal()
      } else {
        throw new Error(response.message || t('maintenanceCycle.schedule.error'))
      }
    } catch (error) {
      toast.error(t('maintenanceCycle.schedule.error'))
      console.error('Error generating schedules:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add handler for opening history modal
  const handleOpenHistoryModal = (cycleId: string) => {
    setSelectedCycleId(cycleId)
    setIsHistoryModalOpen(true)
  }

  // Add handler for closing history modal
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false)
    setSelectedCycleId('')
  }

  // Table columns definition
  const columns: Column<MaintenanceCycle>[] = [
    {
      key: 'index',
      title: t('maintenanceCycle.table.no'),
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'frequency',
      title: t('maintenanceCycle.table.frequency'),
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Settings className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          {t(`maintenanceCycle.filterOptions.frequency.${item.frequency}`)}
        </div>
      ),
    },
    {
      key: 'basis',
      title: t('maintenanceCycle.table.basis'),
      render: item => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {t(`maintenanceCycle.filterOptions.basis.${item.basis}`)}
        </div>
      ),
    },
    {
      key: 'device_type',
      title: t('maintenanceCycle.table.deviceType'),
      render: item => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {t(`maintenanceCycle.filterOptions.deviceType.${item.device_type}`)}
        </div>
      ),
    },
    {
      key: 'actions',
      title: t('maintenanceCycle.table.actions'),
      render: item => (
        <div className="flex justify-center gap-2">
          <button
            onClick={e => {
              e.stopPropagation()
              handleOpenHistoryModal(item.cycle_id)
            }}
            className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            title={t('maintenanceCycle.viewHistory')}
          >
            <History size={16} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              handleEditCycle(item)
            }}
            className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title={t('maintenanceCycle.editCycle')}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              openDeleteModal(item)
            }}
            className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            title={t('maintenanceCycle.deleteCycle')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      width: '120px',
    },
  ]

  // Loading animation
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
      <p className="text-gray-700 dark:text-gray-300">{t('maintenanceCycle.loading')}</p>
    </div>
  )

  // Add History Modal component
  const HistoryModal = ({ isOpen, onClose, historyData, isLoading }: {
    isOpen: boolean
    onClose: () => void
    historyData: any | undefined
    isLoading: boolean
  }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={t('common.close')}
          >
            <X size={20} />
          </button>

          <div className="text-center mb-5">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
              <History className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('maintenanceCycle.history')}</h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : historyData?.data && historyData.data.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {historyData.data.map(history => (
                <div
                  key={history.history_id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {t(`maintenanceCycle.filterOptions.deviceType.${history.device_type}`)} - {t(`maintenanceCycle.filterOptions.frequency.${history.frequency}`)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('maintenanceCycle.changedAt')}: {new Date(history.changed_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('maintenanceCycle.updatedBy')}: {history.updated_by}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t('maintenanceCycle.reason')}: {history.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('maintenanceCycle.noHistory')}
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mt-[60px]">
      <div className="w-[95%] mx-auto mb-4">
        <div className="flex justify-end mb-6 gap-3">
          <button
            onClick={handleOpenGenerateScheduleModal}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
          >
            <Calendar size={16} />
            {t('maintenanceCycle.generateSchedule.title')}
          </button>
          <AddButton
            onClick={handleCreateCycle}
            label={t('maintenanceCycle.createCycle')}
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
              <p>{t('maintenanceCycle.error')}</p>
            </div>
          ) : (
            <>
              <Table
                data={maintenanceCyclesData?.data || []}
                columns={columns}
                keyExtractor={item => item.cycle_id}
                isLoading={isLoading}
                emptyText={t('maintenanceCycle.noData')}
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

      {/* Generate Schedule Modal */}
      <GenerateScheduleModal
        isOpen={isGenerateScheduleModalOpen}
        onClose={handleCloseGenerateScheduleModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteCycle}
        cycleName={cycleToDelete?.name || ''}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        historyData={historyData}
        isLoading={isLoadingHistory}
      />
    </div>
  )
}

export default MaintenanceCycleManagement
