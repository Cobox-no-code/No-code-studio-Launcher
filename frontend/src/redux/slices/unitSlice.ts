// store/slices/unitFormSlice.ts
import { Unit } from '@/models/item/item.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Create a type for the unit form data
type UnitFormData = Omit<Unit, 'id'>;

export interface UnitFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentUnitId: string | null;
  formData: UnitFormData;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
}

const initialState: UnitFormState = {
  isOpen: false,
  mode: 'create',
  currentUnitId: null,
  formData: {
    fullname: '',
    shortname: ''
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {}
};

const unitFormSlice = createSlice({
  name: 'unitForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentUnitId = null;
      state.formData = { ...initialState.formData };
      state.submitError = null;
      state.validationErrors = {};
    },
    
    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentUnitId = action.payload;
      // Note: formData will be populated from API data in the component
      state.submitError = null;
      state.validationErrors = {};
    },
    
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Form data management
    setFormData: (state, action: PayloadAction<UnitFormData>) => {
      state.formData = action.payload;
    },
    
    updateFormField: (state, action: PayloadAction<{
      field: keyof UnitFormData,
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
    
    // Populate form data from an existing unit
    populateFromUnit: (state, action: PayloadAction<Unit>) => {
      const unit = action.payload;
      state.formData = {
        fullname: unit.fullname,
        shortname: unit.shortname
      };
    }
  }
});

// Helper function to validate form data before submission
export function validateUnitForm(formData: UnitFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields validation
  if (!formData.fullname.trim()) {
    errors.fullname = 'Unit name is required';
  }
  
  if (!formData.shortname.trim()) {
    errors.shortname = 'Unit short name is required';
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
  populateFromUnit
} = unitFormSlice.actions;

export default unitFormSlice.reducer;