// src/routes/PublicRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import authApi from "@/services/auth";

const PublicRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Kiểm tra xem có token không
      const token = localStorage.getItem("bmcms_token");
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Xác minh tính hợp lệ của token bằng cách lấy thông tin người dùng hiện tại
      try {
        const user = await authApi.getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // Bạn có thể thêm hiệu ứng loading ở đây
    return <div>Đang tải...</div>;
  }
  
  if (isAuthenticated) {
    // Chuyển hướng sang dashboard nếu đã đăng nhập
    return <Navigate to="/dashboard" replace />;
  }

  // Render các route con
  return <Outlet />;
};

export default PublicRoute;