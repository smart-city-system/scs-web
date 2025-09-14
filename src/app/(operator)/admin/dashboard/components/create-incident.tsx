'use client'
import LoadingButton from '@/components/custom/loading-button'
import { CustomSelect } from '@/components/custom/custom-select'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { Alarm, GuidanceStep } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { file, z } from 'zod'
import { fi } from 'zod/v4/locales'
import { useEffect, useState } from 'react'
import { premiseService } from '@/services/premiseService'
import { guidanceTemplateService } from '@/services/guidanceService'
import { incidentService } from '@/services/incidentService'
import { alarmService } from '@/services/alarmService'

const createPremiseSchema = z.object({
  name: z
    .string({
      error: 'Title is required',
    })
    .nonempty(),

  description: z
    .string({
      error: 'Description is required',
    })
    .nonempty(),
  // premise: z
  //   .string({
  //     error: 'Premise is required',
  //   })
  //   .nonempty(),

  location: z
    .string({
      error: 'Description is required',
    })
    .nonempty(),

  severity: z
    .string({
      error: 'Description is required',
    })
    .nonempty(),
  guidance: z.string().nonempty(),
  alarm_id: z.string().nonempty(),
  assignee_id: z.string().nonempty(),
})

type FormData = z.infer<typeof createPremiseSchema>

