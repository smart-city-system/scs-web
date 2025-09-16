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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { HttpError } from '@/lib/http'
import { premiseService } from '@/services/premiseService'
import { userService } from '@/services/userService'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const createPremiseSchema = z.object({
  name: z
    .string({
      error: 'Title is required',
    })
    .nonempty(),
  email: z
    .email({
      error: 'email is required',
    })
    .nonempty(),
  password: z
    .string({
      error: 'password is required',
    })
    .nonempty(),
  role: z.enum(['admin', 'operator', 'guard']),
  premise_id: z.string().nonempty(),
})

type FormData = z.infer<typeof createPremiseSchema>

export function UserForm({
  open = false,
  onChange,
}: { open: boolean; onChange: (status: boolean) => void }) {
  const queryClient = useQueryClient()
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'guard',
      premise_id: '',
    },
    resolver: zodResolver(createPremiseSchema),
  })
  const { data: premises } = useQuery({
    queryKey: ['premises'],
    queryFn: async () => {
      return premiseService.getAll({ page: 1, limit: 1000 })
    },
  })
  const { mutateAsync: createUser, isPending } = useMutation({
    mutationFn: async (args: { formaData: FormData }) => {
      return userService.create({
        name: args.formaData.name,
        email: args.formaData.email,
        password: args.formaData.password,
        role: args.formaData.role,
        premise_id: args.formaData.premise_id,
      })
    },
    onSuccess: () => {
      onChange(false)
      reset({
        name: '',
        email: '',
        password: '',
        role: 'guard',
        premise_id: '',
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User has been created successfully', {})
    },
    onError: (error) => {
      if (error instanceof HttpError) {
        if (error.status === 409) toast.error('Email already exists')
        return
      }
      toast.error('Failed to create user')
      console.error('Error creating user:', error)
    },
  })
  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Operator', value: 'operator' },
    { label: 'Guard', value: 'guard' },
  ]

  const onSubmit = (data: FormData) => {
    createUser({ formaData: data })
  }
  return (
    <Dialog open={open} onOpenChange={(status) => onChange(status)}>
      <DialogContent className="sm:max-w-[425px] ">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="p-4">
            <DialogTitle>Create User</DialogTitle>
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
                Email <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} error={errors.email?.message} />}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address">
                Password <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => <Input {...field} error={errors.password?.message} />}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address">
                Role <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => {
                  return (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                      }}
                      value={field.value || ''}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address">
                Premise <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="premise_id"
                control={control}
                render={({ field }) => {
                  return (
                    <Select
                      onValueChange={(value) => {
                        console.log('Premise changing from:', field.value, 'to:', value)
                        field.onChange(value)
                      }}
                      value={field.value || ''}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Premise" />
                      </SelectTrigger>
                      <SelectContent>
                        {premises?.data?.map((premise) => (
                          <SelectItem key={premise.id} value={premise.id}>
                            {premise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
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

export default UserForm
