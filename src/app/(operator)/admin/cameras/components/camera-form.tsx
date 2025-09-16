import LoadingButton from '@/components/custom/loading-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea'
import { cameraService } from '@/services/cameraService'
import { premiseService } from '@/services/premiseService'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useEffect } from 'react'
import type { Camera } from '@/types'
import { Switch } from '@/components/ui/switch'

const createCameraSchema = z.object({
  name: z.string().min(1, 'Camera name is required'),
  premise_id: z.string().min(1, 'Premise is required'),
  location_description: z.string().min(1, 'Location is required'),
})

type FormData = z.infer<typeof createCameraSchema>

interface CameraFormProps {
  open: boolean
  onChange: (status: boolean) => void
  camera?: Camera | null
}

export function CameraForm({ open = false, onChange, camera }: CameraFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!camera

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      premise_id: '',
      location_description: '',
    },
    resolver: zodResolver(createCameraSchema),
  })

  // Load premises for dropdown
  const { data: premises } = useQuery({
    queryKey: ['premises'],
    queryFn: () => premiseService.getAll({ page: 1, limit: 1000 }),
  })

  // Reset form when camera changes
  useEffect(() => {
    if (camera && open) {
      reset({
        name: camera.name,
        premise_id: camera.premise_id || '',
        location_description: camera.location_description,
      })
    } else if (!camera && open) {
      reset({
        name: '',
        premise_id: '',
        location_description: '',
      })
    }
  }, [camera, open, reset])

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      cameraService.create({
        name: data.name,
        premise_id: data.premise_id,
        location_description: data.location_description,
      }),
    onSuccess: () => {
      toast.success('Camera created successfully')
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
      onChange(false)
      reset()
    },
    onError: (error) => {
      toast.error('Failed to create camera')
      console.error('Error creating camera:', error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!camera?.id) throw new Error('Camera ID is required for update')
      return cameraService.update(camera.id, {
        name: data.name,
        premise_id: data.premise_id,
        location_description: data.location_description,
      })
    },
    onSuccess: () => {
      toast.success('Camera updated successfully')
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
      onChange(false)
    },
    onError: (error) => {
      toast.error('Failed to update camera')
      console.error('Error updating camera:', error)
    },
  })

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="pb-4">
            <DialogTitle>{isEditing ? 'Edit Camera' : 'Create New Camera'}</DialogTitle>
          </DialogHeader>
          <Separator />

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="grid gap-3">
                <Label htmlFor="name">
                  Camera Name <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter camera name"
                      error={errors.name?.message}
                    />
                  )}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="premise_id">
                  Premise <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="premise_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select premise" />
                      </SelectTrigger>
                      <SelectContent>
                        {premises?.data?.map((premise) => (
                          <SelectItem key={premise.id} value={premise.id}>
                            {premise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.premise_id && (
                  <p className="text-sm text-red-500">{errors.premise_id.message}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="location_description">
                  Location Description <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="location_description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Describe the camera location (e.g., Main entrance, Parking lot, etc.)"
                      error={errors.location_description?.message}
                    />
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Network Configuration */}
            {/* <div className="space-y-4">
              <h3 className="text-lg font-medium">Network Configuration (Optional)</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Controller
                    name="ipAddress"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="192.168.1.100"
                        error={errors.ipAddress?.message}
                      />
                    )}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="port">Port</Label>
                  <Controller
                    name="port"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        placeholder="554"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number.parseInt(e.target.value) : undefined,
                          )
                        }
                        error={errors.port?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="username">Username</Label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="admin" error={errors.username?.message} />
                    )}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="streamUrl">Stream URL</Label>
                <Controller
                  name="streamUrl"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="rtsp://192.168.1.100:554/stream"
                      error={errors.streamUrl?.message}
                    />
                  )}
                />
              </div>
            </div> */}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <LoadingButton
              isLoading={isPending}
              fallback={isEditing ? 'Updating...' : 'Creating...'}
              type="submit"
            >
              {isEditing ? 'Update Camera' : 'Create Camera'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
