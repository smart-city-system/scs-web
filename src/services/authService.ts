import http from '@/lib/http'
import type { LoginResponse, SuccessResApi, ValidateTokenResponse } from '@/types'

class AuthService {
  private basePath = '/api/v1'
  private readonly loginUrl = '/auth/login'
  private readonly registerUrl = '/register'
  private readonly logoutUrl = '/logout'

  //backend api path
  private readonly validateTokenFromServerUrl = '/api/v1/auth/validate-token'
  private readonly loginFromServerUrl = '/api/v1/auth/login'

  async login(email: string, password: string, baseUrl: string): Promise<LoginResponse> {
    const response = await http.post<SuccessResApi<LoginResponse>>(
      `${this.basePath}${this.loginUrl}`,
      {
        email,
        password,
      },
      { baseUrl: baseUrl, skipAuth: true }, // Skip auth for login endpoint
    )
    return response.payload.data
  }
  async auth(token: string): Promise<LoginResponse> {
    const response = await http.post<SuccessResApi<LoginResponse>>(
      '/api/auth',
      {
        token,
      },
      { baseUrl: '', skipAuth: true }, // Skip auth for login endpoint
    )
    return response.payload.data
  }

  async validateToken(token: string, baseUrl: string): Promise<ValidateTokenResponse> {
    const response = await http.post<SuccessResApi<ValidateTokenResponse>>(
      this.validateTokenFromServerUrl,
      {
        token,
      },
      { baseUrl, skipAuth: true }, // Skip auth for token validation
    )
    return response.payload.data
  }
}
export const authService = new AuthService()
