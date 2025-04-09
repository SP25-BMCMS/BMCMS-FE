import React, { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core'
import '../../src/styles/Calendar.css'
import schedulesApi from '@/services/schedules'
import { getBuildings } from '@/services/building'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import EventModal from '@/components/calendar/EventModal'
import BuildingSelectionModal from '@/components/calendar/BuildingSelectionModal'
import { TaskEvent, ApiSchedule } from '@/types/calendar'

const Calendar: React.FC = () => {
  const queryClient = useQueryClient()
  const [events, setEvents] = useState<EventInput[]>([])
  const [selectedEvent, setSelectedEvent] = useState<TaskEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [showBuildingModal, setShowBuildingModal] = useState(false)
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([])
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
    schedule_type: 'Daily',
    buildingId: []
  })
  const navigate = useNavigate()

  // Fetch buildings using React Query
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const response = await getBuildings()
      return response.data
    }
  })

  // Fetch schedules using React Query
  const { data: schedulesData } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await schedulesApi.getSchedules()
      return response.data
    }
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
    }
  })

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiSchedule> }) => {
      return schedulesApi.updateSchedule(id, data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast.success('Schedule updated successfully')
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error('Failed to update schedule')
    }
  })

  // Add delete mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => {
      return schedulesApi.deleteSchedule(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast.success('Schedule deleted successfully')
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error('Failed to delete schedule')
    }
  })

  // Update events when schedules change
  useEffect(() => {
    if (schedulesData) {
      const calendarEvents = (schedulesData as any[]).map((schedule: ApiSchedule) => {
        const buildingIds = schedule.schedule_job
          ?.filter(job => job.status !== "Cancel")
          .map(job => job.building_id) || []

        // Determine the status color based on schedule_job status
        let backgroundColor = '#3b82f6' // Default blue
        const hasInProgress = schedule.schedule_status === "InProgress"
        const hasCompleted = schedule.schedule_status === "Completed"
        const hasCancel = schedule.schedule_status === "Cancel"

        if (hasCancel) {
          backgroundColor = '#ef4444' // Red
        } else if (hasInProgress) {
          backgroundColor = '#f97316' // Orange
        } else if (hasCompleted) {
          backgroundColor = '#22c55e' // Green
        }

        return {
          id: schedule.schedule_id,
          title: schedule.schedule_name,
          start: schedule.start_date,
          end: schedule.end_date,
          allDay: true,
          status: hasCancel ? 'cancel' : hasInProgress ? 'inprogress' : hasCompleted ? 'completed' : 'pending',
          description: schedule.description,
          schedule_type: schedule.schedule_type,
          buildingId: buildingIds,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor,
          textColor: '#ffffff'
        }
      })

      // Log the events being set
      console.log('Setting calendar events:', calendarEvents)

      setEvents(calendarEvents)
    }
  }, [schedulesData])

  // Xử lý khi click vào sự kiện
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start || '',
      end: event.end || '',
      allDay: event.allDay,
      status: event.extendedProps.status,
      description: event.extendedProps.description,
      priority: event.extendedProps.priority,
      schedule_type: event.extendedProps.schedule_type,
      buildingId: event.extendedProps.buildingId || []
    })
    setIsCreateMode(false)
    setIsModalOpen(true)
  }, [])

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

    setInitialFormData({
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      status: 'pending',
      description: '',
      priority: 'medium',
      schedule_type: 'Daily'
    })

    setIsCreateMode(true)
    setIsModalOpen(true)
  }, [])

  // Xử lý lưu sự kiện mới
  const handleSaveEvent = useCallback(async (formData: any) => {
    const title = formData.title
    const description = formData.description
    const scheduleType = formData.schedule_type
    const startDate = formData.start_date
    const endDate = formData.end_date

    if (!title.trim()) {
      toast.error('Please enter event title')
      return
    }

    if (!startDate) {
      toast.error('Please select start time')
      return
    }

    if (!endDate) {
      toast.error('Please select end time')
      return
    }

    const now = new Date()
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    if (startDateObj < now) {
      toast.error('Start time cannot be in the past')
      return
    }

    if (endDateObj < startDateObj) {
      toast.error('End time must be after start time')
      return
    }

    // Create UTC dates without timezone adjustment
    const startDateUTC = new Date(Date.UTC(
      startDateObj.getFullYear(),
      startDateObj.getMonth(),
      startDateObj.getDate(),
      startDateObj.getHours(),
      startDateObj.getMinutes()
    ))

    const endDateUTC = new Date(Date.UTC(
      endDateObj.getFullYear(),
      endDateObj.getMonth(),
      endDateObj.getDate(),
      endDateObj.getHours(),
      endDateObj.getMinutes()
    ))

    // Create schedule jobs with proper structure
    const scheduleJobs = selectedBuildings.map(buildingId => ({
      building_id: buildingId,
      status: "Pending",
      schedule_job_id: "", // Will be set by backend
      schedule_id: "", // Will be set by backend
      run_date: startDateUTC.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const newSchedule: Omit<ApiSchedule, 'schedule_id' | 'created_at' | 'updated_at'> = {
      schedule_name: title,
      schedule_type: scheduleType || 'Daily',
      description: description || '',
      start_date: startDateUTC.toISOString(),
      end_date: endDateUTC.toISOString(),
      buildingId: selectedBuildings,
    }

    createScheduleMutation.mutate(newSchedule)
  }, [createScheduleMutation, selectedBuildings])

  // Hiển thị nội dung sự kiện tùy chỉnh
  const renderEventContent = useCallback((eventContent: EventContentArg) => {
    // Get building names for this event
    const buildingIds = eventContent.event.extendedProps.buildingId || []

    // Lọc ra các building ID duy nhất
    const uniqueBuildingIds = [...new Set(buildingIds)] as string[]

    const buildingNames = uniqueBuildingIds.map((id) => {
      const building = buildings.find(b => b.buildingId === id)
      return building ? building.name : 'Unknown Building'
    }).join(', ')

    return (
      <div className="fc-event-content flex flex-col p-1 max-h-full overflow-hidden">
        <div className="font-semibold text-white truncate">{eventContent.event.title}</div>
        {eventContent.event.extendedProps.schedule_type && (
          <div className="text-xs text-white/80 truncate">{eventContent.event.extendedProps.schedule_type}</div>
        )}
        {buildingNames && (
          <div className="text-xs text-white/70 mt-1 truncate" title={buildingNames}>
            Buildings: {buildingNames}
          </div>
        )}
        {eventContent.event.extendedProps.description && (
          <div className="text-xs italic mt-1 text-white/70 truncate" title={eventContent.event.extendedProps.description}>
            {eventContent.event.extendedProps.description}
          </div>
        )}
      </div>
    )
  }, [buildings])

  // Xử lý đóng modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedEvent(null)
    setIsCreateMode(false)
  }, [])

  // Xử lý cập nhật sự kiện
  const handleUpdateEvent = useCallback((formData: {
    title: string
    description: string
    schedule_type: string
    start_date: Date
    end_date: Date
    buildingId: string[]
  }) => {
    if (!selectedEvent) return

    // Convert local datetime to UTC for API
    const startDateObj = new Date(formData.start_date)
    const endDateObj = new Date(formData.end_date)

    // Create UTC dates without timezone adjustment
    const startDateUTC = new Date(Date.UTC(
      startDateObj.getFullYear(),
      startDateObj.getMonth(),
      startDateObj.getDate(),
      startDateObj.getHours(),
      startDateObj.getMinutes()
    ))

    const endDateUTC = new Date(Date.UTC(
      endDateObj.getFullYear(),
      endDateObj.getMonth(),
      endDateObj.getDate(),
      endDateObj.getHours(),
      endDateObj.getMinutes()
    ))

    // Create schedule jobs with proper structure
    const scheduleJobs = selectedBuildings.length > 0
      ? selectedBuildings.map(buildingId => ({
        building_id: buildingId,
        status: "Pending" as const,
        schedule_job_id: "",
        schedule_id: "",
        run_date: startDateUTC.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      : []

    const updateData: Partial<ApiSchedule> = {
      schedule_name: formData.title,
      schedule_type: formData.schedule_type,
      description: formData.description,
      start_date: startDateUTC.toISOString(),
      end_date: endDateUTC.toISOString(),
      buildingId: selectedBuildings, // This will be empty array if selectedBuildings is empty
    }

    // Log the data being sent to the API
    console.log('Updating event with data:', updateData)

    updateScheduleMutation.mutate({ id: selectedEvent.id, data: updateData })
  }, [selectedEvent, updateScheduleMutation, selectedBuildings])

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

  // Add handleDelete function
  const handleDelete = useCallback((id: string) => {
    deleteScheduleMutation.mutate(id)
  }, [deleteScheduleMutation])

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Schedule Calendar</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-orange-500 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center ml-3">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center ml-3">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Cancel</span>
          </div>
        </div>
      </div>

      <div className="calendar-container custom-calendar-view">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
          locale="en"
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
          eventClassNames={(arg) => {
            return [`${arg.event.extendedProps.status || 'default'}`]
          }}
          eventMaxStack={3}
          eventMinHeight={25}
          eventShortHeight={25}
          eventDisplay="block"
          displayEventEnd={true}
          eventDidMount={(info) => {
            // Add tooltip to event
            const tooltip = document.createElement('div')
            tooltip.className = 'fc-tooltip'
            tooltip.innerHTML = `
              <div class="font-semibold">${info.event.title}</div>
              ${info.event.extendedProps.schedule_type ? `<div>Type: ${info.event.extendedProps.schedule_type}</div>` : ''}
              ${info.event.extendedProps.description ? `<div>${info.event.extendedProps.description}</div>` : ''}
            `
            info.el.appendChild(tooltip)
          }}
        />
      </div>

      <style>
        {`
          .fc-event {
            margin: 1px 0;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 0.875rem;
            line-height: 1.25rem;
            overflow: hidden;
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
        onDelete={handleDelete}
        onViewScheduleJob={handleViewScheduleJob}
        initialFormData={initialFormData}
        buildings={buildings}
        selectedBuildings={selectedBuildings}
        onBuildingSelect={handleBuildingSelect}
        onSetSelectedBuildings={setSelectedBuildings}
        onUpdateStatus={(id, status) => updateScheduleMutation.mutate({ id, data: { status } as any })}
      />

      <BuildingSelectionModal
        isOpen={showBuildingModal}
        selectedEvent={selectedEvent}
        buildings={buildings}
        selectedBuildings={selectedBuildings}
        onClose={() => setShowBuildingModal(false)}
        onBuildingSelect={handleBuildingSelect}
      />
    </div>
  )
}

export default Calendar