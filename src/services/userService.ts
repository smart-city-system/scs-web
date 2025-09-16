import http from '@/lib/http'
import { createSearchParams } from '@/lib/utils'
import type {
  Camera,
  CreateCameraRequest,
  CreateUserRequest,
  PaginatedResponse,
  QueryParams,
  SuccessResApi,
  User,
} from '@/types'

export interface CameraQueryParams {
  premise_id?: string
}

class UserService {
  private readonly baseUrl = '/api/v1/users'

  async getMe(): Promise<User> {
    const response = await http.get<SuccessResApi<User>>(`${this.baseUrl}/me`, {
      baseUrl: process.env.NEXT_PUBLIC_USER_ENDPOINT as string,
    })
    return response.payload.data
  }

  async getAll(params: QueryParams): Promise<PaginatedResponse<User>> {
    const url =
      params && Object.keys(params).length > 0
        ? `${this.baseUrl}?${createSearchParams(params)}`
        : this.baseUrl

    const response = await http.get<SuccessResApi<PaginatedResponse<User>>>(url, {
      baseUrl: process.env.NEXT_PUBLIC_USER_ENDPOINT as string,
    })
    return response.payload.data
  }
  async create(data: CreateUserRequest): Promise<User> {
    const response = await http.post<SuccessResApi<User>>(`${this.baseUrl}`, data, {
      baseUrl: process.env.NEXT_PUBLIC_USER_ENDPOINT as string,
    })
    return response.payload.data
  }
  async verifyEmail(token: string): Promise<void> {
    const response = await http.post<SuccessResApi<void>>(
      `${this.baseUrl}/verify`,
      { token },
      {
        baseUrl: process.env.NEXT_PUBLIC_USER_ENDPOINT as string,
        skipAuth: true,
      },
    )
    return response.payload.data
  }
}

export const userService = new UserService()
