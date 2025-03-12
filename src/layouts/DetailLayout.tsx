import React from 'react';
import { Outlet } from 'react-router-dom';

const DetailLayout: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-auto">
      <Outlet />
    </div>
  );
};

export default DetailLayout;