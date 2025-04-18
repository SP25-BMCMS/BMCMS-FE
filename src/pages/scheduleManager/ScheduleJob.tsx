import TaskModal from '@/components/calendar/TaskModal';
import Pagination from '@/components/Pagination';
import scheduleJobsApi, {
  type ScheduleJob,
  UpdateScheduleJobRequest,
  useSendMaintenanceEmail,
} from '@/services/scheduleJobs';
import schedulesApi, { Schedule as ScheduleType } from '@/services/schedules';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMailLine,
  RiTaskLine,
  RiCalendarCheckLine,
  RiBuilding2Line,
  RiTimeLine,
  RiInformationLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiAlertLine,
} from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';
import { STATUS_COLORS } from '@/constants/colors';

const ScheduleJob: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ScheduleJob | null>(null);

  // Fetch schedule details
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => schedulesApi.getScheduleById(scheduleId!),
    enabled: !!scheduleId,
    select: response => response.data as ScheduleType & { schedule_type?: string },
  });

  // Fetch schedule jobs with pagination
  const { data: scheduleJobsData, isLoading: isJobsLoading } = useQuery({
    queryKey: ['scheduleJobs', scheduleId, currentPage, itemsPerPage],
    queryFn: () =>
      scheduleJobsApi.fetchScheduleJobsByScheduleId(scheduleId!, {
        page: currentPage,
        limit: itemsPerPage,
      }),
    enabled: !!scheduleId,
  });

  // Update schedule job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: UpdateScheduleJobRequest }) =>
      scheduleJobsApi.updateScheduleJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] });
      toast.success('Schedule job updated successfully');
    },
    onError: () => {
      toast.error('Failed to update schedule job');
    },
  });

  // Send maintenance email mutation
  const sendEmailMutation = useSendMaintenanceEmail();

  const handleEditJob = async (job: ScheduleJob) => {
    try {
      await updateJobMutation.mutateAsync({
        jobId: job.schedule_job_id,
        data: { status: 'InProgress' },
      });
    } catch (error) {
      console.error('Error updating schedule job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to cancel this schedule job?')) {
      try {
        await updateJobMutation.mutateAsync({
          jobId,
          data: { status: 'Cancel' },
        });
        toast.success('Schedule job cancelled successfully');
      } catch (error) {
        console.error('Error cancelling schedule job:', error);
      }
    }
  };

  const handleSendEmail = async (job: ScheduleJob) => {
    try {
      await sendEmailMutation.mutateAsync(job.schedule_job_id);
      toast.success('Maintenance email sent successfully');
    } catch (error) {
      console.error('Error sending maintenance email:', error);
      toast.error('Failed to send maintenance email');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-300',
          icon: <RiAlertLine className="mr-1" />,
        };
      case 'inprogress':
        return {
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300',
          icon: <RiTimeLine className="mr-1" />,
        };
      case 'completed':
        return {
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-300',
          icon: <RiCheckboxCircleLine className="mr-1" />,
        };
      case 'cancel':
        return {
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-300',
          icon: <RiCloseCircleLine className="mr-1" />,
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300',
          icon: <RiInformationLine className="mr-1" />,
        };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const handleReturn = () => {
    navigate('/calendar');
  };

  const handleCreateTask = (job: ScheduleJob) => {
    setSelectedJob(job);
    setShowTaskModal(true);
  };

  if (isScheduleLoading || isJobsLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading schedule details...</p>
      </div>
    );
  }

  const scheduleJobs = scheduleJobsData?.data || [];
  const totalItems = scheduleJobsData?.pagination.total || 0;
  const totalPages = scheduleJobsData?.pagination.totalPages || 1;
  
  // Get status for schedule and display appropriate color/icon
  const scheduleStatus = schedule?.schedule_status || 'Pending';
  const statusInfo = getStatusBadge(scheduleStatus);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={handleReturn}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-6"
        >
          <RiArrowLeftLine className="mr-2" />
          <span>Back to Calendar</span>
        </button>

        {schedule && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Header Banner with Status */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 px-6 py-4 border-b border-blue-700">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Schedule Details</h1>
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${statusInfo.className}`}>
                  {statusInfo.icon} {scheduleStatus}
                </div>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                {/* Left Column */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {schedule.schedule_name}
                  </h2>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <RiCalendarCheckLine className="mr-2 text-blue-500" />
                      <span>
                        {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
                      </span>
                    </div>
                    {schedule.schedule_type !== undefined && (
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <RiTimeLine className="mr-2 text-purple-500" />
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded-full text-xs">
                          {schedule.schedule_type}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      {schedule.description || "No description provided"}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Schedule ID:</div>
                    <div className="font-mono text-gray-700 dark:text-gray-300">{scheduleId}</div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Created At:</div>
                    <div className="text-gray-700 dark:text-gray-300">{formatDate(schedule.created_at)}</div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Updated At:</div>
                    <div className="text-gray-700 dark:text-gray-300">{formatDate(schedule.updated_at)}</div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Total Jobs:</div>
                    <div className="text-gray-700 dark:text-gray-300">{totalItems}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Jobs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <RiBuilding2Line className="text-blue-500 mr-2 w-5 h-5" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Schedule Jobs</h2>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              Showing {scheduleJobs.length} of {totalItems} jobs
            </div>
          </div>
        </div>

        {scheduleJobs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="text-blue-500 w-16 h-16 mb-4">
                <RiInformationLine className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No schedule jobs found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                There are no jobs associated with this schedule yet or they may have been cancelled.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Run Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {scheduleJobs.map(job => {
                  const statusInfo = getStatusBadge(job.status);
                  return (
                    <tr key={job.schedule_job_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-500 rounded-lg">
                            <RiBuilding2Line className="w-5 h-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {job.building?.name || 'Unknown Building'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {job.building?.area?.name || 'Unknown Area'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${statusInfo.className}`}
                        >
                          {statusInfo.icon} {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(job.run_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {job.status.toLowerCase() !== 'cancel' && job.status.toLowerCase() !== 'completed' && (
                            <>
                              <button
                                onClick={() => handleEditJob(job)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                title="Mark as In Progress"
                              >
                                <RiEditLine className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.schedule_job_id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Cancel Job"
                              >
                                <RiDeleteBinLine className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleSendEmail(job)}
                                disabled={sendEmailMutation.isPending}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Send Maintenance Email"
                              >
                                <RiMailLine className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleCreateTask(job)}
                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                                title="Create Task"
                              >
                                <RiTaskLine className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {job.status.toLowerCase() === 'cancel' && (
                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">
                              Cancelled
                            </span>
                          )}
                          {job.status.toLowerCase() === 'completed' && (
                            <span className="text-green-600 dark:text-green-400 text-xs italic flex items-center">
                              <RiCheckboxCircleLine className="w-4 h-4 mr-1" /> Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {scheduleJobs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onLimitChange={handleLimitChange}
              limitOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </div>

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedJob(null);
        }}
        scheduleJob={selectedJob}
      />
    </div>
  );
};

export default ScheduleJob;
