import { TaskEvent } from '@/types/calendar';
import { BuildingDetail } from '@/types/buildingDetail';
import React, { useMemo, useState, useCallback } from 'react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out building details with Cancel status and keep only unique names
  const filteredBuildingDetails = useMemo(() => {
    // First, exclude details with Cancel status
    const activeBuildingDetails = buildingDetails.filter(
      detail => !(detail.status && detail.status.toLowerCase() === 'cancel')
    );

    // Then create a map to track unique names
    const uniqueNameMap = new Map<string, BuildingDetail>();

    // For each building detail, only keep the first occurrence of each name
    activeBuildingDetails.forEach(detail => {
      const lowerName = detail.name.toLowerCase();
      if (!uniqueNameMap.has(lowerName)) {
        uniqueNameMap.set(lowerName, detail);
      }
    });

    // Convert map values back to array
    return Array.from(uniqueNameMap.values());
  }, [buildingDetails]);

  // Get selected building detail objects
  const selectedDetailObjects = useMemo(() => {
    return filteredBuildingDetails.filter(detail =>
      selectedBuildingDetails.includes(detail.buildingDetailId)
    );
  }, [filteredBuildingDetails, selectedBuildingDetails]);

  // Get unselected building detail objects
  const unselectedDetailObjects = useMemo(() => {
    return filteredBuildingDetails.filter(
      detail => !selectedBuildingDetails.includes(detail.buildingDetailId)
    );
  }, [filteredBuildingDetails, selectedBuildingDetails]);

  // Filter and sort building details based on search
  const filteredUnselectedDetails = useMemo(() => {
    if (!searchQuery) return unselectedDetailObjects;

    const query = searchQuery.toLowerCase();
    return unselectedDetailObjects
      .filter(detail => detail.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [unselectedDetailObjects, searchQuery]);

  // Các hàm xử lý event - thêm useCallback để tránh render không cần thiết
  const handleBuildingDetailSelect = useCallback(
    (buildingDetailId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onBuildingDetailSelect(buildingDetailId);
    },
    [onBuildingDetailSelect]
  );

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Clear all selected building details one by one
      const selectedIds = [...selectedBuildingDetails];
      selectedIds.forEach(id => onBuildingDetailSelect(id));
    },
    [selectedBuildingDetails, onBuildingDetailSelect]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
  }, []);

  const handleDone = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] building-selection-modal"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={handleModalClick}
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
          Select Building Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Select one or more building details for your schedule
        </p>

        {/* Show selection count */}
        <div className="mb-4 px-3 py-2 bg-blue-50/70 dark:bg-blue-900/10 rounded-md border border-blue-100 dark:border-blue-800/30">
          <span className="text-blue-700 dark:text-blue-400 font-medium text-sm">
            {selectedBuildingDetails.length} building
            {selectedBuildingDetails.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            placeholder="Search building details..."
            value={searchQuery}
            onChange={handleSearchChange}
            onClick={e => e.stopPropagation()}
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Selected building details section */}
        {selectedDetailObjects.length > 0 && (
          <div className="mb-5">
            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200 flex items-center">
              <span className="inline-block w-4 h-4 rounded-full bg-blue-500 mr-2"></span>
              Selected Buildings
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {selectedDetailObjects.map(buildingDetail => (
                <div
                  key={buildingDetail.buildingDetailId}
                  className="p-3 border rounded-md cursor-pointer transition border-blue-200 bg-blue-50/70 dark:bg-blue-900/10 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                  onClick={e => handleBuildingDetailSelect(buildingDetail.buildingDetailId, e)}
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-3 rounded-full border-2 bg-blue-500 border-blue-500 flex items-center justify-center flex-shrink-0">
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
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {buildingDetail.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {buildingDetail.total_apartments} apartments
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleClearAll}
              className="mt-2 w-full px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-sm border border-red-100 dark:border-red-800/30"
              disabled={selectedBuildingDetails.length === 0}
            >
              Clear All Selected
            </button>
          </div>
        )}

        {/* Available building details section */}
        <div>
          <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="inline-block w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></span>
            Available Buildings
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {filteredUnselectedDetails.length > 0 ? (
              filteredUnselectedDetails.map(buildingDetail => (
                <div
                  key={buildingDetail.buildingDetailId}
                  className="p-3 border rounded-md cursor-pointer transition border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/70"
                  onClick={e => handleBuildingDetailSelect(buildingDetail.buildingDetailId, e)}
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-3 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {buildingDetail.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {buildingDetail.total_apartments} apartments
                      </div>
                      {buildingDetail.status && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {getStatusBadge(buildingDetail.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm bg-gray-50/50 dark:bg-gray-800/50 rounded-md">
                {searchQuery
                  ? `No building details match "${searchQuery}"`
                  : selectedBuildingDetails.length === filteredBuildingDetails.length
                    ? 'All building details selected'
                    : 'No available building details.'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDone}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 focus:outline-none"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to render status badges
function getStatusBadge(status: string) {
  let bgColor = '';
  let textColor = '';

  switch (status.toLowerCase()) {
    case 'operational':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Operational
        </span>
      );
    case 'maintenance':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Maintenance
        </span>
      );
    case 'inactive':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          Inactive
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {status}
        </span>
      );
  }
}

// Add some global styles for custom scrollbars
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.7);
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(75, 85, 99, 0.5);
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(75, 85, 99, 0.7);
  }
`;
document.head.appendChild(styleSheet);

export default BuildingDetailSelectionModal;
