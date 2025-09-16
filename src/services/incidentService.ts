import http from '@/lib/http'
import { createSearchParams } from '@/lib/utils'
import type {
  CreateIncidentRequest,
  Incident,
  IncidentGuidance,
  PaginatedResponse,
  QueryParams,
  SuccessResApi,
} from '@/types'

class IncidentService {
  private readonly baseUrl = '/api/v1/incidents'

  async createIncident(data: CreateIncidentRequest): Promise<Incident> {
    const response = await http.post<SuccessResApi<Incident>>(`${this.baseUrl}`, data)
    return response.payload.data
  }
  async getAll(params: QueryParams): Promise<PaginatedResponse<Incident>> {
    const queryParams = new URLSearchParams()
    const url = queryParams.toString()
      ? `${this.baseUrl}?${createSearchParams(params)}`
      : this.baseUrl
    const response = await http.get<SuccessResApi<PaginatedResponse<Incident>>>(url)
    return response.payload.data
  }
  async getById(id: string): Promise<Incident> {
    const response = await http.get<SuccessResApi<Incident>>(`${this.baseUrl}/${id}`)
    return response.payload.data
  }

  async getIncidentGuidance(id: string): Promise<IncidentGuidance> {
    const response = await http.get<SuccessResApi<IncidentGuidance>>(
      `${this.baseUrl}/${id}/guidance`,
    )
    return response.payload.data
  }
  async complete(id: string): Promise<void> {
    const response = await http.patch<SuccessResApi<void>>(`${this.baseUrl}/${id}/complete`, {})
    return response.payload.data
  }
}

export const incidentService = new IncidentService()
