'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services/notificationService'
import { useWebsocketNotification } from '@/hooks/use-websocket'
import { useAuth } from '@/hooks/use-auth'
import type { Notification, WsMessage } from '@/types'
import { toast } from 'sonner'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => void
  markAsUnread: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const wsContext = useWebsocketNotification()
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  console.log({ user })
  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      notificationService.getAll({
        page: 1,
        limit: 50,
        sort_by: 'created_at',
        sort_order: 'desc',
      }),
    enabled: !!user?.user_id,
  })

  // Update local state when data changes
  useEffect(() => {
    if (notificationsData?.data) {
      setNotifications(notificationsData.data)
      setUnreadCount(notificationsData.data.filter((n) => !n.is_read).length)
    }
  }, [notificationsData])

  // Listen to WebSocket notifications
  useEffect(() => {
    if (wsContext?.lastMessage) {
      const message = wsContext.lastMessage as WsMessage

      if (message.event === 'notification') {
        try {
          const notificationData = message.payload as Notification

          // Add new notification to the list
          setNotifications((prev) => [notificationData, ...prev])

          // Show toast notification
          toast.info(notificationData.title, {
            description: notificationData.message,
          })

          // Invalidate queries to update counts
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
        } catch (error) {
          console.error('Error processing notification:', error)
        }
      }
    }
  }, [wsContext?.lastMessage, queryClient])

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (updatedNotification) => {
      setNotifications((prev) =>
        prev.map((n) => {
          return n.id === updatedNotification.id
            ? {
                ...n,
                is_read: true,
              }
            : n
        }),
      )
      setUnreadCount((prev) => prev - 1)
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: () => {
      toast.error('Failed to mark notification as read')
    },
  })

  // Mark as unread mutation
  const markAsUnreadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsUnread(id),
    onSuccess: (updatedNotification) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === updatedNotification.id
            ? {
                ...n,
                is_read: false,
              }
            : n,
        ),
      )
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: () => {
      toast.error('Failed to mark notification as unread')
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user?.id),
    onSuccess: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read')
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: (_, deletedId) => {
      setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.success('Notification deleted')
    },
    onError: () => {
      toast.error('Failed to delete notification')
    },
  })

  const markAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id)
    },
    [markAsReadMutation],
  )

  const markAsUnread = useCallback(
    (id: string) => {
      markAsUnreadMutation.mutate(id)
    },
    [markAsUnreadMutation],
  )

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const deleteNotification = useCallback(
    (id: string) => {
      deleteNotificationMutation.mutate(id)
    },
    [deleteNotificationMutation],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const refreshNotifications = useCallback(() => {
    refetch()
    setUnreadCount(notifications.filter((n) => !n.is_read).length)
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
  }, [refetch, queryClient])

  const value: NotificationContextType = {
    notifications,
    unreadCount: unreadCount || 0,
    isLoading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
