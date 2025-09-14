import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

interface props {
  severity: string
  type: string
  description: string
  triggered_at: string
  device: string
  onClick?: () => void
}
function Alarm({ severity, description, type, triggered_at, device, onClick }: props) {
  return (
    <div
      className={cn('bg-white border rounded-lg shadow-sm p-2', {
        'bg-red-200 border-red-200': severity === 'high',
        'bg-orange-200 border-orange-200': severity === 'medium',
        'bg-yellow-200 border-yellow-200': severity === 'low',
      })}
    >
      <h3
        className={cn('text-sm font-semibold', {
          'text-red-900': severity === 'high',
          'text-orange-900': severity === 'medium',
          'text-yellow-900': severity === 'low',
        })}
      >
        {type}
      </h3>
      <div
        className={cn('text-xs', {
          'text-red-700': severity === 'high',
          'text-orange-700': severity === 'medium',
          'text-yellow-700': severity === 'low',
        })}
      >
        {description}
      </div>
      <div
        className={cn('text-xs mt-1', {
          'text-red-600': severity === 'high',
          'text-orange-600': severity === 'medium',
          'text-yellow-600': severity === 'low',
        })}
      >
        {dayjs(triggered_at).fromNow()}
      </div>
      <div className="flex justify-between items-center">
        <span
          className={cn('text-xs', {
            'text-red-600': severity === 'high',
            'text-orange-600': severity === 'medium',
            'text-yellow-600': severity === 'low',
          })}
        >
          Device: {device}
        </span>
        <Button
          onClick={onClick}
          className={cn('text-xs mt-1', {
            'bg-red-600': severity === 'high',
            'bg-orange-600': severity === 'medium',
            'bg-yellow-600': severity === 'low',
          })}
        >
          View Detail
        </Button>
      </div>
    </div>
  )
}

export default Alarm
