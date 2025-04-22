import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMaintenanceCycles } from '@/services/maintenanceCycle'
import { toast } from 'react-hot-toast'
import { RiCloseLine, RiCalendarLine, RiBuilding2Line, RiSettings3Line, RiSearchLine } from 'react-icons/ri'

interface CreateAutoScheduleModalProps {
    isOpen: boolean
    onClose: () => void
    buildingDetails: any[] | undefined
    onSubmit: (data: {
        schedule_name: string
        description: string
        cycle_id: string
        buildingDetailIds: string[]
        start_date: string
        end_date: string
    }) => void
}

const CreateAutoScheduleModal: React.FC<CreateAutoScheduleModalProps> = ({
    isOpen,
    onClose,
    buildingDetails = [],
    onSubmit,
}) => {
    const [formData, setFormData] = useState({
        schedule_name: '',
        description: '',
        cycle_id: '',
        buildingDetailIds: [] as string[],
        start_date: '',
        end_date: '',
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTab, setSelectedTab] = useState<'all' | 'selected'>('all')

    // Fetch maintenance cycles
    const { data: cyclesData, isLoading: isLoadingCycles } = useQuery({
        queryKey: ['maintenanceCycles'],
        queryFn: () => getMaintenanceCycles({
            page: 1,
            limit: 99999
        }),
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate form data
        if (!formData.schedule_name.trim()) {
            toast.error('Please enter schedule name')
            return
        }
        if (!formData.cycle_id) {
            toast.error('Please select a maintenance cycle')
            return
        }
        if (formData.buildingDetailIds.length === 0) {
            toast.error('Please select at least one building detail')
            return
        }
        if (!formData.start_date) {
            toast.error('Please select start date')
            return
        }
        if (!formData.end_date) {
            toast.error('Please select end date')
            return
        }

        const startDate = new Date(formData.start_date)
        const endDate = new Date(formData.end_date)

        if (endDate < startDate) {
            toast.error('End date must be after start date')
            return
        }

        onSubmit(formData)
    }

    const handleBuildingDetailToggle = (id: string) => {
        setFormData(prev => ({
            ...prev,
            buildingDetailIds: prev.buildingDetailIds.includes(id)
                ? prev.buildingDetailIds.filter(buildingId => buildingId !== id)
                : [...prev.buildingDetailIds, id],
        }))
    }

    const filteredBuildingDetails = buildingDetails?.filter(buildingDetail => {
        const searchLower = searchTerm.toLowerCase()
        return (
            buildingDetail.building?.name?.toLowerCase().includes(searchLower) ||
            buildingDetail.name?.toLowerCase().includes(searchLower)
        )
    })

    const selectedBuildingDetails = buildingDetails?.filter(buildingDetail =>
        formData.buildingDetailIds.includes(buildingDetail.buildingDetailId)
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        Create Automatic Maintenance Schedule
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title="Close modal"
                    >
                        <RiCloseLine className="w-6 h-6" />
                    </button>
                </div>

                {isLoadingCycles ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Schedule Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.schedule_name}
                                    onChange={e => setFormData(prev => ({ ...prev, schedule_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                                    placeholder="Enter schedule name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                    <RiSettings3Line className="w-4 h-4 mr-2 text-blue-500" />
                                    Maintenance Cycle
                                </label>
                                <select
                                    value={formData.cycle_id}
                                    onChange={e => setFormData(prev => ({ ...prev, cycle_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                                    title="Select maintenance cycle"
                                >
                                    <option value="">Select a maintenance cycle</option>
                                    {cyclesData?.data?.map((cycle: any) => (
                                        <option key={cycle.cycle_id} value={cycle.cycle_id}>
                                            {cycle.device_type} - {cycle.frequency} ({cycle.basis})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                                placeholder="Enter description"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                    <RiCalendarLine className="w-4 h-4 mr-2 text-blue-500" />
                                    Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_date}
                                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                                    title="Select start date and time"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                    <RiCalendarLine className="w-4 h-4 mr-2 text-blue-500" />
                                    End Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.end_date}
                                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                                    title="Select end date and time"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                <RiBuilding2Line className="w-4 h-4 mr-2 text-blue-500" />
                                Building Details
                            </label>

                            <div className="flex items-center space-x-4 mb-4">
                                <div className="flex-1 relative">
                                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                                        placeholder="Search buildings..."
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTab('all')}
                                        className={`px-4 py-2 rounded-md transition-colors ${selectedTab === 'all'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        All ({buildingDetails?.length || 0})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTab('selected')}
                                        className={`px-4 py-2 rounded-md transition-colors ${selectedTab === 'selected'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        Selected ({formData.buildingDetailIds.length})
                                    </button>
                                </div>
                            </div>

                            <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                                <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                                    {selectedTab === 'all' ? (
                                        filteredBuildingDetails?.length > 0 ? (
                                            filteredBuildingDetails.map(buildingDetail => (
                                                <div
                                                    key={buildingDetail.buildingDetailId}
                                                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`building-${buildingDetail.buildingDetailId}`}
                                                        checked={formData.buildingDetailIds.includes(buildingDetail.buildingDetailId)}
                                                        onChange={() => handleBuildingDetailToggle(buildingDetail.buildingDetailId)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                                                    />
                                                    <label
                                                        htmlFor={`building-${buildingDetail.buildingDetailId}`}
                                                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                                                    >
                                                        <div className="font-medium">{buildingDetail.building?.name}</div>
                                                        <div className="text-gray-500 dark:text-gray-400">{buildingDetail.name}</div>
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                No building details found
                                            </div>
                                        )
                                    ) : (
                                        selectedBuildingDetails?.length > 0 ? (
                                            selectedBuildingDetails.map(buildingDetail => (
                                                <div
                                                    key={buildingDetail.buildingDetailId}
                                                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`selected-building-${buildingDetail.buildingDetailId}`}
                                                        checked={formData.buildingDetailIds.includes(buildingDetail.buildingDetailId)}
                                                        onChange={() => handleBuildingDetailToggle(buildingDetail.buildingDetailId)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                                                    />
                                                    <label
                                                        htmlFor={`selected-building-${buildingDetail.buildingDetailId}`}
                                                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                                                    >
                                                        <div className="font-medium">{buildingDetail.building?.name}</div>
                                                        <div className="text-gray-500 dark:text-gray-400">{buildingDetail.name}</div>
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                No building details selected
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Create Schedule
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default CreateAutoScheduleModal 