import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBackdrop?: boolean
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showBackdrop = true,
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {showBackdrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      )}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={`relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all ${sizeClasses[size]}`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
