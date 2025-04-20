import React from 'react';
import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { getBuildingDetail } from '@/services/building';
import { Building2 } from 'lucide-react';

const BuildingDetailLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAuthenticated = localStorage.getItem('bmcms_token');
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Fetch building detail để lấy tên tòa nhà
  const { data: buildingDetailData } = useQuery({
    queryKey: ['buildingDetail', id],
    queryFn: () => getBuildingDetail(id || ''),
    enabled: !!id,
  });

  const buildingName = buildingDetailData?.data?.name || '';

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Placeholder để giữ không gian cho sidebar */}
      <div
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 transition-all duration-300`}
      ></div>

      {/* Sidebar */}
      <Sidebar onToggle={setIsSidebarCollapsed} />

      {/* Main Content */}
      <div className="flex-1 p-6 transition-all duration-300">
        {/* Hiển thị "Building + Tên tòa nhà" và Theme Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            {buildingName && (
              <>
                <Building2 className="h-7 w-7 mr-3 text-blue-500" />
                Building {buildingName}
              </>
            )}
          </h1>
          <ThemeToggle />
        </div>

        {/* Outlet để render BuildingDetail */}
        <Outlet />
      </div>
    </div>
  );
};

export default BuildingDetailLayout;
