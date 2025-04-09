import React from 'react';
import Modal from './Modal';
import { BuildingResponse } from '@/types';

interface RemoveBuildingProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  building: BuildingResponse | null;
}

const RemoveBuilding: React.FC<RemoveBuildingProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  building,
}) => {
  if (!building) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Building" size="sm">
      <div className="space-y-4">
        <p className="text-gray-700">
          Do you want to remove this Building <span className="font-medium">{building.name}</span>?
        </p>
        <p className="text-sm text-gray-500">This Action will not be undone.</p>
        <div className="flex justify-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-black"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </div>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RemoveBuilding;
