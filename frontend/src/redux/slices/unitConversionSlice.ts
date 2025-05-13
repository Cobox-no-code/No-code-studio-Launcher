// store/slices/unitConversionFormSlice.ts
import { UnitConversion } from '@/models/item/item.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Create a type for the unit conversion form data
type UnitConversionFormData = Omit<UnitConversion, 'id'>;

export interface UnitConversionFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentConversionId: string | null;
  formData: UnitConversionFormData;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
}

const initialState: UnitConversionFormState = {
  isOpen: false,
  mode: 'create',
  currentConversionId: null,
  formData: {
    primaryUnitId: '',
    secondaryUnitId: '',
    conversionRate: 1
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {}
};

const unitConversionFormSlice = createSlice({
  name: 'unitConversionForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state, action: PayloadAction<string | undefined>) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentConversionId = null;
      state.formData = { 
        ...initialState.formData,
        // If a primary unit ID is provided, use it
        primaryUnitId: action.payload || initialState.formData.primaryUnitId
      };
      state.submitError = null;
      state.validationErrors = {};
    },
    
    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentConversionId = action.payload;
      // Note: formData will be populated from API data in the component
      state.submitError = null;
      state.validationErrors = {};
    },
    
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Form data management
    setFormData: (state, action: PayloadAction<UnitConversionFormData>) => {
      state.formData = action.payload;
    },
    
    updateFormField: (state, action: PayloadAction<{
      field: keyof UnitConversionFormData,
      value: any
    }>) => {
      const { field, value } = action.payload;
      
      // Special handling for conversionRate to ensure it's a number
      if (field === 'conversionRate') {
        state.formData.conversionRate = parseFloat(value) || 0;
      } else {
        (state.formData as any)[field] = value;
      }
      
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
    
    // Populate form data from an existing unit conversion
    populateFromConversion: (state, action: PayloadAction<UnitConversion>) => {
      const conversion = action.payload;
      state.formData = {
        primaryUnitId: conversion.primaryUnitId,
        secondaryUnitId: conversion.secondaryUnitId,
        conversionRate: conversion.conversionRate
      };
    }
  }
});

// Helper function to validate form data before submission
export function validateUnitConversionForm(formData: UnitConversionFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields validation
  if (!formData.primaryUnitId) {
    errors.primaryUnitId = 'Primary unit is required';
  }
  
  if (!formData.secondaryUnitId) {
    errors.secondaryUnitId = 'Secondary unit is required';
  }
  
  if (formData.primaryUnitId === formData.secondaryUnitId) {
    errors.secondaryUnitId = 'Primary and secondary units must be different';
  }
  
  if (!formData.conversionRate || formData.conversionRate <= 0) {
    errors.conversionRate = 'Conversion rate must be greater than zero';
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
  populateFromConversion
} = unitConversionFormSlice.actions;

export default unitConversionFormSlice.reducer;