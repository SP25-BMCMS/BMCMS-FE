import React, { ReactNode } from 'react';
import { XIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4`}>
      <div className='bg-gray-700 px-4 py-3 flex items-center justify-between rounded-t-[6px]'>
          <div className='flex-1 text-center'>
            <h3 className='text-lg leading-6 font-medium text-white inline-block'>{title}</h3>
          </div>
          <button onClick={onClose}
          className='text-white hover:text-gray-300 focus:outline-none'>
            <XIcon className='h-6 w-6' />
            </button>
         </div>
        <div className="p-4 rounded-b-[6px]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;