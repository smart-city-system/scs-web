import { SidebarProvider } from '@/components/ui/sidebar'

import { headers } from 'next/headers'
import Header from './components/header'
import Sidebar from './components/sidebar'
import { AuthProvider } from '@/components/provider/auth-provider'
import WebSocketRTCProvider from '@/components/provider/websocket-rtc-provider'
import WebSocketNotificationProvider from '@/components/provider/websocket-notification-provider'

async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const user = JSON.parse(h.get('x-user') || '{}')
  const isAuthenticated = h.get('x-authenticated') === 'true'
  return (
    <SidebarProvider>
      <div className="w-fit relative">
        <Sidebar />
      </div>
      <AuthProvider initialIsAuthenticated={isAuthenticated} initialUser={user}>
        <div className="flex flex-col w-full">
          <Header />
          <div className="p-2">
            {/* <WebSocketNotificationProvider> */}
            {/* <WebSocketRTCProvider> */}
            {children}
            {/* </WebSocketRTCProvider> */}
            {/* </WebSocketNotificationProvider> */}
          </div>
        </div>
      </AuthProvider>
    </SidebarProvider>
  )
}

export default OperatorLayout
