'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { guidanceTemplateService } from '@/services/guidanceService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Eye, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { GuidanceTemplate } from '@/types'
import { GuidanceTemplateForm } from './components/guidance-template-form'
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
import Link from 'next/link'

const CATEGORIES = [
  'Emergency Response',
  'Security Protocol',
  'Safety Procedure',
  'Incident Management',
  'Maintenance',
  'General',
]

export default function GuidanceTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<GuidanceTemplate | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<GuidanceTemplate | null>(null)

  const queryClient = useQueryClient()

  // Fetch guidance templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['guidance-templates'],
    queryFn: () =>
      guidanceTemplateService.getAll({
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        page: 1,
        limit: 100,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => guidanceTemplateService.delete(id),
    onSuccess: () => {
      toast.success('Guidance template deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['guidance-templates'] })
      setIsDeleteDialogOpen(false)
      setTemplateToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete guidance template')
    },
  })

  const handleAdd = () => {
    setSelectedTemplate(null)
    setIsFormOpen(true)
  }

  const handleEdit = (template: GuidanceTemplate) => {
    setSelectedTemplate(template)
    setIsFormOpen(true)
  }

  const handleDelete = (template: GuidanceTemplate) => {
    setTemplateToDelete(template)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id)
    }
  }

  // const filteredTemplates = templates.filter((template) => {
  //   const matchesSearch =
  //     template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     template.description.toLowerCase().includes(searchTerm.toLowerCase())
  //   const matchesCategory = !selectedCategory || template.category === selectedCategory
  //   return matchesSearch && matchesCategory
  // })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guidance Templates</h1>
          <p className="text-muted-foreground">
            Manage guidance templates for incident response and procedures
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates ({templatesData?.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : templatesData?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory
                  ? 'No templates match your current filters.'
                  : 'Get started by creating your first guidance template.'}
              </p>
              {!searchTerm && !selectedCategory && (
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesData?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.guidance_steps.length} steps</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/guidance/${template.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <GuidanceTemplateForm
        open={isFormOpen}
        onChange={setIsFormOpen}
        template={selectedTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guidance Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
