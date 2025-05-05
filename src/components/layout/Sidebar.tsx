import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  RiDashboardLine,
  RiTeamLine,
  RiUserSettingsLine,
  RiTaskLine,
  RiTimeLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiLogoutBoxRLine,
  RiSettings4Line,
} from 'react-icons/ri'
import { IoIosArrowDown } from 'react-icons/io'
import { FaRegBuilding } from 'react-icons/fa'
import { FaHouseCrack } from 'react-icons/fa6'
import { FaBoxes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { GetCurrentUserAPIResponse } from '../../types'
import '@/assets/css/Sidebar.css'
import { useTranslation } from 'react-i18next'

export const sidebarItems = [
  {
    title: 'sidebar.dashboard',
    path: '/dashboard',
    icon: <RiDashboardLine />,
    roles: ['Admin', 'Manager'],
  },
  {
    title: 'sidebar.residentManagement',
    path: '/resident',
    icon: <RiTeamLine />,
    roles: ['Admin'],
  },
  {
    title: 'sidebar.staffManagement',
    path: '/staff',
    icon: <RiUserSettingsLine />,
    roles: ['Admin'],
  },
  {
    title: 'sidebar.taskManagement',
    path: '/tasks',
    icon: <RiTaskLine />,
    roles: ['Manager'],
  },
  {
    title: 'sidebar.buildingManagement',
    path: '/building',
    icon: <FaRegBuilding />,
    roles: ['Admin'],
  },
  {
    title: 'sidebar.myBuildings',
    path: '/buildings-for-manager',
    icon: <FaRegBuilding />,
    roles: ['Manager'],
  },
  {
    title: 'sidebar.crackManagement',
    path: '/crack',
    icon: <FaHouseCrack />,
    roles: ['Manager'],
  },
  {
    title: 'sidebar.materialManagement',
    path: '/materials',
    icon: <FaBoxes />,
    roles: ['Manager'],
  },
  {
    title: 'sidebar.maintenanceCycle',
    path: '/maintenance-cycles',
    icon: <RiSettings4Line />,
    roles: ['Manager'],
  },
  {
    title: 'sidebar.timesheet.title',
    icon: <RiTimeLine />,
    roles: ['Manager'],
    children: [
      { title: 'sidebar.timesheet.workLog', path: '/worklog' },
      { title: 'sidebar.timesheet.calendar', path: '/calendar' },
    ],
  },
]

interface SidebarProps {
  onToggle?: (isCollapsed: boolean) => void
  isCollapsed?: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle, isCollapsed: externalCollapsed }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState('')
  const user = useState<GetCurrentUserAPIResponse | null>(() => {
    const storedUser = localStorage.getItem('bmcms_user')
    return storedUser ? JSON.parse(storedUser) : null
  })[0]
  const { t } = useTranslation()

  // Use external collapsed state if provided, otherwise use internal state
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed

  useEffect(() => {
    const parentItem = sidebarItems.find(item =>
      item.children?.some(child => child.path === location.pathname)
    )
    setOpenDropdown(parentItem?.title || '')
  }, [location.pathname])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    if (externalCollapsed === undefined) {
      setInternalCollapsed(newState)
    }
    if (onToggle) {
      onToggle(newState)
    }
  }

  const toggleDropdown = (title: string) => {
    setOpenDropdown(prev => (prev === title ? '' : title))
  }

  const isActive = (path?: string, children?: { path: string }[]) => {
    return path === location.pathname || children?.some(child => child.path === location.pathname)
  }

  const handleLogout = () => {
    localStorage.removeItem('bmcms_token')
    localStorage.removeItem('bmcms_refresh_token')
    localStorage.removeItem('bmcms_user')
    toast.success(t('common.logoutSuccess'))
    navigate('/')
  }

  const hasAccess = (roles: string[]) => {
    return user?.role && roles.includes(user.role)
  }

  return (
    <div
      className={`sidebar bg-white dark:bg-gray-800 h-screen shadow-xl border-r border-gray-200 dark:border-gray-700 
      transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} fixed top-0 left-0 z-30`}
    >
      {/* Collapse Button */}
      <div className="flex p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <button
          onClick={toggleSidebar}
          className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <RiMenuUnfoldLine size={24} className="text-blue-600 dark:text-blue-400" />
          ) : (
            <RiMenuFoldLine size={24} className="text-blue-600 dark:text-blue-400" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <nav className="mt-4 flex flex-col gap-2 px-2 pb-20">
          {sidebarItems.map(
            item =>
              hasAccess(item.roles) && (
                <div key={item.title}>
                  <div
                    onClick={() =>
                      item.children ? toggleDropdown(item.title) : navigate(item.path)
                    }
                    className={`flex items-center p-3 rounded-lg cursor-pointer
                    transition-all duration-200 group
                    ${isActive(item.path, item.children)
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    ${!isCollapsed ? 'justify-between' : 'justify-center'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.icon}
                      </span>
                      {!isCollapsed && <span className="text-sm">{t(item.title)}</span>}
                    </div>

                    {!isCollapsed && item.children && (
                      <IoIosArrowDown
                        className={`transition-transform duration-300 ${openDropdown === item.title ? 'rotate-180' : ''
                          } text-gray-400 dark:text-gray-500`}
                      />
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  {item.children && openDropdown === item.title && !isCollapsed && (
                    <div className="ml-4 pl-3 border-l-2 border-gray-100 dark:border-gray-700 animate-slideDown">
                      {item.children.map(child => (
                        <div
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={`py-2 px-3 rounded-lg cursor-pointer text-sm
                          transition-colors duration-200
                          ${location.pathname === child.path
                              ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          {t(child.title)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
          )}

          {/* Logout Button */}
          <div
            onClick={handleLogout}
            className="mt-auto p-3 rounded-lg cursor-pointer
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
              border-t border-gray-100 dark:border-gray-700 mx-2"
          >
            <div className="flex items-center gap-3">
              <RiLogoutBoxRLine size={20} />
              {!isCollapsed && <span className="text-sm">{t('common.logout')}</span>}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar
