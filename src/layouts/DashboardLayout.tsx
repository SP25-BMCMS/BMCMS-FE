import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { sidebarItems } from "@/components/layout/Sidebar"; // Import sidebarItems để lấy tiêu đề động

const DashboardLayout = () => {
  const isAuthenticated = localStorage.getItem("bmcms_token");
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Hàm lấy tiêu đề động từ sidebarItems dựa vào đường dẫn hiện tại
  const getCurrentTitle = () => {
    // Kiểm tra các mục cấp cao nhất
    const mainItem = sidebarItems.find((item) => item.path === location.pathname);
    if (mainItem) return mainItem.title;
    
    // Kiểm tra các mục con
    for (const item of sidebarItems) {
      if (item.children) {
        const childItem = item.children.find(
          (child) => child.path === location.pathname
        );
        if (childItem) return childItem.title;
      }
    }
    
    // Mặc định trả về Dashboard nếu không tìm thấy
    return "Dashboard";
  };

  const currentTitle = getCurrentTitle();

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
