import http from '@/lib/http'
import { createSearchParams } from '@/lib/utils'
import type {
  Camera,
  CreateCameraRequest,
  PaginatedResponse,
  SuccessResApi,
  QueryParams,
} from '@/types'

export interface CameraQueryParams extends QueryParams {
  premise_id?: string
}

class CameraService {
  private readonly baseUrl = '/api/v1/cameras'

  async getAll(params?: CameraQueryParams): Promise<PaginatedResponse<Camera>> {
    const url =
      params && Object.keys(params).length > 0
        ? `${this.baseUrl}?${createSearchParams(params)}`
        : this.baseUrl

    const response = await http.get<SuccessResApi<PaginatedResponse<Camera>>>(url, {
      baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
    })
    return response.payload.data
  }

  async getById(id: string): Promise<Camera> {
    const response = await http.get<SuccessResApi<Camera>>(`${this.baseUrl}/${id}`, {
      baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
    })
    return response.payload.data
  }

  async create(data: CreateCameraRequest): Promise<Camera> {
    const response = await http.post<SuccessResApi<Camera>>(this.baseUrl, data, {
      baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
    })
    return response.payload.data
  }

  async update(id: string, data: Partial<CreateCameraRequest>): Promise<Camera> {
    const response = await http.put<SuccessResApi<Camera>>(`${this.baseUrl}/${id}`, data, {
      baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
    })
    return response.payload.data
  }

  async delete(id: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`, {
      baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
    })
  }

  async toggleActive(id: string): Promise<Camera> {
    const response = await http.patch<SuccessResApi<Camera>>(
      `${this.baseUrl}/${id}/toggle-active`,
      {},
      {
        baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
      },
    )
    return response.payload.data
  }

  // Streaming related methods (existing functionality)
  async publish(cameraId: string, offer: RTCSessionDescriptionInit) {
    const url = `${this.baseUrl}/${cameraId}/publish`
    return http.post(
      url,
      { offer },
      {
        baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
      },
    )
  }

  async join(cameraId: string) {
    const url = `${this.baseUrl}/${cameraId}/join`
    return http.post(
      url,
      {},
      {
        baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
      },
    )
  }

  // Camera status methods
  async checkStatus(id: string): Promise<{ isOnline: boolean; lastSeen?: string }> {
    const response = await http.get<SuccessResApi<{ isOnline: boolean; lastSeen?: string }>>(
      `${this.baseUrl}/${id}/status`,
      {
        baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
      },
    )
    return response.payload.data
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await http.post<SuccessResApi<{ success: boolean; message: string }>>(
      `${this.baseUrl}/${id}/test-connection`,
      {},
      {
        baseUrl: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT as string,
      },
    )
    return response.payload.data
  }
}

export const cameraService = new CameraService()
