// store/slices/paymentFormSlice.ts
import { PaymentType } from "@/models/document/document.model";
import {
  CreatePaymentDTO,
  Payment,
  PaymentDirection,
} from "@/models/payment/payment.model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Form data type definition
type PaymentFormData = Omit<
  CreatePaymentDTO,
  "firmId" | "createdAt" | "updatedAt"
>;

export interface PaymentFormState {
  isOpen: boolean;
  mode: "create" | "edit";
  currentPaymentId: string | null;
  formData: PaymentFormData;
  isSubmitting: boolean;
  submitError: string | null;
  validationErrors: Record<string, string>;
  activeTab: number;
}

// Create initial state with default values
const initialFormData: PaymentFormData = {
  amount: null,
  paymentType: PaymentType.CASH,
  paymentDate: new Date().toISOString().split("T")[0],
  referenceNumber: "",
  partyId: "",
  partyName: "",
  description: "",
  receiptNumber: "",
  direction: PaymentDirection.IN, // Default to payment-in, will be overridden
  bankAccountId: "",
  chequeNumber: "",
  chequeDate: "",
  imageUrl: "",
};

const initialState: PaymentFormState = {
  isOpen: false,
  mode: "create",
  currentPaymentId: null,
  formData: { ...initialFormData },
  isSubmitting: false,
  submitError: null,
  validationErrors: {},
  activeTab: 0,
};

// Create the slice
const paymentFormSlice = createSlice({
  name: "paymentForm",
  initialState,
  reducers: {
    // Open the form for creating payment-in
    openCreatePaymentInForm: (state) => {
      state.isOpen = true;
      state.mode = "create";
      state.currentPaymentId = null;
      state.formData = {
        ...initialFormData,
        direction: PaymentDirection.IN,
        paymentDate: new Date().toISOString().split("T")[0],
      };
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },

    // Open the form for creating payment-out
    openCreatePaymentOutForm: (state) => {
      state.isOpen = true;
      state.mode = "create";
      state.currentPaymentId = null;
      state.formData = {
        ...initialFormData,
        direction: PaymentDirection.OUT,
        paymentDate: new Date().toISOString().split("T")[0],
      };
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },

    // Open the form for editing an existing payment
    openEditForm: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.mode = "edit";
      state.currentPaymentId = action.payload;
      state.submitError = null;
      state.validationErrors = {};
      state.activeTab = 0;
    },

    // Close the form
    closeForm: (state) => {
      state.isOpen = false;
    },

    // Set the entire form data
    setFormData: (state, action: PayloadAction<Partial<PaymentFormData>>) => {
      state.formData = {
        ...state.formData,
        ...action.payload,
      };
    },

    // Update a single form field
    updateFormField: (
      state,
      action: PayloadAction<{
        field: keyof PaymentFormData;
        value: any;
      }>
    ) => {
      const { field, value } = action.payload;
      (state.formData as any)[field] = value;

      // When payment type changes, reset related fields
      if (field === "paymentType") {
        if (value === PaymentType.CASH) {
          state.formData.bankAccountId = "";
          state.formData.chequeNumber = "";
          state.formData.chequeDate = "";
        } else if (value === PaymentType.BANK) {
          state.formData.chequeNumber = "";
          state.formData.chequeDate = "";
        } else if (value === PaymentType.CHEQUE) {
          state.formData.bankAccountId = "";
        }
      }

      // Clear validation error when field is updated
      if (state.validationErrors[field]) {
        delete state.validationErrors[field];
      }
    },

    // Set active tab
    setActiveTab: (state, action: PayloadAction<number>) => {
      state.activeTab = action.payload;
    },

    // Set submitting state
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    // Set submit error
    setSubmitError: (state, action: PayloadAction<string | null>) => {
      state.submitError = action.payload;
    },

    // Set validation errors
    setValidationErrors: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
      state.validationErrors = action.payload;
    },

    // Reset form state
    resetForm: (state) => {
      return {
        ...initialState,
        isOpen: state.isOpen,
        mode: state.mode,
        currentPaymentId: state.currentPaymentId,
        formData: {
          ...initialFormData,
          direction: state.formData.direction,
        },
      };
    },

    // Populate form from existing payment
    populateFromPayment: (state, action: PayloadAction<Payment>) => {
      const payment = action.payload;

      state.formData = {
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentDate: payment.paymentDate,
        referenceNumber: payment.referenceNumber || "",
        partyId: payment.partyId || "",
        partyName: payment.partyName || "",
        description: payment.description || "",
        receiptNumber: payment.receiptNumber || "",
        bankAccountId: payment.bankAccountId || "",
        chequeNumber: payment.chequeNumber || "",
        chequeDate: payment.chequeDate || "",
        imageUrl: payment.imageUrl || "",
        direction: payment.direction,
        linkedDocumentId: payment.linkedDocumentId || "",
        linkedDocumentType: payment.linkedDocumentType || "",
      };
    },
  },
});

// Validation function
export function validatePaymentForm(
  formData: PaymentFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Basic validation
  if (!formData.amount || formData.amount <= 0) {
    errors.amount = "Amount must be greater than zero";
  }

  if (!formData.paymentDate) {
    errors.paymentDate = "Payment date is required";
  }

  // Payment type specific validation
  if (formData.paymentType === PaymentType.BANK && !formData.bankAccountId) {
    errors.bankAccountId = "Bank account is required for bank payments";
  }

  if (formData.paymentType === PaymentType.CHEQUE) {
    if (!formData.chequeNumber) {
      errors.chequeNumber = "Cheque number is required";
    }

    if (!formData.chequeDate) {
      errors.chequeDate = "Cheque date is required";
    }
  }

  return errors;
}

export const {
  openCreatePaymentInForm,
  openCreatePaymentOutForm,
  openEditForm,
  closeForm,
  setFormData,
  updateFormField,
  setActiveTab,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  resetForm,
  populateFromPayment,
} = paymentFormSlice.actions;

export default paymentFormSlice.reducer;
