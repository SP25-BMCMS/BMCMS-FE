import React, { useState } from 'react'
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

    const { data: pdfData, isLoading, error } = useQuery({
        queryKey: ['inspection-pdf', taskAssignmentId],
        queryFn: () => getInspectionPdf(taskAssignmentId),
        enabled: isOpen && !!taskAssignmentId,
    })

    if (!isOpen) return null

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <p className="text-red-600 dark:text-red-400">{t('common.errorLoadingPdf')}</p>
                </div>
            )
        }

        if (!pdfData?.isSuccess || !pdfData.data.length) {
            return (
                <div className="flex flex-col items-center justify-center p-8">
                    <FileText className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{t('taskManagement.noPdfsFound')}</p>
                </div>
            )
        }

        return (
            <div className="flex flex-col h-full">
                {/* PDF List */}
                <div className="grid grid-cols-1 gap-4 mb-4 max-h-[200px] overflow-y-auto">
                    {pdfData.data.map((pdf, index) => {
                        if (!pdf.uploadFile) return null
                        return (
                            <div
                                key={pdf.inspection_id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                                <div className="flex items-center space-x-4">
                                    <FileText className="w-6 h-6 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t('taskManagement.inspectionReport')} #{index + 1}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    {pdf.viewUrl && (
                                        <button
                                            onClick={() => setSelectedPdfUrl(pdf.viewUrl!)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                                            title={t('taskManagement.viewPdf')}
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    )}
                                    {pdf.downloadUrl && (
                                        <button
                                            onClick={() => handleDownload(pdf.downloadUrl!, `inspection-${index + 1}.pdf`)}
                                            className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-full transition-colors"
                                            title={t('taskManagement.downloadPdf')}
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* PDF Viewer */}
                {selectedPdfUrl && (
                    <div className="flex-1 min-h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <iframe
                            src={selectedPdfUrl}
                            className="w-full h-full"
                            title="PDF Viewer"
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {t('taskManagement.viewPdfTitle')}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                            title={t('common.close')}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {renderContent()}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default ViewPdfModal 