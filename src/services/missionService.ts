import http from '@/lib/http'
import type { GuidanceTemplate, SuccessResApi } from '@/types'

class GuidanceTemplateService {
  private readonly baseUrl = '/api/v1/guidance-templates'

  async getGuidances(): Promise<GuidanceTemplate[]> {
    const response = await http.get<SuccessResApi<GuidanceTemplate[]>>(`${this.baseUrl}`)
    return response.payload.data
  }
}

export const guidanceTemplateService = new GuidanceTemplateService()
