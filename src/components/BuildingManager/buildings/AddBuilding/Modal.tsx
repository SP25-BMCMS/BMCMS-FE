import React from 'react';
import { XIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh]">
          <div className="bg-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex-1 text-center">
              <h3 className="text-lg leading-6 font-medium text-white inline-block">{title}</h3>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-300 focus:outline-none">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
