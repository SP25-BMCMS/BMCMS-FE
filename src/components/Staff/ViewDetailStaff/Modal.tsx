import React, { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const { t } = useTranslation();
  const [isRendered, setIsRendered] = useState(false);

  // Handle animation on open/close
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isRendered) return null;

  // Add animation keyframes
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes modalBackdropIn {
        from { background-color: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); }
        to { background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); }
      }
      
      @keyframes modalBackdropOut {
        from { background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); }
        to { background-color: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); }
      }
      
      @keyframes modalContentIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      @keyframes modalContentOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-auto flex items-center justify-center p-4 ${isOpen ? '' : 'pointer-events-none'}`}
      style={{
        animation: isOpen
          ? 'modalBackdropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          : 'modalBackdropOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl ${sizeClasses[size]} w-full mx-auto overflow-hidden transition-colors`}
        style={{
          animation: isOpen
            ? 'modalContentIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : 'modalContentOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            aria-label={t('common.modal.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-10rem)]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
