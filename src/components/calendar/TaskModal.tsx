import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { CreateTaskRequest, useCreateTask } from '@/services/tasks';
import { ScheduleJob } from '@/services/scheduleJobs';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleJob?: ScheduleJob | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, scheduleJob }) => {
  const createTaskMutation = useCreateTask();
  const [formData, setFormData] = useState<CreateTaskRequest>({
    description: '',
    status: 'Assigned',
    crack_id: '',
    schedule_job_id: scheduleJob?.schedule_job_id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleJob) {
      toast.error('No schedule job selected');
      return;
    }
    try {
      await createTaskMutation.mutateAsync({
        ...formData,
        schedule_job_id: scheduleJob.schedule_job_id,
      });
      toast.success('Task created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
    }
  };

  if (!scheduleJob) {
    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Error
            </Dialog.Title>
            <p className="text-gray-600 dark:text-gray-300">No schedule job selected.</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Task
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Schedule Job Details */}
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Schedule Job Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Building</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {scheduleJob.building.name}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Area</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {scheduleJob.building.area.name}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CalendarIcon className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Run Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(scheduleJob.run_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{scheduleJob.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Task Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Task Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                rows={5}
                placeholder="Describe the task to be performed..."
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TaskModal;
