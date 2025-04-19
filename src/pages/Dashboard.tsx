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
} from 'recharts';
import dashboardService, { DashboardSummary } from '@/services/dashboard';
import { FORMAT_DATE_TIME } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

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
        <p className="font-semibold text-xl mb-2">Lỗi kết nối</p>
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
              <div className="h-1 bg-yellow-500 rounded-full" style={{ width: '40%' }}></div>
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
              <div className="h-1 bg-green-500 rounded-full" style={{ width: '70%' }}></div>
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
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
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
              <div className="h-1 bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
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
              <div className="h-1 bg-purple-500 rounded-full" style={{ width: '60%' }}></div>
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
              <div className="h-1 bg-pink-500 rounded-full" style={{ width: '75%' }}></div>
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
                <Tooltip formatter={value => [`${value} tasks`, 'Count']} />
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
                <Tooltip formatter={value => [`${value} cracks`, 'Count']} />
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
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#F3F4F6',
                }}
              />
              <Bar dataKey="count" name="Schedules" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(dashboardData.taskStats?.recentTasks || []).slice(0, 5).map(task => (
                <tr key={task.task_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {task.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {task.task_id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        task.status === 'Completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : task.status === 'InProgress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : task.status === 'Assigned'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {FORMAT_DATE_TIME(task.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {FORMAT_DATE_TIME(task.updated_at)}
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
