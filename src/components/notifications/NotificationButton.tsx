import React, { useState } from 'react';
import { RiNotification3Line, RiNotification3Fill, RiCheckLine } from 'react-icons/ri';
import { useNotificationStream } from '@/hooks/useNotificationStream';

const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, clearAll } =
    useNotificationStream();

  const handleNotificationClick = (notification: { id: string }) => {
    markAsRead(notification.id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <RiNotification3Fill className="h-6 w-6" />
        ) : (
          <RiNotification3Line className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label="Mark all as read"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors ${
                      notification.isRead
                        ? 'bg-gray-50 dark:bg-gray-700/50'
                        : 'bg-blue-50 dark:bg-blue-900/10'
                    } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            notification.isRead
                              ? 'text-gray-600 dark:text-gray-300'
                              : 'text-blue-900 dark:text-blue-100'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p
                          className={`mt-1 text-sm ${
                            notification.isRead
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          {notification.content}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(notification.createdAt).toLocaleString('vi-VN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {notification.isRead ? (
                        <RiCheckLine className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
