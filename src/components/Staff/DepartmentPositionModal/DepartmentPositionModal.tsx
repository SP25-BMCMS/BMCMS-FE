import React from 'react';
import { X } from 'lucide-react';
import DepartmentPositionSelect from '../DepartmentPositionSelect';

interface DepartmentPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  onSaveSuccess?: () => void;
  initialDepartmentId?: string;
  initialPositionId?: string;
}

const DepartmentPositionModal: React.FC<DepartmentPositionModalProps> = ({
  isOpen,
  onClose,
  staffId,
  staffName,
  onSaveSuccess,
  initialDepartmentId,
  initialPositionId
}) => {
  if (!isOpen) return null;

  const handleSaveSuccess = () => {
    if (onSaveSuccess) onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-headline">
              Cập nhật phòng ban và vị trí cho {staffName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="px-6 py-4">
            <DepartmentPositionSelect
              staffId={staffId}
              onSaveSuccess={handleSaveSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPositionModal; 