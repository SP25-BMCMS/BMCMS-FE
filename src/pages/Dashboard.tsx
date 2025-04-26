import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FaTasks,
  FaClipboardCheck,
  FaSpinner,
  FaBuilding,
  FaCalendarAlt,
  FaUsers,
  FaEllipsisV,
  FaExclamationCircle,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaRegFileAlt,
  FaCalendarDay,
  FaHistory,
  FaTag,
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  TooltipProps,
} from 'recharts';
import dashboardService, { DashboardSummary } from '@/services/dashboard';
import { FORMAT_DATE_TIME } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { Tooltip as UITooltip } from '@/components/Tooltip';

// Custom tooltip component for Recharts
const CustomTooltip = ({ active, payload, label, valueLabel = 'Count' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-2 rounded-md shadow-md border border-gray-700 text-sm">
        <p className="font-medium">{`${payload[0].name || label}: ${payload[0].value}`}</p>
        <p className="text-xs text-gray-300">{valueLabel}</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardService.getDashboardSummary,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      console.error('Dashboard error:', error);
      const err = error as any;
      if (err.response?.status === 401) {
        setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Có thể redirect về trang login sau 3 giây
        setTimeout(() => {
          localStorage.removeItem('bmcms_token');
          navigate('/login');
        }, 3000);
      } else {
        setErrorMessage(err.message || 'Không thể tải dữ liệu bảng điều khiển.');
      }
    }
  }, [error, navigate]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    Pending: '#FFBB28',
    InProgress: '#0088FE',
    Completed: '#00C49F',
    Assigned: '#FF8042',
    default: '#8884d8',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="bg-red-100 text-red-700 p-8 rounded-lg text-center max-w-md mx-auto mt-12">
        <FaExclamationCircle className="text-5xl mx-auto mb-4" />
        <p className="font-semibold text-xl mb-2">Connection Error</p>
        <p className="mb-4">{errorMessage || 'Không thể tải dữ liệu bảng điều khiển'}</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Đăng nhập lại
        </button>
      </div>
    );
  }

  // Tạo dữ liệu cho biểu đồ từ API thực tế
  const taskStatusData = [
    { status: 'Pending', count: dashboardData.taskStats?.tasksByStatus?.pending || 0 },
    { status: 'InProgress', count: dashboardData.taskStats?.tasksByStatus?.inProgress || 0 },
    { status: 'Completed', count: dashboardData.taskStats?.tasksByStatus?.completed || 0 },
    { status: 'Assigned', count: dashboardData.taskStats?.tasksByStatus?.assigned || 0 },
  ];

  // Dữ liệu về mức độ nghiêm trọng của vết nứt
  const crackSeverityData = [
    { name: 'Low', value: dashboardData.crackStats?.cracksBySeverity?.low || 0 },
    { name: 'Medium', value: dashboardData.crackStats?.cracksBySeverity?.medium || 0 },
    { name: 'High', value: dashboardData.crackStats?.cracksBySeverity?.high || 0 },
    { name: 'Critical', value: dashboardData.crackStats?.cracksBySeverity?.critical || 0 },
  ].filter(item => item.value > 0);

  // Custom label cho biểu đồ tròn
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (percent <= 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
        style={{
          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))',
          textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
        }}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Tạo dữ liệu phân bố lịch trình theo tháng từ dữ liệu mẫu
  const scheduleDistribution = [
    { month: 'Jan', count: 5 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 12 },
    { month: 'Apr', count: 15 },
    { month: 'May', count: 10 },
    { month: 'Jun', count: 18 },
  ];

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tasks Pending */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Pending</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardData.taskStats?.tasksByStatus?.pending || '0'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <FaTasks className="text-xl text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-1 bg-yellow-500 rounded-full"
                style={{ width: dashboardData.taskStats?.tasksByStatus?.pending ? '40%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tasks Completed
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardData.taskStats?.tasksByStatus?.completed || '0'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <FaClipboardCheck className="text-xl text-green-500 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-1 bg-green-500 rounded-full"
                style={{ width: dashboardData.taskStats?.tasksByStatus?.completed ? '70%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tasks In Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardData.taskStats?.tasksByStatus?.inProgress || '0'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <FaSpinner className="text-xl text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-1 bg-blue-500 rounded-full"
                style={{ width: dashboardData.taskStats?.tasksByStatus?.inProgress ? '50%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Cracks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cracks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardData.crackStats?.cracksByStatus?.total || '0'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <FaBuilding className="text-xl text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-1 bg-indigo-500 rounded-full"
                style={{ width: dashboardData.crackStats?.cracksByStatus?.total ? '85%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Schedule Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Schedule Jobs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardData.taskStats?.tasksByStatus?.total || '0'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <FaCalendarAlt className="text-xl text-purple-500 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-1 bg-purple-500 rounded-full"
                style={{ width: dashboardData.taskStats?.tasksByStatus?.total ? '60%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Staff */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Staff</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardData.staffStats?.totalStaff || '0'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
              <FaUsers className="text-xl text-pink-500 dark:text-pink-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-1 bg-pink-500 rounded-full"
                style={{ width: dashboardData.staffStats?.totalStaff ? '75%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Task Status Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData.filter(item => item.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '2 2' }}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  minAngle={15}
                  paddingAngle={4}
                >
                  {taskStatusData
                    .filter(item => item.count > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip valueLabel="tasks" />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crack Severity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Crack Severity Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={crackSeverityData}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '2 2' }}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  minAngle={15}
                  paddingAngle={4}
                >
                  {crackSeverityData.map((entry, index) => {
                    const COLORS = {
                      Low: '#00C49F',
                      Medium: '#FFBB28',
                      High: '#FF8042',
                      Critical: '#FF0000',
                    };
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name as keyof typeof COLORS]}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip valueLabel="cracks" />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Schedule Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Schedule Distribution
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scheduleDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip valueLabel="schedules" />} />
              <Bar dataKey="count" name="Schedules" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaRegFileAlt className="text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaRegFileAlt className="text-gray-400" />
                    <span>Task</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaTag className="text-gray-400" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaCalendarDay className="text-gray-400" />
                    <span>Created</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaHistory className="text-gray-400" />
                    <span>Updated</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(dashboardData.taskStats?.recentTasks || []).slice(0, 5).map(task => (
                <tr key={task.task_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <UITooltip content={task.description} position="top">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <FaRegFileAlt className="text-blue-500 dark:text-blue-400 text-lg" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white max-w-[250px] truncate">
                            {(task as any).title || task.description.split('.')[0]}
                          </div>
                        </div>
                      </div>
                    </UITooltip>
                  </td>
                  <td className="px-6 py-4">
                    <UITooltip content={`Status: ${task.status}`} position="right">
                      {task.status === 'Completed' ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <FaCheckCircle className="mr-1" />
                            Completed
                          </span>
                        </div>
                      ) : task.status === 'InProgress' ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            <FaSpinner className="mr-1 animate-spin" />
                            In Progress
                          </span>
                        </div>
                      ) : task.status === 'Assigned' ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            <FaUser className="mr-1" />
                            Assigned
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            <FaClock className="mr-1" />
                            Pending
                          </span>
                        </div>
                      )}
                    </UITooltip>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <UITooltip
                      content={`Created: ${FORMAT_DATE_TIME(task.created_at)}`}
                      position="left"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {FORMAT_DATE_TIME(task.created_at).split(',')[0]}
                        </span>
                        <span className="text-xs">
                          {FORMAT_DATE_TIME(task.created_at).split(',')[1]?.trim()}
                        </span>
                      </div>
                    </UITooltip>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <UITooltip
                      content={`Last updated: ${FORMAT_DATE_TIME(task.updated_at)}`}
                      position="left"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {FORMAT_DATE_TIME(task.updated_at).split(',')[0]}
                        </span>
                        <span className="text-xs">
                          {FORMAT_DATE_TIME(task.updated_at).split(',')[1]?.trim()}
                        </span>
                      </div>
                    </UITooltip>
                  </td>
                </tr>
              ))}
              {(!dashboardData.taskStats?.recentTasks ||
                dashboardData.taskStats?.recentTasks.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No recent tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
