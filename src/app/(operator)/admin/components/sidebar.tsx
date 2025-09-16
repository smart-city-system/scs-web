'use client'
import { AppSidebar, type NavItem } from '@/components/custom/app-sidebar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { LayoutDashboard, ScanEye, Building, Users, Settings, Cctv } from 'lucide-react'
// Menu items.
const items: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Guidance Templates',
    url: '/admin/guidance',
    icon: ScanEye,
  },
  {
    title: 'Premises',
    url: '/admin/premises',
    icon: Building,
  },
  {
    title: 'Incidents',
    url: '/admin/incidents',
    icon: ScanEye,
  },
  {
    title: 'Cameras',
    url: '/admin/cameras',
    icon: Cctv,
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
  },
]
function Sidebar() {
  return (
    <>
      <AppSidebar items={items} />
      <SidebarTrigger className="top-0 right-[-25px] absolute " />
    </>
  )
}

export default Sidebar
