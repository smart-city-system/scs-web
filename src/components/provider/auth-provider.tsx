'use client'
import { useState } from 'react'
import AuthContext from '@/contexts/auth-context'
import type { User } from '@/types'

export function AuthProvider({
  children,
  initialUser,
  initialIsAuthenticated,
}: { children: React.ReactNode; initialUser: User; initialIsAuthenticated: boolean }) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialIsAuthenticated)

  return <AuthContext.Provider value={{ user, isAuthenticated }}>{children}</AuthContext.Provider>
}
