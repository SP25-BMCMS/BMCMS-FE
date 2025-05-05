import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex justify-between items-center px-4 sm:px-6 py-4">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white truncate">
              Building Management System
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
