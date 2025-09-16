import { SidebarProvider } from '@/components/ui/sidebar'

import { headers } from 'next/headers'
import Header from './components/header'
import Sidebar from './components/sidebar'
import { AuthProvider } from '@/components/provider/auth-provider'
import WebSocketRTCProvider from '@/components/provider/websocket-rtc-provider'
import WebSocketNotificationProvider from '@/components/provider/websocket-notification-provider'
import { NotificationProvider } from '@/contexts/notification-context'

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
        <WebSocketNotificationProvider>
          <NotificationProvider>
            <div className="flex flex-col w-full">
              <Header />
              <div className="p-2">
                <WebSocketRTCProvider>{children}</WebSocketRTCProvider>
              </div>
            </div>
          </NotificationProvider>
        </WebSocketNotificationProvider>
      </AuthProvider>
    </SidebarProvider>
  )
}

export default OperatorLayout
