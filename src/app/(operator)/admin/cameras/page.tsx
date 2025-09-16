'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cameraService } from '@/services/cameraService'
import { Plus, MoreHorizontal, ArrowUpDown, Eye, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CameraForm } from './components/camera-form'
import type { ColumnDef } from '@tanstack/react-table'
import type { Camera } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import CustomTable from '@/components/custom/table'

function Cameras() {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null)
  const [filters, setFilters] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 4,
  })

  const queryClient = useQueryClient()

  const { data: cameras, isLoading } = useQuery({
    queryKey: ['cameras', filters.page, filters.limit],
    queryFn: () => {
      return cameraService.getAll({
        page: filters.page,
        limit: filters.limit,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cameraService.delete(id),
    onSuccess: () => {
      toast.success('Camera deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
      setIsDeleteDialogOpen(false)
      setCameraToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete camera')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => cameraService.toggleActive(id),
    onSuccess: () => {
      toast.success('Camera status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
    },
    onError: () => {
      toast.error('Failed to update camera status')
    },
  })

  const handleAdd = () => {
    setSelectedCamera(null)
    setIsFormOpen(true)
  }

  const handleEdit = (camera: Camera) => {
    setSelectedCamera(camera)
    setIsFormOpen(true)
  }

  const handleDelete = (camera: Camera) => {
    setCameraToDelete(camera)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleActive = (camera: Camera) => {
    toggleActiveMutation.mutate(camera.id)
  }

  const confirmDelete = () => {
    if (cameraToDelete) {
      deleteMutation.mutate(cameraToDelete.id)
    }
  }

  const columns: ColumnDef<Camera>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'location_description',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Location
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div>{row.getValue('location_description')}</div>,
      },
      {
        accessorKey: 'premise.name',
        header: 'Premise',
        cell: ({ row }) => {
          const camera = row.original
          console.log({ camera })
          return <div>{camera.premise.name}</div>
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.getValue('is_active') === 'true'
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const camera = row.original
          const isActive = camera.is_active === 'true'

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEdit(camera)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleActive(camera)}>
                  {isActive ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDelete(camera)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [],
  )

  const pagination = useMemo(
    () => ({
      pageIndex: filters.page - 1,
      pageSize: filters.limit,
    }),
    [filters.page, filters.limit],
  )

  const handlePaginationChange = useCallback(
    (updater: any) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      setFilters({
        page: newPagination.pageIndex + 1,
        limit: newPagination.pageSize,
      })
    },
    [pagination],
  )
  useEffect(() => {
    console.log({ filters })
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cameras</h1>
          <p className="text-muted-foreground">
            Manage your security cameras and monitoring devices
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Camera
        </Button>
      </div>

      <CustomTable
        isLoading={isLoading}
        data={cameras?.data || []}
        columns={columns}
        pagination={pagination}
        paginationOptions={{
          pageCount: cameras?.pagination?.total_pages ?? 1,
          manualPagination: true,
          onPaginationChange: handlePaginationChange,
        }}
      />

      <CameraForm open={isFormOpen} onChange={setIsFormOpen} camera={selectedCamera} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the camera "
              {cameraToDelete?.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function CamerasPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Cameras />
    </Suspense>
  )
}
