import http from '@/lib/http'
import type { LoginResponse, SuccessResApi, ValidateTokenResponse } from '@/types'

class AuthService {
  private baseUrl = '/api/auth'
  private readonly loginUrl = '/login'
  private readonly registerUrl = '/register'
  private readonly logoutUrl = '/logout'

  //backend api path
  private readonly validateTokenFromServerUrl = '/api/v1/auth/validate-token'
  private readonly loginFromServerUrl = '/api/v1/auth/login'

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await http.post<SuccessResApi<LoginResponse>>(
      `${this.baseUrl}${this.loginUrl}`,
      {
        email,
        password,
      },
      { baseUrl: '' },
    )
    return response.payload.data
  }
  async loginFromServer(email: string, password: string, baseUrl: string): Promise<LoginResponse> {
    const response = await http.post<SuccessResApi<LoginResponse>>(
      this.loginFromServerUrl,
      {
        email,
        password,
      },
      { baseUrl },
    )
    return response.payload.data
  }
  async validateToken(token: string, baseUrl: string): Promise<ValidateTokenResponse> {
    const response = await http.post<SuccessResApi<ValidateTokenResponse>>(
      this.validateTokenFromServerUrl,
      {
        token,
      },
      { baseUrl },
    )
    return response.payload.data
  }
}
export const authService = new AuthService()