export function CreateIncident({
  open = false,
  onChange,
  onSuccess,
  alarm,
}: {
  open: boolean
  onChange: (status: boolean) => void
  alarm: Alarm | null
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()
  const [guidanceSteps, setGuidanceSteps] = useState<GuidanceStep[]>([])

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      location: '',
      severity: '',
      guidance: '',
      assignee_id: '',
      alarm_id: '',
    },
    resolver: zodResolver(createPremiseSchema),
  })

  // Watch for changes in the guidance field
  const selectedGuidanceId = useWatch({
    control,
    name: 'guidance',
  })
  // const { data: premises } = useQuery({
  //   queryKey: ['premises'],
  //   queryFn: async () => {
  //     return premiseService.getAll({ page: 1, limit: 1000 })
  //   },
  // })
  const { data: guidanceTemplates } = useQuery({
    queryKey: ['guidance-templates'],
    queryFn: async () => {
      return guidanceTemplateService.getGuidances()
    },
  })
  const guidanceOptions = guidanceTemplates
    ? guidanceTemplates.map((template) => ({
        label: template.name,
        value: template.id,
        category: 'Available',
      }))
    : []

  const { data: availableGuards } = useQuery({
    queryKey: ['users', { status: 'available' }],
    queryFn: async () => {
      return premiseService.getAvailableUsers(alarm?.premise.id || '')
    },
    enabled: !!alarm?.premise.id,
  })
  const guardOptions = availableGuards
    ? availableGuards.map((guard) => ({
        label: guard.name,
        value: guard.id,
        category: 'Available',
      }))
    : []

  // const premiseOptions = premises
  //   ? premises.data.map((premise) => ({
  //       label: premise.name,
  //       value: premise.id,
  //       category: 'Available',
  //     }))
  //   : []
  const { mutateAsync: createIncident, isPending } = useMutation({
    mutationFn: async (args: { formaData: FormData }) => {
      const formData = args.formaData
      return incidentService.createIncident({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        severity: formData.severity,
        guidance_template_id: formData.guidance,
        assignee_id: formData.assignee_id,
        alarm_id: formData.alarm_id,
      })
    },
    onSuccess: () => {
      onChange(false)
      onSuccess?.()
      updateAlarmStatus({ alarm_id: getValues('alarm_id'), status: 'dispatched' })
      toast.success('Incident has been created successfully', {})
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      control._reset({
        name: '',
        description: '',
        location: '',
        severity: '',
        guidance: '',
        assignee_id: '',
      })
    },
  })
  const { mutateAsync: updateAlarmStatus, isPending: isUpdatingAlarm } = useMutation({
    mutationFn: async (args: { alarm_id: string; status: string }) => {
      return alarmService.updateAlarmStatus(args.alarm_id, args.status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] })
    },
  })
  const onSubmit = (data: FormData) => {
    createIncident({ formaData: data })
  }

  // Update guidance steps when template changes
  useEffect(() => {
    if (selectedGuidanceId && guidanceTemplates) {
      const selectedTemplate = guidanceTemplates.find(
        (template) => template.id === selectedGuidanceId,
      )
      if (selectedTemplate?.guidance_steps) {
        setGuidanceSteps(selectedTemplate.guidance_steps)
      } else {
        setGuidanceSteps([])
      }
    } else {
      setGuidanceSteps([])
    }
  }, [selectedGuidanceId, guidanceTemplates])
  useEffect(() => {
    if (alarm) {
      control._reset({
        name: alarm.type,
        description: alarm?.description || '',
        location: alarm.premise.address || '',
        severity: alarm.severity,
        assignee_id: '',
        alarm_id: alarm.id,
      })
    }
  }, [alarm, control])
  return (
    <Dialog open={open} onOpenChange={(status) => onChange(status)}>
      <DialogContent className="sm:max-w-[325px] md:max-w-md lg:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="p-4">
            <DialogTitle>Create New Incident</DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 p-4  max-h-[70vh] overflow-auto">
            <div className="grid gap-3">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} error={errors.name?.message} />}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="severity">
                Severity <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="font-thin">
                        Low
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="font-thin">
                        Medium
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="font-thin">
                        High
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
            {/* <div className="grid gap-3">
              <Label htmlFor="premise">
                Premises <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="premise"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    onChange={(value) => {
                      field.onChange(value[0]?.value)
                    }}
                    options={premiseOptions}
                    selected={
                      field.value ? premiseOptions.filter((opt) => opt.value === field.value) : []
                    }
                    placeholder="Premise"
                    className="max-w-[50%]"
                    aria-label="Filter by status"
                    multi={false}
                  />
                )}
              />
            </div> */}
            <div className="grid gap-3">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => <Input {...field} error={errors.description?.message} />}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address">
                Description <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <Textarea {...field} />}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address">
                Assign to <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="assignee_id"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    onChange={(value) => {
                      field.onChange(value[0]?.value)
                    }}
                    options={guardOptions}
                    selected={
                      field.value ? guardOptions.filter((opt) => opt.value === field.value) : []
                    }
                    placeholder="Guard"
                    className="max-w-[40%]"
                    aria-label="Filter by status"
                    multi={false}
                  />
                )}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address">
                Guidance <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="guidance"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    onChange={(value) => {
                      field.onChange(value[0]?.value)
                    }}
                    options={guidanceOptions}
                    selected={
                      field.value ? guidanceOptions.filter((opt) => opt.value === field.value) : []
                    }
                    placeholder="Guidance"
                    className="max-w-[100%]"
                    aria-label="Filter by status"
                    multi={false}
                  />
                )}
              />
            </div>

            {/* Guidance Steps Display */}
            <div className="grid gap-2 mt-2">
              <Label>Guidance Steps</Label>
              {guidanceSteps.length > 0 ? (
                <div className="border rounded-md p-3 bg-gray-50">
                  <ol className="list-decimal pl-4 text-sm text-gray-700 space-y-1">
                    {guidanceSteps
                      .sort((a, b) => a.step_number - b.step_number)
                      .map((step: GuidanceStep) => (
                        <li key={step.id} className="text-gray-800">
                          <span className="font-medium">{step.title}</span>
                          {step.description && (
                            <p className="text-gray-600 mt-1 text-xs">{step.description}</p>
                          )}
                        </li>
                      ))}
                  </ol>
                </div>
              ) : (
                <div className="border rounded-md p-3 bg-gray-50 text-center">
                  <p className="text-sm text-gray-500">
                    {selectedGuidanceId
                      ? 'No guidance steps available for this template'
                      : 'Select a guidance template to view steps'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="py-2 px-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            {/* <Button type="submit">Create</Button> */}
            <LoadingButton isLoading={isPending} fallback="Creating..." type="submit">
              Create
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateIncident
