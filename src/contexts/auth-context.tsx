'use client'
import type { User } from '@/types'
import { createContext, useState } from 'react'

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)
export default AuthContext
