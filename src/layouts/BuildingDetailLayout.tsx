import React from 'react'
import { useState, useEffect } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'
import { useQuery } from '@tanstack/react-query'
import { getBuildingDetail } from '@/services/building'
import { Building2 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import NotificationButton from '@/components/notifications/NotificationButton'
import { useTranslation } from 'react-i18next'
import { FaGlobe } from 'react-icons/fa'

const BuildingDetailLayout = () => {
  const isAuthenticated = localStorage.getItem('bmcms_token')
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { i18n, t } = useTranslation()

  // Fetch building detail để lấy tên tòa nhà
  const { data: buildingDetailData } = useQuery({
    queryKey: ['buildingDetail', id],
    queryFn: () => getBuildingDetail(id || ''),
    enabled: !!id,
  })

  const buildingName = buildingDetailData?.data?.name || ''

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            {buildingName && (
              <>
                <Building2 className="h-7 w-7 mr-3 text-blue-500" />
                Building {buildingName}
              </>
            )}
          </h1>

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

        {/* Outlet để render BuildingDetail */}
        <Outlet />
      </div>
    </div>
  )
}

export default BuildingDetailLayout
