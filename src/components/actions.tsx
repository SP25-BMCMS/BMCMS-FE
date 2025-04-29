import React from 'react'
import { useTranslation } from 'react-i18next'

interface ActionProps {
  className?: string
  onOk: () => void
  onCancel: () => void
  okText?: string
  cancelText?: string
  isLoading?: boolean
  isDisabled?: boolean
}

export default function Actions({
  className,
  onOk,
  onCancel,
  okText,
  cancelText,
  isLoading = false,
  isDisabled,
}: ActionProps) {
  const { t } = useTranslation()

  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={onOk}
        disabled={isLoading || isDisabled}
        className={`px-4 py-2 rounded bg-blue-500 text-white 
          ${isDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} 
          transition duration-300 ease-in-out`}
      >
        {isLoading ? t('common.actions.loading') : okText ? t(okText) : t('common.actions.ok')}
      </button>
      <button
        onClick={onCancel}
        disabled={isDisabled}
        className={`px-4 py-2 rounded bg-gray-500 text-white 
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'} 
          transition duration-300 ease-in-out`}
      >
        {cancelText ? t(cancelText) : t('common.actions.cancel')}
      </button>
    </div>
  )
}
