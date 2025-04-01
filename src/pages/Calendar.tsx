import React, { useState, useEffect } from 'react';
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
  const [newEvent, setNewEvent] = useState<Partial<TaskEvent>>({
    title: '',
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

  // Xác định màu sắc dựa trên trạng thái
  const getStatusColor = (status: string) => {
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
  };
  
  // Xác định màu viền dựa trên mức độ ưu tiên
  const getPriorityBorderColor = (priority?: string) => {
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
  };

  // Xử lý khi click vào sự kiện
  const handleEventClick = (clickInfo: EventClickArg) => {
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
  };

  // Xử lý khi chọn một ngày/khoảng thời gian trên lịch
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setNewEvent({
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
  };

  // Xử lý lưu sự kiện mới
  const handleSaveEvent = () => {
    if (!newEvent.title?.trim()) {
      alert('Vui lòng nhập tiêu đề sự kiện');
      return;
    }
    
    const eventToAdd = {
      ...newEvent,
      id: String(Date.now()),
      backgroundColor: getStatusColor(newEvent.status || 'pending'),
      borderColor: getPriorityBorderColor(newEvent.priority),
      textColor: '#ffffff'
    };
    
    setEvents([...events, eventToAdd as EventInput]);
    setIsModalOpen(false);
    setNewEvent({
      title: '',
      description: '',
      assignedTo: '',
      status: 'pending',
      priority: 'medium',
      location: ''
    });
  };

  // Xử lý cập nhật trạng thái sự kiện
  const handleUpdateStatus = (newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (!selectedEvent) return;
    
    const updatedEvents = events.map(event => {
      if (event.id === selectedEvent.id) {
        return {
          ...event,
          status: newStatus,
          backgroundColor: getStatusColor(newStatus)
        };
      }
      return event;
    });
    
    setEvents(updatedEvents);
    setSelectedEvent({
      ...selectedEvent,
      status: newStatus
    });
  };

  // Hiển thị nội dung sự kiện tùy chỉnh
  const renderEventContent = (eventContent: EventContentArg) => {
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
  };

  // Modal hiển thị chi tiết sự kiện
  const EventModal = () => {
    if (!isModalOpen) return null;

    const handleClose = () => {
      setIsModalOpen(false);
      setSelectedEvent(null);
      setIsCreateMode(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setNewEvent(prev => ({
        ...prev,
        [name]: value
      }));
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black opacity-50" onClick={handleClose}></div>
        <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          {isCreateMode ? (
            // Form tạo sự kiện mới
            <>
              <h2 className="text-xl font-semibold mb-4">Tạo sự kiện mới</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                  <input
                    type="text"
                    name="title"
                    value={newEvent.title || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tiêu đề sự kiện"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select
                      name="status"
                      value={newEvent.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="in_progress">Đang thực hiện</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                    <select
                      name="priority"
                      value={newEvent.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={newEvent.assignedTo || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên người thực hiện"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                  <input
                    type="text"
                    name="location"
                    value={newEvent.location || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa điểm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    name="description"
                    value={newEvent.description || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mô tả công việc"
                    rows={3}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                  <div className="text-sm text-gray-500">
                    {new Date(newEvent.start || '').toLocaleString()} 
                    {newEvent.end ? ` - ${new Date(newEvent.end).toLocaleString()}` : ''}
                    {newEvent.allDay ? ' (Cả ngày)' : ''}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                  onClick={handleClose}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={handleSaveEvent}
                >
                  Lưu
                </button>
              </div>
            </>
          ) : (
            // Hiển thị chi tiết sự kiện
            selectedEvent && (
              <>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold mb-4">{selectedEvent.title}</h2>
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
                
                <div className="space-y-4">
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
                  <div className="text-sm font-medium text-gray-700 mb-2">Cập nhật trạng thái:</div>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1.5 rounded text-white text-sm ${
                        selectedEvent.status === 'pending' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
                      } transition`}
                      onClick={() => handleUpdateStatus('pending')}
                    >
                      Chờ xử lý
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded text-white text-sm ${
                        selectedEvent.status === 'in_progress' ? 'bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'
                      } transition`}
                      onClick={() => handleUpdateStatus('in_progress')}
                    >
                      Đang thực hiện
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded text-white text-sm ${
                        selectedEvent.status === 'completed' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
                      } transition`}
                      onClick={() => handleUpdateStatus('completed')}
                    >
                      Hoàn thành
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    onClick={handleClose}
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
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lịch công việc</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span className="text-sm text-gray-600">Chờ xử lý</span>
          </div>
          <div className="flex items-center ml-3">
            <span className="w-3 h-3 rounded-full bg-orange-500 mr-1"></span>
            <span className="text-sm text-gray-600">Đang thực hiện</span>
          </div>
          <div className="flex items-center ml-3">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span className="text-sm text-gray-600">Hoàn thành</span>
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
