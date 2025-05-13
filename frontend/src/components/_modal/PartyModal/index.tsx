import React, { useEffect, useState } from 'react'
import { closeModal } from '@/redux/slices/modal'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertCircle,
  X,
  UserRound,
  Building2,
  Save,
  Loader2,
  Calendar,
  MapPin,
  Check,
  CreditCard,
  BadgeIndianRupee,
  Phone,
  Mail,
  Building,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Import from our slices
import {
  openCreateForm,
  updateFormField,
  toggleBooleanField,
  setFormData,
  setSubmitting,
  setSubmitError,
  setActiveTab,
  resetForm,
  validatePartyForm,
  setValidationErrors,
  closeForm,
  populateFromParty,
  addAdditionalField,
  updateAdditionalField,
  removeAdditionalField,
} from '@/redux/slices/partySlice'

// Import from our API slices
import {
  useCreateGroupMutation,
  useCreatePartyMutation,
  useUpdatePartyMutation,
  useGetGroupsQuery,
  useGetPartyByIdQuery,
} from '@/redux/api/partiesApi'

const AddParty = () => {
  // Redux state from our slice
  const dispatch = useAppDispatch()
  const {
    formData,
    isSubmitting,
    submitError,
    validationErrors,
    activeTab,
    mode,
    currentPartyId,
  } = useAppSelector((state) => state.partyForm)

  // RTK Query hooks
  const [createGroup] = useCreateGroupMutation()
  const [createParty, { isLoading: isCreatingParty }] = useCreatePartyMutation()
  const [updateParty, { isLoading: isUpdatingParty }] = useUpdatePartyMutation()
  const { data: groups, isLoading: isLoadingGroups } = useGetGroupsQuery()

  // Local UI state
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')

  // Initialize form when component mounts
  useEffect(() => {
    if (mode === 'create') {
      dispatch(resetForm())

      // Set some defaults
      dispatch(
        setFormData({
          name: '',
          gstType: 'Unregistered',
          creditLimitType: 'none',
          openingBalanceType: 'to_pay',
          additionalFields: [],
        })
      )
    }

    // Clean up when component unmounts
    return () => {
      dispatch(resetForm())
    }
  }, [dispatch, mode])

  const { data: editParty, isLoading: editPartyLoading } = useGetPartyByIdQuery(
    currentPartyId ?? ''
  )

  // mode === edit then set data in the fields
  useEffect(() => {
    if (mode === 'edit' && editParty) {
      dispatch(populateFromParty(editParty))
    }
  }, [mode, editParty, dispatch])
  
  // Get states for dropdown
  const indianStates = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
  ]

  // Handle tab change
  const handleTabChange = (value: string) => {
    dispatch(setActiveTab(parseInt(value)))
  }

  // Handle field changes
  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean | number
  ) => {
    dispatch(updateFormField({ field, value }))
  }

  // Handle boolean toggle
  const handleToggle = (field: keyof typeof formData) => {
    dispatch(toggleBooleanField(field))
  }
  
  // Handle adding a new additional field
  const handleAddAdditionalField = () => {
    dispatch(addAdditionalField())
  }
  
  // Handle updating an additional field
  const handleUpdateAdditionalField = (index: number, field: 'key' | 'value', value: string) => {
    dispatch(updateAdditionalField({ index, field, value }))
  }
  
  // Handle removing an additional field
  const handleRemoveAdditionalField = (index: number) => {
    dispatch(removeAdditionalField(index))
  }

  // Form submission
  const handleSave = async () => {
    // Validate form for all tabs
    const errors = validatePartyForm(formData, -1)
    if (Object.keys(errors).length > 0) {
      dispatch(setValidationErrors(errors))

      // Show toast for the first error
      const firstError:any = Object.values(errors)[0]
      toast.error(firstError)
      return
    }

    try {
      dispatch(setSubmitting(true))

      if (mode === 'create') {
        // Submit using the createParty mutation
        await createParty(formData).unwrap()
        toast.success('Party created successfully!')
      } else {
        if (!currentPartyId) {
          throw new Error('Party ID is missing')
        }
        // Update existing party
        await updateParty({
          id: currentPartyId,
          ...formData,
        }).unwrap()
        toast.success('Party updated successfully!')
      }

      dispatch(closeForm())
    } catch (error: any) {
      dispatch(setSubmitError(error.message || 'Failed to save party'))
      toast.error(`Failed to save party: ${error.message || 'Unknown error'}`)
    } finally {
      dispatch(setSubmitting(false))
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

      dispatch(updateFormField({ field: 'groupId', value: result.id }))
      toast.success(`Group "${newGroupName}" added successfully`)
      handleAddGroupClose()
    } catch (error: any) {
      toast.error(`Failed to add group: ${error.message || 'Unknown error'}`)
    }
  }

  // Find group name from ID
  const getGroupName = (id: string) => {
    if (!groups) return ''
    const group = groups.find((g) => g.id === id)
    return group ? group.groupName : ''
  }

  return (
    <Dialog open={true} onOpenChange={() => dispatch(closeForm())}>
     
        <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-white border-b">
            <DialogHeader className="px-6 py-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">
                  {mode === 'create' ? 'Add Party' : 'Edit Party'}
                </DialogTitle>
                <DialogClose className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>
            </DialogHeader>
          </div>

          {/* Display any error message from Redux */}
          {submitError && (
            <Alert variant="destructive" className="mx-6 mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="0"
            value={activeTab.toString()}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="0">Basic Info</TabsTrigger>
                <TabsTrigger value="1">
                  {formData.gstType === 'Regular' ? 'GST & Address' : 'Address'}
                </TabsTrigger>
                <TabsTrigger value="2">Credit & Settings</TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: BASIC INFO */}
            <TabsContent value="0" className="px-6 py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Party Details</CardTitle>
                  <CardDescription>
                    Enter the basic information about this party
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">
                        Party Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                        className="mt-1"
                        placeholder="Enter party name"
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="gstType" className="text-sm font-medium">
                        GST Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.gstType || 'Unregistered'}
                        onValueChange={(value) =>
                          handleInputChange('gstType', value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select GST type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unregistered">
                            Unregistered
                          </SelectItem>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Composition">
                            Composition
                          </SelectItem>
                          <SelectItem value="Consumer">Consumer</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.gstType && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.gstType}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) =>
                          handleInputChange('phone', e.target.value)
                        }
                        className="mt-1"
                        placeholder="Enter phone number"
                      />
                      {validationErrors.phone && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={formData.email || ''}
                        onChange={(e) =>
                          handleInputChange('email', e.target.value)
                        }
                        className="mt-1"
                        placeholder="Enter email address"
                        type="email"
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gstNumber" className="text-sm font-medium">
                      GST Number
                    </Label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber || ''}
                      onChange={(e) =>
                        handleInputChange('gstNumber', e.target.value)
                      }
                      className="mt-1"
                      placeholder="Enter GST Number"
                    />
                    {validationErrors.gstNumber && (
                      <p className="text-xs text-red-500 mt-1">
                        {validationErrors.gstNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="groupId" className="text-sm font-medium">
                        Group (Optional)
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-primary"
                        onClick={handleAddGroupOpen}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Group
                      </Button>
                    </div>

                    <Select
                      value={formData.groupId || ''}
                      onValueChange={(value) =>
                        handleInputChange('groupId', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">No Group</SelectItem>
                        {groups?.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.groupName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: GST & ADDRESS */}
            <TabsContent value="1" className="px-6 py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {formData.gstType === 'Regular'
                      ? 'GST Information & Address'
                      : 'Address Details'}
                  </CardTitle>
                  <CardDescription>
                    {formData.gstType === 'Regular'
                      ? 'Enter GST information and address details'
                      : 'Enter address details for billing and shipping'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.gstType === 'Regular' && (
                    <div>
                      <Label htmlFor="gstNumber" className="text-sm font-medium">
                        GST Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="gstNumber"
                        value={formData.gstNumber || ''}
                        onChange={(e) =>
                          handleInputChange('gstNumber', e.target.value)
                        }
                        className="mt-1"
                        placeholder="Enter GST Number"
                      />
                      {validationErrors.gstNumber && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.gstNumber}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="state" className="text-sm font-medium">
                      State
                    </Label>
                    <Select
                      value={formData.state || ''}
                      onValueChange={(value) =>
                        handleInputChange('state', value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="billingAddress"
                      className="text-sm font-medium"
                    >
                      Billing Address
                    </Label>
                    <Textarea
                      id="billingAddress"
                      value={formData.billingAddress || ''}
                      onChange={(e) =>
                        handleInputChange('billingAddress', e.target.value)
                      }
                      className="mt-1"
                      placeholder="Enter billing address"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shippingEnabled"
                      checked={formData.shippingEnabled}
                      onCheckedChange={(checked) =>
                        handleInputChange('shippingEnabled', checked)
                      }
                    />
                    <Label
                      htmlFor="shippingEnabled"
                      className="text-sm font-medium"
                    >
                      Different shipping address
                    </Label>
                  </div>

                  {formData.shippingEnabled && (
                    <div>
                      <Label
                        htmlFor="shippingAddress"
                        className="text-sm font-medium"
                      >
                        Shipping Address
                      </Label>
                      <Textarea
                        id="shippingAddress"
                        value={formData.shippingAddress || ''}
                        onChange={(e) =>
                          handleInputChange('shippingAddress', e.target.value)
                        }
                        className="mt-1"
                        placeholder="Enter shipping address"
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: CREDIT & SETTINGS */}
            <TabsContent value="2" className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Credit Limit & Balance
                    </CardTitle>
                    <CardDescription>
                      Set opening balance and credit limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label
                        htmlFor="openingBalance"
                        className="text-sm font-medium"
                      >
                        Opening Balance
                      </Label>
                      <Input
                        id="openingBalance"
                        type="number"
                        value={formData.openingBalance || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'openingBalance',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="mt-1"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <Label
                        htmlFor="openingBalanceType"
                        className="text-sm font-medium"
                      >
                        Balance Type
                      </Label>
                      <RadioGroup
                        value={formData.openingBalanceType || 'to_pay'}
                        onValueChange={(value) => 
                          handleInputChange('openingBalanceType', value)
                        }
                        className="flex space-x-4 mt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="to_pay" id="to_pay" />
                          <Label htmlFor="to_pay">To Pay</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="to_receive" id="to_receive" />
                          <Label htmlFor="to_receive">To Receive</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label
                        htmlFor="openingBalanceDate"
                        className="text-sm font-medium"
                      >
                        As of Date
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="openingBalanceDate"
                          type="date"
                          value={
                            formData.openingBalanceDate ||
                            new Date().toISOString().split('T')[0]
                          }
                          onChange={(e) =>
                            handleInputChange(
                              'openingBalanceDate',
                              e.target.value
                            )
                          }
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="creditLimitType"
                        className="text-sm font-medium"
                      >
                        Credit Limit
                      </Label>
                      <Select
                        value={formData.creditLimitType || 'none'}
                        onValueChange={(value) =>
                          handleInputChange('creditLimitType', value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Credit limit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Limit</SelectItem>
                          <SelectItem value="custom">Custom Limit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.creditLimitType === 'custom' && (
                      <div>
                        <Label
                          htmlFor="creditLimitValue"
                          className="text-sm font-medium"
                        >
                          Limit Amount
                        </Label>
                        <Input
                          id="creditLimitValue"
                          type="number"
                          value={formData.creditLimitValue || ''}
                          onChange={(e) =>
                            handleInputChange(
                              'creditLimitValue',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="mt-1"
                          placeholder="0.00"
                        />
                        {validationErrors.creditLimitValue && (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors.creditLimitValue}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Additional Settings
                    </CardTitle>
                    <CardDescription>
                      Configure reminders and custom fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            Payment Reminders
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Send reminders for overdue payments
                          </p>
                        </div>
                        <Switch
                          checked={formData.paymentReminderEnabled}
                          onCheckedChange={(checked) =>
                            handleInputChange('paymentReminderEnabled', checked)
                          }
                        />
                      </div>

                      {formData.paymentReminderEnabled && (
                        <div>
                          <Label
                            htmlFor="paymentReminderDays"
                            className="text-sm font-medium"
                          >
                            Remind after (days)
                          </Label>
                          <Input
                            id="paymentReminderDays"
                            type="number"
                            value={formData.paymentReminderDays || ''}
                            onChange={(e) =>
                              handleInputChange(
                                'paymentReminderDays',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="mt-1"
                            placeholder="7"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            Loyalty Points
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Enable loyalty points for this party
                          </p>
                        </div>
                        <Switch
                          checked={formData.loyaltyPointsEnabled}
                          onCheckedChange={(checked) =>
                            handleInputChange('loyaltyPointsEnabled', checked)
                          }
                        />
                      </div>

                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">
                            Additional Fields
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-primary"
                            onClick={handleAddAdditionalField}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Field
                          </Button>
                        </div>
                        
                        {formData.additionalFields && formData.additionalFields.length > 0 ? (
                          <div className="space-y-3">
                            {formData.additionalFields.map((field, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="flex-1">
                                  <Input
                                    placeholder="Field Name"
                                    value={field.key}
                                    onChange={(e) => 
                                      handleUpdateAdditionalField(index, 'key', e.target.value)
                                    }
                                  />
                                  {validationErrors[`additionalField_${index}_key`] && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {validationErrors[`additionalField_${index}_key`]}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <Input
                                    placeholder="Value"
                                    value={field.value}
                                    onChange={(e) => 
                                      handleUpdateAdditionalField(index, 'value', e.target.value)
                                    }
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveAdditionalField(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No additional fields. Click Add Field to create custom fields.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* BOTTOM BUTTONS - STICKY */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => dispatch(closeModal())}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || !formData.name}
              className="gap-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mode === 'create' ? 'Create Party' : 'Update Party'}
            </Button>
          </div>
        </DialogContent>
 

      {/* Add Group Dialog */}
      {addGroupDialogOpen && (
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
      )}
    </Dialog>
  )
}

export default AddParty