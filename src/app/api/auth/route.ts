import { getTokenClaims } from '@/lib/utils'

export async function POST(request: Request) {
  const body = await request.json()
  const sessionToken = body.token as string
  const expiresDate = new Date(getTokenClaims(sessionToken).exp * 1000)
  if (!sessionToken) {
    return Response.json(
      {
        message: 'Token is required',
      },
      {
        status: 400,
      },
    )
  }
  return Response.json(
    {
      message: 'Login successfully',
    },
    {
      status: 200,
      headers: {
        'Set-Cookie': `sessionToken=${sessionToken}; Path=/; HttpOnly; Expires=${expiresDate}; SameSite=Lax; Secure`,
      },
    },
  )
}
