import React, { useEffect } from 'react'
import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { sidebarItems } from '@/components/layout/Sidebar' // Import sidebarItems để lấy tiêu đề động
import ThemeToggle from '@/components/ThemeToggle'
import NotificationButton from '@/components/notifications/NotificationButton'
import { useTranslation } from 'react-i18next'
import { FaGlobe } from 'react-icons/fa'
import Tooltip from '@/components/Tooltip'

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const isAuthenticated = localStorage.getItem('bmcms_token')
  const location = useLocation()
  const { i18n, t } = useTranslation()

  // Load saved language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('language')
    if (savedLang) {
      i18n.changeLanguage(savedLang)
    }
  }, [i18n])

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Hàm lấy tiêu đề động từ sidebarItems dựa vào đường dẫn hiện tại
  const getCurrentTitle = () => {
    // Kiểm tra các mục cấp cao nhất
    const mainItem = sidebarItems.find(item => item.path === location.pathname)
    if (mainItem) return t(mainItem.title)

    // Kiểm tra các mục con
    for (const item of sidebarItems) {
      if (item.children) {
        const childItem = item.children.find(child => child.path === location.pathname)
        if (childItem) return t(childItem.title)
      }
    }

    // Mặc định trả về Dashboard nếu không tìm thấy
    return t('sidebar.dashboard')
  }

  const currentTitle = getCurrentTitle()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

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
            <Tooltip content={i18n.language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}>
              <button
                onClick={toggleLanguage}
                className="flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FaGlobe className="w-5 h-5" />
                <span className="ml-1 text-sm font-medium">{i18n.language === 'en' ? 'VI' : 'EN'}</span>
              </button>
            </Tooltip>
            <NotificationButton />
            <ThemeToggle />
          </div>
        </div>

        {/* Outlet để render các trang con */}
        <Outlet />
      </div>
    </div>
  )
}

export default DashboardLayout
