import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  import { useAppDispatch, useAppSelector } from '@/redux/hooks'
  import {
    closeForm,
    populateFromConversion,
    updateFormField,
    setSubmitting,
    setSubmitError,
    setValidationErrors,
    validateUnitConversionForm
  } from '@/redux/slices/unitConversionSlice'
  import { X, AlertCircle } from 'lucide-react'
  import React, { useEffect, useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
  import { Skeleton } from '@/components/ui/skeleton'
  import { Card, CardContent } from '@/components/ui/card'
  import toast from 'react-hot-toast'
  import {
    useCreateUnitConversionMutation,
    useGetUnitConversionByIdQuery,
    useUpdateUnitConversionMutation,
    useGetUnitsQuery,
  } from '@/redux/api'
  
  const UnitConversionForm = () => {
    const dispatch = useAppDispatch()
    
    // Get state from Redux using your slice structure
    const { 
      isOpen, 
      mode, 
      currentConversionId, 
      formData, 
      isSubmitting, 
      submitError, 
      validationErrors 
    } = useAppSelector((state) => state.unitConversion)
    
    // RTK Query hooks
    const [createUnitConversion] = useCreateUnitConversionMutation()
    const [updateUnitConversion] = useUpdateUnitConversionMutation()
    const { data: editUnitConversion } = useGetUnitConversionByIdQuery(
      currentConversionId ?? '', 
      { skip: !currentConversionId }
    )
    const { data: units, isLoading: isLoadingUnits } = useGetUnitsQuery()
    
    // Populate form data when in edit mode
    useEffect(() => {
      if (mode === 'edit' && editUnitConversion) {
        dispatch(populateFromConversion(editUnitConversion))
      }
    }, [mode, editUnitConversion, dispatch])
  
    // Handle form field changes
    const handleInputChange = (
      field: keyof typeof formData,
      value: string | number
    ) => {
      dispatch(updateFormField({ field, value }))
    }
  
    // Validate form before submission
    const validateForm = () => {
      const errors = validateUnitConversionForm(formData)
      
      if (Object.keys(errors).length > 0) {
        dispatch(setValidationErrors(errors))
        return false
      }
      
      return true
    }
  
    // Handle form submission
    const handleSaveUnitConversion = async () => {
      if (!validateForm()) {
        return
      }
  
      try {
        dispatch(setSubmitting(true))
        
        if (mode === 'create') {
          // Create new unit conversion
          const result = await createUnitConversion({
            primaryUnitId: formData.primaryUnitId,
            secondaryUnitId: formData.secondaryUnitId,
            conversionRate: formData.conversionRate,
          }).unwrap()
          
          toast.success('Unit conversion created successfully')
        } else {
          // Update existing unit conversion
          const result = await updateUnitConversion({
            id: currentConversionId ?? '',
            primaryUnitId: formData.primaryUnitId,
            secondaryUnitId: formData.secondaryUnitId,
            conversionRate: formData.conversionRate,
          }).unwrap()
          
          toast.success('Unit conversion updated successfully')
        }
        
        // Close the form
        dispatch(closeForm())
      } catch (error: any) {
        dispatch(setSubmitError(error.message || 'An unknown error occurred'))
        toast.error(`Failed to save unit conversion: ${error.message || 'Unknown error'}`)
      } finally {
        dispatch(setSubmitting(false))
      }
    }
  
    // Get unit name from ID
    const getUnitName = (id: string) => {
      if (!units) return ''
      const unit = units.find(u => u.id === id)
      return unit ? `${unit.fullname} (${unit.shortname})` : ''
    }
  
    // Don't render anything if the form is not open
    if (!isOpen) return null
  
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && dispatch(closeForm())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? 'Edit Unit Conversion' : 'Create Unit Conversion'}
            </DialogTitle>
            <DialogDescription>
              Define how primary units convert to secondary units for accurate inventory tracking.
            </DialogDescription>
          </DialogHeader>
  
          {/* Display any error message */}
          {submitError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
  
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="primaryUnit" className="text-sm font-medium">
                Primary Unit <span className="text-red-500">*</span>
              </Label>
              {isLoadingUnits ? (
                <Skeleton className="h-10 w-full mt-1" />
              ) : (
                <>
                  <Select
                    value={formData.primaryUnitId || ''}
                    onValueChange={(value) => handleInputChange('primaryUnitId', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select primary unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.fullname} ({unit.shortname})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.primaryUnitId && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.primaryUnitId}</p>
                  )}
                </>
              )}
            </div>
  
            <div>
              <Label htmlFor="secondaryUnit" className="text-sm font-medium">
                Secondary Unit <span className="text-red-500">*</span>
              </Label>
              {isLoadingUnits ? (
                <Skeleton className="h-10 w-full mt-1" />
              ) : (
                <>
                  <Select
                    value={formData.secondaryUnitId || ''}
                    onValueChange={(value) => handleInputChange('secondaryUnitId', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select secondary unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.fullname} ({unit.shortname})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.secondaryUnitId && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.secondaryUnitId}</p>
                  )}
                </>
              )}
            </div>
  
            <div>
              <Label htmlFor="conversionRate" className="text-sm font-medium">
                Conversion Rate <span className="text-red-500">*</span>
              </Label>
              <Input
                id="conversionRate"
                type="text"
                value={formData.conversionRate || ''}
                onChange={(e) => handleInputChange('conversionRate', e.target.value)}
                className="mt-1"
                placeholder="e.g. 12"
              />
              {validationErrors.conversionRate && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.conversionRate}</p>
              )}
            </div>
          </div>
  
          {formData.primaryUnitId && formData.secondaryUnitId && formData.conversionRate > 0 && (
            <Card className="mt-2">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Conversion Preview:</p>
                <p className="text-base">
                  1 {getUnitName(formData.primaryUnitId)} = {formData.conversionRate} {getUnitName(formData.secondaryUnitId)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Example: 1 BOX = 12 PIECES
                </p>
              </CardContent>
            </Card>
          )}
  
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch(closeForm())}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUnitConversion}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'} Unit Conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  
  export default UnitConversionForm