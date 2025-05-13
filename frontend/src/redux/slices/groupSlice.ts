// store/slices/groupFormSlice.ts
import { Group } from '@/models/party/party.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Create a type for the group form data
type GroupFormData = Omit<Group, 'id' | 'createdAt' | 'updatedAt'>;

export interface GroupFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentGroupId: string | null;
  formData: GroupFormData;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
}

const initialState: GroupFormState = {
  isOpen: false,
  mode: 'create',
  currentGroupId: null,
  formData: {
    groupName: '',
    description: ''
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {}
};

const groupFormSlice = createSlice({
  name: 'groupForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentGroupId = null;
      state.formData = { ...initialState.formData };
      state.submitError = null;
      state.validationErrors = {};
    },
    
    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentGroupId = action.payload;
      // Note: formData will be populated from API data in the component
      state.submitError = null;
      state.validationErrors = {};
    },
    
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Form data management
    setFormData: (state, action: PayloadAction<GroupFormData>) => {
      state.formData = action.payload;
    },
    
    updateFormField: (state, action: PayloadAction<{
      field: keyof GroupFormData,
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
    
    // Populate form data from an existing group
    populateFromGroup: (state, action: PayloadAction<Group>) => {
      const group = action.payload;
      state.formData = {
        groupName: group.groupName,
        description: group.description
      };
    }
  }
});

// Helper function to validate form data before submission
export function validateGroupForm(formData: GroupFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields validation
  if (!formData.groupName.trim()) {
    errors.groupName = 'Group name is required';
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
  populateFromGroup
} = groupFormSlice.actions;

export default groupFormSlice.reducer;