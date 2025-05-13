// store/slices/saleInvoiceFormSlice.ts
import { ChargeDetail, InvoiceItem, SaleInvoice, TransportationDetail } from '@/models/sale/saleInvoice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the form state type
export interface SaleInvoiceFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentInvoiceId: string | null;
  formData: Omit<SaleInvoice, 'id' | 'createdAt' | 'updatedAt'>;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
  activeTab: number; // For multi-tab form
}

// Create initial state with default values
const initialState: SaleInvoiceFormState = {
  isOpen: false,
  mode: 'create',
  currentInvoiceId: null,
  formData: {
    saleType: 'cash',
    customer: '',
    customerId: '',
    charges: [],
    items: [],
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    total: 0,
    paymentType: 'cash',
    balanceAmount: 0,
    receivedAmount: 0,
    roundOff: 0,
    transportationDetails: [],
    discount: { percentage: '', amount: '' },
    tax: { percentage: '', amount: '' }
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {},
  activeTab: 0
};

// Create the slice
const saleInvoiceFormSlice = createSlice({
  name: 'saleInvoiceForm',
  initialState,
  reducers: {
    // Form visibility actions
    openCreateForm: (state) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentInvoiceId = null;
      state.formData = { ...initialState.formData };
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },
    
    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentInvoiceId = action.payload;
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },
    
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Form data management
    setFormData: (state, action: PayloadAction<Partial<SaleInvoiceFormState['formData']>>) => {
      state.formData = {
        ...state.formData,
        ...action.payload
      };
    },
    
    // Update a single form field
    updateFormField: (state, action: PayloadAction<{
      field: keyof SaleInvoiceFormState['formData'], 
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
    addItem: (state, action: PayloadAction<InvoiceItem>) => {
      state.formData.items.push(action.payload);
      
      // Recalculate totals
      calculateTotals(state);
    },
    
    updateItem: (state, action: PayloadAction<{ index: number, item: InvoiceItem }>) => {
      const { index, item } = action.payload;
      if (index >= 0 && index < state.formData.items.length) {
        state.formData.items[index] = item;
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    removeItem: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.formData.items.length) {
        state.formData.items.splice(index, 1);
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    // Charge management
    addCharge: (state, action: PayloadAction<ChargeDetail>) => {
      state.formData.charges.push(action.payload);
      
      // Recalculate totals
      calculateTotals(state);
    },
    
    updateCharge: (state, action: PayloadAction<{ index: number, charge: ChargeDetail }>) => {
      const { index, charge } = action.payload;
      if (index >= 0 && index < state.formData.charges.length) {
        state.formData.charges[index] = charge;
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    removeCharge: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.formData.charges.length) {
        state.formData.charges.splice(index, 1);
        
        // Recalculate totals
        calculateTotals(state);
      }
    },
    
    // Transportation detail management
    addTransportationDetail: (state, action: PayloadAction<TransportationDetail>) => {
      state.formData.transportationDetails.push(action.payload);
    },
    
    updateTransportationDetail: (state, action: PayloadAction<{ 
      index: number, 
      detail: TransportationDetail 
    }>) => {
      const { index, detail } = action.payload;
      if (index >= 0 && index < state.formData.transportationDetails.length) {
        state.formData.transportationDetails[index] = detail;
      }
    },
    
    removeTransportationDetail: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.formData.transportationDetails.length) {
        state.formData.transportationDetails.splice(index, 1);
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
        currentInvoiceId: state.currentInvoiceId
      };
    },
    
    // Populate form from existing invoice
    populateFromInvoice: (state, action: PayloadAction<SaleInvoice>) => {
      const invoice = action.payload;
      
      // Copy everything except id and audit fields
      state.formData = {
        saleType: invoice.saleType,
        customer: invoice.customer,
        customerId: invoice.customerId,
        phone: invoice.phone,
        charges: invoice.charges,
        ewaybill: invoice.ewaybill,
        billingAddress: invoice.billingAddress,
        billingName: invoice.billingName,
        invoiceNumber: invoice.invoiceNumber,
        invoiceTime: invoice.invoiceTime,
        poDate: invoice.poDate,
        poNumber: invoice.poNumber,
        invoiceDate: invoice.invoiceDate,
        stateOfSupply: invoice.stateOfSupply,
        items: invoice.items,
        roundOff: invoice.roundOff,
        total: invoice.total,
        transportName: invoice.transportName,
        vehicleNumber: invoice.vehicleNumber,
        deliveryDate: invoice.deliveryDate,
        deliveryLocation: invoice.deliveryLocation,
        shipping: invoice.shipping,
        packaging: invoice.packaging,
        adjustment: invoice.adjustment,
        paymentType: invoice.paymentType,
        description: invoice.description,
        image: invoice.image,
        discount: invoice.discount,
        tax: invoice.tax,
        balanceAmount: invoice.balanceAmount,
        receivedAmount: invoice.receivedAmount,
        transportationDetails: invoice.transportationDetails
      };
    }
  }
});

// Helper function to calculate totals
function calculateTotals(state: SaleInvoiceFormState) {
  // Calculate items total
  let itemsTotal = 0;
  for (const item of state.formData.items) {
    const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
    if (!isNaN(amount)) {
      itemsTotal += amount;
    }
  }
  
  // Calculate charges total
  let chargesTotal = 0;
  for (const charge of state.formData.charges) {
    const amount = typeof charge.amount === 'string' ? parseFloat(charge.amount) : charge.amount;
    if (!isNaN(amount)) {
      chargesTotal += amount;
    }
  }
  
  // Calculate discount amount
  let discountAmount = 0;
  if (state.formData.discount) {
    const amount = typeof state.formData.discount.amount === 'string' 
      ? parseFloat(state.formData.discount.amount) 
      : state.formData.discount.amount;
      
    if (!isNaN(amount)) {
      discountAmount = amount;
    }
  }
  
  // Calculate tax amount
  let taxAmount = 0;
  if (state.formData.tax) {
    const amount = typeof state.formData.tax.amount === 'string' 
      ? parseFloat(state.formData.tax.amount) 
      : state.formData.tax.amount;
      
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
  const receivedAmount = typeof state.formData.receivedAmount === 'string' 
    ? parseFloat(state.formData.receivedAmount) 
    : (state.formData.receivedAmount || 0);
    
  state.formData.balanceAmount = total - receivedAmount;
}

// Helper function to validate invoice data
export function validateSaleInvoiceForm(formData: SaleInvoiceFormState['formData'], activeTab: number): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Basic info validation (tab 0)
  if (activeTab === 0 || activeTab === -1) {
    if (!formData.customer) {
      errors.customer = 'Customer name is required';
    }
    
    if (!formData.invoiceNumber) {
      errors.invoiceNumber = 'Invoice number is required';
    }
    
    if (!formData.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
    }
  }
  
  // Items validation (tab 1)
  if (activeTab === 1 || activeTab === -1) {
    if (!formData.items || formData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      // Validate each item
      formData.items.forEach((item, index) => {
        if (!item.item) {
          errors[`items[${index}].item`] = 'Item name is required';
        }
        
   
        
        if (!item.unit) {
          errors[`items[${index}].unit`] = 'Unit is required';
        }
      });
    }
  }
  
  // Payment validation (tab 2)
  if (activeTab === 2 || activeTab === -1) {
    if (formData.saleType === 'credit' && !formData.balanceAmount && formData.balanceAmount !== 0) {
      errors.balanceAmount = 'Balance amount is required for credit sales';
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
  addTransportationDetail,
  updateTransportationDetail,
  removeTransportationDetail,
  setActiveTab,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  resetForm,
  populateFromInvoice
} = saleInvoiceFormSlice.actions;

export default saleInvoiceFormSlice.reducer;