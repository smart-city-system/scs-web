'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cameraService } from '@/services/cameraService'
import { useQuery } from '@tanstack/react-query'
import { 
  Cctv, 
  MapPin, 
  Wifi, 
  WifiOff, 
  Eye, 
  Settings,
  Building
} from 'lucide-react'
import Link from 'next/link'
import type { Camera } from '@/types'

interface CameraListProps {
  premiseId?: string
  limit?: number
  showHeader?: boolean
}

export function CameraList({ premiseId, limit, showHeader = true }: CameraListProps) {
  const { data: cameras, isLoading } = useQuery({
    queryKey: ['cameras', { premise_id: premiseId }],
    queryFn: () => cameraService.getAll({ premise_id: premiseId }),
  })

  const displayCameras = limit ? cameras?.data?.slice(0, limit) : cameras?.data

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {showHeader && (
            <CardTitle className="flex items-center gap-2">
              <Cctv className="h-5 w-5" />
              Cameras
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!displayCameras || displayCameras.length === 0) {
    return (
      <Card>
        <CardHeader>
          {showHeader && (
            <CardTitle className="flex items-center gap-2">
              <Cctv className="h-5 w-5" />
              Cameras
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Cctv className="h-8 w-8 mb-2" />
            <p className="text-sm">No cameras found</p>
            {!premiseId && (
              <Link href="/admin/cameras">
                <Button variant="outline" size="sm" className="mt-2">
                  Add Camera
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        {showHeader && (
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cctv className="h-5 w-5" />
              Cameras ({displayCameras.length})
            </CardTitle>
            <Link href="/admin/cameras">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayCameras.map((camera: Camera) => (
            <CameraCard key={camera.id} camera={camera} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface CameraCardProps {
  camera: Camera
}

function CameraCard({ camera }: CameraCardProps) {
  const isActive = camera.is_active === 'true'

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Cctv className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{camera.name}</p>
            <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground truncate">
              {camera.location_description}
            </p>
          </div>
          {camera.premise_id && (
            <div className="flex items-center gap-2 mt-1">
              <Building className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Premise: {camera.premise_id}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {/* Connection status - you can add real status checking here */}
          <Wifi className="h-4 w-4 text-green-500" />
        </div>
        
        <div className="flex items-center space-x-1">
          <Link href={`/admin/cameras/${camera.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CameraList
