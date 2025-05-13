// store/slices/documentFormSlice.ts
import {
    Document,
    DocumentCharge,
    DocumentItem,
    DocumentTransportation,
    DocumentType,
    PaymentType,
    TransactionType
} from '@/models/document/document.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the form state type
export interface DocumentFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentDocumentId: string | null;
  documentType: DocumentType | string;
  formData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
  activeTab: number; // For multi-tab form
}

// Function to get default form data based on document type
const getDefaultFormData = (documentType: DocumentType | string): Omit<Document, 'id' | 'createdAt' | 'updatedAt'> => {
  // Determine if this is a sales or purchase document
  const isSalesDocument = String(documentType).startsWith('sale') || documentType === DocumentType.DELIVERY_CHALLAN;
  
  return {
    firmId:'',
    documentType : DocumentType.SALE_INVOICE,
    documentNumber: '',
    documentDate: new Date().toISOString().split('T')[0],
    partyName: '',
    partyType: isSalesDocument ? 'customer' : 'supplier',
    transactionType: TransactionType.CASH,
    status: 'draft',
    roundOff: 0,
    total: 0,
    balanceAmount: 0,
    paidAmount: 0,
    paymentType: PaymentType.CASH,
    items: [],
    charges: [],
    transportation: [],
    discountAmount: 0,
    discountPercentage: 0,
    taxAmount: 0,
    taxPercentage: 0
  };
};

// Create initial state
const initialState: DocumentFormState = {
  isOpen: false,
  mode: 'create',
  currentDocumentId: null,
  documentType: DocumentType.SALE_INVOICE,
  formData: getDefaultFormData(DocumentType.SALE_INVOICE),
  isSubmitting: false,
  submitError: null,
  validationErrors: {},
  activeTab: 0
};

