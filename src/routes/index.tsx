// src/routes/AppRoutes.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/auth/login'
import DashboardLayout from '@/layouts/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PublicRoute from '@/components/auth/PublicRoute'
import Resident from '@/pages/Resident'
import StaffManagement from '@/pages/StaffManagement'
import Building from '@/pages/BuildingManagement'
import BuildingForManager from '@/pages/BuildingForManager'
import BuildingDetail from '@/pages/BuildingDetail'
import CrackManagement from '@/pages/CrackManagement'
import DetailCrack from '@/components/crackManager/DetailCrack/DetailCrack'
import DetailLayout from '@/layouts/DetailLayout'
import BuildingDetailLayout from '@/layouts/BuildingDetailLayout'
import TaskManagement from '@/pages/TaskManagement'
import TaskDetail from '@/components/TaskManager/TaskDetail'
import Calendar from '@/pages/Calendar'
import ScheduleJob from '@/pages/scheduleManager/ScheduleJob'
import MaterialManagement from '@/pages/MaterialManagement'
import MaterialDetail from '@/pages/MaterialDetail'
import { useAuth } from '@/hooks/useAuth'
import WorkLog from '@/pages/WorkLog'
import Dashboard from '@/pages/Dashboard'
import MaintenanceCycleManagement from '@/pages/MaintenanceCycle'
import MainLayout from '@/layouts/MainLayout'

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  const token = localStorage.getItem('bmcms_token')

  if (loading) {
    return <div>Loading...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - Các đường dẫn không yêu cầu xác thực */}
      <Route element={<PublicRoute />}>
        {/* <Route element={<MainLayout />}> */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {/* </Route> */}
      </Route>

      {/* Protected Routes - Các đường dẫn yêu cầu xác thực */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Routes cho cả Admin và Manager */}
          <Route
            path="/dashboard"
            element={
              <RoleBasedRoute allowedRoles={['Admin', 'Manager']}>
                <Dashboard />
              </RoleBasedRoute>
            }
          />
          {/* Routes chỉ cho Admin */}
          <Route
            path="/resident"
            element={
              <RoleBasedRoute allowedRoles={['Admin']}>
                <Resident />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/building"
            element={
              <RoleBasedRoute allowedRoles={['Admin']}>
                <Building />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <RoleBasedRoute allowedRoles={['Admin']}>
                <StaffManagement />
              </RoleBasedRoute>
            }
          />

          {/* Routes chỉ cho Manager */}
          <Route
            path="/buildings-for-manager"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <BuildingForManager />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <TaskManagement />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/crack"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <CrackManagement />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <MaterialManagement />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/worklog"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <WorkLog />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <Calendar />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/maintenance-cycles"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <MaintenanceCycleManagement />
              </RoleBasedRoute>
            }
          />
        </Route>

        {/* Sử dụng BuildingDetailLayout cho BuildingDetail */}
        <Route element={<BuildingDetailLayout />}>
          <Route
            path="/buildingdetails/:id"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <BuildingDetail />
              </RoleBasedRoute>
            }
          />
        </Route>

        <Route element={<DetailLayout />}>
          <Route
            path="/crack/detail/:id"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <DetailCrack />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/schedule-job/:scheduleId"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <ScheduleJob />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/materials/:materialId"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <MaterialDetail />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/task-detail/:taskId"
            element={
              <RoleBasedRoute allowedRoles={['Manager']}>
                <TaskDetail />
              </RoleBasedRoute>
            }
          />
        </Route>
      </Route>

      {/* Đường dẫn mặc định */}
      <Route
        path="*"
        element={
          localStorage.getItem('bmcms_token') ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  )
}

export default AppRoutes
