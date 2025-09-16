'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  CircleCheck,
  ChartBarStacked,
  Calendar,
  MapPin,
  Flag,
  ArrowLeft,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useParams, useRouter } from 'next/navigation'
import { incidentService } from '@/services/incidentService'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import LoadingButton from '@/components/custom/loading-button'

export default function IncidentDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => {
      return incidentService.getById(id as string)
    },
  })
  const { mutateAsync: completeIncident, isPending } = useMutation({
    mutationFn: () => incidentService.complete(id as string),
    onSuccess: () => {
      router.push('/admin/incidents')
    },
  })
  const handleBack = () => {
    router.push('/admin/incidents')
  }
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb + Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{incident?.name}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <LoadingButton
            fallback="Marking as complete..."
            isLoading={isPending}
            onClick={() => completeIncident()}
          >
            Mark as complete
          </LoadingButton>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{incident?.description}</p>
            </CardContent>
          </Card>
          {/* Guidance Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Guidance Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {incident?.incident_guidance.incident_guidance_steps
                  .sort((a, b) => a.step_number - b.step_number)
                  .map((step) => (
                    <li key={step.id} className="flex items-center space-x-2">
                      {step.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                      <span
                        className={`text-sm ${step.is_completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {step.title}
                      </span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {incident?.incident_media?.map((media) => (
                  <li key={media.id} className="border-b pb-2">
                    {/* <p className="text-sm font-medium">{activity.action}</p> */}
                    <p className="text-xs text-muted-foreground">
                      {dayjs(media.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                    {media.file_url && (
                      <img
                        src={media.file_url}
                        alt="Evidence"
                        className="mt-2 w-40 rounded-md border"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-4 space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">
                    {dayjs(incident?.alarm?.triggered_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Severity:</span>
                  <span
                    className={cn(
                      'font-semibold px-2 py-1 rounded-sm text-xs text-center mx-auto',
                      {
                        'bg-red-200 border-red-200 text-red-900':
                          incident?.alarm.severity === 'high',
                        'bg-orange-200 border-orange-200 text-orange-900':
                          incident?.alarm.severity === 'medium',
                        'bg-yellow-200 border-yellow-200 text-yellow-900':
                          incident?.alarm.severity === 'low',
                      },
                    )}
                  >
                    {incident?.alarm.severity}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChartBarStacked className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Category:</span>
                  <span className="text-sm">{incident?.alarm.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{incident?.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CircleCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-sm">{incident?.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Assigned Personnel */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Personnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {incident?.incident_guidance.assignee.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {incident?.incident_guidance.assignee.role}
                  </span>
                  <span className="text-sm text-blue-600">
                    {incident?.incident_guidance.assignee.email}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
