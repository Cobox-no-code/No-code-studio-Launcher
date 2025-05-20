'use client'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import { openModal } from '@/redux/slices/modal'
import {
  useCreateGroupMutation,
  useGetGroupsQuery,
  useGetPartiesQuery,
  useUpdateGroupMutation,
  useUpdatePartyMutation,
} from '@/redux/api/partiesApi'

// UI Components
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Icons
import {
  EllipsisVertical,
  AlertCircle,
  Plus,
  Search,
  Users,
  FolderIcon,
  Folder,
  GroupIcon,
  UsersRound,
  X,
  MoveRight,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { openEditForm, updateFormField } from '@/redux/slices/groupSlice'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppSelector } from '@/redux/hooks'

// Helper to format currency
const formatCurrency = (amount: string | number | bigint) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

const PartyGroups = () => {
  const dispatch = useDispatch<AppDispatch>()

  // State management
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterGroup, setFilterGroup] = useState('')
  const [filterParty, setFilterParty] = useState('')
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([])
  const [movingParties, setMovingParties] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState<string>('')

  // Use RTK Query to fetch groups
  const {
    data: groups,
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    error: groupsError,
    refetch
  } = useGetGroupsQuery()

  // Use RTK Query to fetch parties
  const {
    data: parties,
    isLoading: isLoadingParties,
    isError: isPartiesError,
    error: partiesError,
    refetch: refetchParties,
  } = useGetPartiesQuery({})

  // Open modal with specific type
  const open = (types: string, id: string = '') => {
    dispatch(
      openModal({
        type: types,
        index: id,
      })
    )
  }

  // Get parties without a group
  const ungroupedParties = parties?.filter((party) => !party.groupId)

  // Handle group selection
  const handleSelectGroup = (id: string | null) => {
    setSelectedId(id)
    setSelectedPartyIds([])
  }

  // Get the selected group details
  const selectedGroup = selectedId
    ? groups?.find((group) => group.id === selectedId)
    : null

  // Get parties for the selected group
  const groupParties = selectedId
    ? parties?.filter((party) => party.groupId === selectedId)
    : ungroupedParties

  // Filter groups based on search
  const filteredGroups = groups?.filter((group) =>
    group.groupName.toLowerCase().includes(filterGroup.toLowerCase())
  )

  // Filter parties based on search
  const filteredParties = groupParties?.filter(
    (party) =>
      party.name.toLowerCase().includes(filterParty.toLowerCase()) ||
      (party.phone && party.phone.includes(filterParty)) ||
      (party.email &&
        party.email.toLowerCase().includes(filterParty.toLowerCase()))
  )
 useEffect(() => {
    // Immediately refetch data when component mounts
    refetch();
    
    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetch();
    }, 5000); // Adjust this time as needed
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch]);
  // Handle party selection (for move operation)
  const handlePartySelection = (partyId: string) => {
    setSelectedPartyIds((prev) => {
      if (prev.includes(partyId)) {
        return prev.filter((id) => id !== partyId)
      } else {
        return [...prev, partyId]
      }
    })
  }

  // Handle selection of all visible parties
  const handleSelectAllParties = () => {
    if (
      selectedPartyIds.length === filteredParties?.length &&
      filteredParties.length > 0
    ) {
      // If all are selected, deselect all
      setSelectedPartyIds([])
    } else {
      // Otherwise, select all visible parties
      setSelectedPartyIds(filteredParties?.map((p) => p.id) || [])
    }
  }

  // Handle opening move dialog
  const handleOpenMoveDialog = () => {
    if (selectedPartyIds.length === 0 && filteredParties && filteredParties.length > 0) {
      // If no parties are explicitly selected, select all parties in the current view
      setSelectedPartyIds(filteredParties.map((party) => party.id))
    }
    setTargetGroupId('') // Reset the target group selection
    setMoveDialogOpen(true)
  }

  // Handle move operation
  const [updateParty] = useUpdatePartyMutation()

  const handleMoveParties = async () => {
    if (!targetGroupId && selectedId !== null) {
      // If no target group is selected and we're removing from a group,
      // we should confirm that's what the user wants
      if (!window.confirm('Are you sure you want to remove these parties from the group?')) {
        return
      }
    }

    try {
      setMovingParties(true)

      // Create an array of promises for each party update
      const updatePromises = selectedPartyIds.map((partyId) =>
        updateParty({
          id: partyId,
          // If targetGroupId is empty string and we're in a group view,
          // set groupId to null to remove from group
          groupId: targetGroupId === '' ? '' : targetGroupId,
        }).unwrap()
      )

      // Execute all updates concurrently
      await Promise.all(updatePromises)

      // Refetch parties to update the UI
      await refetchParties()

      // Close dialog and reset selection after successful move
      setMoveDialogOpen(false)
      setSelectedPartyIds([])

      // Show appropriate success message
      if (targetGroupId === '') {
        toast.success(
          `${selectedPartyIds.length} ${
            selectedPartyIds.length === 1 ? 'party' : 'parties'
          } removed from group`
        )
      } else {
        const targetGroup = groups?.find((group) => group.id === targetGroupId)
        toast.success(
          `${selectedPartyIds.length} ${
            selectedPartyIds.length === 1 ? 'party' : 'parties'
          } moved to "${targetGroup?.groupName || 'selected group'}"`
        )
      }
    } catch (error: any) {
      toast.error(`Failed to move parties: ${error.message || 'Unknown error'}`)
      console.error('Error moving parties:', error)
    } finally {
      setMovingParties(false)
    }
  }

  const [createGroup] = useCreateGroupMutation()

  // Local UI state for group management
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')

  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupDescription, setEditGroupDescription] = useState('')

  // Add this mutation alongside your other mutations
  const [updateGroup] = useUpdateGroupMutation()

  // Add this function to open the edit modal
  const openEditModal = (groupId: string) => {
    // Find the group to edit
    const groupToEdit = groups?.find((group) => group.id === groupId)
    if (groupToEdit) {
      setEditingGroupId(groupId)
      setEditGroupName(groupToEdit.groupName)
      setEditGroupDescription(groupToEdit.description || '')
      setEditGroupDialogOpen(true)
    }
  }

  // Add this function to handle group updates
  const handleUpdateGroup = async () => {
    if (!editingGroupId || !editGroupName.trim()) {
      toast.error('Please enter a valid group name')
      return
    }

    try {
      await updateGroup({
        id: editingGroupId,
        groupName: editGroupName.trim(),
        description: editGroupDescription.trim(),
      }).unwrap()

      toast.success(`Group "${editGroupName}" updated successfully`)
      setEditGroupDialogOpen(false)
    } catch (error: any) {
      toast.error(`Failed to update group: ${error.message || 'Unknown error'}`)
    }
  }

  // GROUP HANDLERS
  const handleAddGroupOpen = () => setAddGroupDialogOpen(true)
  const handleAddGroupClose = () => {
    setAddGroupDialogOpen(false)
    setNewGroupName('')
    setNewGroupDescription('')
  }

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a valid group name')
      return
    }

    try {
      const result = await createGroup({
        groupName: newGroupName.trim(),
        description: newGroupDescription.trim(),
      }).unwrap()

      toast.success(`Group "${newGroupName}" added successfully`)
      handleAddGroupClose()
    } catch (error: any) {
      toast.error(`Failed to add group: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header with summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Party Groups</h1>
              <p className="text-muted-foreground mt-1">
                Organize your parties into logical groups for easier management
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGroupOpen}>
                <Plus className="h-4 w-4 mr-1" /> Add Group
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Groups
              </h3>
              <p className="text-2xl font-bold mt-1">
                {isLoadingGroups ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  groups?.length || 0
                )}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Parties
              </h3>
              <p className="text-2xl font-bold mt-1">
                {isLoadingParties ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  parties?.length || 0
                )}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Grouped Parties
              </h3>
              <p className="text-2xl font-bold mt-1">
                {isLoadingParties ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  parties?.filter((party) => party.groupId)?.length || 0
                )}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Ungrouped Parties
              </h3>
              <p className="text-2xl font-bold mt-1">
                {isLoadingParties ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  ungroupedParties?.length || 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - Groups List */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Group Directory</CardTitle>
            </div>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search groups..."
                value={filterGroup}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFilterGroup(e.target.value)
                }
                className="pl-9 pr-9"
              />
              {filterGroup && (
                <button
                  onClick={() => setFilterGroup('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden">
            <div className="h-[calc(100vh-380px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Group</TableHead>
                    <TableHead className="text-right">Parties</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Special row for ungrouped parties */}
                  <TableRow
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedId === null ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectGroup(null)}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-gray-400" />
                      Ungrouped Parties
                    </TableCell>
                    <TableCell className="text-right">
                      {isLoadingParties ? (
                        <Skeleton className="h-4 w-8 ml-auto" />
                      ) : (
                        ungroupedParties?.length || 0
                      )}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {isLoadingGroups ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-8 ml-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-5 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : isGroupsError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {groupsError?.toString() || 'Failed to load groups'}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredGroups?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No groups found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGroups?.map((group) => {
                      const partyCount =
                        parties?.filter((party) => party.groupId === group.id)
                          .length || 0

                      return (
                        <TableRow
                          key={group.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedId === group.id ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => handleSelectGroup(group.id)}
                        >
                          <TableCell className="font-medium flex items-center gap-2">
                            <Folder className="h-4 w-4 text-primary" />
                            {group.groupName}
                          </TableCell>
                          <TableCell className="text-right">
                            {partyCount}
                          </TableCell>
                          <TableCell className="text-right w-10">
                            <Popover>
                              <PopoverTrigger>
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-pointer p-1 rounded hover:bg-gray-100"
                                >
                                  <EllipsisVertical className="h-4 w-4 text-gray-500" />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className='p-2 w-fit'>
                                <Button 
                                  variant={'ghost'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditModal(group.id)
                                  }}
                                >
                                  View/Edit
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Group Details & Parties */}
        <div className="flex flex-col gap-4 w-full md:w-2/3">
          {/* Group Details Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {selectedId ? (
                    <>
                      <Folder className="h-5 w-5 text-primary" />
                      {selectedGroup?.groupName || 'Loading...'}
                    </>
                  ) : (
                    <>
                      <FolderIcon className="h-5 w-5 text-gray-500" />
                      Ungrouped Parties
                    </>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  {selectedPartyIds.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPartyIds([])}
                    >
                      Clear Selection ({selectedPartyIds.length})
                    </Button>
                  )}

                  <Button
                    variant={selectedId ? 'default' : 'secondary'}
                    onClick={handleOpenMoveDialog}
                    disabled={
                      (selectedPartyIds.length === 0 &&
                        filteredParties?.length === 0) ||
                      isLoadingParties
                    }
                  >
                    <MoveRight className="h-4 w-4 mr-1" />
                    {selectedId ? 'Move to Another Group' : 'Assign to Group'}
                  </Button>
                </div>
              </div>
              {selectedGroup?.description && (
                <CardDescription>{selectedGroup.description}</CardDescription>
              )}
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-muted-foreground">
                  {filteredParties?.length || 0} parties{' '}
                  {filterParty ? 'found' : 'in this group'}
                </p>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search parties..."
                    value={filterParty}
                    onChange={(e) => setFilterParty(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {filterParty && (
                    <button
                      onClick={() => setFilterParty('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        style={{ width: '40px' }}
                        className="text-center"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={
                            filteredParties &&
                            filteredParties?.length > 0 &&
                            selectedPartyIds.length === filteredParties?.length
                          }
                          onChange={handleSelectAllParties}
                        />
                      </TableHead>
                      <TableHead>Party Name</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingParties ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className="h-4 w-4 mx-auto" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-16 ml-auto" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-5 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                    ) : isPartiesError ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                              {partiesError?.toString() ||
                                'Failed to load parties'}
                            </AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    ) : filteredParties?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {filterParty
                            ? 'No parties match your search'
                            : selectedId
                            ? 'No parties in this group'
                            : 'No ungrouped parties found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredParties?.map((party) => (
                        <TableRow key={party.id}>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={selectedPartyIds.includes(party.id)}
                              onChange={() => handlePartySelection(party.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{party.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    party.gstType === 'Consumer'
                                      ? 'secondary'
                                      : party.gstType === 'Unregistered'
                                      ? 'outline'
                                      : 'default'
                                  }
                                  className="text-xs"
                                >
                                  {party.gstType}
                                </Badge>
                                {party.phone && (
                                  <span className="text-xs text-muted-foreground">
                                    {party.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {party.openingBalance ? (
                              <span
                                className={
                                  party.openingBalance > 0
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }
                              >
                                {formatCurrency(party.openingBalance)}
                              </span>
                            ) : (
                              '₹0.00'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <button onClick={() => open('Party', party.id)}>
                              <EllipsisVertical className="h-4 w-4 text-gray-500" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Move Parties Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedId
                ? 'Move Parties to Another Group'
                : 'Assign Parties to Group'}
            </DialogTitle>
            <DialogDescription>
              {selectedPartyIds.length === 1
                ? 'Select a group to move this party to.'
                : `Select a group to move ${selectedPartyIds.length} parties to.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label
              htmlFor="targetGroup"
              className="text-sm font-medium mb-2 block"
            >
              Target Group
            </Label>
            <Select
              onValueChange={(value) => setTargetGroupId(value)}
              disabled={movingParties}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {selectedId && (
                  <SelectItem value="None">Remove from Group</SelectItem>
                )}
                {groups
                  ?.filter((group) => group.id !== selectedId)
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.groupName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMoveDialogOpen(false)}
              disabled={movingParties}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMoveParties} 
              disabled={movingParties || (!selectedId && targetGroupId === '')}
            >
              {movingParties ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                'Move Parties'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Group Dialog */}
      <Dialog open={addGroupDialogOpen} onOpenChange={handleAddGroupClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Group</DialogTitle>
            <DialogDescription>
              Create a new group to categorize your parties.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="groupName" className="text-sm font-medium">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="groupName"
                placeholder="e.g. Suppliers"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="groupDesc" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="groupDesc"
                placeholder="Brief description of this group"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Groups help you organize and filter your parties.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={handleAddGroupClose}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup} disabled={!newGroupName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editGroupDialogOpen} onOpenChange={setEditGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the details of this group.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="editGroupName" className="text-sm font-medium">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editGroupName"
                placeholder="e.g. Suppliers"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="editGroupDesc" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="editGroupDesc"
                placeholder="Brief description of this group"
                value={editGroupDescription}
                onChange={(e) => setEditGroupDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditGroupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGroup}
              disabled={!editGroupName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PartyGroups