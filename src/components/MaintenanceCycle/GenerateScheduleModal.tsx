import React, { useState } from 'react'
import Modal from '@/components/Modal'
import { useQuery } from '@tanstack/react-query'
import { getMaintenanceCycles } from '@/services/maintenanceCycle'
import buildingDetailsApi from '@/services/buildingDetails'
import { MaintenanceCycle } from '@/types'
import { BuildingDetail } from '@/types/buildingDetail'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import schedulesApi, { CycleConfig } from '@/services/schedules'
import { motion } from 'framer-motion'
import { Calendar, Building2, Clock, CheckCircle2 } from 'lucide-react'

interface GenerateScheduleModalProps {
    isOpen: boolean
    onClose: () => void
}

const GenerateScheduleModal: React.FC<GenerateScheduleModalProps> = ({ isOpen, onClose }) => {
    const [selectedCycles, setSelectedCycles] = useState<CycleConfig[]>([])
    const [selectedBuildingDetails, setSelectedBuildingDetails] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<'cycles' | 'buildings'>('cycles')

    // Get user ID from localStorage
    const userStr = localStorage.getItem('bmcms_user')
    const user = userStr ? JSON.parse(userStr) : null
    const userId = user?.userId

    // Fetch maintenance cycles
    const { data: maintenanceCycles, isLoading: isLoadingCycles } = useQuery({
        queryKey: ['maintenanceCycles'],
        queryFn: () => getMaintenanceCycles(),
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
    })

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

    const handleSubmit = async () => {
        if (selectedCycles.length === 0) {
            toast.error('Please select at least one maintenance cycle')
            return
        }

        if (selectedBuildingDetails.length === 0) {
            toast.error('Please select at least one building detail')
            return
        }

        try {
            const response = await schedulesApi.generateSchedules({
                cycle_configs: selectedCycles,
                buildingDetails: selectedBuildingDetails,
            })

            if (response.statusCode === 200) {
                toast.success('Schedules generated successfully')
                onClose()
            } else {
                throw new Error(response.message || 'Failed to generate schedules')
            }
        } catch (error) {
            toast.error('Failed to generate schedules')
            console.error('Error generating schedules:', error)
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
            title="Generate Maintenance Schedules"
            size="xl"
            showBackdrop={false}
        >
            <div className="flex flex-col h-[calc(100vh-200px)]">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('cycles')}
                        className={`flex items-center px-4 py-2 text-sm font-medium ${activeTab === 'cycles'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Maintenance Cycles
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
                        Building Details
                        {selectedBuildingDetails.length > 0 && (
                            <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                                {selectedBuildingDetails.length}
                            </span>
                        )}
                    </button>
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
                                                    <h4 className="font-medium text-gray-900">{cycle.cycle_name}</h4>
                                                    <p className="text-sm text-gray-500">{cycle.device_type}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleCycleSelect(cycle)}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedCycles.find(c => c.cycle_id === cycle.cycle_id)
                                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    aria-label={selectedCycles.find(c => c.cycle_id === cycle.cycle_id) ? 'Deselect cycle' : 'Select cycle'}
                                                >
                                                    {selectedCycles.find(c => c.cycle_id === cycle.cycle_id) ? (
                                                        <span className="flex items-center">
                                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                                            Selected
                                                        </span>
                                                    ) : (
                                                        'Select'
                                                    )}
                                                </button>
                                            </div>

                                            {selectedCycles.find(c => c.cycle_id === cycle.cycle_id) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-4 space-y-3"
                                                >
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Duration (days)
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    selectedCycles.find(c => c.cycle_id === cycle.cycle_id)
                                                                        ?.duration_days || 1
                                                                }
                                                                onChange={e =>
                                                                    handleDurationChange(cycle.cycle_id, parseInt(e.target.value))
                                                                }
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                aria-label="Duration in days"
                                                            />
                                                            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Start Date
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
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                aria-label="Start date"
                                                            />
                                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center">
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
                                                            aria-label="Auto create tasks"
                                                        />
                                                        <label className="ml-2 block text-sm text-gray-900">
                                                            Auto create tasks
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
                                                            <span className="font-medium">Building:</span> {buildingDetail.building?.name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">Area:</span> {buildingDetail.building?.area?.name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">Total Apartments:</span> {buildingDetail.total_apartments || 0}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">Number of Floors:</span> {buildingDetail.building?.numberFloor || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">Status:</span>{' '}
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${buildingDetail.building?.Status === 'operational'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {buildingDetail.building?.Status || 'N/A'}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium">Location Details:</span> {buildingDetail.locationDetails?.length || 0} locations
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
                                    No building details found. Please try again later.
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
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Generate Schedules
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default GenerateScheduleModal 