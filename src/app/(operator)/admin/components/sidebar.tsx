'use client'
import { AppSidebar, type NavItem } from '@/components/custom/app-sidebar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { LayoutDashboard, ScanEye } from 'lucide-react'
// Menu items.
const items: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Guidance Templates',
    url: '/admin/guidance-templates',
    icon: ScanEye,
  },
  {
    title: 'Premises',
    url: '/admin/premises',
    icon: ScanEye,
  },
  {
    title: 'Incidents',
    url: '/incidents',
    icon: ScanEye,
  },
  {
    title: 'Cameras',
    url: '/admin/cameras',
    icon: ScanEye,
  },
  {
    title: 'Guards',
    url: '/admin/guards',
    icon: ScanEye,
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: ScanEye,
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
