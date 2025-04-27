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
  const [activeTab, setActiveTab] = useState<'info' | 'apartments'>('info');

  // Debug: console log when component renders with resident
  useEffect(() => {
    if (isOpen && resident) {
      console.log('ViewDetailResident opened with resident:', resident);
    }
  }, [isOpen, resident]);

  // Reset state when modal closes or resident changes
  useEffect(() => {
    if (!isOpen) {
      setApartments([]);
      setError(null);
      setActiveTab('info');
    } else if (resident) {
      setApartments([]);
      setError(null);
      console.log('Account status:', resident.accountStatus);

      // Only fetch if resident is active
      if (resident.accountStatus === 'Active') {
        fetchResidentApartments();
      }
    }
  }, [isOpen, resident?.userId]);

  // Handle adding apartment success
  const handleAddApartmentSuccess = () => {
    // Refresh apartments list
    if (resident && resident.accountStatus === 'Active') {
      fetchResidentApartments();
      setActiveTab('apartments');
    }
  };

  const fetchResidentApartments = async () => {
    if (!resident) {
      console.error('Cannot get apartment information: resident is null');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('Calling API getResidentApartments with userId:', resident.userId);
      const response = await getResidentApartments(resident.userId);
      console.log('API response:', response);

      if (response && response.isSuccess && Array.isArray(response.data)) {
        console.log('apartments:', response.data.length);
        setApartments(response.data);
      } else {
        const errorMsg = response?.message || 'cannot get apartments';
        console.error('errorMsg:', errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error calling API getResidentApartments:', error);
      const errorMessage = error.message || 'An error occurred while loading apartment information';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom close function to ensure state is reset
  const handleClose = () => {
    console.log('Close modal');
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
      console.error('Error when formatting date:', error);
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
    console.log('Not displaying modal because resident is null');
    return null;
  }

  // Show warning for inactive residents
  const isInactive = resident.accountStatus !== 'Active';
  console.log('Current account status:', resident.accountStatus, 'isInactive:', isInactive);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resident Details" size="lg">
      {isInactive ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-500 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            Account Inactive
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 max-w-sm mx-auto">
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
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
          >
            Close
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <span className="ml-3">Loading data...</span>
        </div>
      ) : (
        <div>
          {/* Header with basic info */}
          <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xl font-bold uppercase flex-shrink-0">
              {resident.username.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {resident.username}
              </h2>

              <div className="flex flex-wrap gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getGenderStyle(resident.gender)}`}
                >
                  {resident.gender}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(resident.accountStatus)}`}
                >
                  {resident.accountStatus}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Mail className="h-3.5 w-3.5 mr-1" />
                {resident.email}
              </div>
              <div className="flex items-center mt-1">
                <Phone className="h-3.5 w-3.5 mr-1" />
                {resident.phone}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('info')}
            >
              Personal Info
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'apartments'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('apartments')}
            >
              Apartments ({apartments.length})
            </button>
          </div>

          {/* Mobile only contact info */}
          <div className="sm:hidden mb-4 text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Mail className="h-3.5 w-3.5 mr-1" />
              {resident.email}
            </div>
            <div className="flex items-center mt-1">
              <Phone className="h-3.5 w-3.5 mr-1" />
              {resident.phone}
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-230px)] pr-1">
            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Gender
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">{resident.gender}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Date of Birth
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(resident.dateOfBirth)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Created Date
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {resident.createdDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Summary */}
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Property Summary
                    </h3>
                    {resident?.accountStatus === 'Active' && (
                      <button
                        onClick={() => setIsAddApartmentOpen(true)}
                        className="flex items-center p-1 rounded-md text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </button>
                    )}
                  </div>

                  {error ? (
                    <div className="text-center py-3 text-red-500 dark:text-red-400 text-sm">
                      <p>{error}</p>
                    </div>
                  ) : isLoading ? (
                    <div className="flex justify-center py-3">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    </div>
                  ) : apartments.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Home className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Total Apartments
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-bold">{apartments.length}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Buildings
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {[
                              ...new Set(
                                apartments.map(
                                  apt => apt.buildingDetails?.building?.name || 'Unknown'
                                )
                              ),
                            ].join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Areas
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {[
                              ...new Set(
                                apartments.map(
                                  apt => apt.buildingDetails?.building?.area?.name || 'Unknown'
                                )
                              ),
                            ].join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-500 dark:text-gray-400 text-sm">
                      No apartments assigned.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'apartments' && (
              <div>
                {apartments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-500 dark:text-gray-400">
                    <Home className="h-10 w-10 mb-2 text-gray-400" />
                    <p className="text-sm">No apartments assigned to this resident.</p>
                    <button
                      onClick={() => setIsAddApartmentOpen(true)}
                      className="mt-3 flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add First Apartment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {apartments.length} apartment(s) found
                      </p>
                      <button
                        onClick={() => setIsAddApartmentOpen(true)}
                        className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 focus:outline-none"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add New
                      </button>
                    </div>

                    {apartments.map(apartment => {
                      const buildingName =
                        apartment?.buildingDetails?.building?.name || 'Unknown Building';
                      const buildingDetailName = apartment?.buildingDetails?.name || '';
                      const areaName =
                        apartment?.buildingDetails?.building?.area?.name || 'Unknown Area';
                      const buildingDescription =
                        apartment?.buildingDetails?.building?.description || '';
                      const buildingFloors = apartment?.buildingDetails?.building?.numberFloor || 0;
                      const buildingStatus =
                        apartment?.buildingDetails?.building?.Status || 'Unknown';
                      const buildingImage =
                        apartment?.buildingDetails?.building?.imageCover ||
                        'https://via.placeholder.com/40?text=No+Image';

                      return (
                        <div
                          key={apartment.apartmentId}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden">
                              <img
                                src={buildingImage}
                                alt={buildingName}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  (e.target as HTMLImageElement).src =
                                    'https://via.placeholder.com/40?text=No+Image';
                                }}
                              />
                            </div>

                            <div className="ml-3 flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center truncate">
                                <span>Apartment {apartment.apartmentName}</span>
                                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  {buildingStatus}
                                </span>
                              </h4>

                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                <span className="font-medium">Building:</span> {buildingName}{' '}
                                {buildingDetailName ? `(${buildingDetailName})` : ''}
                              </p>

                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                <span className="font-medium">Area:</span> {areaName}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
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
