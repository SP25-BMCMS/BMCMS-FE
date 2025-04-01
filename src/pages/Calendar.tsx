import React, { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core';

// Định nghĩa kiểu dữ liệu cho sự kiện
interface TaskEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  description?: string;
  assignedTo?: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high';
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TaskEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<TaskEvent>>({
    title: '',
    start: '',
    end: '',
    allDay: false,
    description: '',
    assignedTo: '',
    status: 'pending',
    priority: 'medium',
    location: ''
  });
  
  // Mock data - Trong thực tế, bạn sẽ lấy dữ liệu từ API
  useEffect(() => {
    // Giả lập dữ liệu sự kiện
    const mockEvents: TaskEvent[] = [
      {
        id: '1',
        title: 'Kiểm tra tòa nhà A',
        start: new Date(new Date().setHours(10, 0)),
        end: new Date(new Date().setHours(12, 0)),
        status: 'pending',
        description: 'Kiểm tra định kỳ tòa nhà A',
        assignedTo: 'John Doe',
        location: 'Tòa nhà A',
        priority: 'high'
      },
      {
        id: '2',
        title: 'Sửa chữa khu vực B',
        start: new Date(new Date().setDate(new Date().getDate() + 1)),
        end: new Date(new Date().setDate(new Date().getDate() + 1)),
        allDay: true,
        status: 'in_progress',
        description: 'Sửa chữa các vết nứt ở khu vực B',
        assignedTo: 'Jane Smith',
        location: 'Khu vực B',
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Hoàn thành báo cáo',
        start: new Date(new Date().setDate(new Date().getDate() - 1)),
        status: 'completed',
        description: 'Hoàn thành báo cáo đánh giá tháng',
        assignedTo: 'Mike Johnson',
        priority: 'low'
      },
      {
        id: '4',
        title: 'Cuộc họp hàng tháng',
        start: new Date(new Date().setDate(new Date().getDate() + 3)),
        end: new Date(new Date().setDate(new Date().getDate() + 3)),
        status: 'pending',
        description: 'Cuộc họp với tất cả nhân viên',
        assignedTo: 'All Staff',
        location: 'Phòng họp chính',
        priority: 'high'
      },
      {
        id: '5',
        title: 'Bảo trì hệ thống',
        start: new Date(new Date().setDate(new Date().getDate() + 5)),
        status: 'pending',
        description: 'Bảo trì định kỳ hệ thống HVAC',
        assignedTo: 'Tech Team',
        location: 'Tầng kỹ thuật',
        priority: 'medium'
      }
    ];

    // Chuyển đổi sự kiện để thêm màu sắc tùy thuộc vào trạng thái
    const formattedEvents = mockEvents.map(event => ({
      ...event,
      backgroundColor: getStatusColor(event.status),
      borderColor: getPriorityBorderColor(event.priority),
      textColor: '#ffffff'
    }));

    setEvents(formattedEvents);
  }, []);

  // Xử lý click bên ngoài modal để đóng nó
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Nếu click bên ngoài modal và không phải trên form input, đóng modal
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Kiểm tra xem người dùng có đang nhập liệu không
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.tagName === 'SELECT'
        )) {
          // Người dùng đang nhập liệu, không đóng modal
          return;
        }
        setIsModalOpen(false);
        setSelectedEvent(null);
        setIsCreateMode(false);
      }
    }

    // Chỉ thêm sự kiện nếu modal đang mở
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  // Xác định màu sắc dựa trên trạng thái
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return '#f44336'; // Đỏ
      case 'in_progress':
        return '#ff9800'; // Cam
      case 'completed':
        return '#4caf50'; // Xanh lá
      default:
        return '#2196f3'; // Xanh dương
    }
  }, []);
  
  // Xác định màu viền dựa trên mức độ ưu tiên
  const getPriorityBorderColor = useCallback((priority?: string) => {
    switch (priority) {
      case 'high':
        return '#d32f2f'; // Đỏ đậm
      case 'medium':
        return '#f57c00'; // Cam đậm
      case 'low':
        return '#388e3c'; // Xanh lá đậm
      default:
        return '#1976d2'; // Xanh dương đậm
    }
  }, []);

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
      assignedTo: event.extendedProps.assignedTo,
      location: event.extendedProps.location,
      priority: event.extendedProps.priority
    });
    setIsCreateMode(false);
    setIsModalOpen(true);
  }, []);

  // Xử lý khi chọn một ngày/khoảng thời gian trên lịch
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setInitialFormData({
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      status: 'pending',
      description: '',
      assignedTo: '',
      location: '',
      priority: 'medium'
    });
    
    setIsCreateMode(true);
    setIsModalOpen(true);
  }, []);

  // Xử lý lưu sự kiện mới
  const handleSaveEvent = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const title = formData.get('title') as string;
    const status = formData.get('status') as string;
    const priority = formData.get('priority') as string;
    const description = formData.get('description') as string;
    const assignedTo = formData.get('assignedTo') as string;
    const location = formData.get('location') as string;
    
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề sự kiện');
      return;
    }
    
    const eventToAdd = {
      id: String(Date.now()),
      title,
      start: initialFormData.start,
      end: initialFormData.end,
      allDay: initialFormData.allDay,
      status: status || 'pending',
      priority,
      description,
      assignedTo,
      location,
      backgroundColor: getStatusColor(status || 'pending'),
      borderColor: getPriorityBorderColor(priority),
      textColor: '#ffffff'
    };
    
    setEvents(prev => [...prev, eventToAdd as EventInput]);
    setIsModalOpen(false);
    setIsCreateMode(false);
  }, [initialFormData, getStatusColor, getPriorityBorderColor]);

  // Xử lý cập nhật trạng thái sự kiện
  const handleUpdateStatus = useCallback((newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (!selectedEvent) return;
    
    setEvents(prev => prev.map(event => {
      if (event.id === selectedEvent.id) {
        return {
          ...event,
          status: newStatus,
          backgroundColor: getStatusColor(newStatus)
        };
      }
      return event;
    }));
    
    setSelectedEvent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: newStatus
      };
    });
  }, [selectedEvent, getStatusColor]);

  // Hiển thị nội dung sự kiện tùy chỉnh
  const renderEventContent = useCallback((eventContent: EventContentArg) => {
    return (
      <div className="fc-event-content flex flex-col p-1">
        <div className="font-semibold">{eventContent.event.title}</div>
        {eventContent.event.extendedProps.assignedTo && (
          <div className="text-xs">{eventContent.event.extendedProps.assignedTo}</div>
        )}
        {eventContent.event.extendedProps.location && (
          <div className="text-xs italic mt-1">{eventContent.event.extendedProps.location}</div>
        )}
      </div>
    );
  }, []);

  // Xử lý đóng modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsCreateMode(false);
  }, []);

  // Thêm CSS tùy chỉnh cho dark mode
  useEffect(() => {
    // Thêm CSS tùy chỉnh cho dark mode
    const style = document.createElement('style');
    style.textContent = `
      .dark .fc-theme-standard .fc-toolbar {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-toolbar-title {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-button {
        background-color: #374151;
        border-color: #4b5563;
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-button:hover {
        background-color: #4b5563;
      }
      .dark .fc-theme-standard .fc-button:disabled {
        background-color: #374151;
        opacity: 0.5;
      }
      .dark .fc-theme-standard .fc-button-active {
        background-color: #3b82f6;
        border-color: #3b82f6;
      }
      .dark .fc-theme-standard th {
        background-color: #374151;
        color: #f3f4f6;
        border-color: #4b5563;
      }
      .dark .fc-theme-standard td {
        border-color: #4b5563;
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-day {
        background-color: #1f2937;
      }
      .dark .fc-theme-standard .fc-day-other {
        background-color: #111827;
      }
      .dark .fc-theme-standard .fc-scrollgrid,
      .dark .fc-theme-standard .fc-scrollgrid-section > td,
      .dark .fc-theme-standard .fc-scrollgrid-section > th,
      .dark .fc-theme-standard .fc-scrollgrid-section-liquid > td,
      .dark .fc-theme-standard .fc-scrollgrid-section-liquid > th,
      .dark .fc-theme-standard .fc-list {
        border-color: #4b5563;
      }
      .dark .fc-theme-standard .fc-list-day-cushion {
        background-color: #374151;
      }
      .dark .fc-theme-standard .fc-list-event:hover td {
        background-color: #4b5563;
      }
      .dark .fc-theme-standard .fc-timegrid-slot-minor {
        border-color: #4b5563;
      }
      .dark .fc-theme-standard .fc-timegrid-slot-label-cushion,
      .dark .fc-theme-standard .fc-timegrid-axis-cushion {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-timegrid-divider {
        background: #4b5563;
      }
      .dark .fc-theme-standard .fc-col-header-cell-cushion {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-daygrid-day-number {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-daygrid-day-top {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-h-event,
      .dark .fc-theme-standard .fc-v-event {
        background-color: #3b82f6;
        border-color: #2563eb;
      }
      .dark .fc-theme-standard a.fc-event {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-event-title-container {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-more-link {
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-popover {
        background-color: #1f2937;
        border-color: #4b5563;
      }
      .dark .fc-theme-standard .fc-popover-header {
        background-color: #374151;
        color: #f3f4f6;
      }
      .dark .fc-theme-standard .fc-today-button {
        background-color: #3b82f6;
        border-color: #2563eb;
      }
      .dark .fc-theme-standard .fc-today-button:hover {
        background-color: #2563eb;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Modal hiển thị chi tiết sự kiện
  const EventModal = React.memo(() => {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 bg-black opacity-50" onClick={handleCloseModal}></div>
        <div ref={modalRef} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          {isCreateMode ? (
            // Form tạo sự kiện mới
            <>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Tạo sự kiện mới</h2>
              
              <form ref={formRef} onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="title">Tiêu đề</label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Nhập tiêu đề sự kiện"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="status">Trạng thái</label>
                    <select
                      id="status"
                      name="status"
                      defaultValue="pending"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="in_progress">Đang thực hiện</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="priority">Mức độ ưu tiên</label>
                    <select
                      id="priority"
                      name="priority"
                      defaultValue="medium"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="assignedTo">Người thực hiện</label>
                  <input
                    id="assignedTo"
                    type="text"
                    name="assignedTo"
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Nhập tên người thực hiện"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="location">Địa điểm</label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Nhập địa điểm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="description">Mô tả</label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Nhập mô tả công việc"
                    rows={3}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian</label>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(initialFormData.start || '').toLocaleString()} 
                    {initialFormData.end ? ` - ${new Date(initialFormData.end).toLocaleString()}` : ''}
                    {initialFormData.allDay ? ' (Cả ngày)' : ''}
                  </div>
                </div>
              
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                    onClick={handleCloseModal}
                    type="button"
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                    type="submit"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </>
          ) : (
            // Hiển thị chi tiết sự kiện
            selectedEvent && (
              <>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{selectedEvent.title}</h2>
                  <span 
                    className={`px-2 py-1 rounded text-white text-sm ${
                      selectedEvent.priority === 'high' ? 'bg-red-600' :
                      selectedEvent.priority === 'medium' ? 'bg-orange-500' : 'bg-green-600'
                    }`}
                  >
                    {selectedEvent.priority === 'high' ? 'Cao' :
                     selectedEvent.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
                
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Thời gian:</span> {new Date(selectedEvent.start).toLocaleString()}
                    {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleString()}`}
                    {selectedEvent.allDay && ' (Cả ngày)'}
                  </div>
                  
                  <div>
                    <span className="font-medium">Trạng thái:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-white text-sm ${
                      selectedEvent.status === 'completed' ? 'bg-green-500' :
                      selectedEvent.status === 'in_progress' ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {selectedEvent.status === 'completed' ? 'Hoàn thành' :
                       selectedEvent.status === 'in_progress' ? 'Đang thực hiện' : 'Chờ xử lý'}
                    </span>
                  </div>
                  
                  {selectedEvent.description && (
                    <div>
                      <span className="font-medium">Mô tả:</span> {selectedEvent.description}
                    </div>
                  )}
                  
                  {selectedEvent.assignedTo && (
                    <div>
                      <span className="font-medium">Người thực hiện:</span> {selectedEvent.assignedTo}
                    </div>
                  )}
                  
                  {selectedEvent.location && (
                    <div>
                      <span className="font-medium">Địa điểm:</span> {selectedEvent.location}
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cập nhật trạng thái:</div>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1.5 rounded text-white text-sm ${
                        selectedEvent.status === 'pending' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
                      } transition`}
                      onClick={() => handleUpdateStatus('pending')}
                      type="button"
                    >
                      Chờ xử lý
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded text-white text-sm ${
                        selectedEvent.status === 'in_progress' ? 'bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'
                      } transition`}
                      onClick={() => handleUpdateStatus('in_progress')}
                      type="button"
                    >
                      Đang thực hiện
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded text-white text-sm ${
                        selectedEvent.status === 'completed' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
                      } transition`}
                      onClick={() => handleUpdateStatus('completed')}
                      type="button"
                    >
                      Hoàn thành
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                    onClick={handleCloseModal}
                    type="button"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Lịch công việc</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Chờ xử lý</span>
          </div>
          <div className="flex items-center ml-3">
            <span className="w-3 h-3 rounded-full bg-orange-500 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Đang thực hiện</span>
          </div>
          <div className="flex items-center ml-3">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Hoàn thành</span>
          </div>
        </div>
      </div>
      
      <div className="calendar-container">
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
          dayMaxEvents={true}
          weekends={true}
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          select={handleDateSelect}
          height="auto"
          locale="vi"
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày'
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
        />
      </div>
      
      <EventModal />
    </div>
  );
};

export default Calendar;