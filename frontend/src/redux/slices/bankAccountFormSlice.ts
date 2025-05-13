// store/slices/bankAccountFormSlice.ts
import { BankAccount } from '@/models/banking/banking.model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define form state type excluding server-managed fields
type BankAccountFormData = Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'>;

export interface BankAccountFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentAccountId: string | null;
  formData: BankAccountFormData;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
}

const initialState: BankAccountFormState = {
  isOpen: false,
  mode: 'create',
  currentAccountId: null,
  formData: {
    upiId: '',
displayName: '',
printBankDetailsOnInvoices: false,
    printUpiQrOnInvoices: false,
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    ifscCode: '',
    openingBalance: 0,
    isActive: true,
  },
  isSubmitting: false,
  submitError: null,
  validationErrors: {}
};

const bankAccountFormSlice = createSlice({
  name: 'bankAccountForm',
  initialState,
  reducers: {
    openCreateForm: (state) => {
      state.isOpen = true;
      state.mode = 'create';
      state.currentAccountId = null;
      state.formData = { ...initialState.formData };
      state.submitError = null;
      state.validationErrors = {};
    },

    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.currentAccountId = action.payload;
      state.submitError = null;
      state.validationErrors = {};
    },

    closeForm: (state) => {
      state.isOpen = false;
    },

    setFormData: (state, action: PayloadAction<BankAccountFormData>) => {
      state.formData = action.payload;
    },

    updateFormField: (state, action: PayloadAction<{ field: keyof BankAccountFormData, value: any }>) => {
      const { field, value } = action.payload;
      (state.formData as any)[field] = value;

      if (state.validationErrors[field]) {
        delete state.validationErrors[field];
      }
    },

    toggleIsActive: (state) => {
      state.formData.isActive = !state.formData.isActive;
      if (state.validationErrors['isActive']) {
        delete state.validationErrors['isActive'];
      }
    },

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

    populateFromAccount: (state, action: PayloadAction<BankAccount>) => {
      const account = action.payload;
      const { id, createdAt, updatedAt, currentBalance, ...formData } = account;
      state.formData = formData;
    }
  }
});

// Validation function
export function validateBankAccountForm(formData: BankAccountFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.accountNumber.trim()) {
    errors.accountNumber = 'Account number is required';
  }

  if (!formData.accountHolderName.trim()) {
    errors.accountHolderName = 'Account holder name is required';
  }

  if (!formData.bankName.trim()) {
    errors.bankName = 'Bank name is required';
  }

  if (!formData.ifscCode.trim()) {
    errors.ifscCode = 'IFSC code is required';
  } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
    errors.ifscCode = 'Invalid IFSC code format';
  }

  if (formData.openingBalance < 0) {
    errors.openingBalance = 'Opening balance cannot be negative';
  }

  return errors;
}

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  setFormData,
  updateFormField,
  toggleIsActive,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  resetForm,
  populateFromAccount
} = bankAccountFormSlice.actions;

export default bankAccountFormSlice.reducer;
