'use client'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { userService } from '@/services/userService'
import { useQuery } from '@tanstack/react-query'
import { Bell, User } from 'lucide-react'
import { useEffect, useState } from 'react'
function Header() {
  const [time, setTime] = useState(new Date())
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => {
      return userService.getMe()
    },
  })
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="w-full flex p-2 shadow-sm">
      <div className="ml-auto flex gap-4">
        <div className="flex flex-col">
          <div className="font-semibold text-sm">Saturday, Aug 2, 2025 </div>
          <div className="text-sm">{time.toLocaleTimeString()}</div>
        </div>
        <Button type="button" size="icon">
          <Bell />
        </Button>
        <div>
          <div className="font-semibold text-sm">{userData?.name}</div>
          <div className="text-xs">{userData?.role}</div>
        </div>
        <Button type="button" size="icon">
          <User />
        </Button>
      </div>
    </div>
  )
}

export default Header
