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
import { cn } from '@/lib/utils'
import { premiseService } from '@/services/premiseService'
import type { Alarm } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import CreateIncident from './create-incident'
import { useState } from 'react'

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

export function AlarmDetail({
  open = false,
  onChange,
  alarm,
}: { open: boolean; onChange: (status: boolean) => void; alarm: Alarm | null }) {
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
  const [isOpenCreateIncident, setIsOpenCreateIncident] = useState(false)
  const onSubmit = (data: FormData) => {
    createCourse({ formaData: data })
  }
  return (
    <>
      <Dialog open={open} onOpenChange={(status) => onChange(status)}>
        <DialogContent className="sm:max-w-[425px] md:max-w-2xl lg:max-w-3xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader className="p-4">
              <DialogTitle>Alarm Detail</DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="grid gap-4 p-4  max-h-[70vh] overflow-auto">
              <h3 className="font-bold">{alarm?.type}</h3>
              <div>{alarm?.description}</div>
              <div className="flex justify-between text-sm">
                <div className="">
                  Location: <span className="font-semibold">{alarm?.premise.name}</span>
                </div>
                <div className="">
                  Time:{' '}
                  <span className="font-semibold">
                    {dayjs(alarm?.triggered_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                <div className="">
                  Severity:{' '}
                  <span
                    className={cn('font-semibold px-2 py-1 rounded-sm text-xs', {
                      'bg-red-200 border-red-200 text-red-900': alarm?.severity === 'high',
                      'bg-orange-200 border-orange-200 text-orange-900':
                        alarm?.severity === 'medium',
                      'bg-yellow-200 border-yellow-200 text-yellow-900': alarm?.severity === 'low',
                    })}
                  >
                    {alarm?.severity}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => setIsOpenCreateIncident(true)}
              >
                Create Incident <Plus />
              </Button>
            </div>
            <DialogFooter className="py-2 px-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CreateIncident
        alarm={alarm}
        open={isOpenCreateIncident}
        onChange={(status) => setIsOpenCreateIncident(status)}
        onSuccess={() => onChange(false)}
      />
    </>
  )
}

export default AlarmDetail
