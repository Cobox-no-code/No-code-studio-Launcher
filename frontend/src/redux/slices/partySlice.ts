// store/slices/partyFormSlice.ts
import { Party } from '@/models/party/party.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Create a type for the party form data
type PartyFormData = Omit<Party, 'id' | 'createdAt' | 'updatedAt'>;

export interface PartyFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentPartyId: string | null;
  formData: PartyFormData;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
  activeTab: number; // For multi-tab form
}

const initialState: PartyFormState = {
  isOpen: false,
  mode: 'create',
  currentPartyId: null,
  formData: {
    name: '',
    gstType: 'Unregistered',
    additionalFields: [],
    openingBalanceType: 'to_pay'
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {},
  activeTab: 0
};

const partyFormSlice = createSlice({
  name: 'partyForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentPartyId = null;
      state.formData = { ...initialState.formData };
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },
    
    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentPartyId = action.payload;
      // Note: formData will be populated from API data in the component
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },
    
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Form data management
    setFormData: (state, action: PayloadAction<PartyFormData>) => {
      state.formData = action.payload;
    },
    
    updateFormField: (state, action: PayloadAction<{
      field: keyof PartyFormData,
      value: any
    }>) => {
      const { field, value } = action.payload;
      (state.formData as any)[field] = value;
      
      // Clear validation error when field is updated
      if (state.validationErrors[field]) {
        delete state.validationErrors[field];
      }
    },
    
    // Handle checkbox fields specifically (since they need boolean conversion)
    toggleBooleanField: (state, action: PayloadAction<keyof PartyFormData>) => {
      const field = action.payload;
      (state.formData as any)[field] = !(state.formData as any)[field];
      
      // Clear validation error when field is updated
      if (state.validationErrors[field]) {
        delete state.validationErrors[field];
      }
    },
    
    // Additional Fields Management
    addAdditionalField: (state) => {
      if (!state.formData.additionalFields) {
        state.formData.additionalFields = [];
      }
      
      // Add a new empty field
      state.formData.additionalFields.push({ key: '', value: '' });
    },
    
    updateAdditionalField: (state, action: PayloadAction<{
      index: number,
      field: 'key' | 'value',
      value: string
    }>) => {
      const { index, field, value } = action.payload;
      
      if (state.formData.additionalFields && 
          state.formData.additionalFields[index]) {
        state.formData.additionalFields[index][field] = value;
      }
    },
    
    removeAdditionalField: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      
      if (state.formData.additionalFields) {
        state.formData.additionalFields = state.formData.additionalFields.filter((_, i) => i !== index);
      }
    },
    
    // Tab navigation
    setActiveTab: (state, action: PayloadAction<number>) => {
      state.activeTab = action.payload;
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
      state.activeTab = 0;
    },
    
    // Populate form data from an existing party
    populateFromParty: (state, action: PayloadAction<Party>) => {
      const party = action.payload;
      
      // Convert any boolean values stored as numbers
      const formData: PartyFormData = {
        ...party,
        shippingEnabled: Boolean(party.shippingEnabled),
        paymentReminderEnabled: Boolean(party.paymentReminderEnabled),
        loyaltyPointsEnabled: Boolean(party.loyaltyPointsEnabled)
      };
      
      // Ensure additionalFields is initialized
      if (!formData.additionalFields) {
        formData.additionalFields = [];
      }
      
      // Remove id and timestamps
      delete (formData as any).id;
      delete (formData as any).createdAt;
      delete (formData as any).updatedAt;
      
      state.formData = formData;
    }
  }
});

// Helper function to validate form data before submission
export function validatePartyForm(formData: PartyFormData, activeTab: number): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Basic info validation (tab 0)
  if (activeTab === 0 || activeTab === -1) {
    if (!formData.name?.trim()) {
      errors.name = 'Party name is required';
    }
    
    if (!formData.gstType) {
      errors.gstType = 'GST type is required';
    }
    
    // Validate GST number format if GST type is Regular
    if (formData.gstType === 'Regular' && formData.gstNumber) {
      // Simple GST format validation - 15 characters
      if (!/^[0-9A-Z]{15}$/.test(formData.gstNumber)) {
        errors.gstNumber = 'Invalid GST Number format (must be 15 alphanumeric characters)';
      }
    }
    
    // Phone validation - if provided
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }
    
    // Email validation - if provided
    if (formData.email && 
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
  }
  
  // Credit & Balance validation (tab 1)
  if (activeTab === 1 || activeTab === -1) {
    if (formData.creditLimitType === 'custom' && 
        (formData.creditLimitValue === undefined || formData.creditLimitValue <= 0)) {
      errors.creditLimitValue = 'Credit limit must be greater than zero';
    }
  }
  
  // Validate additional fields if any
  if (formData.additionalFields && formData.additionalFields.length > 0) {
    formData.additionalFields.forEach((field, index) => {
      if (field.key.trim() === '') {
        errors[`additionalField_${index}_key`] = 'Field name cannot be empty';
      }
    });
  }
  
  return errors;
}

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  setFormData,
  updateFormField,
  toggleBooleanField,
  addAdditionalField,
  updateAdditionalField,
  removeAdditionalField,
  setActiveTab,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  resetForm,
  populateFromParty
} = partyFormSlice.actions;

export default partyFormSlice.reducer;