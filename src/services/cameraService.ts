import http from '@/lib/http'
import type { Camera, CreateCameraRequest, PaginatedResponse } from '@/types'

export interface CameraQueryParams {
  premise_id?: string
}

class CameraService {
  private readonly baseUrl = '/api/v1/cameras'

  async getAll(params?: CameraQueryParams): Promise<PaginatedResponse<Camera>> {
    const queryParams = new URLSearchParams()

    if (params?.premise_id) queryParams.append('premise_id', params.premise_id.toString())

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl
    const response = await http.get<PaginatedResponse<Camera>>(url, {
      baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
    })
    return response.payload
  }

  async getById(id: string): Promise<Camera> {
    const response = await http.get<Camera>(`${this.baseUrl}/${id}`)
    return response.payload
  }

  async create(data: CreateCameraRequest): Promise<Camera> {
    const response = await http.post<Camera>(this.baseUrl, data)
    return response.payload
  }

  async update(id: string, data: Partial<CreateCameraRequest>): Promise<Camera> {
    const response = await http.put<Camera>(`${this.baseUrl}/${id}`, data)
    return response.payload
  }

  async delete(id: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`)
  }

  async toggleActive(id: string): Promise<Camera> {
    const response = await http.patch<Camera>(`${this.baseUrl}/${id}/toggle-active`, {})
    return response.payload
  }

  // Streaming related methods (existing functionality)
  async publish(cameraId: string, offer: any) {
    const url = `${this.baseUrl}/${cameraId}/publish`
    return http.post(url, { offer })
  }

  async join(cameraId: string) {
    const url = `${this.baseUrl}/${cameraId}/join`
    return http.post(url, {})
  }

  // Camera status methods
  async checkStatus(id: string): Promise<{ isOnline: boolean; lastSeen?: string }> {
    const response = await http.get<{ isOnline: boolean; lastSeen?: string }>(
      `${this.baseUrl}/${id}/status`,
    )
    return response.payload
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}/test-connection`,
      {},
    )
    return response.payload
  }
}

export const cameraService = new CameraService()
