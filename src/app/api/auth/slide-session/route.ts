import { getTokenClaims } from '@/lib/utils'
import { authService } from '@/services/authService'

export async function POST(request: Request) {
  const body = await request.json()
  const email = body.email as string
  const password = body.password as string
  const baseUrl = process.env.USER_ENDPOINT as string

  const { token } = await authService.loginFromServer(email, password, baseUrl)
  const expiresDate = new Date(getTokenClaims(token).exp * 1000)
  return Response.json(
    {
      message: 'Login successfully',
    },
    {
      status: 200,
      headers: {
        'Set-Cookie': `sessionToken=${token}; Path=/; HttpOnly; Expires=${expiresDate}; SameSite=Lax; Secure`,
      },
    },
  )
}
