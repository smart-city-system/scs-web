'use client'
import { useAuth } from '@/hooks/use-auth'
import Alarm from '../components/alarm'
import { useQuery } from '@tanstack/react-query'
import { premiseService } from '@/services/premiseService'
import { useEffect, useState } from 'react'
import { cameraService } from '@/services/cameraService'
import { cn } from '@/lib/utils'

const alerts = [
  {
    severity: 'high',
    type: 'Suspicious Activity',
    description: 'Someone is climbing the fence',
    location: '10 Marina Boulevard, Singapore',
  },
  {
    severity: 'medium',
    type: 'Unauthorized Access',
    description: 'Door left open at the back entrance',
    location: '10 Marina Boulevard, Singapore',
  },
  {
    severity: 'low',
    type: 'Maintenance Required',
    description: 'Camera 3 needs servicing',
    location: '10 Marina Boulevard, Singapore',
  },
]
function DashboardPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  })
  const [selectedPremise, setSelectedPremise] = useState<string | null>(null)
  const { data: premises } = useQuery({
    queryKey: ['premises', filters.page],
    queryFn: () => {
      return premiseService.getAll({
        page: filters.page,
        limit: filters.limit,
      })
    },
  })
  const { data: cameras, isLoading: isLoadingCameras } = useQuery({
    queryKey: ['cameras', selectedPremise],
    queryFn: () => {
      return cameraService.getAll({
        premise_id: selectedPremise as string,
      })
    },
    enabled: !!premises,
  })
  useEffect(() => {
    if (premises && premises.data.length > 0) {
      setSelectedPremise(premises.data[0].id)
    }
  }, [premises])
  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-3">
        <div className="text-md m-3 font-semibold">Premises</div>
        {premises?.data.map((premise) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            onClick={() => setSelectedPremise(premise.id)}
            key={premise.id}
            className={cn('mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded', {
              'bg-blue-100': selectedPremise === premise.id,
            })}
          >
            <div className="text-xs font-semibold">{premise.name}</div>
            <div className="text-xs  text-gray-600">{premise.address}</div>
          </div>
        ))}
      </div>
      <div className="col-span-6">
        <h2 className="mt-3 font-bold">Live cameras feed</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {cameras?.data.map((camera, index) => (
            <div key={camera.id} className="border rounded-lg flex flex-col items-center">
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                {/* Placeholder for video player */}
                <span className="text-gray-500">{camera.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-3">
        <h2 className="mt-3 font-semibold">Alerts</h2>
        <div>
          {alerts.map((alert, index) => (
            <div className="mt-2">
              <Alarm
                key={index}
                severity={alert.severity}
                type={alert.type}
                description={alert.description}
                location={alert.location}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
