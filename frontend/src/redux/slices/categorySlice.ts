// store/slices/categoryFormSlice.ts
import { Category } from '@/models/item/item.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Create a type for the category form data
type CategoryFormData = Omit<Category, 'id'>;

export interface CategoryFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentCategoryId: string | null;
  formData: CategoryFormData;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
}

const initialState: CategoryFormState = {
  isOpen: false,
  mode: 'create',
  currentCategoryId: null,
  formData: {
    name: '',
    description: ''
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {}
};

const categoryFormSlice = createSlice({
  name: 'categoryForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentCategoryId = null;
      state.formData = { ...initialState.formData };
      state.submitError = null;
      state.validationErrors = {};
    },
    
    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentCategoryId = action.payload;
      // Note: formData will be populated from API data in the component
      state.submitError = null;
      state.validationErrors = {};
    },
    
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Form data management
    setFormData: (state, action: PayloadAction<CategoryFormData>) => {
      state.formData = action.payload;
    },
    
    updateFormField: (state, action: PayloadAction<{
      field: keyof CategoryFormData,
      value: any
    }>) => {
      const { field, value } = action.payload;
      (state.formData as any)[field] = value;
      
      // Clear validation error when field is updated
      if (state.validationErrors[field]) {
        delete state.validationErrors[field];
      }
    },
    
    // Submission state management
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    
    setSubmitError: (state, action: PayloadAction<string | null>) => {
      state.submitError = action.payload;
    },
    
    setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.validationErrors = action.payload;
    },
    
    resetForm: (state) => {
      state.formData = { ...initialState.formData };
      state.submitError = null;
      state.validationErrors = {};
    },
    
    // Populate form data from an existing category
    populateFromCategory: (state, action: PayloadAction<Category>) => {
      const category = action.payload;
      state.formData = {
        name: category.name,
        description: category.description
      };
    }
  }
});

// Helper function to validate form data before submission
export function validateCategoryForm(formData: CategoryFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields validation
  if (!formData.name.trim()) {
    errors.name = 'Category name is required';
  }
  
  return errors;
}

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  setFormData,
  updateFormField,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  resetForm,
  populateFromCategory
} = categoryFormSlice.actions;

export default categoryFormSlice.reducer;