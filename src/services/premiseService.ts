import http from '@/lib/http'
import { createSearchParams } from '@/lib/utils'
import type {
  CreatePremiseRequest,
  PaginatedResponse,
  Premise,
  QueryParams,
  SuccessResApi,
  User,
} from '@/types'

export interface PremiseQueryParams {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

class PremiseService {
  private readonly baseUrl = '/api/v1/premises'

  async getAll(params: QueryParams): Promise<PaginatedResponse<Premise>> {
    const queryParams = new URLSearchParams()
    const url = queryParams.toString()
      ? `${this.baseUrl}?${createSearchParams(params)}`
      : this.baseUrl
    const response = await http.get<SuccessResApi<PaginatedResponse<Premise>>>(url)
    return response.payload.data
  }

  async getById(id: string): Promise<Premise> {
    const response = await http.get<SuccessResApi<Premise>>(`${this.baseUrl}/${id}`)
    return response.payload.data
  }

  async getAvailableUsers(premiseId: string): Promise<User[]> {
    const response = await http.get<SuccessResApi<User[]>>(`${this.baseUrl}/${premiseId}/users`)
    return response.payload.data
  }

  async create(data: CreatePremiseRequest): Promise<Premise> {
    const response = await http.post<Premise>(this.baseUrl, data)
    return response.payload
  }

  async update(id: string, data: Partial<CreatePremiseRequest>): Promise<Premise> {
    const response = await http.patch<Premise>(`${this.baseUrl}/${id}`, data)
    return response.payload
  }

  async delete(id: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`)
  }

  async toggleActive(id: string): Promise<Premise> {
    const response = await http.patch<Premise>(`${this.baseUrl}/${id}/toggle-active`, {})
    return response.payload
  }

  async assignUsers(
    premiseId: string,
    addedUsers: string[],
    removedUsers: string[],
  ): Promise<void> {
    await http.post<SuccessResApi<void>>(`${this.baseUrl}/${premiseId}/assign-users`, {
      added_users: addedUsers,
      removed_users: removedUsers,
    })
  }

  // Get premises for dropdown/select options
  async getOptions(): Promise<Array<{ value: string; label: string }>> {
    const response = await http.get<Premise[]>(`${this.baseUrl}/options`)
    return response.payload.map((premise) => ({
      value: premise.id,
      label: premise.name,
    }))
  }
}

export const premiseService = new PremiseService()
