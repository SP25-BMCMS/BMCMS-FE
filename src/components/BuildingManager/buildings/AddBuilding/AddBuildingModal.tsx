import React, { useState, useEffect } from 'react';
import { addBuilding } from '@/services/building';
import { getAreaList } from '@/services/areas';
import { getAllStaff } from '@/services/staff';
import { Area, StaffData } from '@/types';
import toast from 'react-hot-toast';
import { Loader2, UserIcon, ShieldCheck, X } from 'lucide-react';

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddBuildingModal: React.FC<AddBuildingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    numberFloor: 1,
    imageCover: '',
    areaId: '',
    manager_id: '',
    construction_date: new Date().toLocaleDateString('en-CA'),
    completion_date: new Date().toLocaleDateString('en-CA'),
    Warranty_date: '',
    status: 'operational',
  });

  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (formData.status === 'under_construction') {
      setFormData(prev => ({
        ...prev,
        completion_date: 'dd/mm/yyyy',
        manager_id: '', // Reset manager_id when under construction
        Warranty_date: '', // Reset warranty date when under construction
      }));
    }
  }, [formData.status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch areas
        const areasData = await getAreaList();
        setAreas(areasData);
        if (areasData.length > 0) {
          setFormData(prev => ({ ...prev, areaId: areasData[0].areaId }));
        }

        // Fetch staff for manager selection
        const staffResponse = await getAllStaff();
        if (staffResponse && staffResponse.data) {
          setStaff(staffResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Unable to load required data!');
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'numberFloor') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 1,
      }));
    } else if (name === 'status') {
      if (value === 'under_construction') {
        setFormData(prev => ({
          ...prev,
          status: value,
          completion_date: 'dd/mm/yyyy',
          manager_id: '', // Clear manager when status is under construction
          Warranty_date: '', // Clear warranty date when status is under construction
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          status: value,
          completion_date: new Date().toLocaleDateString('en-CA'),
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Building name is required';
    }

    if (!formData.areaId) {
      newErrors.areaId = 'Please select an area';
    }

    if (!formData.construction_date) {
      newErrors.construction_date = 'Construction date is required';
    }

    if (formData.status === 'operational' && !formData.completion_date) {
      newErrors.completion_date = 'Completion date is required for operational buildings';
    }

    if (formData.status === 'operational' && !formData.Warranty_date) {
      newErrors.Warranty_date = 'Warranty date is required for operational buildings';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const buildingData = {
        name: formData.name,
        description: formData.description,
        numberFloor: formData.numberFloor,
        imageCover: formData.imageCover,
        areaId: formData.areaId,
        construction_date: formData.construction_date,
        completion_date: formData.completion_date,
        status: formData.status as 'operational' | 'under_construction',
        ...(formData.status === 'operational' && formData.manager_id
          ? { manager_id: formData.manager_id }
          : {}),
        ...(formData.status === 'operational' && formData.Warranty_date
          ? { Warranty_date: formData.Warranty_date }
          : {}),
      };

      await addBuilding(buildingData);

      toast.success('Building added successfully!');

      // Reset form
      setFormData({
        name: '',
        description: '',
        numberFloor: 1,
        imageCover: '',
        areaId: '',
        manager_id: '',
        construction_date: new Date().toLocaleDateString('en-CA'),
        completion_date: new Date().toLocaleDateString('en-CA'),
        Warranty_date: '',
        status: 'operational',
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding building:', err);
      toast.error('Error adding new building!');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header - Sticky */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Add New Building
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fill in the information below to add a new building
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-4 flex-1">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Building Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Building Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter building name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                    errors.name
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 dark:text-red-400 text-xs">{errors.name}</p>
                )}
              </div>

              {/* Number of Floors */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of Floors
                </label>
                <input
                  type="number"
                  name="numberFloor"
                  value={formData.numberFloor}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                    errors.numberFloor
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                />
                {errors.numberFloor && (
                  <p className="text-red-500 dark:text-red-400 text-xs">{errors.numberFloor}</p>
                )}
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Image (URL)
                </label>
                <input
                  type="text"
                  name="imageCover"
                  value={formData.imageCover}
                  onChange={handleChange}
                  placeholder="Enter image URL"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                    errors.imageCover
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                />
                {errors.imageCover && (
                  <p className="text-red-500 dark:text-red-400 text-xs">{errors.imageCover}</p>
                )}
              </div>

              {/* Area Selection */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Area
                </label>
                <select
                  name="areaId"
                  value={formData.areaId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                    errors.areaId
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <option value="">Select area</option>
                  {areas.map(area => (
                    <option key={area.areaId} value={area.areaId}>
                      {area.name}
                    </option>
                  ))}
                </select>
                {errors.areaId && (
                  <p className="text-red-500 dark:text-red-400 text-xs">{errors.areaId}</p>
                )}
              </div>

              {/* Construction Date */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Construction Date
                </label>
                <input
                  type="date"
                  name="construction_date"
                  value={formData.construction_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                    errors.construction_date
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                />
                {errors.construction_date && (
                  <p className="text-red-500 dark:text-red-400 text-xs">
                    {errors.construction_date}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="operational"
                      checked={formData.status === 'operational'}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600 dark:text-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Operational</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="under_construction"
                      checked={formData.status === 'under_construction'}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600 dark:text-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Under construction</span>
                  </label>
                </div>
              </div>

              {/* Completion Date */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completion Date
                </label>
                {formData.status === 'under_construction' ? (
                  <input
                    type="text"
                    name="completion_date"
                    value={formData.completion_date}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
                           bg-gray-50 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    disabled
                  />
                ) : (
                  <input
                    type="date"
                    name="completion_date"
                    value={formData.completion_date}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.completion_date
                        ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                        : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  />
                )}
                {errors.completion_date && (
                  <p className="text-red-500 dark:text-red-400 text-xs">
                    {errors.completion_date}
                  </p>
                )}
              </div>

              {/* Warranty Date - Only shows for operational buildings */}
              {formData.status === 'operational' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-green-500" />
                    Warranty Date
                  </label>
                  <input
                    type="date"
                    name="Warranty_date"
                    value={formData.Warranty_date}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.Warranty_date
                        ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                        : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  />
                  {errors.Warranty_date && (
                    <p className="text-red-500 dark:text-red-400 text-xs">
                      {errors.Warranty_date}
                    </p>
                  )}
                </div>
              )}

              {/* Manager Selection - Only shows for operational buildings */}
              {formData.status === 'operational' && (
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <UserIcon className="w-4 h-4 mr-1.5 text-blue-500" />
                    Building Manager
                  </label>
                  <select
                    name="manager_id"
                    value={formData.manager_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Select a manager</option>
                    {staff
                      .filter(s => s.role === 'Manager' || s.role === 'manager')
                      .map(manager => (
                        <option key={manager.userId} value={manager.userId}>
                          {manager.username}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select a manager for this building. This can be updated later.
                  </p>
                </div>
              )}

              {/* Description - Full Width */}
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter building description"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                    errors.description
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-red-500 dark:text-red-400 text-xs">{errors.description}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Sticky */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Add Building'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBuildingModal;
