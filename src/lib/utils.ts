import type { QueryParams } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import type { NextRequest } from 'next/server'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function createSearchParams(queryParams: QueryParams) {
  return new URLSearchParams(
    Object.entries(queryParams).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value)
        return acc
      },
      {} as Record<string, string>,
    ),
  )
}
export function createRouteMatcher(patterns: string[]) {
  const regexes = patterns.map((p) => new RegExp(p))
  return (req: NextRequest) => {
    const pathname = req.nextUrl.pathname
    return regexes.some((re) => re.test(pathname))
  }
}

export function getTokenClaims(token: string) {
  const tokenParts = token.split('.')
  const payload = JSON.parse(atob(tokenParts[1]))
  return payload
}
