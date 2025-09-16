'use client'

import { Button } from '@/components/ui/button'
import { notificationService } from '@/services/notificationService'
import { useAuth } from '@/hooks/use-auth'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'

export function TestNotificationButton() {
  const { user } = useAuth()

  const createTestNotification = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('User not found')
      
      const notifications = [
        {
          title: 'Security Alert',
          message: 'Unauthorized access detected at main entrance',
          type: 'error' as const,
          user_id: user.id,
        },
        {
          title: 'System Update',
          message: 'Camera system has been updated successfully',
          type: 'success' as const,
          user_id: user.id,
        },
        {
          title: 'Maintenance Reminder',
          message: 'Scheduled maintenance for Building A cameras tomorrow at 2 PM',
          type: 'warning' as const,
          user_id: user.id,
        },
        {
          title: 'New Incident',
          message: 'Incident #INC-2024-001 has been assigned to you',
          type: 'info' as const,
          user_id: user.id,
        },
      ]

      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
      return notificationService.create(randomNotification)
    },
    onSuccess: () => {
      toast.success('Test notification created!')
    },
    onError: (error) => {
      toast.error('Failed to create test notification')
      console.error('Error creating test notification:', error)
    },
  })

  if (!user) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => createTestNotification.mutate()}
      disabled={createTestNotification.isPending}
      className="gap-2"
    >
      <Bell className="h-4 w-4" />
      {createTestNotification.isPending ? 'Creating...' : 'Test Notification'}
    </Button>
  )
}
