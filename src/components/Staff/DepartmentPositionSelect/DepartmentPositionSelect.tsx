import React, { useState, useEffect } from 'react';
import apiInstance from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Select, { StylesConfig } from 'react-select';

// Define data types according to API structure
interface Department {
  departmentId: string;
  departmentName: string;
  area?: string;
  description?: string;
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

interface SelectOption {
  value: string;
  label: string;
}

interface DepartmentPositionSelectProps {
  staffId: string;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
  initialDepartmentId?: string;
  initialPositionId?: string;
}

// Map numbers to position names
const getPositionName = (positionNameValue: number, t: any): string => {
  const positionMap: Record<number, string> = {
    1: t('staffManagement.departmentPosition.position.names.leader'),
    2: t('staffManagement.departmentPosition.position.names.maintenance'),
    3: t('staffManagement.departmentPosition.position.names.staff'),
    4: t('staffManagement.departmentPosition.position.names.manager'),
  };
  return positionMap[positionNameValue] || t('staffManagement.departmentPosition.position.names.unknown', { number: positionNameValue });
};

// Format department display name
const formatDepartmentName = (departments: Department[], dept: Department, t: any): string => {
  let displayName = dept.departmentName;

  if (dept.area) {
    displayName += ` - ${dept.area}`;
  } else {
    const duplicateNames = departments.filter(
      d => d.departmentName === dept.departmentName && d.departmentId !== dept.departmentId
    );

    if (duplicateNames.length > 0) {
      displayName += ` (${t('staffManagement.departmentPosition.department.noArea')})`;
    }
  }

  if (dept.description) {
    displayName += ` (${dept.description})`;
  }

  return displayName;
};

const DepartmentPositionSelect: React.FC<DepartmentPositionSelectProps> = ({
  staffId,
  onSaveSuccess,
  onCancel,
  initialDepartmentId,
  initialPositionId,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<SelectOption | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<SelectOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Custom styles for react-select
  const customStyles: StylesConfig<SelectOption, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#374151' : 'white',
      borderColor: state.isFocused 
        ? '#3B82F6' 
        : theme === 'dark' 
          ? '#4B5563' 
          : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
      '&:hover': {
        borderColor: theme === 'dark' ? '#6B7280' : '#9CA3AF'
      },
      minHeight: '42px'
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? theme === 'dark' ? '#2563EB' : '#3B82F6'
        : state.isFocused
          ? theme === 'dark' ? '#374151' : '#F3F4F6'
          : 'transparent',
      color: state.isSelected
        ? 'white'
        : theme === 'dark' ? '#F3F4F6' : '#111827',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: state.isSelected
          ? theme === 'dark' ? '#2563EB' : '#3B82F6'
          : theme === 'dark' ? '#374151' : '#F3F4F6'
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#F3F4F6' : '#111827'
    }),
    input: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#F3F4F6' : '#111827'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#4B5563' : '#D1D5DB'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
      '&:hover': {
        color: theme === 'dark' ? '#F3F4F6' : '#111827'
      }
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
      '&:hover': {
        color: theme === 'dark' ? '#F3F4F6' : '#111827'
      }
    })
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [departmentsResponse, positionsResponse] = await Promise.all([
          apiInstance.get(import.meta.env.VITE_VIEW_DEPARTMENT_LIST),
          apiInstance.get(import.meta.env.VITE_VIEW_POSITION_LIST)
        ]);

        if (departmentsResponse.data?.data) {
          const depts = departmentsResponse.data.data;
          setDepartments(depts);

          if (initialDepartmentId) {
            const initialDept = depts.find((d: Department) => d.departmentId === initialDepartmentId);
            if (initialDept) {
              setSelectedDepartment({
                value: initialDept.departmentId,
                label: formatDepartmentName([initialDept], initialDept, t)
              });
            }
          }
        }

        if (positionsResponse.data?.workingPositions) {
          const pos = positionsResponse.data.workingPositions;
          setPositions(pos);

          if (initialPositionId) {
            const initialPos = pos.find((p: Position) => p.positionId === initialPositionId);
            if (initialPos) {
              setSelectedPosition({
                value: initialPos.positionId,
                label: getPositionName(initialPos.positionName, t)
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error(t('staffManagement.departmentPosition.messages.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [initialDepartmentId, initialPositionId, t]);

  const handleSave = async () => {
    if (!selectedDepartment || !selectedPosition) {
      toast.error(t('staffManagement.departmentPosition.messages.selectBoth'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiInstance.patch(
        import.meta.env.VITE_UPDATE_STAFF_DEPARTMENT_POSITION.replace('{staffId}', staffId),
        {
          departmentId: selectedDepartment.value,
          positionId: selectedPosition.value,
        }
      );

      if (response.data.isSuccess) {
        toast.success(t('staffManagement.departmentPosition.messages.updateSuccess'));
        if (onSaveSuccess) onSaveSuccess();
      } else {
        toast.error(response.data.message || t('staffManagement.departmentPosition.messages.updateFailed'));
      }
    } catch (error: any) {
      console.error('Failed to update:', error);
      toast.error(error.response?.data?.message || t('staffManagement.departmentPosition.messages.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const departmentOptions = departments.map(dept => ({
    value: dept.departmentId,
    label: formatDepartmentName(departments, dept, t)
  }));

  const positionOptions = positions.map(pos => ({
    value: pos.positionId,
    label: getPositionName(pos.positionName, t)
  }));

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        {t('staffManagement.departmentPosition.title')}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('staffManagement.departmentPosition.department.label')}
            </label>
            <Select<SelectOption>
              value={selectedDepartment}
              onChange={(option) => setSelectedDepartment(option)}
              options={departmentOptions}
              isSearchable
              isClearable
              placeholder={t('staffManagement.departmentPosition.department.placeholder')}
              styles={customStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('staffManagement.departmentPosition.position.label')}
            </label>
            <Select<SelectOption>
              value={selectedPosition}
              onChange={(option) => setSelectedPosition(option)}
              options={positionOptions}
              isSearchable
              isClearable
              placeholder={t('staffManagement.departmentPosition.position.placeholder')}
              styles={customStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isSaving}
              >
                {t('staffManagement.departmentPosition.buttons.cancel')}
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
                  {t('staffManagement.departmentPosition.buttons.saving')}
                </span>
              ) : (
                t('staffManagement.departmentPosition.buttons.save')
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DepartmentPositionSelect;
