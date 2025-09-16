import http from '@/lib/http'
import { createSearchParams } from '@/lib/utils'
import type {
  GuidanceTemplate,
  CreateGuidanceTemplateRequest,
  UpdateGuidanceTemplateRequest,
  PaginatedResponse,
  SuccessResApi,
  QueryParams,
} from '@/types'

export interface GuidanceTemplateQueryParams extends QueryParams {
  category?: string
}

class GuidanceTemplateService {
  private readonly baseUrl = '/api/v1/guidance-templates'

  async getAll(params?: GuidanceTemplateQueryParams): Promise<GuidanceTemplate[]> {
    const url =
      params && Object.keys(params).length > 0
        ? `${this.baseUrl}?${createSearchParams(params)}`
        : this.baseUrl

    const response = await http.get<SuccessResApi<GuidanceTemplate[]>>(url)
    return response.payload.data
  }

  async getGuidances(): Promise<GuidanceTemplate[]> {
    const response = await http.get<SuccessResApi<GuidanceTemplate[]>>(`${this.baseUrl}`)
    return response.payload.data
  }

  async getById(id: string): Promise<GuidanceTemplate> {
    const response = await http.get<SuccessResApi<GuidanceTemplate>>(`${this.baseUrl}/${id}`)
    return response.payload.data
  }

  async create(data: CreateGuidanceTemplateRequest): Promise<GuidanceTemplate> {
    const response = await http.post<SuccessResApi<GuidanceTemplate>>(this.baseUrl, data)
    return response.payload.data
  }

  async update(
    id: string,
    data: Partial<CreateGuidanceTemplateRequest>,
  ): Promise<GuidanceTemplate> {
    console.log('data', data)
    const response = await http.put<SuccessResApi<GuidanceTemplate>>(`${this.baseUrl}/${id}`, data)
    return response.payload.data
  }

  async delete(id: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`)
  }

  // Get categories for filtering
  async getCategories(): Promise<string[]> {
    const response = await http.get<SuccessResApi<string[]>>(`${this.baseUrl}/categories`)
    return response.payload.data
  }
}

export const guidanceTemplateService = new GuidanceTemplateService()
