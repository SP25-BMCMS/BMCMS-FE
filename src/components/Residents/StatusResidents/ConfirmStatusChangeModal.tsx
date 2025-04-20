import React from 'react';
import { Residents } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resident: Residents | null;
}

const ConfirmStatusChangeModal: React.FC<ConfirmStatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  resident,
}) => {
  if (!isOpen || !resident) return null;

  const newStatus = resident.accountStatus === 'Active' ? 'Inactive' : 'Active';
  const statusColor = newStatus === 'Active' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Confirm Status Change</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-gray-700 mb-3">
            Are you sure you want to change the status of{' '}
            <span className="font-semibold">{resident.username}</span> from{' '}
            <span
              className={
                resident.accountStatus === 'Active'
                  ? 'text-green-600 font-medium'
                  : 'text-red-600 font-medium'
              }
            >
              {resident.accountStatus}
            </span>{' '}
            to <span className={statusColor + ' font-medium'}>{newStatus}</span>?
          </p>
          <p className="text-sm text-gray-500">
            This action will change the user's ability to access the system.
          </p>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 ${
              newStatus === 'Active'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white font-medium rounded-lg`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmStatusChangeModal;
