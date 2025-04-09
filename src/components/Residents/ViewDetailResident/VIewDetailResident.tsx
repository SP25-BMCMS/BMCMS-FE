import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getResidentApartments } from '@/services/residents';
import { Residents, ResidentApartment } from '@/types';
import { toast } from 'react-hot-toast';
import {
  User,
  Phone,
  Mail,
  Home,
  Building,
  MapPin,
  CalendarDays,
  UserCheck,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import AddApartmentModal from '../AddApartment';

interface ViewDetailResidentProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Residents | null;
}

const ViewDetailResident: React.FC<ViewDetailResidentProps> = ({ isOpen, onClose, resident }) => {
  const [apartments, setApartments] = useState<ResidentApartment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddApartmentOpen, setIsAddApartmentOpen] = useState<boolean>(false);

  // Reset state when modal closes or resident changes
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setApartments([]);
      setError(null);
    } else if (resident) {
      // Reset apartments when resident changes
      setApartments([]);
      setError(null);

      // Only fetch if resident is active
      if (resident.accountStatus === 'Active') {
        fetchResidentApartments();
      }
    }
  }, [isOpen, resident?.userId]); // Add resident.userId as dependency to detect changes

  // Handle adding apartment success
  const handleAddApartmentSuccess = () => {
    // Refresh apartments list
    if (resident && resident.accountStatus === 'Active') {
      fetchResidentApartments();
    }
  };

  const fetchResidentApartments = async () => {
    if (!resident) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await getResidentApartments(resident.userId);
      if (response.isSuccess && response.data) {
        setApartments(response.data);
      } else {
        setError(response.message || 'Failed to load resident apartments');
        toast.error(response.message || 'Failed to load resident apartments');
      }
    } catch (error: any) {
      console.error('Error fetching resident apartments:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Could not load resident apartments');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom close function to ensure state is reset
  const handleClose = () => {
    setApartments([]);
    setError(null);
    onClose();
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Define account status styles
  const getStatusStyle = (status: string) => {
    if (status === 'Active') {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-400';
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-400';
  };

  // Define gender styles
  const getGenderStyle = (gender: string) => {
    if (gender === 'Male') {
      return 'bg-[#FBCD17] bg-opacity-35 text-[#FBCD17] border border-[#FBCD17]';
    }
    return 'bg-[#FF6B98] bg-opacity-30 text-[#FF6B98] border border-[#FF6B98]';
  };

  if (!resident) {
    return null;
  }

  // Show warning for inactive residents
  const isInactive = resident.accountStatus !== 'Active';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resident Details" size="lg">
      {isInactive ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-500 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Account Inactive
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            This resident account is currently inactive. Details are only available for active
            accounts.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <div className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-400">
              {resident.accountStatus}
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300">
              ID: {resident.userId.substring(0, 8)}...
            </div>
          </div>
          <button
            onClick={handleClose}
            className="mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
          >
            Close
          </button>
        </div>
      ) : isLoading ? ( // Remove apartments.length check to always show loading spinner when isLoading is true
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with basic info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-4xl font-bold uppercase">
              {resident.username.charAt(0)}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {resident.username}
              </h2>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getGenderStyle(resident.gender)}`}
                >
                  {resident.gender}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(resident.accountStatus)}`}
                >
                  {resident.accountStatus}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-center sm:justify-start items-center mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {resident.email}
                </div>
                <div className="flex justify-center sm:justify-start items-center mt-1">
                  <Phone className="h-4 w-4 mr-2" />
                  {resident.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                Personal Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="text-gray-900 dark:text-white">{resident.gender}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Date of Birth
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(resident.dateOfBirth)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</p>
                    <p className="text-gray-900 dark:text-white text-xs md:text-sm">
                      {resident.userId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created Date
                    </p>
                    <p className="text-gray-900 dark:text-white">{resident.createdDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Summary */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                Property Summary
              </h3>
              {resident?.accountStatus === 'Active' && (
                <button
                  onClick={() => setIsAddApartmentOpen(true)}
                  className="flex items-center p-1.5 rounded-md text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Assign a new apartment to this resident"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Apartment
                </button>
              )}
              {error ? (
                <div className="text-center py-4 text-red-500 dark:text-red-400">
                  <p>{error}</p>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : apartments.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Apartments
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        <span className="text-2xl font-bold">{apartments.length}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Buildings
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {[
                          ...new Set(apartments.map(apt => apt.buildingDetails.building.name)),
                        ].join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Areas</p>
                      <p className="text-gray-900 dark:text-white">
                        {[
                          ...new Set(apartments.map(apt => apt.buildingDetails.building.area.name)),
                        ].join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No apartments assigned to this resident.
                </div>
              )}
            </div>
          </div>

          {/* Apartments List - Only show if there are apartments */}
          {apartments.length > 0 && (
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                Apartment Details
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {apartments.map(apartment => (
                  <div
                    key={apartment.apartmentId}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                        <img
                          src={
                            apartment.buildingDetails.building.imageCover ||
                            'https://via.placeholder.com/64?text=No+Image'
                          }
                          alt={apartment.buildingDetails.building.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="ml-4 flex-1">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                          <span>Apartment {apartment.apartmentName}</span>
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {apartment.buildingDetails.building.Status}
                          </span>
                        </h4>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Building:</span>{' '}
                          {apartment.buildingDetails.building.name} (
                          {apartment.buildingDetails.name})
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Area:</span>{' '}
                          {apartment.buildingDetails.building.area.name}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium">Building Info:</span>{' '}
                          {apartment.buildingDetails.building.description} •{' '}
                          {apartment.buildingDetails.building.numberFloor} floors
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              {apartments.length === 0 && resident?.accountStatus === 'Active' && (
                <button
                  onClick={() => setIsAddApartmentOpen(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Apartment
                </button>
              )}
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              title="Assign the first apartment to this resident"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <AddApartmentModal
        isOpen={isAddApartmentOpen}
        onClose={() => setIsAddApartmentOpen(false)}
        resident={resident}
        onSuccess={handleAddApartmentSuccess}
      />
    </Modal>
  );
};

export default ViewDetailResident;
