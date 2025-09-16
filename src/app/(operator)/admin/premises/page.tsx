'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { premiseService } from '@/services/premiseService'
import { Eye, Plus } from 'lucide-react'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PremiseForm } from './components/premise-form'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import type { Premise, SortConfig, TableColumn } from '@/types'
import { useQuery } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import CustomTable from '@/components/custom/table'
import Link from 'next/link'

function Premises() {
  const [searchQuery, setSearchQuery] = useState('')
  // const [sortConfig, setSortConfig] = useState<SortConfig>({
  //   key: 'name',
  //   direction: 'asc',
  // })
  const [selectedPremise, setSelectedPremise] = useState<Premise | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [premiseToDelete, setPremiseToDelete] = useState<Premise | null>(null)
  const [filters, setFilters] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  })
  const { data: premises, isLoading } = useQuery({
    queryKey: ['premises', filters.page],
    queryFn: () => {
      return premiseService.getAll({
        search: searchQuery,
        page: filters.page,
        limit: filters.limit,
      })
    },
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  // const handleSort = (config: SortConfig) => {
  //   setSortConfig(config)
  // }

  const handleAdd = () => {
    setSelectedPremise(null)
    setIsFormOpen(true)
  }

  const handleEdit = (premise: Premise) => {
    setSelectedPremise(premise)
    setIsFormOpen(true)
  }

  const handleDelete = (premise: Premise) => {
    setPremiseToDelete(premise)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!premiseToDelete) return

    try {
      await premiseService.delete(premiseToDelete.id)
      toast.success('Premise deleted successfully')
    } catch (error) {
      toast.error('Failed to delete premise')
      console.error('Error deleting premise:', error)
    }
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedPremise) {
        await premiseService.update(selectedPremise.id, data)
        toast.success('Premise updated successfully')
      } else {
        await premiseService.create(data)
        toast.success('Premise created successfully')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(selectedPremise ? 'Failed to update premise' : 'Failed to create premise')
      console.error('Error saving premise:', error)
    }
  }
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
  const columns: ColumnDef<Premise>[] = [
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
      accessorKey: 'address',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Address
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue('address')}</div>,
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
                  href={`/admin/premises/${row.original.id}`}
                  className="flex gap-1 p-2 items-center"
                >
                  <Eye className="mr-2 h-4 w-4" /> <span className="text-sm"> View details</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Premises</h1>
          <p className="text-muted-foreground">Manage your premises and locations</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Premise
        </Button>
      </div>

      <CustomTable
        isLoading={isLoading}
        data={premises?.data || []}
        columns={columns}
        pagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        }}
        paginationOptions={{
          pageCount: premises?.pagination?.total_pages ?? 1,
          manualPagination: true,
          onPaginationChange: handlePaginationChange,
        }}
      />

      <PremiseForm open={isFormOpen} onChange={() => setIsFormOpen(false)} />
    </div>
  )
}
export default function PremisesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Premises />
    </Suspense>
  )
}
