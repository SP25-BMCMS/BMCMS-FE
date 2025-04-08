import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal 