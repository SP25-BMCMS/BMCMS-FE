import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RiDashboardLine,
  RiTeamLine,
  RiUserSettingsLine,
  RiTaskLine,
  RiImageLine,
  RiTimeLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiLogoutBoxRLine,
} from "react-icons/ri";
import toast from "react-hot-toast";

// Danh sách sidebar items (export để dùng trong DashboardLayout.tsx)
export const sidebarItems = [
  { title: "Dashboard", path: "/dashboard", icon: <RiDashboardLine /> },
  { title: "Residents", path: "/resident", icon: <RiTeamLine /> },
  { title: "Staff Manager", path: "/staff", icon: <RiUserSettingsLine /> },
  { title: "Task Management", path: "/tasks", icon: <RiTaskLine /> },
  { title: "Picture Management", path: "/pictures", icon: <RiImageLine /> },
  { title: "WorkLog", path: "/worklog", icon: <RiTimeLine /> },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
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
        <button onClick={toggleSidebar} className="text-gray-600 hover:text-gray-800">
          {isCollapsed ? <RiMenuUnfoldLine size={30} /> : <RiMenuFoldLine size={30} />}
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-[52px]">
        {sidebarItems.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className={`flex items-center px-4 py-3 cursor-pointer
              ${isActive(item.path) ? "bg-[#c7c7c7] text-black" : "hover:bg-gray-200"}
              ${!isCollapsed ? "gap-4" : "justify-center"}`}
          >
            <span className="text-xl">{item.icon}</span>
            {!isCollapsed && <span className="text-gray-700">{item.title}</span>}
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
