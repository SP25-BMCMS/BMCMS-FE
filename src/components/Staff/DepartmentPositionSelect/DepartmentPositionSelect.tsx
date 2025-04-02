import React, { useState, useEffect } from 'react';
import apiInstance from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';

// Define data types according to API structure
interface Department {
  departmentId: string;
  departmentName: string;
  description?: string;
  area?: string;
}

interface Position {
  positionId: string;
  positionName: number;
  description?: string;
}

// Interface for position API data
interface PositionsResponse {
  workingPositions: Position[];
}

// Interface for department API response
interface DepartmentResponse {
  isSuccess: boolean;
  message: string;
  data: Department[];
}

// Map numbers to position names
const positionNameMap: Record<number, string> = {
  1: 'Leader',
  2: 'Maintenance',
  3: 'Staff',
  4: 'Manager',
};

// Get position name from code
const getPositionName = (positionNameValue: number): string => {
  return positionNameMap[positionNameValue] || `Position ${positionNameValue}`;
};

interface DepartmentPositionSelectProps {
  staffId: string;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
  initialDepartmentId?: string;
  initialPositionId?: string;
}

const DepartmentPositionSelect: React.FC<DepartmentPositionSelectProps> = ({
  staffId,
  onSaveSuccess,
  onCancel,
  initialDepartmentId,
  initialPositionId
}) => {
  const { theme } = useTheme();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDepartmentId || '');
  const [selectedPosition, setSelectedPosition] = useState<string>(initialPositionId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch departments and positions from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch departments from real API
        const departmentsResponse = await apiInstance.get(import.meta.env.VITE_VIEW_DEPARTMENT_LIST);
        console.log("Departments API Response:", departmentsResponse.data);
        
        // Process departments API response
        if (departmentsResponse.data && departmentsResponse.data.isSuccess && Array.isArray(departmentsResponse.data.data)) {
          setDepartments(departmentsResponse.data.data);
        } else {
          console.error("Unexpected departments API response format:", departmentsResponse.data);
          toast.error('Department data is not in the correct format');
        }

        // Call API to get position list from VITE_VIEW_POSITION_LIST
        const positionsResponse = await apiInstance.get(import.meta.env.VITE_VIEW_POSITION_LIST);
        console.log("Positions API Response:", positionsResponse.data);
        
        // Process actual API structure with workingPositions
        if (positionsResponse.data && positionsResponse.data.workingPositions && Array.isArray(positionsResponse.data.workingPositions)) {
          setPositions(positionsResponse.data.workingPositions);
        } else {
          console.error("Unexpected API response format:", positionsResponse.data);
          toast.error('Position data is not in the correct format');
        }
      } catch (error) {
        console.error('Failed to fetch departments and positions:', error);
        toast.error('Could not load departments and positions list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter positions based on selected department
  useEffect(() => {
    if (selectedDepartment) {
      // Since departmentId doesn't exist in Position interface anymore,
      // we don't filter positions based on department
      // Just reset the selected position when department changes
      setSelectedPosition('');
    } else {
      setFilteredPositions([]);
      setSelectedPosition('');
    }
  }, [selectedDepartment]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPosition(e.target.value);
  };

  const handleSave = async () => {
    if (!selectedDepartment || !selectedPosition) {
      toast.error('Please select department and position');
      return;
    }

    setIsSaving(true);
    try {
      // Call API to update staff department and position
      const response = await apiInstance.patch(
        import.meta.env.VITE_UPDATE_STAFF_DEPARTMENT_POSITION.replace('{staffId}', staffId),
        {
          departmentId: selectedDepartment,
          positionId: selectedPosition
        }
      );

      if (response.data.isSuccess) {
        toast.success('Department and position updated successfully');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (error: any) {
      console.error('Failed to update department and position:', error);
      toast.error(error.response?.data?.message || 'An error occurred during update');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        Update Department and Position
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 border-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <option value="">-- Select Department --</option>
              {departments.map(dept => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName} {dept.area ? `(${dept.area})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position
            </label>
            <select
              id="position"
              value={selectedPosition}
              onChange={handlePositionChange}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 border-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <option value="">-- Select Position --</option>
              {positions.map(pos => (
                <option key={pos.positionId} value={pos.positionId}>
                  {getPositionName(pos.positionName)} {pos.description ? `(${pos.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedDepartment || !selectedPosition || isSaving}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DepartmentPositionSelect; 