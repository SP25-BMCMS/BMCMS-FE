import React, { useState, useEffect } from 'react';
import { createMaintenanceCycle, updateMaintenanceCycle } from '@/services/maintenanceCycle';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { MaintenanceCycle } from '@/types';

interface MaintenanceCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  cycleData?: MaintenanceCycle;
}

const frequencyOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
  { value: 'Specific', label: 'Specific' },
];

const basisOptions = [
  { value: 'ManufacturerRecommendation', label: 'Manufacturer Recommendation' },
  { value: 'LegalStandard', label: 'Legal Standard' },
  { value: 'OperationalExperience', label: 'Operational Experience' },
  { value: 'Other', label: 'Other' },
];

const deviceTypeOptions = [
  { value: 'Elevator', label: 'Elevator' },
  { value: 'FireProtection', label: 'Fire Protection' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'Generator', label: 'Generator' },
  { value: 'Lighting', label: 'Lighting' },
  { value: 'AutomaticDoor', label: 'Automatic Door' },
  { value: 'FireExtinguisher', label: 'Fire Extinguisher' },
  { value: 'Other', label: 'Other' },
];

const MaintenanceCycleModal: React.FC<MaintenanceCycleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  cycleData,
}) => {
  const [deviceType, setDeviceType] = useState('');
  const [frequency, setFrequency] = useState('');
  const [basis, setBasis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when in edit mode
  useEffect(() => {
    if (editMode && cycleData) {
      setDeviceType(cycleData.device_type || '');
      setFrequency(cycleData.frequency || '');
      setBasis(cycleData.basis || '');
    }
  }, [editMode, cycleData, isOpen]);

  const resetForm = () => {
    setDeviceType('');
    setFrequency('');
    setBasis('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deviceType || !frequency || !basis) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      device_type: deviceType,
      frequency,
      basis,
    };

    setIsSubmitting(true);
    try {
      if (editMode && cycleData) {
        await updateMaintenanceCycle(cycleData.cycle_id, payload);
        toast.success('Maintenance cycle updated successfully');
      } else {
        await createMaintenanceCycle(payload);
        toast.success('Maintenance cycle created successfully');
      }
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} maintenance cycle:`, error);
      toast.error(`Failed to ${editMode ? 'update' : 'create'} maintenance cycle`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {editMode ? 'Edit' : 'Create'} Maintenance Cycle
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Device Type <span className="text-red-500">*</span>
              </label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="">Select Device Type</option>
                {deviceTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="">Select Frequency</option>
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Basis <span className="text-red-500">*</span>
              </label>
              <select
                value={basis}
                onChange={e => setBasis(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="">Select Basis</option>
                {basisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting
                ? editMode
                  ? 'Updating...'
                  : 'Creating...'
                : editMode
                  ? 'Update'
                  : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceCycleModal;
