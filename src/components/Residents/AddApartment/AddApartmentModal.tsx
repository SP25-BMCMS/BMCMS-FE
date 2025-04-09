import React, { useState, useEffect } from 'react';
import { Residents } from '@/types';
import { toast } from 'react-hot-toast';
import { X, Building, User, Home, Info } from 'lucide-react';
import { getAllBuildingDetails, addApartmentForResident } from '@/services/residents';

interface AddApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Residents | null;
  onSuccess: () => void;
}

interface BuildingDetail {
  buildingDetailId: string;
  name: string;
  building: {
    name: string;
  };
}

const AddApartmentModal: React.FC<AddApartmentModalProps> = ({
  isOpen,
  onClose,
  resident,
  onSuccess,
}) => {
  const [apartmentName, setApartmentName] = useState<string>('');
  const [selectedBuildingDetail, setSelectedBuildingDetail] = useState<string>('');
  const [buildingDetails, setBuildingDetails] = useState<BuildingDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch building details
  useEffect(() => {
    if (isOpen) {
      fetchBuildingDetails();
    }
  }, [isOpen]);

  const fetchBuildingDetails = async () => {
    setIsLoading(true);
    try {
      const response = await getAllBuildingDetails();
      if (response.data) {
        setBuildingDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching building details:', error);
      toast.error('Failed to load building details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resident) {
      toast.error('Resident information is missing');
      return;
    }

    if (!apartmentName.trim()) {
      toast.error('Please enter apartment name');
      return;
    }

    if (!selectedBuildingDetail) {
      toast.error('Please select a building detail');
      return;
    }

    setIsSubmitting(true);
    try {
      await addApartmentForResident(resident.userId, {
        apartments: [
          {
            apartmentName: apartmentName.trim(),
            buildingDetailId: selectedBuildingDetail,
          },
        ],
      });

      toast.success(`Apartment successfully assigned to ${resident.username}`);
      setApartmentName('');
      setSelectedBuildingDetail('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign apartment to resident');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assign Apartment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {resident && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center">
              <User className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Assigning apartment for:
                </p>
                <p className="text-gray-900 dark:text-white font-medium">{resident.username}</p>
              </div>
            </div>
          </div>
        )}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/20">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Assigning an apartment will give the resident access to that property in the system.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="apartmentName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Apartment Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Home className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="apartmentName"
                  type="text"
                  value={apartmentName}
                  onChange={e => setApartmentName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. A101"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="buildingDetail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Building Detail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                {isLoading ? (
                  <div className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-400 sm:text-sm dark:bg-gray-700">
                    Loading building details...
                  </div>
                ) : (
                  <select
                    id="buildingDetail"
                    value={selectedBuildingDetail}
                    onChange={e => setSelectedBuildingDetail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select building detail</option>
                    {buildingDetails.map(detail => (
                      <option key={detail.buildingDetailId} value={detail.buildingDetailId}>
                        {detail.name} - {detail.building.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 ${
                isSubmitting || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? (
                <>
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
                  Assigning Apartment...
                </>
              ) : (
                'Assign Apartment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApartmentModal;
