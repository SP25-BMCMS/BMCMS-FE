import notificationApi from '@/services/notifications'
import { Notification } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useAuth } from './useAuth'

export const useNotificationStream = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.userId],
    queryFn: () => notificationApi.getNotifications(user?.userId || ''),
    enabled: !!user?.userId,
  })

  // Mark notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: (notificationId: string) => notificationApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] })
    },
  })

  // Mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(user?.userId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] })
    },
  })

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Clear all notifications (local only)
  const clearAll = useCallback(() => {
    // TODO: Add API endpoint for clearing all notifications
  }, [])

  // SSE connection for realtime notifications
  useEffect(() => {
    if (!user?.userId) return

    const unsubscribe = notificationApi.subscribeToNotifications(user.userId, newNotification => {
      queryClient.setQueryData<Notification[]>(['notifications', user.userId], (oldData = []) => {
        return [newNotification, ...oldData]
      })
    })

    return () => {
      unsubscribe()
    }
  }, [user?.userId, queryClient])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
  }
}
