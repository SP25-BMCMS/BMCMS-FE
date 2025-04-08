// src/routes/AppRoutes.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"
import Login from "@/pages/auth/login"
import DashboardLayout from "@/layouts/DashboardLayout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import PublicRoute from "@/components/auth/PublicRoute"
import Resident from "@/pages/Resident"
import StaffManagement from "@/pages/StaffManagement"
import Building from "@/pages/BuildingManagement"
import CrackManagement from "@/pages/CrackManagement"
import DetailCrack from "@/components/crackManager/DetailCrack/DetailCrack"
import DetailLayout from "@/layouts/DetailLayout"
import TaskManagement from "@/pages/TaskManagement"
import Calendar from "@/pages/Calendar"
import ScheduleJob from "@/pages/scheduleManager/ScheduleJob"

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
            <Route path="/resident" element={<Resident />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/building" element={<Building />} />
            <Route path="/worklog" element={<div>WorkLog Content</div>} />
            <Route path="/crack" element={<CrackManagement />} />
            <Route path="/calendar" element={<Calendar />} />
          </Route>
          <Route element={<DetailLayout />}>
            <Route path="/crack/detail/:id" element={<DetailCrack />} />
            <Route path="/schedule-job/:scheduleId" element={<ScheduleJob />} />
          </Route>
        </Route>

        {/* Đường dẫn mặc định - chuyển hướng dựa trên trạng thái xác thực tạm thời tắt sau khi sửa xong có thể mở lại */}
        <Route
          path="*"
          element={
            localStorage.getItem("bmcms_token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes
