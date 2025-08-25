/**
 * CORS utility functions for API routes
 */

export function getCorsHeaders(origin?: string) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // In development, allow localhost origins
  // In production, use specific allowed origins
  const allowedOrigin = isDevelopment
    ? origin?.includes('localhost')
      ? origin
      : 'http://localhost:3000'
    : process.env.FRONTEND_URL || origin || '*'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
  }
}

export function createCookieString(
  name: string,
  value: string,
  options: {
    expires?: Date
    maxAge?: number
    path?: string
    domain?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  } = {},
) {
  let isDevelopment = process.env.NODE_ENV === 'development'
  isDevelopment = false
  const cookieParts = [`${name}=${value}`]

  if (options.expires) {
    cookieParts.push(`Expires=${options.expires.toUTCString()}`)
  }

  if (options.maxAge) {
    cookieParts.push(`Max-Age=${options.maxAge}`)
  }

  cookieParts.push(`Path=${options.path || '/'}`)

  // Only set domain in production or if explicitly provided
  if (options.domain && !isDevelopment) {
    cookieParts.push(`Domain=${options.domain}`)
  }

  if (options.httpOnly) {
    cookieParts.push('HttpOnly')
  }

  // Handle SameSite and Secure based on environment
  if (isDevelopment) {
    cookieParts.push('SameSite=Lax')
  } else {
    cookieParts.push(`SameSite=${options.sameSite || 'None'}`)
    if (options.secure !== false) {
      cookieParts.push('Secure')
    }
  }

  return cookieParts.join('; ')
}
