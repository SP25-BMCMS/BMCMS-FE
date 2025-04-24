import React from 'react';
import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { sidebarItems } from '@/components/layout/Sidebar'; // Import sidebarItems để lấy tiêu đề động
import ThemeToggle from '@/components/ThemeToggle';
import NotificationButton from '@/components/notifications/NotificationButton';

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAuthenticated = localStorage.getItem('bmcms_token');
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Hàm lấy tiêu đề động từ sidebarItems dựa vào đường dẫn hiện tại
  const getCurrentTitle = () => {
    // Kiểm tra các mục cấp cao nhất
    const mainItem = sidebarItems.find(item => item.path === location.pathname);
    if (mainItem) return mainItem.title;

    // Kiểm tra các mục con
    for (const item of sidebarItems) {
      if (item.children) {
        const childItem = item.children.find(child => child.path === location.pathname);
        if (childItem) return childItem.title;
      }
    }

    // Mặc định trả về Dashboard nếu không tìm thấy
    return 'Dashboard';
  };

  const currentTitle = getCurrentTitle();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Placeholder để giữ không gian cho sidebar */}
      <div
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 transition-all duration-300`}
      ></div>

      {/* Sidebar */}
      <Sidebar onToggle={setIsSidebarCollapsed} />

      {/* Main Content */}
      <div className="flex-1 p-6 transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{currentTitle}</h1>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            <NotificationButton />
            <ThemeToggle />
          </div>
        </div>

        {/* Outlet để render các trang con */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
