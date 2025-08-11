import { QueryParams } from '@/types/util.type'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatCurrency(currency: number | string) {
  return new Intl.NumberFormat('de-DE').format(+currency)
}

export function formatNumberToSocialStyle(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace('.', ',')
    .toLowerCase()
}
export function formatDuration(time: number) {
  const minutes = Math.floor((time / 60) % 60)
  const hours = Math.floor(time / (60 * 60))
  return `${hours}h ${minutes}m `
}

export function durationToClockFormat(time: number) {
  const seconds = Math.floor(time % 60)
  const minutes = Math.floor((time / 60) % 60)
  const hours = Math.floor(time / (60 * 60))
  return `${hours ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} `
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

export const cleanEmptyParams = <T extends Record<string, unknown>>(search: T) => {
  const newSearch = { ...search }
  // biome-ignore lint/complexity/noForEach: <explanation>
  Object.keys(newSearch).forEach((key) => {
    const value = newSearch[key]
    if (value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value)))
      delete newSearch[key]
  })

  return newSearch
}
