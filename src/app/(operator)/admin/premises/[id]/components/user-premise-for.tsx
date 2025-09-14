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
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { premiseService } from '@/services/premiseService'
import { userService } from '@/services/userService'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { Search, UserPlus, UserMinus, Users, Mail, Shield } from 'lucide-react'
import { toast } from 'sonner'

const assignUserPremiseSchema = z.object({
  addedUsers: z.array(z.string()),
  removedUsers: z.array(z.string()),
})

type User = {
  id: string
  name: string
  email: string
  role: string
}

function UserPremiseForm({
  id,
  open = false,
  onChange,
}: { open: boolean; onChange: (status: boolean) => void; id: string }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAvailableUsers, setFilteredAvailableUsers] = useState<User[]>([])
  const [assignedUsers, setAssignedUsers] = useState<User[]>([])
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll({ page: 1, limit: 1000 }),
  })

  const { data: originAssignedUsers, isLoading: isAssignedUsersLoading } = useQuery({
    queryKey: ['premise', id, 'users'],
    queryFn: () => premiseService.getAvailableUsers(id as string),
  })

  const assignUsersMutation = useMutation({
    mutationFn: async (args: { addedUsers: string[]; removedUsers: string[] }) => {
      // TODO: Implement premiseService.assignUsers(id, userIds)
      console.log('Assigning users:', args, 'to premise:', id)
      return premiseService.assignUsers(id as string, args.addedUsers, args.removedUsers)
    },
    onSuccess: () => {
      toast.success('Users assigned successfully!')
      queryClient.invalidateQueries({ queryKey: ['premise', id, 'users'] })
      onChange(false)
    },
    onError: () => {
      toast.error('Failed to assign users')
    },
  })

  const unassignUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // TODO: Implement premiseService.unassignUser(id, userId)
      console.log('Unassigning user:', userId, 'from premise:', id)
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('User unassigned successfully!')
      queryClient.invalidateQueries({ queryKey: ['premise', id, 'users'] })
    },
    onError: () => {
      toast.error('Failed to unassign user')
    },
  })

  const handleAssignUser = (user: User) => {
    setAssignedUsers((prev) => [...prev, user])
    setFilteredAvailableUsers((prev) => prev.filter((user1: User) => user1.id !== user.id))
  }

  const handleUnassignUser = (user: User) => {
    setAssignedUsers((prev) => prev.filter((user1: User) => user1.id !== user.id))
    setFilteredAvailableUsers((prev) => [...prev, user])
  }

  const handleSave = () => {
    const addedUsers = assignedUsers.filter(
      (user: User) => !originAssignedUsers?.some((assigned: User) => assigned.id === user.id),
    )
    const removedUsers = originAssignedUsers?.filter(
      (user: User) => !assignedUsers?.some((assigned: User) => assigned.id === user.id),
    )
    if (addedUsers.length === 0 && removedUsers?.length === 0) {
      return
    }
    assignUsersMutation.mutate({
      addedUsers: addedUsers.map((user: User) => user.id),
      removedUsers: removedUsers?.map((user: User) => user.id) || [],
    })
  }

  // const handleRemoveFromSelected = (userId: string) => {
  //   setSelectedUsers((prev) => prev.filter((id) => id !== userId))
  // }
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'operator':
        return 'bg-blue-100 text-blue-800'
      case 'guard':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!users || !originAssignedUsers) {
      return
    }
    const availableUsers =
      users?.data?.filter(
        (user: User) => !originAssignedUsers?.some((assigned: User) => assigned.id === user.id),
      ) || []

    setFilteredAvailableUsers(availableUsers)
  }, [users, originAssignedUsers])
  useEffect(() => {
    if (!originAssignedUsers) {
      return
    }
    setAssignedUsers(originAssignedUsers)
  }, [originAssignedUsers])

  return (
    <Dialog open={open} onOpenChange={(status) => onChange(status)}>
      <DialogContent className="lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5" />
            Manage Premise Users
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Assign or unassign users to this premise</p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Available Users */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Available Users
              </h3>
            </div>

            <div className="border rounded-lg flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-32"></div>
              ) : filteredAvailableUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-sm">No available users found</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[275px]">
                  {filteredAvailableUsers.map((user: User) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border-b hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {getUserInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          {/* <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div> */}
                          <Badge className={`text-xs mt-1 ${getRoleColor(user.role)}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignUser(user)}
                        disabled={assignUsersMutation.isPending}
                        className="ml-auto"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Users */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Users
              </h3>
              <Badge variant="secondary" className="text-xs">
                {assignedUsers?.length} users
              </Badge>
            </div>

            <div className="border rounded-lg flex-1 overflow-hidden">
              {isAssignedUsersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : assignedUsers?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-sm">No users assigned yet</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[275px]">
                  {assignedUsers?.map((user: User) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-3 py-2 border-b hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {getUserInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          {/* <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div> */}
                          <Badge className={`text-xs mt-1 ${getRoleColor(user.role)}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUnassignUser(user)}
                        disabled={unassignUserMutation.isPending}
                        className="ml-2"
                      >
                        <UserMinus className="h-3 w-3 mr-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <LoadingButton
            isLoading={assignUsersMutation.isPending}
            fallback="Assigning..."
            // disabled={selectedUsers.length === 0}
            className=""
            onClick={handleSave}
          >
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserPremiseForm
