import React from 'react'
import { Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'
import { Tooltip } from '@/components/Tooltip'
import NotificationButton from '@/components/notifications/NotificationButton'
import i18n from '@/i18n'
import { FaGlobe } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

const DetailLayout: React.FC = () => {
  const { i18n: i18nInstance, t } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18nInstance.language === 'en' ? 'vi' : 'en'
    i18nInstance.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
          </h1>

          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Tooltip content={i18nInstance.language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}>
              <button
                onClick={toggleLanguage}
                className="flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FaGlobe className="w-5 h-5" />
                <span className="ml-1 text-sm font-medium">{i18nInstance.language === 'en' ? 'VI' : 'EN'}</span>
              </button>
            </Tooltip>
            <NotificationButton />
            <ThemeToggle />
          </div>
        </div>

        {/* Outlet để render các trang con */}
        <div className="overflow-x-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DetailLayout
