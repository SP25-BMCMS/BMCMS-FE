import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getStaffDetail } from '@/services/staffs';
import { StaffDetailData } from '@/types';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Building2,
  CalendarDays,
  UserCheck,
  MapPin,
  Shield,
  Clock,
} from 'lucide-react';

interface ViewDetailStaffProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
}

const ViewDetailStaff: React.FC<ViewDetailStaffProps> = ({ isOpen, onClose, staffId }) => {
  const { t } = useTranslation();
  const [staffDetail, setStaffDetail] = useState<StaffDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'work'>('personal');

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
        setError(response.message || t('staffManagement.viewDetail.error.loadFailed'));
        toast.error(response.message || t('staffManagement.viewDetail.error.loadFailed'));
      }
    } catch (error: any) {
      console.error('Error fetching staff detail:', error);
      setError(error.message || t('staffManagement.viewDetail.error.loadFailed'));
      toast.error(error.message || t('staffManagement.viewDetail.error.loadFailed'));
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

  // Define account status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status === 'Active';
    return (
      <div
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
        ${
          isActive
            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}
        ></span>
        {status}
      </div>
    );
  };

  // Define role badge
  const RoleBadge = ({ role }: { role: string }) => {
    let styleClasses = '';
    let Icon = Shield;

    switch (role) {
      case 'Leader':
        styleClasses = 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        break;
      case 'Staff':
        styleClasses = 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        break;
      case 'Manager':
        styleClasses = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
        break;
      case 'Admin':
        styleClasses =
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        break;
      default:
        styleClasses = 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${styleClasses}`}
      >
        <Icon className="w-3 h-3" />
        {role}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('staffManagement.viewDetail.title')}
      size="lg"
    >
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400 mb-4">
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
            {t('staffManagement.viewDetail.error.title')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      ) : staffDetail ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold uppercase shadow-lg mb-4 transform transition-transform hover:scale-105">
              {staffDetail.username.charAt(0)}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
              {staffDetail.username}
            </h2>

            <div className="flex flex-wrap gap-2 justify-center mb-3">
              <RoleBadge role={staffDetail.role} />
              <StatusBadge status={staffDetail.accountStatus} />
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center text-sm text-gray-600 dark:text-gray-400 transition-colors">
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{staffDetail.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{staffDetail.phone}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'personal'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('staffManagement.viewDetail.personalInfo')}
            </button>
            <button
              onClick={() => setActiveTab('work')}
              className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'work'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('staffManagement.viewDetail.workInfo')}
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'personal' ? (
            <div
              className="space-y-6 animate-in"
              style={{ animation: 'fadeIn 0.3s ease-out forwards' }}
            >
              <div className="bg-white dark:bg-gray-700/40 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem
                    icon={<User className="h-5 w-5" />}
                    label={t('staffManagement.viewDetail.labels.gender')}
                    value={staffDetail.gender}
                  />

                  <InfoItem
                    icon={<CalendarDays className="h-5 w-5" />}
                    label={t('staffManagement.viewDetail.labels.dateOfBirth')}
                    value={formatDate(staffDetail.dateOfBirth)}
                  />

                  <InfoItem
                    icon={<Clock className="h-5 w-5" />}
                    label={t('staffManagement.viewDetail.labels.lastUpdated')}
                    value={formatDate(staffDetail.dateOfBirth)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="space-y-6 animate-in"
              style={{ animation: 'fadeIn 0.3s ease-out forwards' }}
            >
              {staffDetail.userDetails ? (
                <div className="bg-white dark:bg-gray-700/40 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                  <div className="grid grid-cols-1 gap-6">
                    <InfoItem
                      icon={<Briefcase className="h-5 w-5" />}
                      label={t('staffManagement.viewDetail.labels.position')}
                      value={
                        <>
                          {staffDetail.userDetails.position.positionName}
                          {staffDetail.userDetails.position.description && (
                            <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                              ({staffDetail.userDetails.position.description})
                            </span>
                          )}
                        </>
                      }
                      isFullWidth
                    />

                    <InfoItem
                      icon={<Building2 className="h-5 w-5" />}
                      label={t('staffManagement.viewDetail.labels.department')}
                      value={
                        <>
                          <div>{staffDetail.userDetails.department.departmentName}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-sm">
                            {staffDetail.userDetails.department.description}
                          </div>
                        </>
                      }
                      isFullWidth
                    />

                    <InfoItem
                      icon={<MapPin className="h-5 w-5" />}
                      label={t('staffManagement.viewDetail.labels.area')}
                      value={staffDetail.userDetails.department.area}
                      isFullWidth
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  {t('staffManagement.viewDetail.noDepartment')}
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              {t('staffManagement.viewDetail.close')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-700 dark:text-gray-300 transition-colors">
          <User className="h-14 w-14 mb-4 text-gray-400 dark:text-gray-600" strokeWidth={1.5} />
          <p className="text-lg">{t('staffManagement.viewDetail.noData')}</p>
        </div>
      )}
    </Modal>
  );
};

// Helper component for displaying info items
const InfoItem = ({
  icon,
  label,
  value,
  isFullWidth = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  isFullWidth?: boolean;
}) => (
  <div className={`flex items-start space-x-3 ${isFullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex-shrink-0 mt-1">
      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 transition-colors">
        {icon}
      </div>
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors">
        {label}
      </p>
      <p className="text-gray-900 dark:text-white break-words transition-colors">{value}</p>
    </div>
  </div>
);

export default ViewDetailStaff;
