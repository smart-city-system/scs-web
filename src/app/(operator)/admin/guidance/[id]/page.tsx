'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { guidanceTemplateService } from '@/services/guidanceService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2, FileText, List, Clock, Tag } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { GuidanceTemplate } from '@/types'
import { GuidanceTemplateForm } from '../components/guidance-template-form'
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

export default function GuidanceTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  // Fetch guidance template
  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['guidance-template', id],
    queryFn: () => guidanceTemplateService.getById(id),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => guidanceTemplateService.delete(id),
    onSuccess: () => {
      toast.success('Guidance template deleted successfully')
      router.push('/admin/guidance')
    },
    onError: () => {
      toast.error('Failed to delete guidance template')
    },
  })

  const handleEdit = () => {
    setIsFormOpen(true)
  }

  const handleDelete = () => {
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate()
  }

  const handleBack = () => {
    router.push('/admin/guidance')
  }
  useEffect(() => {
    console.log({ template })
  })
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Template not found</h3>
          <p className="text-muted-foreground mb-4">
            The guidance template you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{template.category}</Badge>
              <Badge variant="outline">{template.guidance_steps.length} steps</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{template.description}</p>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {template.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Guidance Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Guidance Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.guidance_steps
                  .sort((a, b) => a.step_number - b.step_number)
                  .map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground">{template.category}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <List className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Steps</p>
                  <p className="text-sm text-muted-foreground">
                    {template.guidance_steps.length} steps
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Dialog */}
      <GuidanceTemplateForm open={isFormOpen} onChange={setIsFormOpen} template={template} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guidance Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.name}"? This action cannot be undone.
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