// Create the slice
const documentFormSlice = createSlice({
  name: 'documentForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state, action: PayloadAction<DocumentType | string>) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentDocumentId = null;
      state.documentType = action.payload;
      state.formData = getDefaultFormData(action.payload);
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },
    
    openEditForm: (state, action: PayloadAction<{ id: string, documentType: DocumentType | string }>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentDocumentId = action.payload.id;
      state.documentType = action.payload.documentType;
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },
    
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Form data management
    setFormData: (state, action: PayloadAction<Partial<DocumentFormState['formData']>>) => {
      state.formData = {
        ...state.formData,
        ...action.payload
      };
    },
    
    // Update a single form field
    updateFormField: (state, action: PayloadAction<{
      field: keyof DocumentFormState['formData'], 
      value: any
    }>) => {
      const { field, value } = action.payload;
      (state.formData as any)[field] = value;
      
      // Clear validation error when field is updated
      if (state.validationErrors[field]) {
        delete state.validationErrors[field];
      }
    },
    
    // Item management
    addItem: (state, action: PayloadAction<DocumentItem>) => {
      if (!state.formData.items) {
        state.formData.items = [];
      }
      state.formData.items.push(action.payload);
      
      // Recalculate totals
      calculateTotals(state);
    },
    
    updateItem: (state, action: PayloadAction<{ index: number, item: DocumentItem }>) => {
      const { index, item } = action.payload;
      if (state.formData.items && index >= 0 && index < state.formData.items.length) {
        state.formData.items[index] = item;
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    removeItem: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (state.formData.items && index >= 0 && index < state.formData.items.length) {
        state.formData.items.splice(index, 1);
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    // Charge management
    addCharge: (state, action: PayloadAction<DocumentCharge>) => {
      if (!state.formData.charges) {
        state.formData.charges = [];
      }
      state.formData.charges.push(action.payload);
      
      // Recalculate totals
      calculateTotals(state);
    },
    
    updateCharge: (state, action: PayloadAction<{ index: number, charge: DocumentCharge }>) => {
      const { index, charge } = action.payload;
      if (state.formData.charges && index >= 0 && index < state.formData.charges.length) {
        state.formData.charges[index] = charge;
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    removeCharge: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (state.formData.charges && index >= 0 && index < state.formData.charges.length) {
        state.formData.charges.splice(index, 1);
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    // Transportation detail management
    addTransportation: (state, action: PayloadAction<DocumentTransportation>) => {
      if (!state.formData.transportation) {
        state.formData.transportation = [];
      }
      state.formData.transportation.push(action.payload);
    },
    
    updateTransportation: (state, action: PayloadAction<{ 
      index: number, 
      detail: DocumentTransportation 
    }>) => {
      const { index, detail } = action.payload;
      if (state.formData.transportation && index >= 0 && index < state.formData.transportation.length) {
        state.formData.transportation[index] = detail;
      }
    },
    
    removeTransportation: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (state.formData.transportation && index >= 0 && index < state.formData.transportation.length) {
        state.formData.transportation.splice(index, 1);
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
    
    // Reset form state
    resetForm: (state) => {
      return { 
        ...initialState, 
        isOpen: state.isOpen,
        mode: state.mode,
        documentType: state.documentType,
        currentDocumentId: state.currentDocumentId,
        formData: getDefaultFormData(state.documentType)
      };
    },
    
    // Populate form from existing document
    populateFromDocument: (state, action: PayloadAction<Document>) => {
      const document = action.payload;
      
      // Copy document data to form, omitting id and audit fields
      const { id, createdAt, updatedAt, ...docData } = document;
      state.formData = docData;
    }
  }
});

// Helper function to calculate totals
function calculateTotals(state: DocumentFormState) {
  // Calculate items total
  let itemsTotal = 0;
  if (state.formData.items) {
    for (const item of state.formData.items) {
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
      if (!isNaN(amount)) {
        itemsTotal += amount;
      }
    }
  }
  
  // Calculate charges total
  let chargesTotal = 0;
  if (state.formData.charges) {
    for (const charge of state.formData.charges) {
      const amount = typeof charge.amount === 'string' ? parseFloat(charge.amount) : charge.amount;
      if (!isNaN(amount)) {
        chargesTotal += amount;
      }
    }
  }
  
  // Calculate discount amount
  let discountAmount = 0;
  if (state.formData.discountAmount) {
    const amount = typeof state.formData.discountAmount === 'string' 
      ? parseFloat(state.formData.discountAmount) 
      : state.formData.discountAmount;
      
    if (!isNaN(amount)) {
      discountAmount = amount;
    }
  }
  
  // Calculate tax amount
  let taxAmount = 0;
  if (state.formData.taxAmount) {
    const amount = typeof state.formData.taxAmount === 'string' 
      ? parseFloat(state.formData.taxAmount) 
      : state.formData.taxAmount;
      
    if (!isNaN(amount)) {
      taxAmount = amount;
    }
  }
  
  // Calculate shipping, packaging, adjustment
  const shipping = typeof state.formData.shipping === 'string' 
    ? parseFloat(state.formData.shipping) 
    : (state.formData.shipping || 0);
    
  const packaging = typeof state.formData.packaging === 'string' 
    ? parseFloat(state.formData.packaging) 
    : (state.formData.packaging || 0);
    
  const adjustment = typeof state.formData.adjustment === 'string' 
    ? parseFloat(state.formData.adjustment) 
    : (state.formData.adjustment || 0);
  
  // Calculate total
  let total = itemsTotal + chargesTotal + taxAmount - discountAmount + shipping + packaging + adjustment;
  
  // Apply roundOff
  const roundOff = state.formData.roundOff || 0;
  total = Math.round(total + roundOff);
  
  // Update state
  state.formData.total = total;
  
  // Update balance amount
  const paidAmount = typeof state.formData.paidAmount === 'string' 
    ? parseFloat(state.formData.paidAmount) 
    : (state.formData.paidAmount || 0);
    
  state.formData.balanceAmount = total - paidAmount;
}

// Helper function to validate document data
export function validateDocumentForm(formData: DocumentFormState['formData'], activeTab: number, documentType: DocumentType | string): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Determine the party field name based on document type
  const isSalesDocument = String(documentType).startsWith('sale') || documentType === DocumentType.DELIVERY_CHALLAN;
  const partyLabel = isSalesDocument ? 'Customer' : 'Supplier';
  
  // Basic info validation (tab 0)
  if (activeTab === 0 || activeTab === -1) {
    if (!formData.partyName) {
      errors.partyName = `${partyLabel} name is required`;
    }
    
    if (!formData.documentNumber) {
      errors.documentNumber = 'Document number is required';
    }
    
    if (!formData.documentDate) {
      errors.documentDate = 'Document date is required';
    }
  }
  
  // Items validation (tab 1)
  if (activeTab === 1 || activeTab === -1) {
    if (!formData.items || formData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      // Validate each item
      formData.items.forEach((item, index) => {
        if (!item.itemName) {
          errors[`items[${index}].itemName`] = 'Item name is required';
        }
        
        if (!item.primaryUnitName) {
          errors[`items[${index}].primaryUnitName`] = 'Unit is required';
        }
      });
    }
  }
  
  // Payment validation (tab 2)
  if (activeTab === 2 || activeTab === -1) {
    if (formData.transactionType === 'credit' && formData.balanceAmount === undefined) {
      errors.balanceAmount = 'Balance amount is required for credit transactions';
    }
  }
  
  return errors;
}

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  setFormData,
  updateFormField,
  addItem,
  updateItem,
  removeItem,
  addCharge,
  updateCharge,
  removeCharge,
  addTransportation,
  updateTransportation,
  removeTransportation,
  setActiveTab,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  resetForm,
  populateFromDocument
} = documentFormSlice.actions;

export default documentFormSlice.reducer;