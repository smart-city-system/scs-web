'use client'
import { useAuth } from '@/hooks/use-auth'
import Alarm from '../components/alarm'

const premises = [
  {
    name: 'Headquarter Tower',
    address: '10 Marina Boulevard, Singapore',
  },
  {
    name: 'Headquarter Tower',
    address: '10 Marina Boulevard, Singapore',
  },
]
const cameras = [
  { name: 'Camera 1' },
  { name: 'Camera 2' },
  { name: 'Camera 3' },
  { name: 'Camera 4' },
]
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
  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-3">
        <div className="text-md m-3 font-semibold">Premises</div>
        {premises.map((premise, index) => (
          <div key={index} className="mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
            <div className="text-xs font-semibold">{premise.name}</div>
            <div className="text-xs  text-gray-600">{premise.address}</div>
          </div>
        ))}
      </div>
      <div className="col-span-6">
        <h2 className="mt-3 font-bold">Live cameras feed</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {cameras.map((camera, index) => (
            <div key={index} className="border rounded-lg flex flex-col items-center">
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                {/* Placeholder for video player */}
                <span className="text-gray-500">Video Feed</span>
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
