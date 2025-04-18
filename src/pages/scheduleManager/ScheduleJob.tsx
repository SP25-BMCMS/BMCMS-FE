import TaskModal from '@/components/calendar/TaskModal';
import Pagination from '@/components/Pagination';
import scheduleJobsApi, {
  type ScheduleJob,
  UpdateScheduleJobRequest,
  useSendMaintenanceEmail,
} from '@/services/scheduleJobs';
import schedulesApi from '@/services/schedules';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMailLine,
  RiTaskLine,
} from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';

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
    select: response => response.data,
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

  // Update schedule job status mutation
  // const updateStatusMutation = useMutation({
  //     mutationFn: ({ jobId, status }: { jobId: string; status: 'Pending' | 'InProgress' | 'Completed' }) =>
  //         scheduleJobsApi.updateScheduleJobStatus(jobId, status),
  //     onSuccess: () => {
  //         queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] })
  //         toast.success('Status updated successfully')
  //     },
  //     onError: () => {
  //         toast.error('Failed to update status')
  //     }
  // })

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
    try {
      await updateJobMutation.mutateAsync({
        jobId,
        data: { status: 'Cancel' },
      });
    } catch (error) {
      console.error('Error deleting schedule job:', error);
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

  // const handleStatusChange = async (jobId: string, newStatus: 'Pending' | 'InProgress' | 'Completed') => {
  //     try {
  //         await updateStatusMutation.mutateAsync({ jobId, status: newStatus })
  //     } catch (error) {
  //         console.error('Error updating job status:', error)
  //     }
  // }

  // const handleCompleteJob = async (job: ScheduleJob) => {
  //     try {
  //         await updateStatusMutation.mutateAsync({
  //             jobId: job.schedule_job_id,
  //             status: 'Completed'
  //         })
  //     } catch (error) {
  //         console.error('Error completing job:', error)
  //     }
  // }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getScheduleTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'daily':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'weekly':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'monthly':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const scheduleJobs = scheduleJobsData?.data || [];
  const totalItems = scheduleJobsData?.pagination.total || 0;
  const totalPages = scheduleJobsData?.pagination.totalPages || 1;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={handleReturn}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
        >
          <RiArrowLeftLine className="mr-2" />
          <span>Back to Calendar</span>
        </button>

        {schedule && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {schedule.schedule_name}
                </h1>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(schedule.start_date).toLocaleDateString()} -{' '}
                    {new Date(schedule.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Schedule ID</p>
                <p className="font-mono text-gray-900 dark:text-white">{scheduleId}</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{schedule.description}</p>
          </div>
        )}
      </div>

      {/* Schedule Jobs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Schedule Jobs</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {scheduleJobs.length} of {totalItems} jobs
            </div>
          </div>
        </div>

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
              {scheduleJobs.map(job => (
                <tr key={job.schedule_job_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {job.building.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {job.building.area.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(job.run_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Edit"
                    >
                      <RiEditLine className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.schedule_job_id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <RiDeleteBinLine className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleSendEmail(job)}
                      disabled={sendEmailMutation.isPending}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send Email"
                    >
                      <RiMailLine className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleCreateTask(job)}
                      className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                      title="Create Task"
                    >
                      <RiTaskLine className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
