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

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: string
  premise_id: string
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

export interface CreateIncidentRequest {
  name: string
  description: string
  location: string
  severity: string
  guidance_template_id: string
  assignee_id: string
  alarm_id: string
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
  id: string
  role: string
  name: string
  email: string
}

export interface Incident {
  id: string
  name: string
  alarm: Alarm
  description: string
  location: string
  severity: 'low' | 'medium' | 'high'
  incident_guidance: IncidentGuidance
  status: string
  incident_media: IncidentMedia[]
}
export interface IncidentMedia {
  id: string
  incident_id: string
  media_type: string
  file_url: string
  file_name: string
  file_type: string
  created_at: string
}
export interface IncidentGuidance {
  id: string
  assignee: User
  guidance_template_id: string
  incident_guidance_steps: IncidentGuidanceStep[]
}
export interface IncidentGuidanceStep {
  id: string
  incident_guidance_id: string
  title: string
  step_number: number
  description: string
  is_completed?: boolean
}
export interface Alarm {
  id: string
  premise: Premise
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  triggered_at: string
  device: string
}
export interface GuidanceTemplate {
  id: string
  name: string
  content: string
  description: string
  category: string
  guidance_steps: GuidanceStep[]
}
export interface GuidanceStep {
  id: string
  guidance_template_id: string
  title: string
  step_number: number
  description: string
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

export type WsMessage = {
  event: string
  payload: any
}

export type QueryParams = z.infer<typeof QueryParamsSchema>
