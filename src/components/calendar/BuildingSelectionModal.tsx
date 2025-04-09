import { TaskEvent } from '@/types/calendar';
import React from 'react';

interface BuildingSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: Array<{
    buildingId: string;
    name: string;
    description?: string;
    Status: string;
  }>;
  selectedBuildings: string[];
  onBuildingSelect: (buildingId: string) => void;
  selectedEvent: TaskEvent | null;
}

const BuildingSelectionModal: React.FC<BuildingSelectionModalProps> = ({
  isOpen,
  onClose,
  buildings,
  selectedBuildings,
  onBuildingSelect,
  selectedEvent,
}) => {
  if (!isOpen) return null;

  console.log('All Buildings:', buildings);
  console.log('Selected Event Buildings:', selectedEvent?.buildingId);

  const handleBuildingSelect = (buildingId: string) => {
    onBuildingSelect(buildingId);
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
          Select Buildings
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select one or more buildings for your event
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {buildings.length > 0 ? (
            buildings.map(building => (
              <div
                key={building.buildingId}
                className={`p-3 border rounded-md cursor-pointer transition ${
                  selectedBuildings.includes(building.buildingId)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={e => {
                  e.stopPropagation();
                  handleBuildingSelect(building.buildingId);
                }}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 mr-3 rounded border ${
                      selectedBuildings.includes(building.buildingId)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400 dark:border-gray-500'
                    } flex items-center justify-center`}
                  >
                    {selectedBuildings.includes(building.buildingId) && (
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
                      {building.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {building.description || 'No description available'}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Status: {building.Status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No available buildings
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

export default BuildingSelectionModal;
