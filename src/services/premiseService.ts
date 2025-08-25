import http from '@/lib/http'
import { createSearchParams } from '@/lib/utils'
import type {
  CreatePremiseRequest,
  PaginatedResponse,
  Premise,
  QueryParams,
  SuccessResApi,
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
    const response = await http.get<Premise>(`${this.baseUrl}/${id}`)
    return response.payload
  }

  async create(data: CreatePremiseRequest): Promise<Premise> {
    const response = await http.post<Premise>(this.baseUrl, data)
    return response.payload
  }

  async update(id: string, data: Partial<CreatePremiseRequest>): Promise<Premise> {
    const response = await http.put<Premise>(`${this.baseUrl}/${id}`, data)
    return response.payload
  }

  async delete(id: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`)
  }

  async toggleActive(id: string): Promise<Premise> {
    const response = await http.patch<Premise>(`${this.baseUrl}/${id}/toggle-active`, {})
    return response.payload
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
