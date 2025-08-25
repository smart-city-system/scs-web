import { authService } from '@/services/authService'
import type { User } from '@/types'
// biome-ignore lint/style/useImportType: <explanation>
import { NextRequest, NextResponse } from 'next/server'
import { getTokenClaims } from './utils'

export interface AuthContext {
  protect: () => Promise<NextResponse | undefined>
  user?: User | null
  isAuthenticated: boolean
}

export type MiddlewareHandler = (
  auth: AuthContext,
  req: NextRequest,
) => NextResponse | Promise<NextResponse | undefined>

export function customMiddleware(handler: MiddlewareHandler, options?: { signInUrl?: string }) {
  return async (req: NextRequest) => {
    let isAuthenticated = false
    let user = null
    const token = req.cookies.get('sessionToken')?.value
    if (token) {
      const claims = getTokenClaims(token)
      const baseUrl = process.env.NEXT_PUBLIC_USER_ENDPOINT as string
      const validation = await authService.validateToken(token, baseUrl)
      if (validation.valid) {
        isAuthenticated = true
        user = {
          user_id: claims.user_id,
          role: claims.role,
        }
      }
    }
    const auth: AuthContext = {
      isAuthenticated,
      user,
      protect: async () => {
        if (!isAuthenticated) {
          const signInUrl = options?.signInUrl ?? '/sign-in'
          return NextResponse.redirect(
            new URL(`${signInUrl}?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url),
          )
        }
      },
    }
    // 🚨 Redirect authenticated users away from login/signup
    if (isAuthenticated && ['/sign-in', '/sign-up'].includes(req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    // run your handler
    const result: any = await handler(auth, req)
    if (result instanceof NextResponse) return result

    return NextResponse.next({
      request: {
        headers: new Headers({
          ...Object.fromEntries(req.headers),
          'x-authenticated': String(auth.isAuthenticated),
          'x-user': auth.user ? JSON.stringify(auth.user) : '',
        }),
      },
    })
  }
}
