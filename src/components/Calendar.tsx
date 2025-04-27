import { useState, useCallback, useEffect } from 'react';
import { EventContentArg } from '@fullcalendar/react';
import { useQuery } from '@tanstack/react-query';
import schedulesApi from '@/services/schedules';
import { STATUS_COLORS } from '@/constants/colors';

interface UseCalendarProps {
  buildingDetails: any[];
  deletedScheduleIds: { [key: string]: number };
}

/**
 * Custom hook để quản lý dữ liệu lịch cho FullCalendar
 */
const useCalendar = ({ buildingDetails, deletedScheduleIds }: UseCalendarProps) => {
  const [events, setEvents] = useState<any[]>([]);

  // Fetch schedules using React Query - tối ưu hóa các tùy chọn
  const schedulesQuery = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await schedulesApi.getSchedules(1, 1000); // Lấy tất cả lịch trình
      return response;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 phút
    cacheTime: 15 * 60 * 1000, // 15 phút
    retry: 1, // Chỉ thử lại 1 lần nếu lỗi
  });

  // Tách hàm chuyển đổi dữ liệu thành một hàm riêng để tái sử dụng và dễ bảo trì
  const transformSchedulesToEvents = useCallback(
    (schedules: any[]) => {
      return schedules
        .filter(schedule => {
          // If it's deleted and the deletion time has passed, filter it out
          if (deletedScheduleIds[schedule.schedule_id]) {
            const now = Date.now();
            return now < deletedScheduleIds[schedule.schedule_id];
          }
          return true;
        })
        .map((schedule: any) => {
          // Get all buildingDetailIds from schedule_job entries that aren't cancelled
          const buildingDetailIds =
            schedule.schedule_job
              ?.filter(job => job.status !== 'Cancel')
              .map(job => job.buildingDetailId) || [];

          // Determine the status color based on schedule_job status with softer colors
          let backgroundColor, textColor, borderColor;
          const hasInProgress = schedule.schedule_status === 'InProgress';
          const hasCompleted = schedule.schedule_status === 'Completed';
          const hasCancel = schedule.schedule_status === 'Cancel';
          const isPending = schedule.schedule_status === 'Pending';

          if (hasCancel) {
            // Softer red for cancelled
            backgroundColor = 'rgba(239, 68, 68, 0.15)';
            textColor = '#ef4444';
            borderColor = '#ef4444';
          } else if (hasCompleted) {
            // Softer green for completed
            backgroundColor = 'rgba(34, 197, 94, 0.15)';
            textColor = '#16a34a';
            borderColor = '#16a34a';
          } else if (hasInProgress) {
            // Softer blue for in progress
            backgroundColor = 'rgba(59, 130, 246, 0.15)';
            textColor = '#3b82f6';
            borderColor = '#3b82f6';
          } else if (isPending) {
            // Softer yellow for pending
            backgroundColor = 'rgba(234, 179, 8, 0.15)';
            textColor = '#eab308';
            borderColor = '#eab308';
          } else {
            // Default - softer gray
            backgroundColor = 'rgba(156, 163, 175, 0.15)';
            textColor = '#6b7280';
            borderColor = '#9ca3af';
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
            borderColor: borderColor,
            textColor: textColor,
            cycle_id: schedule.cycle_id,
            schedule_status: schedule.schedule_status,
            schedule_type: schedule.schedule_type,
          };
        });
    },
    [deletedScheduleIds]
  );

  // Update events when schedules change
  useEffect(() => {
    if (schedulesQuery.data?.data) {
      const calendarEvents = transformSchedulesToEvents(schedulesQuery.data.data);
      setEvents(calendarEvents);
    }
  }, [schedulesQuery.data, transformSchedulesToEvents]);

  // Hiển thị nội dung sự kiện tùy chỉnh với UI cải tiến
  const renderEventContent = useCallback(
    (eventContent: EventContentArg) => {
      // Get building detail IDs for this event
      const buildingDetailIds = eventContent.event.extendedProps.buildingDetailIds || [];

      // Filter out duplicate building detail IDs
      const uniqueBuildingDetailIds = [...new Set(buildingDetailIds)];

      // Count unique building details
      const buildingCount = uniqueBuildingDetailIds.length;

      return (
        <div className="fc-event-content flex flex-col p-1.5 max-h-full overflow-hidden">
          <div className="font-semibold truncate">{eventContent.event.title}</div>
          {buildingCount > 0 && (
            <div className="text-xs mt-1 truncate opacity-85">
              {buildingCount} {buildingCount === 1 ? 'Building' : 'Buildings'}
            </div>
          )}
          {eventContent.event.extendedProps.description && (
            <div
              className="text-xs italic mt-1 truncate opacity-85"
              title={eventContent.event.extendedProps.description}
            >
              {eventContent.event.extendedProps.description}
            </div>
          )}
        </div>
      );
    },
    [buildingDetails]
  );

  // Trả về tất cả dữ liệu và hàm cần thiết
  return {
    events,
    isLoading: schedulesQuery.isLoading,
    isError: schedulesQuery.isError,
    error: schedulesQuery.error,
    refetch: schedulesQuery.refetch,
    renderEventContent,
    schedulesData: schedulesQuery.data,
  };
};

export default useCalendar;
