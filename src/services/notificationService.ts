import http from '@/lib/http'
import { createSearchParams } from '@/lib/utils'
import type {
  Notification,
  CreateNotificationRequest,
  NotificationQueryParams,
  PaginatedResponse,
  SuccessResApi,
} from '@/types'

class NotificationService {
  private readonly baseUrl = '/notifications'

  async getAll(params?: NotificationQueryParams): Promise<PaginatedResponse<Notification>> {
    const url =
      params && Object.keys(params).length > 0
        ? `${this.baseUrl}?${createSearchParams(params)}`
        : this.baseUrl

    const response = await http.get<SuccessResApi<PaginatedResponse<Notification>>>(url, {
      baseUrl: process.env.NEXT_PUBLIC_NOTIFICATION_ENDPOINT as string,
    })
    return response.payload.data
  }

  async getById(id: string): Promise<Notification> {
    const response = await http.get<SuccessResApi<Notification>>(`${this.baseUrl}/${id}`, {
      baseUrl: process.env.NEXT_PUBLIC_NOTIFICATION_ENDPOINT as string,
    })
    return response.payload.data
  }

  async create(data: CreateNotificationRequest): Promise<Notification> {
    const response = await http.post<SuccessResApi<Notification>>(this.baseUrl, data)
    return response.payload.data
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await http.patch<SuccessResApi<Notification>>(`${this.baseUrl}/read`, {
      id,
    }, {
      baseUrl: process.env.NEXT_PUBLIC_NOTIFICATION_ENDPOINT as string,
    })
    return response.payload.data
  }

  async markAsUnread(id: string): Promise<Notification> {
    const response = await http.patch<SuccessResApi<Notification>>(
      `${this.baseUrl}/${id}/unread`,
      {
        baseUrl: process.env.NEXT_PUBLIC_NOTIFICATION_ENDPOINT as string,
      },
    )
    return response.payload.data
  }

  async markAllAsRead(userId?: string): Promise<void> {
    const url = userId
      ? `${this.baseUrl}/mark-all-read?user_id=${userId}`
      : `${this.baseUrl}/mark-all-read`
    await http.patch(url, {})
  }

  async delete(id: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`)
  }

  async getUnreadCount(userId?: string): Promise<number> {
    const url = userId
      ? `${this.baseUrl}/unread-count?user_id=${userId}`
      : `${this.baseUrl}/unread-count`
    const response = await http.get<SuccessResApi<{ count: number }>>(url)
    return response.payload.data.count
  }
}

export const notificationService = new NotificationService()
