import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { sidebarItems } from "@/components/Sidebar"; // Import sidebarItems để lấy tiêu đề động

const DashboardLayout = () => {
  const isAuthenticated = localStorage.getItem("bmcms_token");
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Lấy tiêu đề động từ sidebarItems dựa vào đường dẫn hiện tại
  const currentTitle =
    sidebarItems.find((item) => item.path === location.pathname)?.title ||
    "Dashboard";

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Tiêu đề động */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 ml-[8rem] mt-[10px] text-[50px]">
          {currentTitle}
        </h1>

        {/* Outlet để render các trang con */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
