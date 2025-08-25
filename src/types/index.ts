import { z } from 'zod'
// Base types for API responses
export interface SuccessResApi<T> {
  status: number
  code: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}
interface Pagination {
  page: number
  limit: number
  total_pages: number
}

// Premise types
export interface Premise {
  id: string
  name: string
  address: string
}

export interface LoginResponse {
  token: string
}
export interface ValidateTokenResponse {
  valid: boolean
}

export interface CreatePremiseRequest {
  name: string
  address: string
  description?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  isActive?: boolean
}

export interface UpdatePremiseRequest extends Partial<CreatePremiseRequest> {
  id: string
}

// Camera types
export interface Camera {
  id: string
  name: string
  location_description: string
  premise_id?: string // For display purposes
  is_active: string
}

export interface CreateCameraRequest {
  name: string
  premiseId: string
  location: string
  ipAddress?: string
  port?: number
  username?: string
  password?: string
  streamUrl?: string
  isActive?: boolean
}

export interface UpdateCameraRequest extends Partial<CreateCameraRequest> {
  id: string
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined
}

// Table and UI types
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}
export interface User {
  user_id: string
  role: string
}
export interface FilterConfig {
  search?: string
  isActive?: boolean
  premiseId?: string
}

// Modal types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}
export const QueryParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.string().optional(),
})

export type QueryParams = z.infer<typeof QueryParamsSchema>
