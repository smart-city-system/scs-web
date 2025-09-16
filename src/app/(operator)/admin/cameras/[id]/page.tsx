'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cameraService } from '@/services/cameraService'
import { premiseService } from '@/services/premiseService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Edit, 
  Power, 
  PowerOff, 
  Wifi, 
  WifiOff, 
  TestTube,
  MapPin,
  Building,
  Settings,
  Activity
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { CameraForm } from '../components/camera-form'
import type { Camera } from '@/types'

export default function CameraDetail() {
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { data: camera, isLoading: isCameraLoading } = useQuery({
    queryKey: ['camera', id],
    queryFn: () => cameraService.getById(id as string),
  })

  const { data: premise } = useQuery({
    queryKey: ['premise', camera?.premise_id],
    queryFn: () => premiseService.getById(camera!.premise_id!),
    enabled: !!camera?.premise_id,
  })

  const { data: cameraStatus } = useQuery({
    queryKey: ['camera-status', id],
    queryFn: () => cameraService.checkStatus(id as string),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!id,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: () => cameraService.toggleActive(id as string),
    onSuccess: () => {
      toast.success('Camera status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['camera', id] })
    },
    onError: () => {
      toast.error('Failed to update camera status')
    },
  })

  const testConnectionMutation = useMutation({
    mutationFn: () => cameraService.testConnection(id as string),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Connection test successful')
      } else {
        toast.error(`Connection test failed: ${result.message}`)
      }
    },
    onError: () => {
      toast.error('Failed to test connection')
    },
  })

  const handleEdit = () => {
    setIsFormOpen(true)
  }

  const handleToggleActive = () => {
    toggleActiveMutation.mutate()
  }

  const handleTestConnection = () => {
    testConnectionMutation.mutate()
  }

  const handleBack = () => {
    router.push('/admin/cameras')
  }

  if (isCameraLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!camera) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold mb-2">Camera Not Found</h2>
        <p className="text-muted-foreground mb-4">The camera you're looking for doesn't exist.</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cameras
        </Button>
      </div>
    )
  }

  const isActive = camera.is_active === 'true'
  const isOnline = cameraStatus?.isOnline ?? false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{camera.name}</h1>
            <p className="text-muted-foreground">Camera details and configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleTestConnection} disabled={testConnectionMutation.isPending}>
            <TestTube className="h-4 w-4 mr-2" />
            {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button variant="outline" onClick={handleToggleActive} disabled={toggleActiveMutation.isPending}>
            {isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active:</span>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection:</span>
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <Badge variant={isOnline ? 'default' : 'destructive'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
              {cameraStatus?.lastSeen && (
                <div className="text-xs text-muted-foreground">
                  Last seen: {new Date(cameraStatus.lastSeen).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{camera.location_description}</p>
              </div>
              {premise && (
                <div>
                  <p className="text-sm font-medium">Premise</p>
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{premise.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">ID:</span>
                <span className="ml-2 text-muted-foreground font-mono">{camera.id}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Created:</span>
                <span className="ml-2 text-muted-foreground">
                  {/* Add created_at field if available in your Camera type */}
                  N/A
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-muted-foreground mb-2">
                  {isActive && isOnline ? (
                    'Camera feed would appear here'
                  ) : (
                    'Camera is offline or inactive'
                  )}
                </div>
                {isActive && isOnline && (
                  <Button variant="outline" size="sm">
                    View Full Stream
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                No recent activity data available
              </div>
              {/* Add activity log when available */}
            </div>
          </CardContent>
        </Card>
      </div>

      <CameraForm 
        open={isFormOpen} 
        onChange={setIsFormOpen}
        camera={camera}
      />
    </div>
  )
}
