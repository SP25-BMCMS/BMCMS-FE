// src/routes/AppRoutes.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/auth/login";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes - Các đường dẫn không yêu cầu xác thực */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes - Các đường dẫn yêu cầu xác thực */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
            <Route path="/customer" element={<div>Customer Content</div>} />
            <Route path="/staff" element={<div>Staff Content</div>} />
            <Route path="/tasks" element={<div>Tasks Content</div>} />
            <Route path="/pictures" element={<div>Pictures Content</div>} />
            <Route path="/worklog" element={<div>WorkLog Content</div>} />
          </Route>
        </Route>

        {/* Đường dẫn mặc định - chuyển hướng dựa trên trạng thái xác thực */}
        <Route path="*" element={
          localStorage.getItem("bmcms_token") ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/" replace />
        } />
      </Routes>
    </Router>
  );
}

export default AppRoutes;