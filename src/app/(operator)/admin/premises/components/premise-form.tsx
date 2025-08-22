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
import { premiseService } from '@/services/premiseService'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const createPremiseSchema = z.object({
  name: z
    .string({
      error: 'Title is required',
    })
    .nonempty(),

  address: z
    .string({
      error: 'Description is required',
    })
    .nonempty(),
})

type FormData = z.infer<typeof createPremiseSchema>

export function PremiseForm({
  open = false,
  onChange,
}: { open: boolean; onChange: (status: boolean) => void }) {
  const queryClient = useQueryClient()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      address: '',
    },
    resolver: zodResolver(createPremiseSchema),
  })
  console.log({ errors })
  const { mutateAsync: createCourse, isPending } = useMutation({
    mutationFn: async (args: { formaData: FormData }) => {
      return premiseService.create({
        address: args.formaData.address,
        name: args.formaData.name,
      })
    },
    onSuccess: () => {
      onChange(false)
      queryClient.invalidateQueries({ queryKey: ['premises'] })
      toast.success('Premise has been created successfully', {})
    },
  })
  const onSubmit = (data: FormData) => {
    createCourse({ formaData: data })
  }
  return (
    <Dialog open={open} onOpenChange={(status) => onChange(status)}>
      <DialogContent className="sm:max-w-[425px] ">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="p-4">
            <DialogTitle>Create premises</DialogTitle>
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
              <Label htmlFor="address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => <Input {...field} error={errors.address?.message} />}
              />
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

export default PremiseForm
