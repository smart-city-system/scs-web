'use client'

import { Button } from '@/components/ui/button'
import { premiseService } from '@/services/premiseService'
import { Plus } from 'lucide-react'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import type { Incident, Premise, SortConfig, TableColumn } from '@/types'
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
import { incidentService } from '@/services/incidentService'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import dayjs from 'dayjs'

function Incidents() {
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
  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', filters.page],
    queryFn: () => {
      return incidentService.getAll({
        search: searchQuery,
        page: filters.page,
        limit: filters.limit,
      })
    },
  })
  console.log('Incidents data:', incidents)

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
  const columns: ColumnDef<Incident>[] = [
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
      accessorKey: 'description',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Description
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue('description')}</div>,
    },
    {
      accessorKey: 'location',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Description
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue('location')}</div>,
    },
    {
      accessorKey: 'severity',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Severity
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="">
          <span
            className={cn('font-semibold px-2 py-1 rounded-sm text-xs text-center mx-auto', {
              'bg-red-200 border-red-200 text-red-900': row.getValue('severity') === 'high',
              'bg-orange-200 border-orange-200 text-orange-900':
                row.getValue('severity') === 'medium',
              'bg-yellow-200 border-yellow-200 text-yellow-900': row.getValue('severity') === 'low',
            })}
          >
            {row.getValue('severity')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Status
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue('status')}</div>,
    },
    {
      accessorKey: 'incident_guidance.assignee.name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Assignee
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => {
        const assigneeName = row.original.incident_guidance.assignee.name
        return <div className="lowercase">{assigneeName}</div>
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Datetime
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="lowercase">
          {dayjs(row.getValue('created_at')).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      ),
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
              <DropdownMenuItem asChild>
                <Link href={`/admin/incidents/${row.original.id}`}>View details</Link>
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
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Manage your Incidents</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Incident
        </Button>
      </div>

      <CustomTable
        isLoading={isLoading}
        data={incidents?.data || []}
        columns={columns}
        pagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        }}
        paginationOptions={{
          pageCount: incidents?.pagination?.total_pages ?? 1,
          manualPagination: true,
          onPaginationChange: handlePaginationChange,
        }}
      />

      {/* <PremiseForm open={isFormOpen} onChange={() => setIsFormOpen(false)} /> */}
    </div>
  )
}
export default function PremisesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Incidents />
    </Suspense>
  )
}
