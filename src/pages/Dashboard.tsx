import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  FaStar,
  FaComments,
} from 'react-icons/fa'
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
} from 'recharts'
import dashboardService, {
  DashboardSummary,
  Feedback,
  FeedbacksResponse,
} from '@/services/dashboard'
import { getAllResidents } from '@/services/residents'
import { FORMAT_DATE_TIME } from '@/utils/format'
import { useNavigate } from 'react-router-dom'
import { Tooltip as UITooltip } from '@/components/Tooltip'

// Custom tooltip component for Recharts
const CustomTooltip = ({ active, payload, label, valueLabel = 'Count' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-2 rounded-md shadow-md border border-gray-700 text-sm">
        <p className="font-medium">{`${payload[0].name || label}: ${payload[0].value}`}</p>
        <p className="text-xs text-gray-300">{valueLabel}</p>
      </div>
    )
  }
  return null
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [currentTaskPage, setCurrentTaskPage] = useState<number>(1)
  const itemsPerPage = 5

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardService.getDashboardSummary,
    retry: 1,
  })

  const {
    data: feedbacksData,
    isLoading: isFeedbacksLoading,
    isError: isFeedbacksError,
    error: feedbacksError,
  } = useQuery<FeedbacksResponse>({
    queryKey: ['feedbacks'],
    queryFn: () => dashboardService.getFeedbacks({ limit: 999999 }),
    retry: 1,
  })

  const {
    data: residentsData,
    isLoading: isResidentsLoading,
    isError: isResidentsError,
    error: residentsError,
  } = useQuery({
    queryKey: ['residents'],
    queryFn: () => getAllResidents({ limit: 99999 }),
    retry: 1,
  })

  // Create a map of resident IDs to names for quick lookup
  const residentNameMap = React.useMemo(() => {
    if (!residentsData?.data) return new Map()
    return new Map(residentsData.data.map(resident => [resident.userId, resident.username]))
  }, [residentsData])

  // Calculate pagination
  const totalPages = feedbacksData?.data ? Math.ceil(feedbacksData.data.length / itemsPerPage) : 0
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFeedbacks = feedbacksData?.data?.slice(startIndex, endIndex) || []

  // Calculate task pagination
  const totalTaskPages = dashboardData?.taskStats?.recentTasks ? Math.ceil(dashboardData.taskStats.recentTasks.length / itemsPerPage) : 0
  const taskStartIndex = (currentTaskPage - 1) * itemsPerPage
  const taskEndIndex = taskStartIndex + itemsPerPage
  const currentTasks = dashboardData?.taskStats?.recentTasks?.slice(taskStartIndex, taskEndIndex) || []

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle task page change
  const handleTaskPageChange = (page: number) => {
    setCurrentTaskPage(page)
  }

  useEffect(() => {
    if (dashboardError) {
      console.error('Dashboard error:', dashboardError)
      const err = dashboardError as any
      if (err.response?.status === 401) {
        setErrorMessage(t('common.sessionExpired'))
        setTimeout(() => {
          localStorage.removeItem('bmcms_token')
          navigate('/login')
        }, 3000)
      } else {
        setErrorMessage(err.message || t('common.dashboardLoadError'))
      }
    }
  }, [dashboardError, navigate, t])

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
  const STATUS_COLORS = {
    Pending: '#FFBB28',
    InProgress: '#0088FE',
    Completed: '#00C49F',
    Assigned: '#FF8042',
    default: '#8884d8',
  }

  if (isDashboardLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (isDashboardError || !dashboardData) {
    return (
      <div className="bg-red-100 text-red-700 p-8 rounded-lg text-center max-w-md mx-auto mt-12">
        <FaExclamationCircle className="text-5xl mx-auto mb-4" />
        <p className="font-semibold text-xl mb-2">{t('common.connectionError')}</p>
        <p className="mb-4">{errorMessage || t('common.dashboardLoadError')}</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          {t('common.login')}
        </button>
      </div>
    )
  }

  // Tạo dữ liệu cho biểu đồ từ API thực tế
  const taskStatusData = [
    { status: 'Pending', count: dashboardData.taskStats?.tasksByStatus?.pending || 0 },
    { status: 'InProgress', count: dashboardData.taskStats?.tasksByStatus?.inProgress || 0 },
    { status: 'Completed', count: dashboardData.taskStats?.tasksByStatus?.completed || 0 },
    { status: 'Assigned', count: dashboardData.taskStats?.tasksByStatus?.assigned || 0 },
  ]

  // Dữ liệu về mức độ nghiêm trọng của vết nứt
  const crackSeverityData = [
    { name: 'Low', value: dashboardData.crackStats?.cracksBySeverity?.low || 0 },
    { name: 'Medium', value: dashboardData.crackStats?.cracksBySeverity?.medium || 0 },
    { name: 'High', value: dashboardData.crackStats?.cracksBySeverity?.high || 0 },
    { name: 'Critical', value: dashboardData.crackStats?.cracksBySeverity?.critical || 0 },
  ].filter(item => item.value > 0)

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
    if (percent <= 0.05) return null

    const RADIAN = Math.PI / 180
    const radius = outerRadius * 1.2
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

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
    )
  }


  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default
  }

  // Update the feedback display to include resident names
  const renderFeedbackRow = (feedback: any) => (
    <tr
      key={feedback.feedback_id}
      className="hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <td className="px-6 py-4">
        <UITooltip
          content={feedback.task?.description || t('dashboard.noTaskDescription')}
          position="top"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <FaRegFileAlt className="text-blue-500 dark:text-blue-400 text-lg" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                {feedback.task?.title || 'Task #' + feedback.task_id?.substring(0, 8)}
              </div>
            </div>
          </div>
        </UITooltip>
      </td>
      <td className="px-6 py-4">
        <UITooltip content={feedback.comments} position="top">
          <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate">
            {feedback.comments}
          </div>
        </UITooltip>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 dark:text-white">
          {feedback.feedback_by ? residentNameMap.get(feedback.feedback_by) || t('dashboard.unknownUser') : t('dashboard.unknownUser')}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index}
              className={`${index < feedback.rating
                ? 'text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
                } w-4 h-4`}
            />
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        <UITooltip
          content={`${t('common.created')}: ${FORMAT_DATE_TIME(feedback.created_at)}`}
          position="left"
        >
          <div className="flex flex-col">
            <span className="font-medium">
              {FORMAT_DATE_TIME(feedback.created_at).split(',')[0]}
            </span>
            <span className="text-xs">
              {FORMAT_DATE_TIME(feedback.created_at).split(',')[1]?.trim()}
            </span>
          </div>
        </UITooltip>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tasks Pending */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.tasksPending')}</p>
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
                {t('dashboard.tasksCompleted')}
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.tasksInProgress')}</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalCracks')}</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.scheduleJobs')}</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalStaff')}</p>
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

        {/* Feedback Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('dashboard.feedbackRating')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 flex items-center">
                {isFeedbacksLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                    {t('common.loading')}
                  </span>
                ) : isFeedbacksError ? (
                  'N/A'
                ) : feedbacksData?.data && feedbacksData.data.length > 0 ? (
                  <>
                    {(
                      feedbacksData.data.reduce((sum, item) => sum + item.rating, 0) /
                      feedbacksData.data.length
                    ).toFixed(1)}
                    <span className="ml-2 text-yellow-400 flex">
                      <FaStar className="w-5 h-5 mr-1" />
                    </span>
                  </>
                ) : (
                  t('common.noData')
                )}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <FaStar className="text-xl text-purple-500 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-1 bg-purple-500 rounded-full"
                style={{
                  width:
                    isFeedbacksLoading ||
                      isFeedbacksError ||
                      !feedbacksData?.data ||
                      feedbacksData.data.length === 0
                      ? '0%'
                      : `${(feedbacksData.data.reduce((sum, item) => sum + item.rating, 0) / feedbacksData.data.length / 5) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      {/* Recent Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaRegFileAlt className="text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('dashboard.recentTasks')}</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaRegFileAlt className="text-gray-400" />
                    <span>{t('dashboard.task')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaTag className="text-gray-400" />
                    <span>{t('common.status')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaCalendarDay className="text-gray-400" />
                    <span>{t('common.createdDate')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaHistory className="text-gray-400" />
                    <span>{t('common.updated')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentTasks.map(task => (
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
                    <UITooltip content={`${t('common.status')}: ${task.status}`} position="right">
                      {task.status === 'Completed' ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <FaCheckCircle className="mr-1" />
                            {t('taskManagement.status.completed')}
                          </span>
                        </div>
                      ) : task.status === 'InProgress' ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            <FaSpinner className="mr-1 animate-spin" />
                            {t('taskManagement.status.inProgress')}
                          </span>
                        </div>
                      ) : task.status === 'Assigned' ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            <FaUser className="mr-1" />
                            {t('taskManagement.status.assigned')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            <FaClock className="mr-1" />
                            {t('taskManagement.status.pending')}
                          </span>
                        </div>
                      )}
                    </UITooltip>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <UITooltip
                      content={`${t('common.created')}: ${FORMAT_DATE_TIME(task.created_at)}`}
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
                      content={`${t('common.lastUpdated')}: ${FORMAT_DATE_TIME(task.updated_at)}`}
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
                      {t('dashboard.noRecentTasks')}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
          {/* Task Pagination Controls */}
          {dashboardData?.taskStats?.recentTasks && dashboardData.taskStats.recentTasks.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.pagination.showing')} {taskStartIndex + 1}-{Math.min(taskEndIndex, dashboardData.taskStats.recentTasks.length)} {t('common.pagination.of')} {dashboardData.taskStats.recentTasks.length} {t('common.pagination.items')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTaskPageChange(currentTaskPage - 1)}
                    disabled={currentTaskPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentTaskPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                  >
                    {t('common.pagination.previous')}
                  </button>
                  {[...Array(totalTaskPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleTaskPageChange(index + 1)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${currentTaskPage === index + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handleTaskPageChange(currentTaskPage + 1)}
                    disabled={currentTaskPage === totalTaskPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentTaskPage === totalTaskPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                  >
                    {t('common.pagination.next')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Feedbacks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaComments className="text-purple-500 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentFeedbacks')}
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaRegFileAlt className="text-gray-400" />
                    <span>{t('dashboard.task')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaComments className="text-gray-400" />
                    <span>{t('dashboard.comments')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaUser className="text-gray-400" />
                    <span>{t('dashboard.by')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaStar className="text-gray-400" />
                    <span>{t('dashboard.rating')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FaCalendarDay className="text-gray-400" />
                    <span>{t('common.createdDate')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isFeedbacksLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : isFeedbacksError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    {t('dashboard.feedbacksLoadError')}
                  </td>
                </tr>
              ) : currentFeedbacks.length > 0 ? (
                currentFeedbacks.map(renderFeedbackRow)
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t('dashboard.noFeedbacks')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {!isFeedbacksLoading && !isFeedbacksError && feedbacksData?.data && feedbacksData.data.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.pagination.showing')} {startIndex + 1}-{Math.min(endIndex, feedbacksData.data.length)} {t('common.pagination.of')} {feedbacksData.data.length} {t('common.pagination.items')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                  >
                    {t('common.pagination.previous')}
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === index + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                  >
                    {t('common.pagination.next')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Feedback Ratings Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaStar className="text-yellow-400 mr-2" />
          {t('dashboard.feedbackRatings')}
        </h2>
        <div className="h-auto">
          {isFeedbacksLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : isFeedbacksError ? (
            <div className="flex justify-center items-center h-32 text-red-500">
              {t('dashboard.feedbackDataLoadError')}
            </div>
          ) : feedbacksData?.data && feedbacksData.data.length > 0 ? (
            <div className="max-w-lg mx-auto space-y-3 py-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = feedbacksData.data.filter(feedback => feedback.rating === rating).length
                const percent = Math.round((count / feedbacksData.data.length) * 100) || 0

                return (
                  <div key={rating} className="flex items-center">
                    <div className="flex items-center mr-3 w-24">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`${i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                            } w-4 h-4`}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-3 rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: rating === 5 ? '#8B5CF6' :
                              rating === 4 ? '#A78BFA' :
                                rating === 3 ? '#C4B5FD' :
                                  rating === 2 ? '#DDD6FE' : '#EDE9FE'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-3 w-16 text-sm text-gray-600 dark:text-gray-300">
                      {count} ({percent}%)
                    </div>
                  </div>
                )
              })}
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {t('dashboard.totalFeedbacks')}: {feedbacksData.data.length} | {t('dashboard.average')}: {(feedbacksData.data.reduce((sum, item) => sum + item.rating, 0) / feedbacksData.data.length).toFixed(1)}
                <FaStar className="text-yellow-400 inline-block ml-1 mb-1" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 text-gray-500">
              {t('dashboard.noFeedbackData')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
