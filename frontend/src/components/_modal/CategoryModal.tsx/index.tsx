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
import { Textarea } from '@/components/ui/textarea'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  closeForm,
  populateFromCategory,
  updateFormField,
} from '@/redux/slices/categorySlice'
import { X } from 'lucide-react'
import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import {
  useCreateCategoryMutation,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
} from '@/redux/api/categoriesApi'

const AddCategory = () => {
  const dispatch = useAppDispatch()
  const [createCategory] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const { formData, isSubmitting, submitError, validationErrors } =
    useAppSelector((state) => state.categories)
  const { mode, currentCategoryId } = useAppSelector(
    (state) => state.categories
  )
  const { data: editCategory } = useGetCategoryByIdQuery(
    currentCategoryId ?? ''
  
  )

  // mode === edit then set data in the fields
  useEffect(() => {
    // Check if we're in edit mode and have the item data
    if (mode === 'edit'  && editCategory) {
      // Use the populateFromItem action to set all form data at once
      dispatch(populateFromCategory(editCategory))
    }
  }, [mode, editCategory, dispatch])

  const handleInputChange = (
    field: 'name' | 'description',
    value: string | boolean
  ) => {
    let processedValue = value
    // Dispatch the field change to Redux
    dispatch(updateFormField({ field, value: processedValue }))
  }

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a valid category name')
      return
    }

      try {
          if (mode === 'create') {
              const result = await createCategory({
                name: formData.name.trim(),
                description: (formData.description ?? '').trim(),
              }).unwrap()
        
              //   dispatch(updateFormField({ field: 'categoryId', value: result.id }))
              toast.success(`Category "${formData.name}" added successfully`)
            
          } else {
               const result = await updateCategory({
                 id: currentCategoryId ?? '',
                 name: formData.name.trim(),
                 description: (formData.description ?? '').trim(),
               }).unwrap()

               //   dispatch(updateFormField({ field: 'categoryId', value: result.id }))
              toast.success(`Category "${formData.name}" Edited successfully`)
        }
      dispatch(closeForm())
    } catch (error: any) {
      toast.error(`Failed to add category: ${error.message || 'Unknown error'}`)
    }
  }
  return (
    <Dialog open={true} onOpenChange={() => dispatch(closeForm())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            Create a new category to organize your inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="categoryName" className="text-sm font-medium">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="categoryName"
              placeholder="e.g. Electronics"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="categoryDesc" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="categoryDesc"
              placeholder="Brief description of this category"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Categories help you organize and filter your inventory.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => dispatch(closeForm())}>
            Cancel
          </Button>
          <Button onClick={handleAddCategory} disabled={!formData.name.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddCategory
