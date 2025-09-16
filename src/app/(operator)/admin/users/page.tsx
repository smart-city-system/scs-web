'use client'

import CustomTable from '@/components/custom/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { premiseService } from '@/services/premiseService'
import { userService } from '@/services/userService'
import type { Premise, User } from '@/types'
import { DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, MoreHorizontal, Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import UserForm from './components/user-form'

function Guards() {
  const [searchQuery, setSearchQuery] = useState('')
  // const [sortConfig, setSortConfig] = useState<SortConfig>({
  //   key: 'name',
  //   direction: 'asc',
  // })
  const [selectedPremise, setSelectPremise] = useState<Premise | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setuserToDelete] = useState<Premise | null>(null)
  const [filters, setFilters] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 3,
  })
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', filters.page, filters.limit],
    queryFn: () => {
      return userService.getAll({
        search: searchQuery,
        page: filters.page,
        limit: filters.limit,
      })
    },
  })

  // const handleSort = (config: SortConfig) => {
  //   setSortConfig(config)
  // }

  const handleAdd = () => {
    setSelectPremise(null)
    setIsFormOpen(true)
  }

  const handleEdit = (premise: Premise) => {
    setSelectPremise(premise)
    setIsFormOpen(true)
  }

  const handleDelete = (premise: Premise) => {
    setuserToDelete(premise)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      await premiseService.delete(userToDelete.id)
      toast.success('Premise deleted successfully')
    } catch (error) {
      toast.error('Failed to delete premise')
      console.error('Error deleting premise:', error)
    }
  }

  // const handleFormSubmit = async (data: any) => {
  //   try {
  //     if (selectedGuard) {
  //       await premiseService.update(selectedGuard.id, data)
  //       toast.success('Premise updated successfully')
  //     } else {
  //       await premiseService.create(data)
  //       toast.success('Premise created successfully')
  //     }
  //     setIsFormOpen(false)
  //   } catch (error) {
  //     toast.error(selectedGuard ? 'Failed to update guard' : 'Failed to create guard')
  //     console.error('Error saving premise:', error)
  //   }
  // }
  // Handler function for pagination changes (page/limit)

  // Pagination state derived from URL params
  const pagination = useMemo(
    () => ({
      pageIndex: Number(filters.page) - 1,
      pageSize: Number(filters.limit),
    }),
    [filters.page, filters.limit],
  )

  // Fetch course reviews using React Query
  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue('role')}</div>,
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: 'flex justify-center',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-center">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Link
                  href={`/admin/users/${row.original.id}`}
                  className="flex gap-1 p-2 items-center"
                >
                  <Eye size={16} /> <span className="text-sm"> View details</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handlePaginationChange = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (paginate: any) => {
      let pageIndex = pagination.pageIndex
      let pageSize = pagination.pageSize
      if (typeof paginate === 'function') {
        const result = paginate(pagination)
        pageIndex = result.pageIndex
        pageSize = result.pageSize
      } else if (paginate && typeof paginate === 'object') {
        pageIndex = paginate.pageIndex
        pageSize = paginate.pageSize
      }
      setFilters({ page: pageIndex + 1, limit: pageSize })
    },
    [pagination, setFilters],
  )
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage your users and locations</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <CustomTable
        isLoading={isLoading}
        data={users?.data || []}
        columns={columns}
        pagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        }}
        paginationOptions={{
          pageCount: users?.pagination?.total_pages ?? 1,
          manualPagination: true,
          onPaginationChange: handlePaginationChange,
        }}
      />

      <UserForm open={isFormOpen} onChange={() => setIsFormOpen(false)} />
    </div>
  )
}
export default function SuspensePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Guards />
    </Suspense>
  )
}
