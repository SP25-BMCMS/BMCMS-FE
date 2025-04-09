import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Building2,
  Users,
  Calendar,
  Settings,
  FileText,
  AlertCircle,
  LogOut,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/buildings', icon: Building2, label: 'Buildings' },
    { path: '/residents', icon: Users, label: 'Residents' },
    { path: '/staff', icon: Users, label: 'Staff' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/maintenance', icon: AlertCircle, label: 'Maintenance' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">BMCMS</h2>
      </div>
      <nav className="mt-4">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isActive ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-64 p-4">
        <button className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
