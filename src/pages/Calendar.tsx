import React, { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core';
import '../../src/styles/Calendar.css';
import schedulesApi, { PaginationResponse, Schedule } from '@/services/schedules';
import scheduleJobsApi from '@/services/scheduleJobs';
import { getBuildings } from '@/services/building';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EventModal from '@/components/calendar/EventModal';
import { TaskEvent, ApiSchedule } from '@/types/calendar';
import Table from '@/components/Table';
import Pagination from '@/components/Pagination';
import { Calendar as CalendarIcon, List, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { STATUS_COLORS } from '@/constants/colors';
import buildingDetailsApi, { BuildingDetail } from '@/services/buildingDetails';
import { getMaintenanceCycles } from '@/services/maintenanceCycle';
import apiInstance from '@/lib/axios';
import { MaintenanceCycle } from '@/types';
import BuildingDetailSelectionModal from '@/components/calendar/BuildingDetailSelectionModal';

const Calendar: React.FC = () => {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TaskEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedBuildingDetails, setSelectedBuildingDetails] = useState<string[]>([]);
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
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [deletedScheduleIds, setDeletedScheduleIds] = useState<{ [key: string]: number }>({});
  const deletionTimersRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const [buildingDetails, setBuildingDetails] = useState<BuildingDetail[]>([]);

  // Fetch current user for manager ID
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiInstance.get(import.meta.env.VITE_CURRENT_USER_API);
      return response.data;
    },
  });

  // Fetch buildings using React Query
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const response = await getBuildings();
      return response.data;
    },
  });

  // Fetch building details for the current manager
  const { data: buildingDetailsData } = useQuery({
    queryKey: ['buildingDetails', currentUser?.userId],
    queryFn: async () => {
      if (!currentUser?.userId) return [];
      const response = await buildingDetailsApi.getBuildingDetailsForManager(currentUser.userId);
      setBuildingDetails(response);
      return response;
    },
    enabled: !!currentUser?.userId,
  });

  // Fetch maintenance cycles
  const { data: maintenanceCycles = [] } = useQuery({
    queryKey: ['maintenanceCycles'],
    queryFn: async () => {
      const response = await getMaintenanceCycles();
      return response.data || [];
    },
  });

  // Fetch schedules using React Query with pagination
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['schedules', { page, limit }],
    queryFn: async () => {
      if (viewMode === 'calendar') {
        // For calendar view, fetch all schedules with high limit
        const response = await schedulesApi.getSchedules();
        return response;
      } else {
        // For table view, respect pagination
        const response = await schedulesApi.getSchedules(page, limit);
        return response;
      }
    },
  });

  // Fetch schedule jobs for building count in table view
  const scheduleJobsQuery = useQuery({
    queryKey: ['scheduleJobs', 'allCounts'],
    queryFn: async () => {
      // Only fetch if we're in table view to avoid unnecessary API calls
      if (viewMode !== 'table') return null;

      // Create an object to store the counts for each schedule
      const buildingCountsBySchedule: { [scheduleId: string]: number } = {};

      // For each schedule, fetch the jobs to count buildings
      if (schedulesData?.data) {
        const promises = schedulesData.data.map(async schedule => {
          try {
            const response = await scheduleJobsApi.fetchScheduleJobsByScheduleId(
              schedule.schedule_id
            );
            // Count only non-cancelled jobs
            const activeJobs = response.data.filter(job => job.status.toLowerCase() !== 'cancel');
            // Use Set to count unique buildings
            const uniqueBuildingIds = new Set(activeJobs.map(job => job.building_id));
            buildingCountsBySchedule[schedule.schedule_id] = uniqueBuildingIds.size;
          } catch (error) {
            console.error(`Error fetching jobs for schedule ${schedule.schedule_id}:`, error);
            buildingCountsBySchedule[schedule.schedule_id] = 0;
          }
        });

        await Promise.all(promises);
      }

      return buildingCountsBySchedule;
    },
    enabled: viewMode === 'table' && !!schedulesData?.data,
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (newSchedule: Omit<ApiSchedule, 'schedule_id' | 'created_at' | 'updated_at'>) => {
      return schedulesApi.createSchedule(newSchedule as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created successfully');
      setIsModalOpen(false);
      setIsCreateMode(false);
    },
    onError: () => {
      toast.error('Failed to create schedule');
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiSchedule> }) => {
      return schedulesApi.updateSchedule(id, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated successfully');
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to update schedule');
    },
  });

  // Format date for the table view
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // Handle view schedule details from table
  const handleViewScheduleDetails = (schedule: any) => {
    // Navigate directly to schedule job detail page using the correct path
    navigate(`/schedule-job/${schedule.schedule_id}`);
  };

  // Add delete mutation with 5-minute delay
  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => {
      // Schedule the deletion after 5 minutes
      const deletionTime = Date.now() + 5 * 60 * 1000; // 5 minutes in milliseconds

      setDeletedScheduleIds(prev => ({
        ...prev,
        [id]: deletionTime,
      }));

      // Set a timer to remove the schedule from the view after 5 minutes
      if (deletionTimersRef.current[id]) {
        clearTimeout(deletionTimersRef.current[id]);
      }

      deletionTimersRef.current[id] = setTimeout(
        () => {
          // This will trigger a refetch without the deleted item
          queryClient.invalidateQueries({ queryKey: ['schedules'] });

          // Remove from our tracking state
          setDeletedScheduleIds(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
          });

          // Remove the timer reference
          delete deletionTimersRef.current[id];
        },
        5 * 60 * 1000
      ); // 5 minutes

      // Actually delete the schedule in the backend
      return schedulesApi.deleteSchedule(id);
    },
    onSuccess: (_, id) => {
      toast.success('Schedule marked as cancelled and will be removed in 5 minutes');

      // Update the local status to show it as cancelled immediately
      queryClient.setQueryData(['schedules'], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((schedule: any) =>
            schedule.schedule_id === id ? { ...schedule, schedule_status: 'Cancel' } : schedule
          ),
        };
      });

      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete schedule');
    },
  });

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      Object.values(deletionTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  // Update events when schedules change
  useEffect(() => {
    if (schedulesData?.data) {
      const calendarEvents = schedulesData.data
        .filter(schedule => {
          // If it's deleted and the deletion time has passed, filter it out
          if (deletedScheduleIds[schedule.schedule_id]) {
            const now = Date.now();
            return now < deletedScheduleIds[schedule.schedule_id];
          }
          return true;
        })
        .map((schedule: any) => {
          const buildingIds =
            schedule.schedule_job
              ?.filter(job => job.status !== 'Cancel')
              .map(job => job.building_id) || [];

          // Determine the status color based on schedule_job status
          let backgroundColor = STATUS_COLORS.IN_PROGRESS.BORDER; // Default blue
          const hasInProgress = schedule.schedule_status === 'InProgress';
          const hasCompleted = schedule.schedule_status === 'Completed';
          const hasCancel = schedule.schedule_status === 'Cancel';

          if (hasCancel) {
            backgroundColor = STATUS_COLORS.INACTIVE.BORDER; // Red
          } else if (hasInProgress) {
            backgroundColor = STATUS_COLORS.IN_PROGRESS.BORDER; // Blue
          } else if (hasCompleted) {
            backgroundColor = STATUS_COLORS.ACTIVE.BORDER; // Green
          } else {
            backgroundColor = STATUS_COLORS.PENDING.BORDER; // Yellow/Orange for pending
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
            buildingId: buildingIds,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            textColor: '#ffffff',
          };
        });

      setEvents(calendarEvents);
    }
  }, [schedulesData, deletedScheduleIds]);

  // Xử lý khi click vào sự kiện
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start || '',
      end: event.end || '',
      allDay: event.allDay,
      status: event.extendedProps.status,
      description: event.extendedProps.description,
      priority: event.extendedProps.priority,
      buildingId: event.extendedProps.buildingId || [],
    });
    setIsCreateMode(false);
    setIsModalOpen(true);
  }, []);

  // Xử lý khi chọn một ngày/khoảng thời gian trên lịch
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    // Kiểm tra xem ngày được chọn có phải là quá khứ không
    const selectedDate = new Date(selectInfo.start);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (selectedDate < now) {
      toast.error('Cannot create events in the past');
      return;
    }

    // Clear selected building details when creating a new schedule
    setSelectedBuildingDetails([]);

    setInitialFormData({
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      status: 'pending',
      description: '',
      priority: 'medium',
      schedule_type: 'Daily',
    });

    setIsCreateMode(true);
    setIsModalOpen(true);
  }, []);

  // Xử lý lưu sự kiện mới
  const handleSaveEvent = useCallback(
    async (formData: any) => {
      const title = formData.title;
      const description = formData.description;
      const scheduleType = formData.schedule_type;
      const startDate = formData.start_date;
      const endDate = formData.end_date;
      const cycleId = formData.cycle_id;
      const buildingDetailIds = formData.buildingDetailIds;

      if (!title.trim()) {
        toast.error('Please enter event title');
        return;
      }

      if (!startDate) {
        toast.error('Please select start time');
        return;
      }

      if (!endDate) {
        toast.error('Please select end time');
        return;
      }

      if (buildingDetailIds.length === 0) {
        toast.error('Please select at least one building detail');
        return;
      }

      if (!cycleId) {
        toast.error('Please select a maintenance cycle');
        return;
      }

      const now = new Date();
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (startDateObj < now) {
        toast.error('Start time cannot be in the past');
        return;
      }

      if (endDateObj < startDateObj) {
        toast.error('End time must be after start time');
        return;
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
      );

      const endDateUTC = new Date(
        Date.UTC(
          endDateObj.getFullYear(),
          endDateObj.getMonth(),
          endDateObj.getDate(),
          endDateObj.getHours(),
          endDateObj.getMinutes()
        )
      );

      // Format the data according to the API requirements
      const newSchedule = {
        schedule_name: title,
        description: description || '',
        start_date: startDateUTC.toISOString(),
        end_date: endDateUTC.toISOString(),
        cycle_id: cycleId,
        schedule_status: 'InProgress',
        buildingDetailIds: buildingDetailIds,
      };

      console.log('Creating schedule with data:', newSchedule);
      createScheduleMutation.mutate(newSchedule as any);
    },
    [createScheduleMutation]
  );

  // Hiển thị nội dung sự kiện tùy chỉnh
  const renderEventContent = useCallback(
    (eventContent: EventContentArg) => {
      // Get building names for this event
      const buildingIds = eventContent.event.extendedProps.buildingId || [];

      // Lọc ra các building ID duy nhất
      const uniqueBuildingIds = [...new Set(buildingIds)] as string[];

      const buildingNames = uniqueBuildingIds
        .map(id => {
          const building = buildings.find(b => b.buildingId === id);
          return building ? building.name : 'Unknown Building';
        })
        .join(', ');

      return (
        <div className="fc-event-content flex flex-col p-1 max-h-full overflow-hidden">
          <div className="font-semibold text-white truncate">{eventContent.event.title}</div>
          {buildingNames && (
            <div className="text-xs text-white/70 mt-1 truncate" title={buildingNames}>
              Buildings: {buildingNames}
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
      );
    },
    [buildings]
  );

  // Xử lý đóng modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsCreateMode(false);
  }, []);

  // Xử lý cập nhật sự kiện
  const handleUpdateEvent = useCallback(
    (formData: {
      title: string;
      description: string;
      schedule_type: string;
      start_date: Date;
      end_date: Date;
      buildingDetailIds: string[];
      cycle_id: string;
      schedule_status: 'Pending' | 'InProgress' | 'Completed' | 'Cancel';
    }) => {
      if (!selectedEvent) return;

      // Convert local datetime to UTC for API
      const startDateObj = new Date(formData.start_date);
      const endDateObj = new Date(formData.end_date);

      // Create UTC dates without timezone adjustment
      const startDateUTC = new Date(
        Date.UTC(
          startDateObj.getFullYear(),
          startDateObj.getMonth(),
          startDateObj.getDate(),
          startDateObj.getHours(),
          startDateObj.getMinutes()
        )
      );

      const endDateUTC = new Date(
        Date.UTC(
          endDateObj.getFullYear(),
          endDateObj.getMonth(),
          endDateObj.getDate(),
          endDateObj.getHours(),
          endDateObj.getMinutes()
        )
      );

      // Format the data according to the API requirements
      const updateData = {
        schedule_name: formData.title,
        description: formData.description,
        start_date: startDateUTC.toISOString(),
        end_date: endDateUTC.toISOString(),
        cycle_id: formData.cycle_id,
        schedule_status: formData.schedule_status,
        buildingDetailIds: formData.buildingDetailIds,
      };

      console.log('Updating event with data:', updateData);

      updateScheduleMutation.mutate({ id: selectedEvent.id, data: updateData as any });
    },
    [selectedEvent, updateScheduleMutation]
  );

  // Thêm hàm xử lý chuyển hướng đến trang ScheduleJob
  const handleViewScheduleJob = useCallback(() => {
    if (selectedEvent) {
      navigate(`/schedule-job/${selectedEvent.id}`);
    }
  }, [selectedEvent, navigate]);

  // Xử lý chọn building
  const handleBuildingSelect = useCallback((buildingId: string) => {
    setSelectedBuildings(prev => {
      if (prev.includes(buildingId)) {
        return prev.filter(id => id !== buildingId);
      } else {
        return [...prev, buildingId];
      }
    });
  }, []);

  // Handle building detail selection
  const handleBuildingDetailSelect = useCallback((buildingDetailId: string) => {
    setSelectedBuildingDetails(prev => {
      if (prev.includes(buildingDetailId)) {
        return prev.filter(id => id !== buildingDetailId);
      } else {
        return [...prev, buildingDetailId];
      }
    });
  }, []);

  // Get filtered data for table view
  const getFilteredTableData = useCallback(() => {
    if (!schedulesData?.data) return [];

    return schedulesData.data.filter(schedule => {
      // If it's deleted and the deletion time has passed, filter it out
      if (deletedScheduleIds[schedule.schedule_id]) {
        const now = Date.now();
        return now < deletedScheduleIds[schedule.schedule_id];
      }
      return true;
    });
  }, [schedulesData, deletedScheduleIds]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Get paginated data and pagination info from the API response
  const tableData = viewMode === 'table' ? getFilteredTableData() : [];
  const paginationInfo = viewMode === 'table' && schedulesData ? schedulesData.pagination : null;
  const totalPages = paginationInfo ? paginationInfo.totalPages : 1;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Schedule Management</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-4 mr-4">
            <div className="flex items-center">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.IN_PROGRESS.BORDER }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">In Progress</span>
            </div>
            <div className="flex items-center">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.ACTIVE.BORDER }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">Completed</span>
            </div>
            <div className="flex items-center">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.INACTIVE.BORDER }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">Cancel</span>
            </div>
            <div className="flex items-center">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.PENDING.BORDER }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">Pending</span>
            </div>
          </div>

          <div className="flex rounded-md shadow-sm overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <CalendarIcon size={16} />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 flex items-center gap-2 ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <List size={16} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
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
            locale="en"
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
            eventClassNames={arg => {
              return [`${arg.event.extendedProps.status || 'default'}`];
            }}
            eventMaxStack={3}
            eventMinHeight={25}
            eventShortHeight={25}
            eventDisplay="block"
            displayEventEnd={true}
            eventDidMount={info => {
              // Add tooltip to event
              const tooltip = document.createElement('div');
              tooltip.className = 'fc-tooltip';
              tooltip.innerHTML = `
                <div class="font-semibold">${info.event.title}</div>
                ${info.event.extendedProps.description ? `<div>${info.event.extendedProps.description}</div>` : ''}
              `;
              info.el.appendChild(tooltip);
            }}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {isLoading || scheduleJobsQuery.isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading...</span>
            </div>
          ) : (
            <>
              <Table
                data={tableData}
                columns={[
                  {
                    key: 'schedule_name',
                    title: 'Schedule Name',
                    className: 'font-medium',
                  },
                  {
                    key: 'start_date',
                    title: 'Start Date',
                    render: item => (
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1 text-gray-500" />
                        {formatDate(item.start_date)}
                      </div>
                    ),
                  },
                  {
                    key: 'end_date',
                    title: 'End Date',
                    render: item => (
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1 text-gray-500" />
                        {formatDate(item.end_date)}
                      </div>
                    ),
                  },
                  {
                    key: 'schedule_status',
                    title: 'Status',
                    render: (item: any) => {
                      let statusStyles = {};

                      if (item.schedule_status === 'InProgress') {
                        statusStyles = {
                          backgroundColor: STATUS_COLORS.IN_PROGRESS.BG,
                          color: STATUS_COLORS.IN_PROGRESS.TEXT,
                          border: `1px solid ${STATUS_COLORS.IN_PROGRESS.BORDER}`,
                        };
                      } else if (item.schedule_status === 'Completed') {
                        statusStyles = {
                          backgroundColor: STATUS_COLORS.ACTIVE.BG,
                          color: STATUS_COLORS.ACTIVE.TEXT,
                          border: `1px solid ${STATUS_COLORS.ACTIVE.BORDER}`,
                        };
                      } else if (item.schedule_status === 'Cancel') {
                        statusStyles = {
                          backgroundColor: STATUS_COLORS.INACTIVE.BG,
                          color: STATUS_COLORS.INACTIVE.TEXT,
                          border: `1px solid ${STATUS_COLORS.INACTIVE.BORDER}`,
                        };
                      } else {
                        // Default for pending
                        statusStyles = {
                          backgroundColor: STATUS_COLORS.PENDING.BG,
                          color: STATUS_COLORS.PENDING.TEXT,
                          border: `1px solid ${STATUS_COLORS.PENDING.BORDER}`,
                        };
                      }

                      return (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={statusStyles}
                        >
                          {item.schedule_status || 'Pending'}
                        </span>
                      );
                    },
                  },
                  {
                    key: 'buildings',
                    title: 'Buildings',
                    render: item => {
                      // Use the building counts from our query instead of the buildings array
                      const buildingCounts = scheduleJobsQuery.data || {};
                      const buildingCount = buildingCounts[item.schedule_id] || 0;

                      return (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {buildingCount} {buildingCount === 1 ? 'Building' : 'Buildings'}
                        </span>
                      );
                    },
                  },
                  {
                    key: 'actions',
                    title: 'Actions',
                    render: item => (
                      <div className="flex justify-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/schedule-job/${item.schedule_id}`);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Schedule Details"
                        >
                          <Eye size={18} />
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
                      setLimit(newLimit);
                      setPage(1);
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
        onDelete={deleteScheduleMutation.mutate}
        onViewScheduleJob={handleViewScheduleJob}
        initialFormData={initialFormData}
        buildings={buildings}
        buildingDetails={buildingDetails}
        selectedBuildingDetails={selectedBuildingDetails}
        onBuildingDetailSelect={handleBuildingDetailSelect}
        onSetSelectedBuildingDetails={setSelectedBuildingDetails}
        maintenanceCycles={maintenanceCycles}
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
    </div>
  );
};

export default Calendar;
