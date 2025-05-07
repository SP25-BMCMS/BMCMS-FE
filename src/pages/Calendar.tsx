import React, { useState, useEffect, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core'
import '../../src/styles/Calendar.css'
import schedulesApi, { PaginationResponse, Schedule } from '@/services/schedules'
import scheduleJobsApi from '@/services/scheduleJobs'
import { getBuildings } from '@/services/building'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import EventModal from '@/components/calendar/EventModal'
import { TaskEvent, ApiSchedule } from '@/types/calendar'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { Calendar as CalendarIcon, List, Eye, Clock } from 'lucide-react'
import { RiEditLine } from 'react-icons/ri'
import { format } from 'date-fns'
import { STATUS_COLORS } from '@/constants/colors'
import buildingDetailsApi, { BuildingDetail } from '@/services/buildingDetails'
import { getMaintenanceCycles } from '@/services/maintenanceCycle'
import apiInstance from '@/lib/axios'
import { MaintenanceCycle } from '@/types'
import BuildingDetailSelectionModal from '@/components/calendar/BuildingDetailSelectionModal'
import CreateAutoScheduleModal from '@/components/calendar/CreateAutoScheduleModal'
import { RiAddLine } from 'react-icons/ri'
import { useTranslation } from 'react-i18next'

const Calendar: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [events, setEvents] = useState<EventInput[]>([])
  const [selectedEvent, setSelectedEvent] = useState<TaskEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [showBuildingModal, setShowBuildingModal] = useState(false)
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([])
  const [selectedBuildingDetails, setSelectedBuildingDetails] = useState<string[]>([])
  const [initialFormData, setInitialFormData] = useState<Partial<TaskEvent>>({
    title: '',
    start: '',
    end: '',
    allDay: false,
    description: '',
    assignedTo: '',
    status: 'pending',
    priority: 'medium',
    location: '',
    buildingId: [],
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('table')
  const [deletedScheduleIds, setDeletedScheduleIds] = useState<{ [key: string]: number }>({})
  const deletionTimersRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({})
  const [buildingDetails, setBuildingDetails] = useState<BuildingDetail[]>([])
  const [showCreateAutoScheduleModal, setShowCreateAutoScheduleModal] = useState(false)
  const [isViewChanging, setIsViewChanging] = useState(false)

  // Fetch current user for manager ID
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiInstance.get(import.meta.env.VITE_CURRENT_USER_API)
      return response.data
    },
  })

  // Fetch buildings using React Query
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const response = await getBuildings()
      return response.data
    },
  })

  // Fetch building details for the current manager
  const { data: buildingDetailsData } = useQuery({
    queryKey: ['buildingDetails', currentUser?.userId],
    queryFn: async () => {
      if (!currentUser?.userId) return []
      const response = await buildingDetailsApi.getBuildingDetailsForManager(currentUser.userId)
      setBuildingDetails(response)
      return response
    },
    enabled: !!currentUser?.userId,
  })

  // Fetch maintenance cycles
  const { data: maintenanceCyclesData } = useQuery({
    queryKey: ['maintenanceCycles'],
    queryFn: async () => {
      const response = await getMaintenanceCycles({
        page: 1,
        limit: 99999,
      })
      return response.data || [] // Extract the data array from the response
    },
  })

  // Fetch schedules using React Query with pagination
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['schedules', { page, limit, viewMode }],
    queryFn: async () => {
      // For calendar view, fetch all schedules with high limit
      if (viewMode === 'calendar') {
        const response = await schedulesApi.getSchedules()
        return response
      }
      // For table view, respect pagination
      const response = await schedulesApi.getSchedules(page, limit)
      return response
    },
  })

  // Fetch schedule jobs for building count in table view
  const scheduleJobsQuery = useQuery({
    queryKey: ['scheduleJobs', 'allCounts', schedulesData?.data?.map(s => s.schedule_id)],
    queryFn: async () => {
      // Only fetch if we're in table view and have schedule data
      if (viewMode !== 'table' || !schedulesData?.data) return null

      // Create an object to store the counts for each schedule
      const buildingCountsBySchedule: { [scheduleId: string]: number } = {}

      // For each schedule, fetch the jobs to count buildings
      const promises = schedulesData.data.map(async schedule => {
        try {
          const response = await scheduleJobsApi.fetchScheduleJobsByScheduleId(
            schedule.schedule_id
          )
          // Count only non-cancelled jobs
          const activeJobs = response.data.filter(job => job.status.toLowerCase() !== 'cancel')
          // Use Set to count unique building details
          const uniqueBuildingDetailIds = new Set(activeJobs.map(job => job.buildingDetailId))
          buildingCountsBySchedule[schedule.schedule_id] = uniqueBuildingDetailIds.size
        } catch (error) {
          console.error(`Error fetching jobs for schedule ${schedule.schedule_id}:`, error)
          buildingCountsBySchedule[schedule.schedule_id] = 0
        }
      })

      await Promise.all(promises)
      return buildingCountsBySchedule
    },
    enabled: viewMode === 'table' && !!schedulesData?.data,
  })

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (newSchedule: Omit<ApiSchedule, 'schedule_id' | 'created_at' | 'updated_at'>) => {
      return schedulesApi.createSchedule(newSchedule as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast.success('Schedule created successfully')
      setIsModalOpen(false)
      setIsCreateMode(false)
    },
    onError: () => {
      toast.error('Failed to create schedule')
    },
  })

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiSchedule> }) => {
      return schedulesApi.updateSchedule(id, data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast.success(t('calendar.messages.updateSuccess'))
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error('Failed to update schedule')
    },
  })

  // Format date for the table view
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (error) {
      return dateString
    }
  }

  // Handle view schedule details from table
  const handleViewScheduleDetails = (schedule: any) => {
    // Navigate directly to schedule job detail page using the correct path
    navigate(`/schedule-job/${schedule.schedule_id}`)
  }

  // Add delete mutation with 5-minute delay
  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => {
      // Schedule the deletion after 5 minutes
      const deletionTime = Date.now() + 5 * 60 * 1000 // 5 minutes in milliseconds

      setDeletedScheduleIds(prev => ({
        ...prev,
        [id]: deletionTime,
      }))

      // Set a timer to remove the schedule from the view after 5 minutes
      if (deletionTimersRef.current[id]) {
        clearTimeout(deletionTimersRef.current[id])
      }

      deletionTimersRef.current[id] = setTimeout(
        () => {
          // This will trigger a refetch without the deleted item
          queryClient.invalidateQueries({ queryKey: ['schedules'] })

          // Remove from our tracking state
          setDeletedScheduleIds(prev => {
            const newState = { ...prev }
            delete newState[id]
            return newState
          })

          // Remove the timer reference
          delete deletionTimersRef.current[id]
        },
        5 * 60 * 1000
      ) // 5 minutes

      // Actually delete the schedule in the backend
      return schedulesApi.deleteSchedule(id)
    },
    onSuccess: (_, id) => {
      toast.success('Schedule marked as cancelled and will be removed in 5 minutes')

      // Update the local status to show it as cancelled immediately
      queryClient.setQueryData(['schedules'], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          data: oldData.data.map((schedule: any) =>
            schedule.schedule_id === id ? { ...schedule, schedule_status: 'Cancel' } : schedule
          ),
        }
      })

      setIsModalOpen(false)
    },
    onError: () => {
      toast.error('Failed to delete schedule')
    },
  })

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      Object.values(deletionTimersRef.current).forEach(timer => {
        clearTimeout(timer)
      })
    }
  }, [])

  // Update events when schedules change
  useEffect(() => {
    if (schedulesData?.data) {
      const calendarEvents = schedulesData.data
        .filter(schedule => {
          // If it's deleted and the deletion time has passed, filter it out
          if (deletedScheduleIds[schedule.schedule_id]) {
            const now = Date.now()
            return now < deletedScheduleIds[schedule.schedule_id]
          }
          return true
        })
        .map((schedule: any) => {
          // Get all buildingDetailIds from schedule_job entries that aren't cancelled
          const buildingDetailIds =
            schedule.schedule_job
              ?.filter(job => job.status !== 'Cancel')
              .map(job => job.buildingDetailId) || []

          // Determine the status color based on schedule_job status
          let backgroundColor = STATUS_COLORS.IN_PROGRESS.BORDER // Default blue
          const hasInProgress = schedule.schedule_status === 'InProgress'
          const hasCompleted = schedule.schedule_status === 'Completed'
          const hasCancel = schedule.schedule_status === 'Cancel'

          if (hasCancel) {
            backgroundColor = STATUS_COLORS.INACTIVE.BORDER // Red
          } else if (hasInProgress) {
            backgroundColor = STATUS_COLORS.IN_PROGRESS.BORDER // Blue
          } else if (hasCompleted) {
            backgroundColor = STATUS_COLORS.ACTIVE.BORDER // Green
          } else {
            backgroundColor = STATUS_COLORS.PENDING.BORDER // Yellow/Orange for pending
          }

          return {
            id: schedule.schedule_id,
            title: schedule.schedule_name,
            start: schedule.start_date,
            end: schedule.end_date,
            allDay: true,
            status: hasCancel
              ? 'cancel'
              : hasInProgress
                ? 'inprogress'
                : hasCompleted
                  ? 'completed'
                  : 'pending',
            description: schedule.description,
            buildingDetailIds: buildingDetailIds,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            textColor: '#ffffff',
          }
        })

      setEvents(calendarEvents)
    }
  }, [schedulesData, deletedScheduleIds])

  // Xử lý khi click vào sự kiện
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const event = clickInfo.event
      // Get schedule data from the original data source
      const scheduleData = schedulesData?.data?.find(schedule => schedule.schedule_id === event.id)

      setSelectedEvent({
        id: event.id,
        title: event.title,
        start: event.start || '',
        end: event.end || '',
        allDay: event.allDay,
        status: event.extendedProps.status,
        description: event.extendedProps.description,
        priority: event.extendedProps.priority,
        buildingDetailIds: event.extendedProps.buildingDetailIds || [],
        cycle_id: scheduleData?.cycle_id || '', // Add cycle_id from the original schedule data
        schedule_type: scheduleData?.schedule_type || 'Daily',
      })
      setIsCreateMode(false)
      setIsModalOpen(true)
    },
    [schedulesData]
  )

  // Xử lý khi chọn một ngày/khoảng thời gian trên lịch
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    // Kiểm tra xem ngày được chọn có phải là quá khứ không
    const selectedDate = new Date(selectInfo.start)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset time to start of day for comparison

    if (selectedDate < now) {
      toast.error('Cannot create events in the past')
      return
    }

    // Clear selected building details when creating a new schedule
    setSelectedBuildingDetails([])

    setInitialFormData({
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      status: 'pending',
      description: '',
      priority: 'medium',
      schedule_type: 'Daily',
    })

    setIsCreateMode(true)
    setIsModalOpen(true)
  }, [])

  // Xử lý lưu sự kiện mới
  const handleSaveEvent = useCallback(
    async (formData: any) => {
      const title = formData.title
      const description = formData.description
      const scheduleType = formData.schedule_type
      const startDate = formData.start_date
      const endDate = formData.end_date
      const cycleId = formData.cycle_id
      const buildingDetailIds = formData.buildingDetailIds

      if (!title.trim()) {
        toast.error(t('calendar.errors.noTitle'))
        return
      }

      if (!startDate) {
        toast.error(t('calendar.errors.noStartDate'))
        return
      }

      if (!endDate) {
        toast.error(t('calendar.errors.noEndDate'))
        return
      }

      if (buildingDetailIds.length === 0) {
        toast.error(t('calendar.errors.noBuilding'))
        return
      }

      if (!cycleId) {
        toast.error(t('calendar.errors.noCycle'))
        return
      }

      const now = new Date()
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)

      if (startDateObj < now) {
        toast.error(t('calendar.errors.pastDate'))
        return
      }

      if (endDateObj < startDateObj) {
        toast.error(t('calendar.errors.endBeforeStart'))
        return
      }

      // Create UTC dates without timezone adjustment
      const startDateUTC = new Date(
        Date.UTC(
          startDateObj.getFullYear(),
          startDateObj.getMonth(),
          startDateObj.getDate(),
          startDateObj.getHours(),
          startDateObj.getMinutes()
        )
      )

      const endDateUTC = new Date(
        Date.UTC(
          endDateObj.getFullYear(),
          endDateObj.getMonth(),
          endDateObj.getDate(),
          endDateObj.getHours(),
          endDateObj.getMinutes()
        )
      )

      // Format the data according to the API requirements
      const newSchedule = {
        schedule_name: title,
        description: description || '',
        start_date: startDateUTC.toISOString(),
        end_date: endDateUTC.toISOString(),
        cycle_id: cycleId,
        schedule_status: 'InProgress',
        buildingDetailIds: buildingDetailIds,
      }

      createScheduleMutation.mutate(newSchedule as any)
    },
    [createScheduleMutation, t]
  )

  // Hiển thị nội dung sự kiện tùy chỉnh
  const renderEventContent = useCallback(
    (eventContent: EventContentArg) => {
      // Get building detail IDs for this event
      const buildingDetailIds = eventContent.event.extendedProps.buildingDetailIds || []

      // Filter out duplicate building detail IDs
      const uniqueBuildingDetailIds = [...new Set(buildingDetailIds)]

      // Count unique building details
      const buildingCount = uniqueBuildingDetailIds.length

      return (
        <div className="fc-event-content flex flex-col p-1 max-h-full overflow-hidden">
          <div className="font-semibold text-white truncate">{eventContent.event.title}</div>
          {buildingCount > 0 && (
            <div className="text-xs text-white/70 mt-1 truncate">
              {buildingCount} {buildingCount === 1 ? 'Building' : 'Buildings'}
            </div>
          )}
          {eventContent.event.extendedProps.description && (
            <div
              className="text-xs italic mt-1 text-white/70 truncate"
              title={eventContent.event.extendedProps.description}
            >
              {eventContent.event.extendedProps.description}
            </div>
          )}
        </div>
      )
    },
    [buildingDetails]
  )

  // Xử lý đóng modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedEvent(null)
    setIsCreateMode(false)
  }, [])

  // Xử lý cập nhật sự kiện
  const handleUpdateEvent = useCallback(
    (formData: {
      title: string
      description: string
      schedule_type: string
      start_date: Date
      end_date: Date
      buildingDetailIds: string[]
      cycle_id: string
      schedule_status: 'Pending' | 'InProgress' | 'Completed' | 'Cancel'
    }) => {
      console.log('handleUpdateEvent called with:', formData)
      console.log('selectedEvent:', selectedEvent)

      if (!selectedEvent) {
        console.log('No selectedEvent, returning')
        return
      }

      // Convert local datetime to UTC for API
      const startDateObj = new Date(formData.start_date)
      const endDateObj = new Date(formData.end_date)

      // Create UTC dates without timezone adjustment
      const startDateUTC = new Date(
        Date.UTC(
          startDateObj.getFullYear(),
          startDateObj.getMonth(),
          startDateObj.getDate(),
          startDateObj.getHours(),
          startDateObj.getMinutes()
        )
      )

      const endDateUTC = new Date(
        Date.UTC(
          endDateObj.getFullYear(),
          endDateObj.getMonth(),
          endDateObj.getDate(),
          endDateObj.getHours(),
          endDateObj.getMinutes()
        )
      )

      // Format the data according to the API requirements
      const updateData = {
        schedule_name: formData.title,
        description: formData.description,
        start_date: startDateUTC.toISOString(),
        end_date: endDateUTC.toISOString(),
        cycle_id: formData.cycle_id,
        schedule_status: formData.schedule_status,
        buildingDetailIds: formData.buildingDetailIds,
      }

      console.log('Calling updateScheduleMutation with:', { id: selectedEvent.id, data: updateData })
      updateScheduleMutation.mutate({ id: selectedEvent.id, data: updateData as any })
    },
    [selectedEvent, updateScheduleMutation]
  )

  // Thêm hàm xử lý chuyển hướng đến trang ScheduleJob
  const handleViewScheduleJob = useCallback(() => {
    if (selectedEvent) {
      navigate(`/schedule-job/${selectedEvent.id}`)
    }
  }, [selectedEvent, navigate])

  // Xử lý chọn building
  const handleBuildingSelect = useCallback((buildingId: string) => {
    setSelectedBuildings(prev => {
      if (prev.includes(buildingId)) {
        return prev.filter(id => id !== buildingId)
      } else {
        return [...prev, buildingId]
      }
    })
  }, [])

  // Handle building detail selection
  const handleBuildingDetailSelect = useCallback((buildingDetailId: string) => {
    setSelectedBuildingDetails(prev => {
      if (prev.includes(buildingDetailId)) {
        return prev.filter(id => id !== buildingDetailId)
      } else {
        return [...prev, buildingDetailId]
      }
    })
  }, [])

  // Get filtered data for table view
  const getFilteredTableData = useCallback(() => {
    if (!schedulesData?.data) return []

    return schedulesData.data.filter(schedule => {
      // If it's deleted and the deletion time has passed, filter it out
      if (deletedScheduleIds[schedule.schedule_id]) {
        const now = Date.now()
        return now < deletedScheduleIds[schedule.schedule_id]
      }
      return true
    })
  }, [schedulesData, deletedScheduleIds])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // Get paginated data and pagination info from the API response
  const tableData = viewMode === 'table' ? getFilteredTableData() : []
  const paginationInfo = viewMode === 'table' && schedulesData ? schedulesData.pagination : null
  const totalPages = paginationInfo ? paginationInfo.totalPages : 1

  const handleCreateAutoSchedule = async (data: {
    schedule_name: string
    description: string
    cycle_id: string
    buildingDetailIds: string[]
    start_date: string
  }) => {
    try {
      const response = await apiInstance.post('/schedules/auto-maintenance', data)
      if (response.status === 200) {
        toast.success('Schedule created successfully')
        setShowCreateAutoScheduleModal(false)
        queryClient.invalidateQueries({ queryKey: ['schedules'] })
      }
    } catch (error) {
      toast.error('Failed to create schedule')
    }
  }

  // Add view change handler
  const handleViewChange = (newView: 'calendar' | 'table') => {
    setIsViewChanging(true)
    setViewMode(newView)
    // Add a small delay to show loading state
    setTimeout(() => {
      setIsViewChanging(false)
    }, 500)
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('calendar.title')}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('calendar.statusLabels.inProgress')}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('calendar.statusLabels.completed')}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('calendar.statusLabels.cancel')}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('calendar.statusLabels.pending')}</span>
            </div>
          </div>

          <div className="flex rounded-md shadow-sm overflow-hidden">
            <button
              onClick={() => handleViewChange('table')}
              className={`px-4 py-2 flex items-center gap-2 transition-colors ${viewMode === 'table'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              <List size={16} />
              <span>{t('calendar.viewMode.table')}</span>
            </button>
            <button
              onClick={() => handleViewChange('calendar')}
              className={`px-4 py-2 flex items-center gap-2 transition-colors ${viewMode === 'calendar'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              <CalendarIcon size={16} />
              <span>{t('calendar.viewMode.calendar')}</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateAutoScheduleModal(true)}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <RiAddLine className="w-5 h-5" />
            <span>{t('calendar.buttons.create')}</span>
          </button>
        </div>
      </div>

      {isViewChanging ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">{t('calendar.loading')}</span>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="calendar-container custom-calendar-view">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            weekends={true}
            events={events}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            select={handleDateSelect}
            height="auto"
            locale="vi"
            buttonText={{
              today: t('calendar.buttons.today'),
              month: t('calendar.buttons.month'),
              week: t('calendar.buttons.week'),
              day: t('calendar.buttons.day'),
              prev: t('calendar.buttons.prev'),
              next: t('calendar.buttons.next')
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
            eventClassNames={arg => {
              return [`${arg.event.extendedProps.status || 'default'}`]
            }}
            eventMaxStack={3}
            eventMinHeight={25}
            eventShortHeight={25}
            eventDisplay="block"
            displayEventEnd={true}
            eventDidMount={info => {
              const tooltip = document.createElement('div')
              tooltip.className = 'fc-tooltip'
              tooltip.innerHTML = `
                <div class="font-semibold">${info.event.title}</div>
                ${info.event.extendedProps.description ? `<div>${info.event.extendedProps.description}</div>` : ''}
              `
              info.el.appendChild(tooltip)
            }}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {isLoading || scheduleJobsQuery.isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">{t('calendar.loading')}</span>
            </div>
          ) : (
            <>
              <Table
                data={tableData}
                columns={[
                  {
                    key: 'schedule_name',
                    title: t('calendar.table.scheduleName'),
                    className: 'font-medium',
                  },
                  {
                    key: 'start_date',
                    title: t('calendar.table.startDate'),
                    render: item => (
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1 text-gray-500" />
                        {formatDate(item.start_date)}
                      </div>
                    ),
                  },
                  {
                    key: 'end_date',
                    title: t('calendar.table.endDate'),
                    render: item => (
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1 text-gray-500" />
                        {formatDate(item.end_date)}
                      </div>
                    ),
                  },
                  {
                    key: 'schedule_status',
                    title: t('calendar.table.status'),
                    render: (item: any) => {
                      let statusStyles = {}
                      let statusKey = ''

                      if (item.schedule_status === 'InProgress') {
                        statusStyles = {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#3B82F6',
                          border: '1px solid #3B82F6',
                        }
                        statusKey = 'inProgress'
                      } else if (item.schedule_status === 'Completed') {
                        statusStyles = {
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: '#22C55E',
                          border: '1px solid #22C55E',
                        }
                        statusKey = 'completed'
                      } else if (item.schedule_status === 'Cancel') {
                        statusStyles = {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                        }
                        statusKey = 'cancel'
                      } else {
                        statusStyles = {
                          backgroundColor: 'rgba(234, 179, 8, 0.1)',
                          color: '#EAB308',
                          border: '1px solid #EAB308',
                        }
                        statusKey = 'pending'
                      }

                      return (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={statusStyles}
                        >
                          {t(`calendar.statusLabels.${statusKey}`)}
                        </span>
                      )
                    },
                  },
                  {
                    key: 'buildings',
                    title: t('calendar.table.buildings'),
                    render: item => {
                      const buildingCounts = scheduleJobsQuery.data || {}
                      const buildingCount = buildingCounts[item.schedule_id] || 0

                      return (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {buildingCount} {buildingCount === 1 ? t('calendar.buildings.building') : t('calendar.buildings.building')}
                        </span>
                      )
                    },
                  },
                  {
                    key: 'actions',
                    title: t('calendar.table.actions'),
                    render: item => (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            navigate(`/schedule-job/${item.schedule_id}`)
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group relative"
                          title={t('calendar.tooltips.viewDetails')}
                        >
                          <Eye size={18} />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {t('calendar.tooltips.viewDetails')}
                          </span>
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedEvent({
                              id: item.schedule_id,
                              title: item.schedule_name,
                              start: item.start_date,
                              end: item.end_date,
                              allDay: true,
                              status: item.schedule_status.toLowerCase(),
                              description: item.description,
                              buildingDetailIds: item.buildingDetailIds || [],
                              cycle_id: item.cycle_id || '',
                              schedule_type: item.schedule_type || 'Daily',
                            })
                            setIsCreateMode(false)
                            setIsModalOpen(true)
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group relative"
                          title={t('calendar.tooltips.edit')}
                        >
                          <RiEditLine className="w-5 h-5" />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {t('calendar.tooltips.edit')}
                          </span>
                        </button>
                      </div>
                    ),
                  },
                ]}
                keyExtractor={item => item.schedule_id}
                className="mt-0"
                headerClassName="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400"
                tableClassName="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
              />
              {paginationInfo && (
                <div className="p-4">
                  <Pagination
                    currentPage={page}
                    totalPages={paginationInfo.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={paginationInfo.total}
                    itemsPerPage={limit}
                    onLimitChange={newLimit => {
                      setLimit(newLimit)
                      setPage(1)
                    }}
                    limitOptions={[5, 10, 20, 50]}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <style>
        {`
          .fc-event {
            margin: 1px 0;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 0.875rem;
            line-height: 1.25rem;
            overflow: hidden;
            transition: all 0.2s ease;
          }

          .fc-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .fc-event-content {
            min-height: 24px;
          }

          .fc-tooltip {
            display: none;
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 0.875rem;
            max-width: 200px;
            white-space: normal;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .dark .fc-tooltip {
            background: rgba(30, 41, 59, 0.95);
            color: #e5e7eb;
          }

          .fc-event:hover .fc-tooltip {
            display: block;
          }

          .fc-daygrid-event {
            white-space: normal;
            align-items: flex-start;
          }

          .fc-daygrid-day-events {
            margin-top: 1px;
          }

          .fc-daygrid-more-link {
            margin-top: 2px;
            font-size: 0.75rem;
            color: #3B82F6;
          }
          
          /* Fix dark mode issues */
          .dark .fc-toolbar-title {
            color: #e5e7eb !important;
          }
          
          .dark .fc-col-header-cell-cushion {
            color: #e5e7eb !important;
          }
          
          .dark .fc-daygrid-day-number {
            color: #e5e7eb !important;
          }
          
          .dark .fc-day-today {
            background-color: rgba(59, 130, 246, 0.1) !important;
          }

          /* Navigation buttons (prev, next) - remove background */
          .fc-prev-button, .fc-next-button {
            background: transparent !important;
            border: 1px solid #d1d5db !important;
            color: #4b5563 !important;
            transition: all 0.2s ease !important;
          }

          .fc-prev-button:hover, .fc-next-button:hover {
            background-color: rgba(243, 244, 246, 0.1) !important;
          }

          .dark .fc-prev-button, .dark .fc-next-button {
            background: transparent !important;
            border: 1px solid #4b5563 !important;
            color: #e5e7eb !important;
          }

          .dark .fc-prev-button:hover, .dark .fc-next-button:hover {
            background-color: rgba(75, 85, 99, 0.2) !important;
          }
          
          .dark .fc-button {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
            color: #e5e7eb !important;
          }
          
          .dark .fc-button:hover {
            background-color: #4b5563 !important;
          }
          
          .dark .fc-daygrid-day.fc-day-other {
            background-color: #1a202c !important;
          }
          
          .dark .fc-theme-standard td,
          .dark .fc-theme-standard th,
          .dark .fc-theme-standard .fc-scrollgrid {
            border-color: #374151 !important;
          }
          
          .dark .fc-theme-standard .fc-scrollgrid-section-header th {
            background-color: #1F2937 !important;
          }
          
          .dark .fc-theme-standard .fc-scrollgrid-section > * {
            border-color: #374151 !important;
          }
          
          .dark .fc-daygrid-more-link {
            color: #60a5fa !important;
          }
          
          .dark .fc .fc-timegrid-slot-label-cushion,
          .dark .fc .fc-timegrid-axis-cushion {
            color: #e5e7eb !important;
          }
          
          .dark .fc .fc-list-sticky .fc-list-day > * {
            background-color: #1F2937 !important;
            color: #e5e7eb !important;
          }

          .dark .fc .fc-cell-shaded, 
          .dark .fc .fc-day-disabled {
            background-color: #1a202c !important;
          }
        `}
      </style>

      <EventModal
        isOpen={isModalOpen}
        isCreateMode={isCreateMode}
        selectedEvent={selectedEvent}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onUpdate={handleUpdateEvent}
        onDelete={deleteScheduleMutation.mutate}
        onViewScheduleJob={handleViewScheduleJob}
        initialFormData={initialFormData}
        buildings={buildings}
        buildingDetails={buildingDetails}
        selectedBuildingDetails={selectedBuildingDetails}
        onBuildingDetailSelect={handleBuildingDetailSelect}
        onSetSelectedBuildingDetails={setSelectedBuildingDetails}
        maintenanceCycles={maintenanceCyclesData || []}
        onUpdateStatus={(id, status) =>
          updateScheduleMutation.mutate({ id, data: { status } as any })
        }
      />

      <BuildingDetailSelectionModal
        isOpen={showBuildingModal}
        onClose={() => setShowBuildingModal(false)}
        buildingDetails={buildingDetails}
        selectedBuildingDetails={selectedBuildingDetails}
        onBuildingDetailSelect={handleBuildingDetailSelect}
        selectedEvent={selectedEvent}
      />

      <CreateAutoScheduleModal
        isOpen={showCreateAutoScheduleModal}
        onClose={() => setShowCreateAutoScheduleModal(false)}
        buildingDetails={buildingDetails}
        onSubmit={handleCreateAutoSchedule}
      />
    </div>
  )
}

export default Calendar
