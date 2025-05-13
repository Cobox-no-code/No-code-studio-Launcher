// store/slices/itemsFormSlice.ts
import {
    BaseItem,
    Item,
    ItemType,
    Product,
    Service,
} from '@/models/item/item.model'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Create a type that combines all possible form fields
// This is easier to work with in the form context
type ItemFormData = Omit<BaseItem, 'id'> & {
  // Product-specific fields as optional
  unit_conversionId?: string
  purchasePrice?: number
  primaryOpeningQuantity?: number
  secondaryOpeningQuantity?: number
  pricePerUnit?: number
  minStockLevel?: number
  location?: string

  // Additional form-specific fields not in the model
  salePriceTaxInclusive?: boolean
  purchasePriceTaxInclusive?: boolean
  openingStockDate?: Date
  allowNegativeStock?: boolean
  isActive?: boolean
  isFavorite?: boolean

  // For custom fields
  customFields?: Record<string, any>
}

export interface ItemFormState {
  isOpen: boolean
  mode: 'create' | 'edit'
  currentItemId: string | null
  formData: ItemFormData
  isSubmitting: boolean
  submitError: string | null
  validationErrors: Record<string, string>
}

const initialState: ItemFormState = {
  isOpen: false,
  mode: 'create',
  currentItemId: null,
  formData: {
    name: '',
    type: ItemType.PRODUCT,
    categoryId: '',
    salePrice: 0,
    isActive: true,
    primaryOpeningQuantity: 0,
    secondaryOpeningQuantity: 0,
    pricePerUnit: 0,
    customFields: {},
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {},
}

const itemsFormSlice = createSlice({
  name: 'itemsForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state) => {
      state.isOpen = true
      state.mode = 'create'
      state.currentItemId = null
      state.formData = { ...initialState.formData }
      state.submitError = null
      state.validationErrors = {}
    },

    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true
      state.mode = 'edit'
      state.currentItemId = action.payload
      // Note: formData will be populated from API data in the component
      state.submitError = null
      state.validationErrors = {}
    },

    closeForm: (state) => {
      state.isOpen = false
    },

    // Form data management
    setFormData: (state, action: PayloadAction<ItemFormData>) => {
      state.formData = action.payload
    },

    updateFormField: (
      state,
      action: PayloadAction<{
        field: keyof ItemFormData
        value: any
      }>
    ) => {
      const { field, value } = action.payload
      ;(state.formData as any)[field] = value

      // Clear validation error when field is updated
      if (state.validationErrors[field]) {
        delete state.validationErrors[field]
      }
    },

    setItemType: (state, action: PayloadAction<ItemType>) => {
      state.formData.type = action.payload

      // Clear product-specific fields when switching to service
      if (action.payload === ItemType.SERVICE) {
        state.formData.unit_conversionId = undefined
        state.formData.purchasePrice = undefined
        state.formData.primaryOpeningQuantity = 0
        state.formData.secondaryOpeningQuantity = undefined
        state.formData.pricePerUnit = undefined
        state.formData.minStockLevel = undefined
        state.formData.location = undefined
        state.formData.purchasePriceTaxInclusive = undefined
        state.formData.allowNegativeStock = undefined
      }
    },

    // Submission state management
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload
    },

    setSubmitError: (state, action: PayloadAction<string | null>) => {
      state.submitError = action.payload
    },

    setValidationErrors: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
      state.validationErrors = action.payload
    },

    resetForm: (state) => {
      state.formData = { ...initialState.formData }
      state.submitError = null
      state.validationErrors = {}
    },

    // Populate form data from an existing item
    populateFromItem: (state, action: PayloadAction<Item>) => {
      const item = action.payload

      // Set base item properties
      state.formData = {
        name: item.name,
        type: item.type,
        hsnCode: item.hsnCode,
        itemCode: item.itemCode,
        description: item.description,
        imageUrl: item.imageUrl,
        categoryId: item.categoryId,
        salePrice: item.salePrice,
        wholesalePrice: item.wholesalePrice,
        taxRate: item.taxRate,
      }

      // Add product-specific properties if it's a product
      if (item.type === ItemType.PRODUCT) {
        const productItem = item as Product
        state.formData.unit_conversionId = productItem.unit_conversionId
        state.formData.purchasePrice = productItem.purchasePrice
        state.formData.primaryOpeningQuantity =
          productItem.primaryOpeningQuantity
        state.formData.secondaryOpeningQuantity =
          productItem.secondaryOpeningQuantity
        state.formData.pricePerUnit = productItem.pricePerUnit
        state.formData.minStockLevel = productItem.minStockLevel
        state.formData.location = productItem.location
      } else if (item.type === ItemType.SERVICE) {
        const serviceItem = item as Service
        state.formData.unit_conversionId = serviceItem.unit_conversionId
      }
    },
  },
})

// Helper function to transform form data to the correct model type
// Use this before API submission
export function transformFormToModel(
  formData: ItemFormData
): Omit<Product, 'id'> | Omit<Service, 'id'> {
  const baseItem = {
    name: formData.name,
    type: formData.type,
    hsnCode: formData.hsnCode,
    itemCode: formData.itemCode,
    description: formData.description,
    imageUrl: formData.imageUrl,
    categoryId: formData.categoryId,
    salePrice: formData.salePrice,
    wholesalePrice: formData.wholesalePrice,
    taxRate: formData.taxRate,
    

  }

  if (formData.type === ItemType.PRODUCT) {
    // Return as Product type
    return {
      ...baseItem,
      type: ItemType.PRODUCT,
      unit_conversionId: formData.unit_conversionId || '',
      purchasePrice: formData.purchasePrice || 0,
      primaryOpeningQuantity: formData.primaryOpeningQuantity || 0,
      secondaryOpeningQuantity: formData.secondaryOpeningQuantity || 0,
      pricePerUnit: formData.pricePerUnit || 0,
  
      minStockLevel: formData.minStockLevel,
      location: formData.location,
    } as Omit<Product, 'id'>
  } else {
    // Return as Service type
    return {
      ...baseItem,
      type: ItemType.SERVICE,
      unit_conversionId: formData.unit_conversionId || undefined,
    } as Omit<Service, 'id'>
  }
}
// Helper function to validate form data before submission
export function validateFormData(
  formData: ItemFormData
): Record<string, string> {
  const errors: Record<string, string> = {}

  // Required fields validation
  if (!formData.name.trim()) {
    errors.name = 'Name is required'
  }




  return errors
}

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  setFormData,
  updateFormField,
  setItemType,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  resetForm,
  populateFromItem,
} = itemsFormSlice.actions

export default itemsFormSlice.reducer
