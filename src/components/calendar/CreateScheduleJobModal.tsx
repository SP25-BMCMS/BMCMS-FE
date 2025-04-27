import apiInstance from '@/lib/axios';
import authApi from '@/services/auth';
import { BuildingOfficeIcon, CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-hot-toast';

interface CreateScheduleJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  onSubmit?: (data: {
    schedule_id: string;
    run_date: string;
    buildingDetailId: string;
  }) => Promise<void>;
}

interface Building {
  buildingId: string;
  name: string;
  numberFloor: number;
  area: {
    areaId: string;
    name: string;
  };
  buildingDetails: {
    buildingDetailId: string;
    name: string;
    total_apartments: number;
  }[];
}

const CreateScheduleJobModal: React.FC<CreateScheduleJobModalProps> = ({
  isOpen,
  onClose,
  scheduleId,
  onSubmit,
}) => {
  const queryClient = useQueryClient();
  const [selectedBuildingDetail, setSelectedBuildingDetail] = useState<string>('');
  const [runDate, setRunDate] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get current user (manager)
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: isOpen,
  });

  // Fetch buildings managed by the current manager
  const { data: buildingsData, isLoading: buildingsLoading } = useQuery({
    queryKey: ['managerBuildings', currentUser?.userId],
    queryFn: async () => {
      if (!currentUser?.userId) return { data: [] };
      const url = import.meta.env.VITE_VIEW_BUILDING_LIST_FOR_MANAGER.replace(
        '{managerId}',
        currentUser.userId
      );
      const response = await apiInstance.get(url);
      return response.data;
    },
    enabled: isOpen && !!currentUser?.userId,
  });

  // Create schedule job mutation
  const createScheduleJobMutation = useMutation({
    mutationFn: async (data: {
      schedule_id: string;
      run_date: string;
      buildingDetailId: string;
    }) => {
      return await apiInstance.post(import.meta.env.VITE_CREATE_SCHEDULE_JOB, {
        ...data,
        status: 'Pending',
        inspectionId: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] });
      toast.success('Schedule job created successfully');
      onClose();
    },
    onError: (error: any) => {
      console.error('Error creating schedule job:', error);
      toast.error(error.response?.data?.message || 'Failed to create schedule job');
      setIsSubmitting(false);
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBuildingDetail('');
      setRunDate(new Date());
    }
  }, [isOpen]);

  // Create flattened list of buildings with their details
  const buildingOptions: {
    buildingId: string;
    buildingName: string;
    buildingDetailId: string;
    detailName: string;
    totalApartments: number;
    numberFloor: number;
    areaName: string;
  }[] = [];

  if (buildingsData?.data) {
    buildingsData.data.forEach((building: Building) => {
      if (building.buildingDetails && building.buildingDetails.length > 0) {
        building.buildingDetails.forEach(detail => {
          buildingOptions.push({
            buildingId: building.buildingId,
            buildingName: building.name,
            buildingDetailId: detail.buildingDetailId,
            detailName: detail.name,
            totalApartments: detail.total_apartments || 0,
            numberFloor: building.numberFloor,
            areaName: building.area.name,
          });
        });
      }
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleId) {
      toast.error('No schedule selected');
      return;
    }

    if (!selectedBuildingDetail) {
      toast.error('Please select a building');
      return;
    }

    if (!runDate) {
      toast.error('Please select a run date');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        schedule_id: scheduleId,
        run_date: runDate.toISOString(),
        buildingDetailId: selectedBuildingDetail,
      };

      if (onSubmit) {
        await onSubmit(submitData);
      } else {
        await createScheduleJobMutation.mutateAsync(submitData);
      }
    } catch (error) {
      // Error handled in mutation or onSubmit
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center bg-blue-600 dark:bg-blue-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CalendarDaysIcon className="w-5 h-5 mr-2" />
            Create Schedule Job
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            title="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {buildingsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading buildings...</p>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="buildingDetail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Building
                </label>
                {buildingOptions.length > 0 ? (
                  <div className="relative">
                    <select
                      id="buildingDetail"
                      value={selectedBuildingDetail}
                      onChange={e => setSelectedBuildingDetail(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 dark:text-white"
                      required
                    >
                      <option value="">Select a building</option>
                      {buildingOptions.map(option => (
                        <option key={option.buildingDetailId} value={option.buildingDetailId}>
                          {option.buildingName} - {option.detailName}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <BuildingOfficeIcon className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    No buildings available for this manager.
                  </p>
                )}
              </div>

              {selectedBuildingDetail && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    {
                      buildingOptions.find(opt => opt.buildingDetailId === selectedBuildingDetail)
                        ?.buildingName
                    }{' '}
                    -{' '}
                    {
                      buildingOptions.find(opt => opt.buildingDetailId === selectedBuildingDetail)
                        ?.detailName
                    }
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {
                      buildingOptions.find(opt => opt.buildingDetailId === selectedBuildingDetail)
                        ?.totalApartments
                    }{' '}
                    apartments •{' '}
                    {
                      buildingOptions.find(opt => opt.buildingDetailId === selectedBuildingDetail)
                        ?.numberFloor
                    }{' '}
                    floors
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Area:{' '}
                    {
                      buildingOptions.find(opt => opt.buildingDetailId === selectedBuildingDetail)
                        ?.areaName
                    }
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="runDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Run Date
                </label>
                <DatePicker
                  selected={runDate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setRunDate(date);
                    }
                  }}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 dark:text-white"
                  minDate={new Date()}
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedBuildingDetail ||
                    !runDate ||
                    buildingOptions.length === 0
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Creating...
                    </>
                  ) : (
                    'Create Job'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateScheduleJobModal;
