// store/slices/transactionFormSlice.ts
import { BankTransaction, BankTransactionType } from '@/models/banking/banking.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// UI-specific transaction types
export type TransactionType = 'BANK_TO_CASH' | 'CASH_TO_BANK' | 'BANK_TO_BANK' | 'ADJUST_BALANCE';

// Extended form data to handle different transaction types
interface TransactionFormData extends Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional fields for bank transfers
  sourceBankAccountId?: string;
  targetBankAccountId?: string;
  
  // Additional fields for UI state
  adjustmentType?: 'ADD' | 'SUBTRACT';
}

export interface TransactionFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentTransactionId: string | null;
  formData: TransactionFormData;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  transactionType: TransactionType | null;
}

const initialState: TransactionFormState = {
  isOpen: false,
  mode: 'create',
  currentTransactionId: null,
  formData: {
    bankAccountId: '',
    amount: 0,
    transactionType: BankTransactionType.DEPOSIT,
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    referenceNumber: ''
  },
  isSubmitting: false,
  validationErrors: {},
  transactionType: null
};

const transactionFormSlice = createSlice({
  name: 'transactionForm',
  initialState,
  reducers: {
    // Open the form for creating a new transaction
    openCreateForm: (state, action: PayloadAction<TransactionType>) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentTransactionId = null;
      state.transactionType = action.payload;
      
      // Reset form data to defaults
      state.formData = { ...initialState.formData };
      
      // Set appropriate transaction type based on UI type
      switch (action.payload) {
        case 'BANK_TO_CASH':
          state.formData.transactionType = BankTransactionType.WITHDRAWAL;
          state.formData.description = 'Bank to Cash transfer';
          break;
        case 'CASH_TO_BANK':
          state.formData.transactionType = BankTransactionType.DEPOSIT;
          state.formData.description = 'Cash to Bank deposit';
          break;
        case 'BANK_TO_BANK':
          state.formData.transactionType = BankTransactionType.TRANSFER;
          state.formData.description = 'Bank to Bank transfer';
          break;
        case 'ADJUST_BALANCE':
          state.formData.transactionType = BankTransactionType.DEPOSIT; // Default
          state.formData.adjustmentType = 'ADD';
          state.formData.description = 'Bank balance adjustment';
          break;
      }
      
      state.validationErrors = {};
    },
    
    // Open the form for editing an existing transaction
    openEditForm: (state, action: PayloadAction<{ id: string, type: TransactionType }>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentTransactionId = action.payload.id;
      state.transactionType = action.payload.type;
      state.validationErrors = {};
    },
    
    // Close the form
    closeForm: (state) => {
      state.isOpen = false;
    },
    
    // Update a field in the form
    updateFormField: (state, action: PayloadAction<{ field: string, value: any }>) => {
      const { field, value } = action.payload;
      (state.formData as any)[field] = value;
      
      // Clear validation error for this field if any
      if (state.validationErrors[field]) {
        delete state.validationErrors[field];
      }
    },
    
    // Set the entire form data (used when editing)
    setFormData: (state, action: PayloadAction<Partial<TransactionFormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    
    // Set submission state
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    
    // Set validation errors
    setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.validationErrors = action.payload;
    },
    
    // Reset form to initial state
    resetForm: (state) => {
      state.formData = { ...initialState.formData };
      state.validationErrors = {};
    },
    
    // Populate form with transaction data
    populateFromTransaction: (state, action: PayloadAction<BankTransaction>) => {
      const { id, createdAt, updatedAt, ...formData } = action.payload;
      state.formData = formData;
    }
  }
});

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  updateFormField,
  setFormData,
  setSubmitting,
  setValidationErrors,
  resetForm,
  populateFromTransaction
} = transactionFormSlice.actions;

export default transactionFormSlice.reducer;