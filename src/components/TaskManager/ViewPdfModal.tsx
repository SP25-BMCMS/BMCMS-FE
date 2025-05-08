import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { X, FileText, Download, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getInspectionPdf } from '@/services/inspections'

interface ViewPdfModalProps {
    isOpen: boolean
    onClose: () => void
    taskAssignmentId: string
}

const ViewPdfModal: React.FC<ViewPdfModalProps> = ({ isOpen, onClose, taskAssignmentId }) => {
    const { t } = useTranslation()
    const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)

    console.log('ViewPdfModal rendered with:', { isOpen, taskAssignmentId })

    const { data: pdfData, isLoading, error } = useQuery({
        queryKey: ['inspection-pdf', taskAssignmentId],
        queryFn: async () => {
            console.log('Fetching PDF for taskAssignmentId:', taskAssignmentId)
            if (!taskAssignmentId) {
                console.error('No taskAssignmentId provided')
                throw new Error('No taskAssignmentId provided')
            }
            const response = await getInspectionPdf(taskAssignmentId)
            console.log('PDF API Response:', response)
            return response
        },
        enabled: isOpen && !!taskAssignmentId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })

    useEffect(() => {
        console.log('ViewPdfModal useEffect:', { isOpen, taskAssignmentId, pdfData })
    }, [isOpen, taskAssignmentId, pdfData])

    if (!isOpen) return null

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleViewPdfClick = (url: string) => {
        if (selectedPdfUrl === url) {
            setSelectedPdfUrl(null)
        } else {
            setSelectedPdfUrl(url)
        }
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
            )
        }

        if (error) {
            console.error('Error loading PDF:', error)
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('common.errorLoadingPdf')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                        {error instanceof Error ? error.message : t('common.errorLoadingPdf')}
                    </p>
                </div>
            )
        }

        if (!pdfData || !pdfData.isSuccess || !pdfData.data) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('taskManagement.noPdfTitle')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                        {pdfData?.message || t('taskManagement.noPdfDescription')}
                    </p>
                    <div className="flex flex-col items-center space-y-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('taskManagement.noPdfSuggestions')}
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-2">
                            <li>{t('taskManagement.noPdfSuggestion1')}</li>
                            <li>{t('taskManagement.noPdfSuggestion2')}</li>
                        </ul>
                    </div>
                </div>
            )
        }

        if (!Array.isArray(pdfData.data) || pdfData.data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('taskManagement.noPdfTitle')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                        {pdfData.message || t('taskManagement.noPdfsFound')}
                    </p>
                </div>
            )
        }

        return (
            <div className="flex flex-col h-full">
                {/* PDF List */}
                <div className="mb-4">
                    {pdfData.data
                        .filter(pdf => pdf.uploadFile && (pdf.viewUrl || pdf.downloadUrl))
                        .map((pdf, index) => (
                            <div
                                key={pdf.inspection_id}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t('taskManagement.inspectionReport')} #{index + 1}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {pdf.viewUrl && (
                                        <button
                                            onClick={() => handleViewPdfClick(pdf.viewUrl!)}
                                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${selectedPdfUrl === pdf.viewUrl ? 'bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}
                                            title={t('taskManagement.viewPdf')}
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="text-sm font-medium hidden sm:inline">
                                                {t('taskManagement.viewPdf')}
                                            </span>
                                        </button>
                                    )}
                                    {pdf.downloadUrl && (
                                        <button
                                            onClick={() => handleDownload(pdf.downloadUrl!, `inspection-${index + 1}.pdf`)}
                                            className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                                            title={t('taskManagement.downloadPdf')}
                                        >
                                            <Download className="w-4 h-4" />
                                            <span className="text-sm font-medium hidden sm:inline">
                                                {t('taskManagement.downloadPdf')}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>

                {/* PDF Viewer */}
                {selectedPdfUrl && (
                    <div className="flex-1">
                        <iframe
                            src={selectedPdfUrl}
                            className="w-full h-full min-h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
                            title="PDF Viewer"
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('taskManagement.viewPdfTitle')}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                                    title={t('common.close')}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {renderContent()}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ViewPdfModal 