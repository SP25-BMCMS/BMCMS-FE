import apiInstance from '@/lib/axios'
import { Notification, NotificationResponse, MarkAsReadResponse } from '@/types'
import { EventSource } from 'eventsource'

const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data } = await apiInstance.get<NotificationResponse>(`/notifications/user/${userId}`)
    return data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch notifications')
  }
}

const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const { data } = await apiInstance.put<MarkAsReadResponse>(
      `/notifications/read/${notificationId}`
    )
    return data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to mark notification as read')
  }
}

const markAllAsRead = async (userId: string): Promise<Notification[]> => {
  try {
    const { data } = await apiInstance.put<NotificationResponse>(
      `/notifications/mark-all-read/${userId}`
    )
    return data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read')
  }
}

const subscribeToNotifications = (
  userId: string,
  onMessage: (notification: Notification) => void
) => {
  let eventSource: EventSource | null = null
  let reconnectTimeout: number | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY = 5000 // 5 seconds

  const connect = () => {
    if (eventSource) {
      eventSource.close()
    }

    // Get the base URL and token
    const baseURL = apiInstance.defaults.baseURL || ''
    const url = `${baseURL}/notifications/stream/${userId}`

    // Create EventSource
    eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log('SSE Connection established')
      reconnectAttempts = 0
    }

    eventSource.onmessage = event => {
      try {
        const notification = JSON.parse(event.data) as Notification
        onMessage(notification)
      } catch (error) {
        console.error('Error parsing notification:', error)
      }
    }

    eventSource.onerror = error => {
      console.error('SSE Error:', error)

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)

        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout)
        }

        reconnectTimeout = window.setTimeout(() => {
          connect()
        }, RECONNECT_DELAY)
      } else {
        console.error('Max reconnection attempts reached')
        if (eventSource) {
          eventSource.close()
        }
      }
    }
  }

  // Initial connection
  connect()

  // Cleanup function
  return () => {
    if (eventSource) {
      eventSource.close()
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
    }
  }
}

const notificationApi = {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  subscribeToNotifications,
}

export default notificationApi
