import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { WorkLogListPaginationResponse, WorkLog } from '@/types';
import Pagination from '@/components/Pagination';
import {
  FaCalendarAlt,
  FaClipboardList,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHourglassHalf,
  FaTools,
  FaSearch,
} from 'react-icons/fa';
import { Tooltip } from '@/components/Tooltip';

const statusIcons: Record<string, JSX.Element> = {
  EXECUTE_CRACKS: <FaTools className="text-blue-500" />,
  CONFIRM_NO_PENDING_ISSUES: <FaCheckCircle className="text-green-500" />,
  FINAL_REVIEW: <FaHourglassHalf className="text-purple-500" />,
  DEFAULT: <FaExclamationTriangle className="text-yellow-500" />,
};

const statusColors: Record<string, string> = {
  EXECUTE_CRACKS: 'bg-blue-100 text-blue-800',
  CONFIRM_NO_PENDING_ISSUES: 'bg-green-100 text-green-800',
  FINAL_REVIEW: 'bg-purple-100 text-purple-800',
  DEFAULT: 'bg-yellow-100 text-yellow-800',
};

const WorkLogPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: workLogsData,
    isLoading,
    isError,
  } = useQuery<WorkLogListPaginationResponse>({
    queryKey: ['worklogs', currentPage, itemsPerPage, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_SECRET}${import.meta.env.VITE_VIEW_WORKLOG_LIST}?${params.toString()}`
      );
      return response.data;
    },
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    return statusIcons[status] || statusIcons.DEFAULT;
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || statusColors.DEFAULT;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Failed to load work logs.</span>
        </div>
      </div>
    );
  }

  const workLogs = workLogsData?.data || [];
  const totalItems = workLogsData?.pagination.total || 0;
  const totalPages = workLogsData?.pagination.totalPages || 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Work Log Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track and manage all work logs for tasks and assignments
        </p>
      </div>

      {/* Search and filter section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Work logs list */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Work Logs</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {workLogs.length} of {totalItems} logs
            </div>
          </div>
        </div>

        {workLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No work logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {workLogs.map(worklog => (
                  <tr key={worklog.worklog_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <FaClipboardList className="mt-1 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {worklog.title}
                          </div>
                          <Tooltip content={worklog.description} position="bottom">
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              {worklog.description}
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip content={worklog.task.description} position="top">
                        <div className="text-sm text-gray-900 dark:text-white max-w-[350px] truncate">
                          {worklog.task.description.includes(' - ') 
                            ? worklog.task.description.split(' - ')[0] + ' - ' + worklog.task.description.split(' - ')[1]?.split('.')[0]
                            : worklog.task.description.split('.')[0] + '.'}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(worklog.status)}`}
                        >
                          {getStatusIcon(worklog.status)}
                          <span className="ml-1">{worklog.status.replace(/_/g, ' ')}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <Tooltip content={`Created: ${formatDate(worklog.created_at)}`} position="left">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(worklog.created_at).split(',')[0]}</span>
                            <span className="text-xs">{formatDate(worklog.created_at).split(',')[1]?.trim()}</span>
                          </div>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
    </div>
  );
};

export default WorkLogPage;
