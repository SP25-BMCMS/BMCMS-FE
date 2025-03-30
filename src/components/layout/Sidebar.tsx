import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  RiDashboardLine,
  RiTeamLine,
  RiUserSettingsLine,
  RiTaskLine,
  RiTimeLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiLogoutBoxRLine,
} from "react-icons/ri"
import { IoIosArrowDown } from "react-icons/io"
import { FaRegBuilding } from "react-icons/fa"
import { FaHouseCrack } from "react-icons/fa6"
import toast from "react-hot-toast"
import "@/assets/css/Sidebar.css"

export const sidebarItems = [
  { title: "Dashboard", path: "/dashboard", icon: <RiDashboardLine /> },
  { title: "Residents", path: "/resident", icon: <RiTeamLine /> },
  { title: "Staff Manager", path: "/staff", icon: <RiUserSettingsLine /> },
  { title: "Task Management", path: "/tasks", icon: <RiTaskLine /> },
  {
    title: "Building Management",
    path: "/building",
    icon: <FaRegBuilding />
  },
  {
    title: "Crack Management",
    path: "/crack",
    icon: <FaHouseCrack />
  },
  {
    title: "TimeSheet",
    icon: <RiTimeLine />,
    children: [
      { title: "Work Log", path: "/worklog" },
      { title: "Calendar", path: "/calendar" },
    ],
  },
]

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState("")

  React.useEffect(() => {
    const parentItem = sidebarItems.find(item =>
      item.children?.some(child => child.path === location.pathname)
    )
    setOpenDropdown(parentItem?.title || "")
  }, [location.pathname])

  const toggleDropdown = (title: string) => {
    setOpenDropdown(prev => prev === title ? "" : title)
  }

  const isActive = (path?: string, children?: { path: string }[]) => {
    return path === location.pathname ||
      children?.some(child => child.path === location.pathname)
  }

  const handleLogout = () => {
    localStorage.removeItem("bmcms_token")
    localStorage.removeItem("bmcms_refresh_token")
    toast.success("Đăng xuất thành công")
    navigate("/")
  }

  return (
    <div className={`bg-white min-h-screen shadow-xl border-r border-gray-200 
      transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"} sticky top-0`}>

      {/* Collapse Button */}
      <div className="flex p-4 border-b border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <RiMenuUnfoldLine size={24} className="text-blue-600" />
          ) : (
            <RiMenuFoldLine size={24} className="text-blue-600" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="mt-4 flex flex-col gap-2 px-2">
        {sidebarItems.map((item) => (
          <div key={item.title}>
            <div
              onClick={() => item.children ? toggleDropdown(item.title) : navigate(item.path)}
              className={`flex items-center p-3 rounded-lg cursor-pointer
                transition-all duration-200 group
                ${isActive(item.path, item.children)
                  ? "bg-blue-100 text-blue-600 font-semibold"
                  : "hover:bg-gray-100"}
                ${!isCollapsed ? "justify-between" : "justify-center"}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl text-gray-600 group-hover:text-blue-600">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-sm">{item.title}</span>
                )}
              </div>

              {!isCollapsed && item.children && (
                <IoIosArrowDown className={`transition-transform duration-300 ${openDropdown === item.title ? 'rotate-180' : ''
                  } text-gray-400`} />
              )}
            </div>

            {/* Dropdown Menu */}
            {item.children && openDropdown === item.title && !isCollapsed && (
              <div className="ml-4 pl-3 border-l-2 border-gray-100 animate-slideDown">
                {item.children.map((child) => (
                  <div
                    key={child.path}
                    onClick={() => navigate(child.path)}
                    className={`py-2 px-3 rounded-lg cursor-pointer text-sm
                      transition-colors duration-200
                      ${location.pathname === child.path
                        ? "bg-blue-50 text-blue-600"
                        : "hover:bg-gray-100"}`}
                  >
                    {child.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Logout Button */}
        <div
          onClick={handleLogout}
          className="mt-auto mx-2 mb-4 p-3 rounded-lg cursor-pointer
            text-red-600 hover:bg-red-50 transition-colors
            border-t border-gray-100"
        >
          <div className="flex items-center gap-3">
            <RiLogoutBoxRLine size={20} />
            {!isCollapsed && <span className="text-sm">Đăng xuất</span>}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
