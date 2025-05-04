import TaskModal from '@/components/calendar/TaskModal'
import CreateScheduleJobModal from '@/components/calendar/CreateScheduleJobModal'
import UpdateStatusModal from '@/components/calendar/UpdateStatusModal'
import Pagination from '@/components/Pagination'
import scheduleJobsApi, {
  type ScheduleJob,
  UpdateScheduleJobRequest,
  useSendMaintenanceEmail,
  CreateScheduleJobRequest,
} from '@/services/scheduleJobs'
import schedulesApi, { Schedule as ScheduleType } from '@/services/schedules'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
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
  RiAddLine,
  RiSettings3Line,
} from 'react-icons/ri'
import { useNavigate, useParams } from 'react-router-dom'
import { STATUS_COLORS } from '@/constants/colors'
import { getMaintenanceCycles } from '@/services/maintenanceCycle'
import { createPortal } from 'react-dom'
import ConfirmModal from '@/components/ConfirmModal'
import apiInstance from '@/lib/axios'
import { useTranslation } from 'react-i18next'

const ScheduleJob: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<ScheduleJob | null>(null)
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const { t } = useTranslation()

  // Fetch schedule details
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => schedulesApi.getScheduleById(scheduleId!),
    enabled: !!scheduleId,
    select: response => response.data as ScheduleType & { schedule_type?: string },
  })

  // Fetch cycle details
  const { data: cycleData } = useQuery({
    queryKey: ['cycle', schedule?.cycle_id],
    queryFn: () => getMaintenanceCycles(),
    enabled: !!schedule?.cycle_id,
    select: response => response.data.find(cycle => cycle.cycle_id === schedule?.cycle_id),
  })

  // Fetch schedule jobs with pagination
  const {
    data: scheduleJobsData,
    isLoading: isJobsLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['scheduleJobs', scheduleId, currentPage, itemsPerPage],
    queryFn: () =>
      scheduleJobsApi.fetchScheduleJobsByScheduleId(scheduleId!, {
        page: currentPage,
        limit: itemsPerPage,
      }),
    enabled: !!scheduleId,
  })

  // Fetch staff leaders for the schedule job
  const { data: staffLeaders } = useQuery({
    queryKey: ['staff-leaders', scheduleId],
    queryFn: async () => {
      if (!scheduleId) {
        throw new Error('Schedule ID is required')
      }
      const response = await apiInstance.get(
        `${import.meta.env.VITE_GET_STAFF_LEADERS_BY_SCHEDULE_JOB.replace(
          '{scheduleJobId}',
          scheduleId
        )}`
      )
      return response.data
    },
    enabled: !!scheduleId,
  })

  // Create schedule job mutation
  const createJobMutation = useMutation({
    mutationFn: (data: CreateScheduleJobRequest) => scheduleJobsApi.createScheduleJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] })
      toast.success(t('maintenanceCycle.success.create'))
      setShowCreateJobModal(false)
      refetchJobs()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create schedule job')
    },
  })

  // Update schedule job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: UpdateScheduleJobRequest }) =>
      scheduleJobsApi.updateScheduleJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleJobs'] })
      toast.success(t('maintenanceCycle.success.update'))
      setShowUpdateStatusModal(false)
      setSelectedJob(null)
      refetchJobs()
    },
    onError: () => {
      toast.error('Failed to update schedule job')
    },
  })

  // Send maintenance email mutation
  const sendEmailMutation = useSendMaintenanceEmail()

  const handleCreateJob = async (data: CreateScheduleJobRequest) => {
    try {
      await createJobMutation.mutateAsync(data)
    } catch (error) {
      console.error('Error creating schedule job:', error)
    }
  }

  const handleEditJob = (job: ScheduleJob) => {
    setSelectedJob(job)
    setShowUpdateStatusModal(true)
  }

  const handleUpdateStatus = async (
    jobId: string,
    status: 'Pending' | 'InProgress' | 'Completed' | 'Cancel'
  ) => {
    try {
      await updateJobMutation.mutateAsync({
        jobId,
        data: { status },
      })
    } catch (error) {
      console.error('Error updating schedule job:', error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    setSelectedJob(scheduleJobsData?.data.find(job => job.schedule_job_id === jobId) || null)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedJob) {
      try {
        await updateJobMutation.mutateAsync({
          jobId: selectedJob.schedule_job_id,
          data: { status: 'Cancel' },
        })
        toast.success(t('maintenanceCycle.success.cancel'))
        setShowDeleteConfirm(false)
        setSelectedJob(null)
      } catch (error) {
        console.error('Error cancelling schedule job:', error)
      }
    }
  }

  const handleSendEmail = async (jobId: string) => {
    setSelectedJob(scheduleJobsData?.data.find(job => job.schedule_job_id === jobId) || null)
    setShowEmailConfirm(true)
  }

  const handleConfirmSendEmail = async () => {
    if (selectedJob) {
      try {
        await sendEmailMutation.mutateAsync(selectedJob.schedule_job_id)
        toast.success(t('maintenanceCycle.success.sendEmail'))
        setShowEmailConfirm(false)
        setSelectedJob(null)
        refetchJobs()
      } catch (error) {
        toast.error('Failed to send maintenance email')
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          className:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-300',
          icon: <RiAlertLine className="mr-1" />,
          text: t(`scheduleDetail.ScheduleJob.status.${status.toLowerCase()}`)
        }
      case 'inprogress':
        return {
          className:
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300',
          icon: <RiTimeLine className="mr-1" />,
          text: t(`scheduleDetail.ScheduleJob.status.${status.toLowerCase()}`)
        }
      case 'completed':
        return {
          className:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-300',
          icon: <RiCheckboxCircleLine className="mr-1" />,
          text: t(`scheduleDetail.ScheduleJob.status.${status.toLowerCase()}`)
        }
      case 'cancel':
        return {
          className:
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-300',
          icon: <RiCloseCircleLine className="mr-1" />,
          text: t(`scheduleDetail.ScheduleJob.status.${status.toLowerCase()}`)
        }
      default:
        return {
          className:
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300',
          icon: <RiInformationLine className="mr-1" />,
          text: status
        }
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit)
    setCurrentPage(1)
  }

  const handleReturn = () => {
    navigate('/calendar')
  }

  const handleCreateTask = (job: ScheduleJob) => {
    setSelectedJob(job)
    setShowTaskModal(true)
  }

  const handleOpenCreateJobModal = () => {
    setShowCreateJobModal(true)
  }

  // Toggle device details visibility
  const toggleDeviceDetails = (deviceId: string) => {
    if (expandedDeviceId === deviceId) {
      setExpandedDeviceId(null)
    } else {
      setExpandedDeviceId(deviceId)
    }
  }

  const handleDeviceHover = (event: React.MouseEvent, device: any) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltipPosition({ x: rect.left, y: rect.top })
    setCurrentDevice(device)
    setShowTooltip(true)
  }

  const handleDeviceLeave = () => {
    setShowTooltip(false)
    setCurrentDevice(null)
  }

  if (isScheduleLoading || isJobsLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-300">{t('scheduleDetail.ScheduleJob.loading')}</p>
      </div>
    )
  }

  const scheduleJobs = scheduleJobsData?.data || []
  const totalItems = scheduleJobsData?.pagination.total || 0
  const totalPages = scheduleJobsData?.pagination.totalPages || 1

  // Get status for schedule and display appropriate color/icon
  const scheduleStatus = schedule?.schedule_status || 'Pending'
  const statusInfo = getStatusBadge(scheduleStatus)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={handleReturn}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-6"
        >
          <RiArrowLeftLine className="mr-2" />
          <span>{t('scheduleDetail.ScheduleJob.backToCalendar')}</span>
        </button>

        {schedule && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Header Banner with Status */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 px-6 py-4 border-b border-blue-700">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">{schedule.schedule_name}</h1>
                <div
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${statusInfo.className}`}
                >
                  {statusInfo.icon} {statusInfo.text}
                </div>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                {/* Left Column - Schedule Information */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <RiCalendarCheckLine className="mr-2 text-blue-500" />
                      <span>
                        {t('scheduleDetail.ScheduleJob.schedulePeriod', {
                          start: formatDate(schedule.start_date),
                          end: formatDate(schedule.end_date)
                        })}
                      </span>
                    </div>
                    {schedule.schedule_type && (
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
                      {t('scheduleDetail.ScheduleJob.description')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      {schedule.description || t('scheduleDetail.ScheduleJob.noDescription')}
                    </p>
                  </div>
                </div>

                {/* Right Column - Schedule Statistics */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t('scheduleDetail.ScheduleJob.scheduleOverview')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">{t('scheduleDetail.ScheduleJob.maintenanceCycle')}:</div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {cycleData ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <RiSettings3Line className="mr-2 text-blue-500" />
                            {t(`maintenanceCycle.filterOptions.deviceType.${cycleData.device_type}`)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                            {t(`maintenanceCycle.filterOptions.frequency.${cycleData.frequency}`)} ({t(`maintenanceCycle.filterOptions.basis.${cycleData.basis}`)})
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </div>

                    <div className="text-gray-500 dark:text-gray-400">{t('scheduleDetail.ScheduleJob.totalJobs')}:</div>
                    <div className="text-gray-700 dark:text-gray-300">{totalItems}</div>

                    <div className="text-gray-500 dark:text-gray-400">{t('scheduleDetail.ScheduleJob.created')}:</div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {formatDate(schedule.created_at)}
                    </div>

                    <div className="text-gray-500 dark:text-gray-400">{t('scheduleDetail.ScheduleJob.lastUpdated')}:</div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {formatDate(schedule.updated_at)}
                    </div>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('scheduleDetail.ScheduleJob.maintenanceJobs')}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
                {t('scheduleDetail.ScheduleJob.showingJobs', { count: scheduleJobs.length, total: totalItems })}
              </div>
              <button
                onClick={handleOpenCreateJobModal}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
              >
                <RiAddLine className="w-4 h-4" />
                <span>{t('scheduleDetail.ScheduleJob.newJob')}</span>
              </button>
            </div>
          </div>
        </div>

        {scheduleJobs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="text-blue-500 w-16 h-16 mb-4">
                <RiInformationLine className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('scheduleDetail.ScheduleJob.noJobsFound')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                {t('scheduleDetail.ScheduleJob.noJobsDescription')}
              </p>
              <button
                onClick={handleOpenCreateJobModal}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <RiAddLine className="w-5 h-5" />
                <span>{t('scheduleDetail.ScheduleJob.createFirstJob')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('scheduleDetail.ScheduleJob.locationDetails')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('scheduleDetail.ScheduleJob.equipment')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('scheduleDetail.ScheduleJob.status.title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('scheduleDetail.ScheduleJob.schedule')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('scheduleDetail.ScheduleJob.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {scheduleJobs.map(job => {
                  const statusInfo = getStatusBadge(job.status)
                  return (
                    <tr
                      key={job.schedule_job_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-500 rounded-lg">
                            <RiBuilding2Line className="w-5 h-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {job.buildingDetail?.building?.name} - {job.buildingDetail?.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {job.buildingDetail?.building?.area?.name}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {job.buildingDetail?.total_apartments} {t('common.apartments')} •{' '}
                              {job.buildingDetail?.building?.numberFloor} {t('common.floors')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 overflow-visible">
                        {job.buildingDetail?.device && job.buildingDetail.device.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {(() => {
                              const matchingDevices = job.buildingDetail.device.filter(
                                device => device.type === cycleData?.device_type
                              )
                              if (matchingDevices.length === 0) {
                                return (
                                  <div className="relative">
                                    <button className="text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/30 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-full transition-colors flex items-center">
                                      {t('common.other')}
                                    </button>
                                  </div>
                                )
                              }
                              return (
                                <>
                                  {matchingDevices.slice(0, 2).map(device => (
                                    <div key={device.device_id} className="relative">
                                      <button
                                        onClick={() => toggleDeviceDetails(device.device_id)}
                                        onMouseEnter={e => handleDeviceHover(e, device)}
                                        onMouseLeave={handleDeviceLeave}
                                        className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-full transition-colors flex items-center"
                                      >
                                        {device.name}
                                      </button>
                                    </div>
                                  ))}
                                  {matchingDevices.length > 2 && (
                                    <div className="text-xs text-gray-500">
                                      {t('scheduleDetail.ScheduleJob.moreDevices', { count: matchingDevices.length - 2 })}
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">
                            {t('scheduleDetail.ScheduleJob.noEquipment')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${statusInfo.className}`}
                        >
                          {statusInfo.icon} {statusInfo.text}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('scheduleDetail.ScheduleJob.updated', { date: formatDate(job.updated_at) })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {t('scheduleDetail.ScheduleJob.runDate', { date: formatDate(job.run_date) })}
                        </div>
                        {job.start_date && job.end_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            {t('scheduleDetail.ScheduleJob.period', {
                              start: formatDate(job.start_date),
                              end: formatDate(job.end_date)
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {job.status.toLowerCase() !== 'cancel' &&
                            job.status.toLowerCase() !== 'completed' && (
                              <>
                                <button
                                  onClick={() => handleEditJob(job)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                  title={t('scheduleDetail.ScheduleJob.tooltips.updateStatus')}
                                >
                                  <RiEditLine className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteJob(job.schedule_job_id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title={t('scheduleDetail.ScheduleJob.tooltips.cancelJob')}
                                >
                                  <RiDeleteBinLine className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleSendEmail(job.schedule_job_id)}
                                  disabled={sendEmailMutation.isPending}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={t('scheduleDetail.ScheduleJob.tooltips.sendEmail')}
                                >
                                  <RiMailLine className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleCreateTask(job)}
                                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                                  title={t('scheduleDetail.ScheduleJob.tooltips.createTask')}
                                >
                                  <RiTaskLine className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          {job.status.toLowerCase() === 'cancel' && (
                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">
                              {t('scheduleDetail.ScheduleJob.cancelled')}
                            </span>
                          )}
                          {job.status.toLowerCase() === 'completed' && (
                            <span className="text-green-600 dark:text-green-400 text-xs italic flex items-center">
                              <RiCheckboxCircleLine className="w-4 h-4 mr-1" /> {t('scheduleDetail.ScheduleJob.completed')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
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

      {/* Modals */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setSelectedJob(null)
        }}
        scheduleJob={selectedJob}
      />

      <CreateScheduleJobModal
        isOpen={showCreateJobModal}
        onClose={() => setShowCreateJobModal(false)}
        scheduleId={scheduleId}
      />

      <UpdateStatusModal
        isOpen={showUpdateStatusModal}
        onClose={() => {
          setShowUpdateStatusModal(false)
          setSelectedJob(null)
        }}
        job={selectedJob}
        onUpdateStatus={handleUpdateStatus}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('calendar.confirmModal.cancelJob.title')}
        message={t('calendar.confirmModal.cancelJob.message')}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setSelectedJob(null)
        }}
      />

      <ConfirmModal
        isOpen={showEmailConfirm}
        title={t('calendar.confirmModal.sendEmail.title')}
        message={t('calendar.confirmModal.sendEmail.message')}
        onConfirm={handleConfirmSendEmail}
        onCancel={() => {
          setShowEmailConfirm(false)
          setSelectedJob(null)
        }}
        confirmText={t('calendar.confirmModal.sendEmail.confirm')}
        cancelText={t('calendar.confirmModal.sendEmail.cancel')}
        confirmButtonClassName="bg-blue-600 hover:bg-blue-700 text-white"
      />

      {showTooltip &&
        currentDevice &&
        createPortal(
          <div
            className="fixed z-[100] bg-white dark:bg-gray-800 rounded-md shadow-lg p-3 min-w-[200px] max-w-[300px] text-xs border border-gray-200 dark:border-gray-700 max-h-[200px] overflow-y-auto"
            style={{
              top: `${tooltipPosition.y}px`,
              left: `${tooltipPosition.x}px`,
              transform: 'translateY(-100%)',
            }}
          >
            <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
              {currentDevice.name}
            </h4>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">{t('common.type')}:</span> {currentDevice.type}
              </p>
              <p>
                <span className="font-medium">{t('common.manufacturer')}:</span> {currentDevice.manufacturer}
              </p>
              <p>
                <span className="font-medium">{t('common.model')}:</span> {currentDevice.model}
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default ScheduleJob
