import React from 'react';
import { Outlet } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

const DetailLayout: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-auto">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  );
};

export default DetailLayout;