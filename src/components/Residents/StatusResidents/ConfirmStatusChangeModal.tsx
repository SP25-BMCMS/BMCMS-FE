import React from 'react';
import Modal from './Modal';
import { Residents } from '@/types';

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
  resident
}) => {
  if (!resident) return null;

  const newStatus = resident.accountStatus === 'Active' ? 'Inactive' : 'Active';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận thay đổi trạng thái">
      <div className="p-6 space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn thay đổi trạng thái của <span className="font-medium">{resident.username}</span> từ <span className={`font-medium ${resident.accountStatus === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{resident.accountStatus}</span> sang <span className={`font-medium ${newStatus === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{newStatus}</span> không?
          </p>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmStatusChangeModal;
