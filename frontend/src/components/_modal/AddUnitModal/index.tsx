import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  closeForm,
  populateFromUnit,
  updateFormField,
  setSubmitting,
  setSubmitError,
  resetForm,
  setValidationErrors,
  validateUnitForm,
} from '@/redux/slices/unitSlice'
import { toast } from 'react-hot-toast'
import {
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useGetUnitByIdQuery,
} from '@/redux/api'

const AddUnit = () => {
  const dispatch = useAppDispatch()
  const [createUnit, { isLoading: isCreatingUnit }] = useCreateUnitMutation()
  const [updateUnit, { isLoading: isUpdatingUnit }] = useUpdateUnitMutation()
  
  const { 
    isOpen,
    formData, 
    isSubmitting, 
    mode, 
    currentUnitId, 
    submitError, 
    validationErrors 
  } = useAppSelector((state) => state.units)
    
  const { data: editUnit, isLoading: isLoadingUnit } = useGetUnitByIdQuery(
    currentUnitId ?? '',
    { skip: !currentUnitId }
  )
 
  // If mode === edit then set data in the fields
  useEffect(() => {
    // Check if we're in edit mode and have the unit data
    if (mode === 'edit' && editUnit) {
      // Use the populateFromUnit action to set all form data at once
      dispatch(populateFromUnit(editUnit))
    }
  }, [mode, editUnit, dispatch])

  const handleInputChange = (
    field: 'fullname' | 'shortname',
    value: string
  ) => {
    // Process the value if needed
    let processedValue = value
    
    if (field === 'shortname') {
      // Convert short name to uppercase
      processedValue = value.toUpperCase()
    }
    
    // Dispatch the field change to Redux
    dispatch(updateFormField({ field, value: processedValue }))
  }

  const handleSave = async () => {
    // Validate form first
    const errors = validateUnitForm(formData)
    if (Object.keys(errors).length > 0) {
      // Set validation errors in Redux
      dispatch(setValidationErrors(errors))
      
      // Show first validation error as toast
      const firstError = Object.values(errors)[0]
      toast.error(firstError)
      return
    }

    try {
      dispatch(setSubmitting(true))

      if (mode === 'edit' && currentUnitId) {
        // Use updateUnit for edit mode
        await updateUnit({
          id: currentUnitId,
          fullname: formData.fullname.trim(),
          shortname: formData.shortname.trim(),
        }).unwrap()
        
        toast.success(`Unit "${formData.fullname}" updated successfully`)
      } else {
        // Use createUnit for create mode
        await createUnit({
          fullname: formData.fullname.trim(),
          shortname: formData.shortname.trim(),
        }).unwrap()
        
        toast.success(`Unit "${formData.fullname}" added successfully`)
      }
      
      dispatch(closeForm())
    } catch (error: any) {
      dispatch(setSubmitError(error.message || 'Failed to save unit'))
      toast.error(`Failed to ${mode === 'create' ? 'add' : 'update'} unit: ${error.message || 'Unknown error'}`)
    } finally {
      dispatch(setSubmitting(false))
    }
  }

 
  return (
    <Dialog open={true} onOpenChange={() => dispatch(closeForm())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {mode === 'create' ? 'Add New' : 'Edit'} Unit
            </DialogTitle>
           
          </div>
          <DialogDescription>
            {mode === 'create' ? 'Create a new' : 'Update the'} unit for your inventory items.
          </DialogDescription>
        </DialogHeader>

        {/* Display any error message from Redux */}
        {submitError && (
          <div className="bg-destructive/15 p-3 rounded-md text-destructive text-sm mt-4">
            <p>{submitError}</p>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="unitName" className="text-sm font-medium">
              Unit Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unitName"
              placeholder="e.g. KILOGRAMS"
              value={formData.fullname || ''}
              onChange={(e) => handleInputChange('fullname', e.target.value)}
              className="mt-1"
            />
            {validationErrors?.fullname && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.fullname}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="unitShortName" className="text-sm font-medium">
              Unit Short Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unitShortName"
              placeholder="e.g. KG"
              value={formData.shortname || ''}
              onChange={(e) => handleInputChange('shortname', e.target.value)}
              className="mt-1"
            />
            {validationErrors?.shortname && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.shortname}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          This unit will be available for all future inventory items.
        </p>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => dispatch(closeForm())}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !formData.fullname?.trim() || !formData.shortname?.trim()}
            className="gap-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {mode === 'create' ? 'Add' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddUnit