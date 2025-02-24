// src/components/DashboardLayout.tsx
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from "@/components/Sidebar";

const DashboardLayout = () => {
  const isAuthenticated = localStorage.getItem('bmcms_token');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;