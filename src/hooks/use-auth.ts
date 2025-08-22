import { useContext } from 'react'
import AuthContext, { type AuthContextType } from '@/contexts/auth-context'

export function useAuth(): AuthContextType {
  const authContext = useContext<AuthContextType | null>(AuthContext)
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return authContext
}
