import { TaskEvent } from '@/types/calendar';
import { BuildingDetail } from '@/services/buildingDetails';
import React from 'react';

interface BuildingDetailSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingDetails: BuildingDetail[];
  selectedBuildingDetails: string[];
  onBuildingDetailSelect: (buildingDetailId: string) => void;
  selectedEvent: TaskEvent | null;
}

const BuildingDetailSelectionModal: React.FC<BuildingDetailSelectionModalProps> = ({
  isOpen,
  onClose,
  buildingDetails,
  selectedBuildingDetails,
  onBuildingDetailSelect,
  selectedEvent,
}) => {
  if (!isOpen) return null;

  console.log('All Building Details:', buildingDetails);
  console.log('Selected Event Building Details:', selectedEvent?.buildingId);

  const handleBuildingDetailSelect = (buildingDetailId: string) => {
    onBuildingDetailSelect(buildingDetailId);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] building-selection-modal"
      onClick={e => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Select Building Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select one or more building details for your schedule
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {buildingDetails.length > 0 ? (
            buildingDetails.map(buildingDetail => (
              <div
                key={buildingDetail.buildingDetailId}
                className={`p-3 border rounded-md cursor-pointer transition ${
                  selectedBuildingDetails.includes(buildingDetail.buildingDetailId)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={e => {
                  e.stopPropagation();
                  handleBuildingDetailSelect(buildingDetail.buildingDetailId);
                }}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 mr-3 rounded border ${
                      selectedBuildingDetails.includes(buildingDetail.buildingDetailId)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400 dark:border-gray-500'
                    } flex items-center justify-center`}
                  >
                    {selectedBuildingDetails.includes(buildingDetail.buildingDetailId) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      {buildingDetail.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total apartments: {buildingDetail.total_apartments}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No available building details. Buildings without associated details are not shown.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingDetailSelectionModal; 