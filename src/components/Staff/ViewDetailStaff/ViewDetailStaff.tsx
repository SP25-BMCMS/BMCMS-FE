import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getStaffDetail } from '@/services/staffs';
import { StaffDetailData } from '@/types';
import { toast } from 'react-hot-toast';
import { User, Phone, Mail, Briefcase, Building2, CalendarDays, UserCheck } from 'lucide-react';

interface ViewDetailStaffProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
}

const ViewDetailStaff: React.FC<ViewDetailStaffProps> = ({ isOpen, onClose, staffId }) => {
  const [staffDetail, setStaffDetail] = useState<StaffDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && staffId) {
      fetchStaffDetail();
    }
  }, [isOpen, staffId]);

  const fetchStaffDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getStaffDetail(staffId);
      if (response.isSuccess && response.data) {
        setStaffDetail(response.data);
      } else {
        setError(response.message || 'Failed to load staff details');
        toast.error(response.message || 'Failed to load staff details');
      }
    } catch (error: any) {
      console.error('Error fetching staff detail:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Could not load staff details');
    } finally {
      setIsLoading(false);
    }
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

  // Define role styles
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'Leader':
        return 'bg-[#0eeffe] bg-opacity-30 border border-[#0eeffe] text-[#0084FF]';
      case 'Staff':
        return 'bg-[#F213FE] bg-opacity-30 border border-[#F213FE] text-[#F213FE]';
      case 'Manager':
        return 'bg-[#360AFE] bg-opacity-30 border border-[#360AFE] text-[#360AFE]';
      case 'Admin':
        return 'bg-[#50f186] bg-opacity-30 border border-[#50f186] text-[#00ff90]';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-400';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Details" size="lg">
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Staff Details
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      ) : staffDetail ? (
        <div className="space-y-6">
          {/* Header with basic info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-4xl font-bold uppercase">
              {staffDetail.username.charAt(0)}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {staffDetail.username}
              </h2>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleStyle(staffDetail.role)}`}
                >
                  {staffDetail.role}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(staffDetail.accountStatus)}`}
                >
                  {staffDetail.accountStatus}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-center sm:justify-start items-center mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {staffDetail.email}
                </div>
                <div className="flex justify-center sm:justify-start items-center mt-1">
                  <Phone className="h-4 w-4 mr-2" />
                  {staffDetail.phone}
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
                    <p className="text-gray-900 dark:text-white">{staffDetail.gender}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Date of Birth
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(staffDetail.dateOfBirth)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</p>
                    <p className="text-gray-900 dark:text-white text-xs md:text-sm">
                      {staffDetail.userId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department and Position Details */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                Work Information
              </h3>

              {staffDetail.userDetails ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Position
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {staffDetail.userDetails.position.positionName}
                        {staffDetail.userDetails.position.description && (
                          <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                            ({staffDetail.userDetails.position.description})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Department
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {staffDetail.userDetails.department.departmentName}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {staffDetail.userDetails.department.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="h-5 w-5 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-3">
                      <span className="text-xs font-bold">A</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Area</p>
                      <p className="text-gray-900 dark:text-white">
                        {staffDetail.userDetails.department.area}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No department or position assigned.
                </div>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center p-6">
          <p>No staff data available</p>
        </div>
      )}
    </Modal>
  );
};

export default ViewDetailStaff;
