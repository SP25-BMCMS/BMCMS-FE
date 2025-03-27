import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RiDashboardLine,
  RiTeamLine,
  RiUserSettingsLine,
  RiTaskLine,
  RiTimeLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiLogoutBoxRLine,
} from "react-icons/ri";
import { IoIosArrowDown } from "react-icons/io";
import { FaRegBuilding } from "react-icons/fa";
import { FaHouseCrack } from "react-icons/fa6";
import toast from "react-hot-toast";
import "@/assets/css/Sidebar.css";

// Danh sách sidebar items (export để dùng trong DashboardLayout.tsx)
export const sidebarItems = [
  { title: "Dashboard", path: "/dashboard", icon: <RiDashboardLine /> },
  { title: "Residents", path: "/resident", icon: <RiTeamLine /> },
  { title: "Staff Manager", path: "/staff", icon: <RiUserSettingsLine /> },
  { title: "Task Management", path: "/tasks", icon: <RiTaskLine /> },
  { title: "BuildingManagent", path: "/building", icon: <FaRegBuilding /> },
  { title: "crackManagent", path: "/crack", icon: <FaHouseCrack /> },
  {
    title: "TimeSheet",
    icon: <RiTimeLine />,
    children: [
      { title: "WorkLog", path: "/worklog" },
      { title: "Calendar", path: "/calendar" },
    ],
  },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState("");

  React.useEffect(() => {
    // Tìm item cha của path hiện tại
    const parentItem = sidebarItems.find(item => 
      item.children && item.children.some(child => child.path === location.pathname)
    );
    
    if (parentItem) {
      // Nếu tìm thấy, mở dropdown của item cha
      setOpenDropdown(parentItem.title);
    } else {
      // Nếu không tìm thấy, đóng tất cả dropdown
      setOpenDropdown("");
    }
  }, [location.pathname]);
  

  const toggleDropdown = (title: string) => {
    setOpenDropdown(openDropdown === title ? "" : title);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (
    path?: string,
    children?: { title: string; path: string }[]
  ) => {
    if (path && location.pathname === path) {
      return true;
    }

    // Kiểm tra nếu có children và một trong các children đang active
    if (children) {
      return children.some((child) => location.pathname === child.path);
    }

    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem("bmcms_token");
    localStorage.removeItem("bmcms_refresh_token");
    toast.success("Đăng xuất thành công");
    navigate("/");
  };

  return (
    <div
      className={`bg-gray-100 min-h-screen transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex p-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-600 hover:text-gray-800"
        >
          {isCollapsed ? (
            <RiMenuUnfoldLine size={30} />
          ) : (
            <RiMenuFoldLine size={30} />
          )}
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-[52px]">
        {sidebarItems.map((item, index) => (
          <div key={index}>
            <div
              onClick={() =>
                item.children ? toggleDropdown(item.title) : navigate(item.path)
              }
              className={`flex items-center px-4 py-3 cursor-pointer
                ${
                  isActive(item.path, item.children)
                    ? "bg-[#c7c7c7] text-black"
                    : "hover:bg-gray-200"
                }
                ${!isCollapsed ? "justify-between" : "justify-center"}`}
            >
              <div
                className={`flex items-center ${!isCollapsed ? "gap-4" : ""}`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && (
                  <span className="text-gray-700">{item.title}</span>
                )}
              </div>
              {!isCollapsed && item.children && (
                <span
                  className={`icon-wrapper ${
                    openDropdown === item.title ? "icon-rotate" : ""
                  }`}
                >
                  <IoIosArrowDown className="text-gray-600" />
                </span>
              )}
            </div>
            {item.children && openDropdown === item.title && !isCollapsed && (
              <div className="ml-8">
                {item.children.map((child, childIndex) => (
                  <div
                    key={childIndex}
                    onClick={() => navigate(child.path)}
                    className={`py-2 px-4 cursor-pointer hover:bg-gray-200 ${
                      location.pathname === child.path
                        ? "bg-[#e0e0e0] font-medium"
                        : ""
                    }`}
                  >
                    {child.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div
          onClick={handleLogout}
          className="flex items-center px-4 py-3 mt-auto cursor-pointer hover:bg-red-100 text-red-600"
        >
          <span className="text-xl">
            <RiLogoutBoxRLine />
          </span>
          {!isCollapsed && <span className="ml-4">Logout</span>}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
