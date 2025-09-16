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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { guidanceTemplateService } from '@/services/guidanceService'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useEffect } from 'react'
import type { GuidanceTemplate } from '@/types'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const guidanceStepSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Step title is required'),
  description: z.string().min(1, 'Step description is required'),
  step_number: z.number().min(1),
})

const createGuidanceTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  steps: z.array(guidanceStepSchema).min(1, 'At least one step is required'),
})

type FormData = z.infer<typeof createGuidanceTemplateSchema>

interface GuidanceTemplateFormProps {
  open: boolean
  onChange: (status: boolean) => void
  template?: GuidanceTemplate | null
}

const CATEGORIES = [
  'Emergency Response',
  'Security Protocol',
  'Safety Procedure',
  'Incident Management',
  'Maintenance',
  'General',
]

export function GuidanceTemplateForm({
  open = false,
  onChange,
  template,
}: GuidanceTemplateFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!template
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      steps: [{ title: '', description: '', step_number: 1, id: '' }],
    },
    resolver: zodResolver(createGuidanceTemplateSchema),
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
  })

  // Reset form when template changes
  useEffect(() => {
    if (template && open) {
      reset({
        name: template.name,
        description: template.description,
        steps: template.guidance_steps.map((step, index) => {
          return {
            id: step.id,
            title: step.title,
            description: step.description,
            step_number: index + 1,
          }
        }),
      })
    } else if (!template && open) {
      reset({
        name: '',
        description: '',
        steps: [{ title: '', description: '', step_number: 1, id: '' }],
      })
    }
  }, [template, open, reset])

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      return guidanceTemplateService.create({
        name: data.name,
        description: data.description,
        add_steps: data.steps.map((step) => ({
          title: step.title,
          description: step.description,
          step_number: step.step_number,
        })),
        remove_steps: [],
        update_steps: [],
      })
    },
    onSuccess: () => {
      toast.success('Guidance template created successfully')
      queryClient.invalidateQueries({ queryKey: ['guidance-templates'] })
      onChange(false)
      reset()
    },
    onError: (error) => {
      toast.error('Failed to create guidance template')
      console.error('Error creating guidance template:', error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!template?.id) throw new Error('Template ID is required for update')
      const addSteps = data.steps.filter((step) => !step.id)
      const removeSteps = template.guidance_steps.filter(
        (step) => !data.steps.some((s) => s.id === step.id),
      )
      const updateSteps = data.steps.filter((step) => {
        const originalStep = template.guidance_steps.find((s) => s.id === step.id)
        return (
          originalStep &&
          (originalStep.title !== step.title ||
            originalStep.description !== step.description ||
            originalStep.step_number !== step.step_number)
        )
      })

      return guidanceTemplateService.update(template.id, {
        name: data.name,
        description: data.description,
        add_steps: addSteps.map((step) => ({
          title: step.title,
          description: step.description,
          step_number: step.step_number,
        })),
        remove_steps: removeSteps.map((step) => step.id),
        update_steps: updateSteps.map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          step_number: step.step_number,
        })),
      })
    },
    onSuccess: () => {
      toast.success('Guidance template updated successfully')
      queryClient.invalidateQueries({
        queryKey: ['guidance-template', template?.id],
      })
      onChange(false)
    },
    onError: (error) => {
      toast.error('Failed to update guidance template')
      console.error('Error updating guidance template:', error)
    },
  })

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const addStep = () => {
    append({
      title: '',
      description: '',
      step_number: fields.length + 1,
    })
  }

  const removeStep = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="pb-4">
            <DialogTitle>
              {isEditing ? 'Edit Guidance Template' : 'Create New Guidance Template'}
            </DialogTitle>
          </DialogHeader>
          <Separator />

          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">
                    Template Name <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter template name"
                        error={errors.name?.message}
                      />
                    )}
                  />
                </div>

                {/* <div className="grid gap-3">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-sm text-red-500">{errors.category.message}</p>
                  )}
                </div> */}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Describe the purpose and scope of this template"
                      rows={3}
                      // error={errors.description?.message}
                    />
                  )}
                />
              </div>

              {/* <div className="grid gap-3">
                <Label htmlFor="content">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Enter the main content or overview of the guidance"
                      rows={4}
                      error={errors.content?.message}
                    />
                  )}
                />
              </div> */}
            </div>

            <Separator />

            {/* Guidance Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Guidance Steps</h3>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {errors.steps && <p className="text-sm text-red-500">{errors.steps.message}</p>}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Step {index + 1}</CardTitle>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3">
                        <Label htmlFor={`guidance_steps.${index}.title`}>
                          Step Title <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name={`steps.${index}.title`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="Enter step title"
                              error={errors.steps?.[index]?.title?.message}
                            />
                          )}
                        />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor={`guidance_steps.${index}.description`}>
                          Step Description <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name={`steps.${index}.description`}
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              placeholder="Describe what should be done in this step"
                              rows={3}
                              // error={errors.guidance_steps?.[index]?.description?.message}
                            />
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
              {isEditing ? 'Update Template' : 'Create Template'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
