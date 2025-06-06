import Modal from '@/components/Modal'
import buildingDetailsApi from '@/services/buildingDetails'
import { getMaintenanceCycles } from '@/services/maintenanceCycle'
import schedulesApi, { CycleConfig } from '@/services/schedules'
import { MaintenanceCycle } from '@/types'
import { BuildingDetailWithBuilding } from '@/types/buildingDetail'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Building2, Calendar, CheckCircle2, Clock } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface GenerateScheduleModalProps {
    isOpen: boolean
    onClose: () => void
}

const GenerateScheduleModal: React.FC<GenerateScheduleModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation()
    const [selectedCycles, setSelectedCycles] = useState<CycleConfig[]>([])
    const [selectedBuildingDetails, setSelectedBuildingDetails] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<'cycles' | 'buildings'>('cycles')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Get user ID from localStorage
    const userStr = localStorage.getItem('bmcms_user')
    const user = userStr ? JSON.parse(userStr) : null
    const userId = user?.userId

    // Fetch maintenance cycles
    const { data: maintenanceCycles, isLoading: isLoadingCycles } = useQuery({
        queryKey: ['maintenanceCycles'],
        queryFn: () => getMaintenanceCycles({ page: 1, limit: 9999 }),
    })

    // Fetch building details
    const { data: buildingDetails, isLoading: isLoadingBuildings } = useQuery({
        queryKey: ['buildingDetails', userId],
        queryFn: () => {
            if (!userId) {
                throw new Error('User ID not found')
            }
            return buildingDetailsApi.getBuildingDetailsForManager(userId)
        },
        enabled: !!userId, // Only run query if userId exists
    }) as { data: BuildingDetailWithBuilding[] | undefined, isLoading: boolean }

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

    const handleDurationChange = (cycleId: string, value: string) => {
        // Allow empty value for better UX
        if (value === '') {
            setSelectedCycles(prev =>
                prev.map(c =>
                    c.cycle_id === cycleId ? { ...c, duration_days: 1 } : c
                )
            )
            return
        }

        // Convert to number and validate
        const duration = parseInt(value)
        if (isNaN(duration) || duration < 1) {
            return // Don't update if invalid
        }

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

    const handleSelectAllCycles = () => {
        if (!maintenanceCycles?.data) return

        if (selectedCycles.length === maintenanceCycles.data.length) {
            // If all are selected, deselect all
            setSelectedCycles([])
        } else {
            // Select all cycles
            const allCycles = maintenanceCycles.data.map(cycle => ({
                cycle_id: cycle.cycle_id,
                duration_days: 1,
                auto_create_tasks: true,
                start_date: format(new Date(), 'yyyy-MM-dd'),
            }))
            setSelectedCycles(allCycles)
        }
    }

    const handleSelectAllBuildings = () => {
        if (!buildingDetails) return

        if (selectedBuildingDetails.length === buildingDetails.length) {
            // If all are selected, deselect all
            setSelectedBuildingDetails([])
        } else {
            // Select all building details
            const allBuildingIds = buildingDetails.map(building => building.buildingDetailId)
            setSelectedBuildingDetails(allBuildingIds)
        }
    }

    const handleSubmit = async () => {
        if (selectedCycles.length === 0) {
            toast.error(t('maintenanceCycle.generateSchedule.errors.selectCycle'))
            return
        }

        if (selectedBuildingDetails.length === 0) {
            toast.error(t('maintenanceCycle.generateSchedule.errors.selectBuilding'))
            return
        }

        setIsSubmitting(true)
        try {
            const response = await schedulesApi.generateSchedules({
                cycle_configs: selectedCycles,
                buildingDetails: selectedBuildingDetails,
            })

            // Check if response has createdSchedules
            if (response && response.data && response.data.createdSchedules && response.data.createdSchedules.length > 0) {
                // Reset selections
                setSelectedCycles([])
                setSelectedBuildingDetails([])
                // Close modal first
                onClose()
                // Then show success message
                toast.success(response.message || t('maintenanceCycle.generateSchedule.success'))
            } else {
                // Handle case where response doesn't have expected structure
                toast.error(response.message || t('maintenanceCycle.generateSchedule.errors.generateFailed'))
                console.error('Invalid response structure:', response)
            }
        } catch (error) {
            // Handle network errors or other exceptions
            toast.error(t('maintenanceCycle.generateSchedule.errors.generateFailed'))
            console.error('Error generating schedules:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const LoadingSpinner = () => (
        <div className="flex justify-center items-center h-32">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
            />
        </div>
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('maintenanceCycle.generateSchedule.title')}
            size="xl"
            showBackdrop={false}
        >
            <div className="flex flex-col h-[calc(100vh-200px)]">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <div className="flex-1 flex items-center">
                        <button
                            onClick={() => setActiveTab('cycles')}
                            className={`flex items-center px-4 py-2 text-sm font-medium ${activeTab === 'cycles'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            {t('maintenanceCycle.generateSchedule.tabs.cycles')}
                            {selectedCycles.length > 0 && (
                                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                                    {selectedCycles.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('buildings')}
                            className={`flex items-center px-4 py-2 text-sm font-medium ${activeTab === 'buildings'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Building2 className="w-4 h-4 mr-2" />
                            {t('maintenanceCycle.generateSchedule.tabs.buildings')}
                            {selectedBuildingDetails.length > 0 && (
                                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                                    {selectedBuildingDetails.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="flex items-center px-4">
                        {activeTab === 'cycles' ? (
                            <button
                                onClick={handleSelectAllCycles}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                {selectedCycles.length === maintenanceCycles?.data.length
                                    ? t('maintenanceCycle.generateSchedule.deselectAll')
                                    : t('maintenanceCycle.generateSchedule.selectAll')}
                            </button>
                        ) : (
                            <button
                                onClick={handleSelectAllBuildings}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                {selectedBuildingDetails.length === buildingDetails?.length
                                    ? t('maintenanceCycle.generateSchedule.deselectAll')
                                    : t('maintenanceCycle.generateSchedule.selectAll')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'cycles' ? (
                        <div>
                            {isLoadingCycles ? (
                                <LoadingSpinner />
                            ) : (
                                <div className="space-y-4">
                                    {maintenanceCycles?.data.map(cycle => (
                                        <motion.div
                                            key={cycle.cycle_id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 border rounded-lg transition-all duration-200 ${selectedCycles.find(c => c.cycle_id === cycle.cycle_id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        {t(`maintenanceCycle.deviceTypes.${cycle.device_type}`)} - {t(`maintenanceCycle.frequencies.${cycle.frequency}`)}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">{cycle.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleCycleSelect(cycle)}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedCycles.find(c => c.cycle_id === cycle.cycle_id)
                                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    aria-label={selectedCycles.find(c => c.cycle_id === cycle.cycle_id) ? t('maintenanceCycle.generateSchedule.selected') : t('maintenanceCycle.generateSchedule.select')}
                                                >
                                                    {selectedCycles.find(c => c.cycle_id === cycle.cycle_id) ? (
                                                        <span className="flex items-center">
                                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                                            {t('maintenanceCycle.generateSchedule.selected')}
                                                        </span>
                                                    ) : (
                                                        t('maintenanceCycle.generateSchedule.select')
                                                    )}
                                                </button>
                                            </div>

                                            {selectedCycles.find(c => c.cycle_id === cycle.cycle_id) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-4 space-y-4 bg-white rounded-lg p-4 border border-blue-100"
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('maintenanceCycle.generateSchedule.duration.label')}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={selectedCycles.find(c => c.cycle_id === cycle.cycle_id)?.duration_days || ''}
                                                                    onChange={e => handleDurationChange(cycle.cycle_id, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        // Prevent negative numbers and decimal points
                                                                        if (e.key === '-' || e.key === '.') {
                                                                            e.preventDefault()
                                                                        }
                                                                    }}
                                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                                                                    placeholder="Nhập số ngày"
                                                                    aria-label={t('maintenanceCycle.generateSchedule.duration.label')}
                                                                />
                                                                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            </div>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {t('maintenanceCycle.generateSchedule.duration.help')}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('maintenanceCycle.generateSchedule.startDate.label')}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="date"
                                                                    value={
                                                                        selectedCycles.find(c => c.cycle_id === cycle.cycle_id)
                                                                            ?.start_date || format(new Date(), 'yyyy-MM-dd')
                                                                    }
                                                                    onChange={e =>
                                                                        handleStartDateChange(cycle.cycle_id, e.target.value)
                                                                    }
                                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                                                                    aria-label={t('maintenanceCycle.generateSchedule.startDate.label')}
                                                                />
                                                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center mt-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectedCycles.find(c => c.cycle_id === cycle.cycle_id)
                                                                    ?.auto_create_tasks || false
                                                            }
                                                            onChange={e =>
                                                                handleAutoCreateChange(cycle.cycle_id, e.target.checked)
                                                            }
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            aria-label={t('maintenanceCycle.generateSchedule.autoCreateTasks.label')}
                                                        />
                                                        <label className="ml-2 block text-sm text-gray-900">
                                                            {t('maintenanceCycle.generateSchedule.autoCreateTasks.label')}
                                                        </label>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {isLoadingBuildings ? (
                                <LoadingSpinner />
                            ) : buildingDetails && buildingDetails.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {buildingDetails.map(buildingDetail => (
                                        <motion.div
                                            key={buildingDetail.buildingDetailId}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedBuildingDetails.includes(buildingDetail.buildingDetailId)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                            onClick={() => handleBuildingDetailSelect(buildingDetail.buildingDetailId)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleBuildingDetailSelect(buildingDetail.buildingDetailId)
                                                }
                                            }}
                                        >
                                            <div className="flex items-start">
                                                <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">{buildingDetail.name}</h4>
                                                    <div className="mt-1 space-y-1">
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">{t('maintenanceCycle.generateSchedule.building')}:</span> {buildingDetail.building?.name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">{t('maintenanceCycle.generateSchedule.area')}:</span> {buildingDetail.building?.area?.name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">{t('maintenanceCycle.generateSchedule.totalApartments')}:</span> {buildingDetail.total_apartments || 0}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">{t('maintenanceCycle.generateSchedule.numberOfFloors')}:</span> {buildingDetail.building?.numberFloor || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">{t('maintenanceCycle.generateSchedule.status')}:</span>{' '}
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${buildingDetail.building?.Status === 'operational'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {buildingDetail.building?.Status === 'operational'
                                                                    ? t('maintenanceCycle.generateSchedule.operational')
                                                                    : t('maintenanceCycle.generateSchedule.underConstruction')}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">{t('maintenanceCycle.generateSchedule.locationDetails')}:</span> {buildingDetail.locationDetails?.length || 0} {t('maintenanceCycle.generateSchedule.locations')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedBuildingDetails.includes(buildingDetail.buildingDetailId) && (
                                                    <CheckCircle2 className="w-5 h-5 text-blue-500 ml-2" />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    {t('maintenanceCycle.generateSchedule.noBuildingDetails')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        {t('maintenanceCycle.generateSchedule.buttons.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`px-4 py-2 rounded-md transition-colors ${isSubmitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                {t('maintenanceCycle.generateSchedule.buttons.generating')}
                            </div>
                        ) : (
                            t('maintenanceCycle.generateSchedule.buttons.generate')
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default GenerateScheduleModal 