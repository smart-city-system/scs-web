import { SidebarProvider } from '@/components/ui/sidebar'

import { headers } from 'next/headers'
import Header from './components/header'
import Sidebar from './components/sidebar'
import { AuthProvider } from '@/components/provider/auth-provider'

async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const user = JSON.parse(h.get('x-user') || '{}')
  const isAuthenticated = h.get('x-authenticated') === 'true'
  return (
    <SidebarProvider>
      <div className="w-fit relative">
        <Sidebar />
      </div>
      <div className="flex flex-col w-full">
        <Header />
        <div className="p-2">
          <AuthProvider initialIsAuthenticated={isAuthenticated} initialUser={user}>
            {children}
          </AuthProvider>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default OperatorLayout
