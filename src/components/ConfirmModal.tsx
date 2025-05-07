import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    confirmText?: string
    cancelText?: string
    confirmButtonClassName?: string
    cancelButtonClassName?: string
    isLoading?: boolean
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClassName = 'bg-red-600 hover:bg-red-700 text-white',
    cancelButtonClassName = 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
    isLoading = false,
}) => {
    const { t } = useTranslation()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close modal"
                        disabled={isLoading}
                    >
                        <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className={`px-4 py-2 rounded-lg transition-colors ${cancelButtonClassName}`}
                        disabled={isLoading}
                    >
                        {cancelText || t('calendar.confirmModal.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg transition-colors ${confirmButtonClassName}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('common.processing')}
                            </div>
                        ) : (
                            confirmText || t('calendar.confirmModal.confirm')
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal 