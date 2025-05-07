import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { IoArrowBack } from 'react-icons/io5'
import { FaClipboardList, FaCalendarAlt, FaUser, FaCheckCircle, FaMapMarkerAlt, FaMailBulk } from 'react-icons/fa'
import { STATUS_COLORS } from '../constants/statusColors'
import { FORMAT_DATE_TIME } from '../utils/dateTimeFormatter'
import { displayStaffName } from '../utils/displayStaffName'
import { getStatusIcon } from '../utils/getStatusIcon'
import { motion } from 'framer-motion'
import Pagination from '@/components/Pagination'

const TaskDetail: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [task, setTask] = useState(null)
    const [crackInfo, setCrackInfo] = useState(null)
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
    const [assignmentsByStatus, setAssignmentsByStatus] = useState({
        Confirmed: [],
        Reassigned: [],
        InFixing: [],
        Fixed: []
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

    useEffect(() => {
        // Fetch task details and assignments
    }, [])

    const handleAssignmentClick = (assignmentId) => {
        // Handle assignment click
    }

    const handleOpenConfirmModal = () => {
        // Handle opening the confirm modal
    }

    // Add pagination for inspections
    const getPaginatedInspections = () => {
        if (!inspections?.data) return { currentInspections: [], totalPages: 0, totalItems: 0 }

        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const currentInspections = inspections.data.slice(startIndex, endIndex)
        const totalPages = Math.ceil(inspections.data.length / itemsPerPage)

        return {
            currentInspections,
            totalPages,
            totalItems: inspections.data.length
        }
    }

    return (
        <div className="p-6 w-full bg-gray-50 dark:bg-gray-800 min-h-screen">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/tasks')}
                    className="mr-4 p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    title={t('taskManagement.detail.backButton')}
                >
                    <IoArrowBack className="text-xl" />
                </button>
                <h1 className="text-2xl font-bold dark:text-white">{t('taskManagement.detail.title')}</h1>
            </div>

            {/* Task details card */}
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center mb-2">
                            <FaClipboardList className="mr-2 text-blue-500" />
                            <h2 className="text-xl font-semibold dark:text-white">{task.description}</h2>
                        </div>
                    </div>
                    <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                            backgroundColor: STATUS_COLORS[task.status]?.BG || STATUS_COLORS.DEFAULT.BG,
                            color: STATUS_COLORS[task.status]?.TEXT || STATUS_COLORS.DEFAULT.TEXT,
                            border: '1px solid',
                            borderColor: STATUS_COLORS[task.status]?.BORDER || STATUS_COLORS.DEFAULT.BORDER,
                        }}
                    >
                        {t(`taskManagement.detail.taskStatus.${task.status.toLowerCase()}`)}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            {t('taskManagement.detail.created')}: {FORMAT_DATE_TIME(task.created_at)}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            {t('taskManagement.detail.updated')}: {FORMAT_DATE_TIME(task.updated_at)}
                        </span>
                    </div>

                    {/* Add user information if this is a crack repair task */}
                    {crackInfo && (
                        <>
                            <div className="flex items-center">
                                <FaUser className="mr-2 text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    {t('taskManagement.detail.reportedBy')}: {crackInfo.reportedBy?.username || t('common.unknown')}
                                </span>
                            </div>
                            {crackInfo.verifiedBy && (
                                <div className="flex items-center">
                                    <FaCheckCircle className="mr-2 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {t('taskManagement.detail.verifiedBy')}: {crackInfo.verifiedBy?.username || t('common.unknown')}
                                    </span>
                                </div>
                            )}
                            {crackInfo.position && (
                                <div className="flex items-center col-span-2">
                                    <FaMapMarkerAlt className="mr-2 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {t('taskManagement.detail.location')}: {crackInfo.position}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {crackInfo?.isPrivatesAsset === false && task.status !== 'Completed' && (
                    <div className="mt-4">
                        {isLoadingSchedules ? (
                            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">{t('taskManagement.detail.loadingSchedules')}</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleOpenConfirmModal}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                <FaMailBulk className="w-5 h-5 mr-2" />
                                {t('taskManagement.detail.sendNotification')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Task assignments section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(assignmentsByStatus).map(([status, assignments]) => (
                    <div key={status} className="bg-white dark:bg-gray-700 rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: STATUS_COLORS[status.toUpperCase()]?.TEXT }}
                                ></div>
                                <h3 className="font-semibold dark:text-white">
                                    {t(`taskManagement.detail.assignments.${status.toLowerCase()}`)}
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                {assignments.length}
                            </span>
                        </div>
                        <div className="p-2 h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                            {assignments.map((assignment, index) => (
                                <motion.div
                                    key={`${status}-${index}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-3 border-l-4 hover:shadow-md transition cursor-pointer transform hover:-translate-y-0.5"
                                    style={{ borderLeftColor: STATUS_COLORS[status.toUpperCase()]?.TEXT }}
                                    onClick={() => handleAssignmentClick(assignment.assignment_id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-medium text-sm dark:text-white">
                                            {t('taskManagement.detail.assignments.assignment')} {index + 1}
                                        </h4>
                                        {getStatusIcon(assignment.status)}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                        {assignment.description}
                                    </p>
                                    <div className="text-xs space-y-2">
                                        <div className="flex items-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                            <FaUser className="mr-2" />
                                            {displayStaffName(assignment)}
                                        </div>
                                        <div className="flex items-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                            <FaCalendarAlt className="mr-2" />
                                            {FORMAT_DATE_TIME(assignment.updated_at)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {assignments.length === 0 && (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                    <div className="mb-2">
                                        <FaClipboardList className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600" />
                                    </div>
                                    {t('taskManagement.detail.assignments.noAssignments')}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Inspection Details Section */}
            {task.taskAssignments && task.taskAssignments.length > 0 && (
                <InspectionDetails taskAssignments={task.taskAssignments} />
            )}

            {/* Simple Inspection Modal */}
            {selectedAssignmentId && selectedAssignment && (
                <SimpleInspectionModal
                    isOpen={!!selectedAssignmentId}
                    onClose={handleCloseModal}
                    assignment={selectedAssignment}
                    inspections={inspections}
                    isLoading={isLoadingInspections}
                    error={inspectionsError ? String(inspectionsError) : undefined}
                />
            )}

            {/* Add confirmation modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
                        {/* ... existing modal content ... */}
                    </div>
                </div>
            )}

            <style>
                {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
            border: 2px solid #f1f1f1;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          /* Dark mode */
          .dark .custom-scrollbar::-webkit-scrollbar-track {
            background: #374151;
          }

          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4B5563;
            border: 2px solid #374151;
          }

          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6B7280;
          }
        `}
            </style>
        </div>
    )
}

export default TaskDetail 