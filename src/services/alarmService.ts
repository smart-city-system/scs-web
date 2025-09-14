import http from '@/lib/http'
import type { Alarm, SuccessResApi } from '@/types'

class AlarmService {
  private readonly baseUrl = '/api/v1/alarms'

  async getAlarms({ status }: { status: string }): Promise<Alarm[]> {
    const queryParams = new URLSearchParams()
    if (status) {
      queryParams.append('status', status)
    }

    const response = await http.get<SuccessResApi<Alarm[]>>(
      `${this.baseUrl}?${queryParams.toString()}`,
    )
    return response.payload.data
  }
  async updateAlarmStatus(id: string, status: string): Promise<Alarm> {
    const response = await http.patch<SuccessResApi<Alarm>>(`${this.baseUrl}/${id}`, { status })
    return response.payload.data
  }
}

export const alarmService = new AlarmService()
