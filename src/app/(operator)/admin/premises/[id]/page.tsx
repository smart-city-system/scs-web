'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { premiseService } from '@/services/premiseService'
import { Label } from '@radix-ui/react-label'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChartBarStacked, Edit, Flag, MapPin } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import UserPremiseForm from './components/user-premise-for'
import { useMutation } from '@/hooks/use-async'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
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
export default function PremiseDetail() {
  const { id } = useParams()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data: premise } = useQuery({
    queryKey: ['premise', id],
    queryFn: () => {
      return premiseService.getById(id as string)
    },
  })
  const { data: availableUser } = useQuery({
    queryKey: ['premise', id, 'users'],
    queryFn: () => {
      return premiseService.getAvailableUsers(id as string)
    },
  })
  const updatePremiseMutation = useMutation(
    async (data: { name: string; address: string }) => {
      return premiseService.update(id as string, data)
    },
    {
      onSuccess: () => {
        toast.success('Premise updated successfully')
      },
    },
  )
  const {
    formState: { errors },
    control,
    handleSubmit,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: premise?.name || '',
      address: premise?.address || '',
    },
    resolver: zodResolver(createPremiseSchema),
  })
  const onSubmit = (data: { name: string; address: string }) => {
    updatePremiseMutation.mutate(data)
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    reset({
      name: premise?.name || '',
      address: premise?.address || '',
    })
  }, [premise])

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb + Back */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Premises</span>
        <span>/</span>
        <span className="text-foreground font-medium">{premise?.name}</span>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 space-y-6">
          {/* Description */}
          <Card>
            <div className="grid gap-4 p-4  max-h-[70vh] overflow-auto">
              <form onSubmit={handleSubmit(onSubmit)}>
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
                <div className="flex justify-end mt-4">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>
          </Card>
          {/* Guidance Steps */}
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle>Users</CardTitle>
              <Button
                onClick={() => {
                  setIsFormOpen(true)
                }}
                size="icon"
              >
                <Edit />
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {availableUser?.map((user) => (
                  <li key={user.id}>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <UserPremiseForm id={id as string} open={isFormOpen} onChange={() => setIsFormOpen(false)} />
    </div>
  )
}
