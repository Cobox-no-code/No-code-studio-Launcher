'use client';

import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Document,
    DocumentCharge,
    DocumentItem,
    DocumentTransportation,
    DocumentType,
    PaymentType,
    TransactionType
} from '@/models/document/document.model';

// Type for Document Context
type DocumentContextType = {
  state: DocumentState;
  dispatch: React.Dispatch<DocumentAction>;
  calculateTotals: () => DocumentTotals;
  isItemsValid: () => boolean;
  isPartyValid: () => boolean;
  isPaymentValid: () => boolean;
  validateAll: () => Record<string, string>;
};

// State structure for the document
export interface DocumentState {
  document: Document;
  mode: 'create' | 'edit' | 'view';
  isSubmitting: boolean;
  validationErrors: any;
  activeTab: number;
}

// Define the totals type
export interface DocumentTotals {
  itemsTotal: number;
  subtotal: number;
  total: number;
  balanceAmount: number;
  taxAmount: number;
  discountAmount: number;
  paidAmount: number;
}

// Action types for reducer
type DocumentAction =
  | { type: 'SET_DOCUMENT'; payload: Document }
  | { type: 'SET_MODE'; payload: 'create' | 'edit' | 'view' }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof Document; value: any } }
  | { type: 'ADD_ITEM'; payload: DocumentItem }
  | { type: 'UPDATE_ITEM'; payload: { index: number; item: any } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'ADD_CHARGE'; payload: DocumentCharge }
  | { type: 'UPDATE_CHARGE'; payload: { index: number; charge: DocumentCharge } }
  | { type: 'REMOVE_CHARGE'; payload: number }
  | { type: 'ADD_TRANSPORTATION'; payload: DocumentTransportation }
  | { type: 'UPDATE_TRANSPORTATION'; payload: { index: number; transportation: DocumentTransportation } }
  | { type: 'REMOVE_TRANSPORTATION'; payload: number }
  | { type: 'SET_ACTIVE_TAB'; payload: number }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'RESET' };

// Helper function to get default document values based on document type
const getDefaultDocument = (documentType: DocumentType): Document => {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  
  // Determine if this is a sales or purchase document
  const isSalesDocument = String(documentType).startsWith('sale') || documentType === DocumentType.DELIVERY_CHALLAN;
  
  return {
    id: uuidv4(),
    firmId: '',
    documentType,
    documentNumber: '',
    documentDate: today,
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
    taxPercentage: 0,
    createdAt: now,
    updatedAt: now
  };
};

// Reducer function
const documentReducer = (state: DocumentState, action: DocumentAction): DocumentState => {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return {
        ...state,
        document: action.payload
      };
    
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload
      };
    
    case 'UPDATE_FIELD':
      return {
        ...state,
        document: {
          ...state.document,
          [action.payload.field]: action.payload.value
        },
        validationErrors: {
          ...state.validationErrors,
          [action.payload.field]: undefined
        }
      };
    
    case 'ADD_ITEM':
      return {
        ...state,
        document: {
          ...state.document,
          items: [...(state.document.items || []), action.payload]
        }
      };
    
    case 'UPDATE_ITEM':
      if (!state.document.items) return state;
      
      return {
        ...state,
        document: {
          ...state.document,
          items: state.document.items.map((item, index) => 
            index === action.payload.index ? action.payload.item : item
          )
        }
      };
    
    case 'REMOVE_ITEM':
      if (!state.document.items) return state;
      
      return {
        ...state,
        document: {
          ...state.document,
          items: state.document.items.filter((_, index) => index !== action.payload)
        }
      };
    
    case 'ADD_CHARGE':
      return {
        ...state,
        document: {
          ...state.document,
          charges: [...(state.document.charges || []), action.payload]
        }
      };
    
    case 'UPDATE_CHARGE':
      if (!state.document.charges) return state;
      
      return {
        ...state,
        document: {
          ...state.document,
          charges: state.document.charges.map((charge, index) => 
            index === action.payload.index ? action.payload.charge : charge
          )
        }
      };
    
    case 'REMOVE_CHARGE':
      if (!state.document.charges) return state;
      
      return {
        ...state,
        document: {
          ...state.document,
          charges: state.document.charges.filter((_, index) => index !== action.payload)
        }
      };
    
    case 'ADD_TRANSPORTATION':
      return {
        ...state,
        document: {
          ...state.document,
          transportation: [...(state.document.transportation || []), action.payload]
        }
      };
    
    case 'UPDATE_TRANSPORTATION':
      if (!state.document.transportation) return state;
      
      return {
        ...state,
        document: {
          ...state.document,
          transportation: state.document.transportation.map((t, index) => 
            index === action.payload.index ? action.payload.transportation : t
          )
        }
      };
    
    case 'REMOVE_TRANSPORTATION':
      if (!state.document.transportation) return state;
      
      return {
        ...state,
        document: {
          ...state.document,
          transportation: state.document.transportation.filter((_, index) => index !== action.payload)
        }
      };
    
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      };
    
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      };
    
    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload
      };
    
    case 'RESET':
      return {
        ...initialState,
        document: getDefaultDocument(state.document.documentType)
      };
    
    default:
      return state;
  }
};

// Create the context
const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Initial state
const initialState: DocumentState = {
  document: getDefaultDocument(DocumentType.SALE_INVOICE),
  mode: 'create',
  isSubmitting: false,
  validationErrors: {},
  activeTab: 0
};

// Context provider component
export const DocumentProvider: React.FC<{
  children: ReactNode;
  initialDocument?: Document;
  documentType?: DocumentType;
  mode?: 'create' | 'edit' | 'view';
}> = ({ children, initialDocument, documentType = DocumentType.SALE_INVOICE, mode = 'create' }) => {
  // Initialize state with provided document or default
  const [state, dispatch] = useReducer(documentReducer, {
    ...initialState,
    document: initialDocument || getDefaultDocument(documentType),
    mode
  });
  
  // Calculate all document totals
  const calculateTotals = (): DocumentTotals => {
    // Items total - this already includes individual item taxes
    const itemsTotal = state.document.items?.reduce((total, item) => {
      const itemAmount = typeof item.amount === 'string' 
        ? parseFloat(item.amount) 
        : (item.amount || 0);
      return total + (isNaN(itemAmount) ? 0 : itemAmount);
    }, 0) || 0;
    
    // Charges total
    const chargesTotal = state.document.charges?.reduce((total, charge) => {
      const chargeAmount = typeof charge.amount === 'string'
        ? parseFloat(String(charge.amount))
        : (charge.amount || 0);
      return total + (isNaN(chargeAmount) ? 0 : chargeAmount);
    }, 0) || 0;
    
    // Calculate the tax total from items for display
    const taxAmount = state.document.items?.reduce((total, item) => {
      const itemTaxAmount = typeof item.taxAmount === 'string'
        ? parseFloat(String(item.taxAmount))
        : (item.taxAmount || 0);
      return total + (isNaN(itemTaxAmount) ? 0 : itemTaxAmount);
    }, 0) || 0;
    
    // Get discount amount
    const discountAmount = typeof state.document.discountAmount === 'string'
      ? parseFloat(String(state.document.discountAmount) || '0')
      : (state.document.discountAmount || 0);
    
    // Additional amounts
    const shipping = typeof state.document.shipping === 'string'
      ? parseFloat(String(state.document.shipping) || '0')
      : (state.document.shipping || 0);
    
    const packaging = typeof state.document.packaging === 'string'
      ? parseFloat(String(state.document.packaging) || '0')
      : (state.document.packaging || 0);
    
    const adjustment = typeof state.document.adjustment === 'string'
      ? parseFloat(String(state.document.adjustment) || '0')
      : (state.document.adjustment || 0);
    
    // Calculate subtotal (tax is already included in itemsTotal)
    const subtotal = itemsTotal + chargesTotal - discountAmount + 
                  shipping + packaging + adjustment;
    
    // Apply round off
    const roundOff = typeof state.document.roundOff === 'string'
      ? parseFloat(String(state.document.roundOff) || '0')
      : (state.document.roundOff || 0);
    
    // Calculate final total
    const total = Math.round(subtotal + roundOff);
    
    // Calculate balance amount
    const paidAmount = typeof state.document.paidAmount === 'string'
      ? parseFloat(String(state.document.paidAmount) || '0')
      : (state.document.paidAmount || 0);
    
    const balanceAmount = total - paidAmount;
    
    return {
      itemsTotal,
      subtotal,
      total,
      balanceAmount,
      taxAmount,
      discountAmount,
      paidAmount,
    };
  };
  
  // Update the document totals when items, charges, etc. change
  useEffect(() => {
    const totals = calculateTotals();
    
    // Only update if values changed to avoid infinite loops
    if (
      totals.total !== state.document.total ||
      totals.balanceAmount !== state.document.balanceAmount ||
      totals.taxAmount !== state.document.taxAmount
    ) {
      dispatch({
        type: 'UPDATE_FIELD',
        payload: { field: 'total', value: totals.total }
      });
      
      dispatch({
        type: 'UPDATE_FIELD',
        payload: { field: 'balanceAmount', value: totals.balanceAmount }
      });
      
      dispatch({
        type: 'UPDATE_FIELD',
        payload: { field: 'taxAmount', value: totals.taxAmount }
      });
    }
  }, [
    state.document.items,
    state.document.charges,
    state.document.discountAmount,
    state.document.shipping,
    state.document.packaging,
    state.document.adjustment,
    state.document.roundOff,
    state.document.paidAmount
  ]);
  
  // Validation functions
  const isItemsValid = (): boolean => {
    if (!state.document.items || state.document.items.length === 0) {
      return false;
    }
    
    // Check if all items have required fields
    return state.document.items.every(item => 
      item.itemName && item.primaryQuantity && item.primaryUnitId && item.amount
    );
  };
  
  const isPartyValid = (): boolean => {
    return !!state.document.partyName && !!state.document.documentNumber && !!state.document.documentDate;
  };
  
  const isPaymentValid = (): boolean => {
    // For credit transactions, validate payment details
    if (state.document.transactionType === 'credit') {
      if (state.document.balanceAmount === undefined) return false;
      
      // For bank payments, bank account is required
      if (state.document.paymentType === 'bank' && !state.document.bankId) {
        return false;
      }
      
      // For cheque payments, check number and date are required
      if (state.document.paymentType === 'cheque' && 
          (!state.document.chequeNumber || !state.document.chequeDate)) {
        return false;
      }
    }
    
    return true;
  };
  
  // Complete validation for all fields
  const validateAll = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Basic info validation
    if (!state.document.partyName) {
      errors.partyName = `${state.document.partyType === 'customer' ? 'Customer' : 'Supplier'} name is required`;
    }
    
    if (!state.document.documentNumber) {
      errors.documentNumber = 'Document number is required';
    }
    
    if (!state.document.documentDate) {
      errors.documentDate = 'Document date is required';
    }
    
    // Items validation
    if (!state.document.items || state.document.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      // Validate each item
      state.document.items.forEach((item, index) => {
        if (!item.itemName) {
          errors[`items[${index}].itemName`] = 'Item name is required';
        }
        
        if (!item.primaryUnitName) {
          errors[`items[${index}].primaryUnitName`] = 'Unit is required';
        }
      });
    }
    
    // Payment validation
    if (state.document.transactionType === 'credit' && state.document.balanceAmount === undefined) {
      errors.balanceAmount = 'Balance amount is required for credit transactions';
    }
    
    if (state.document.paymentType === 'bank' && !state.document.bankId) {
      errors.bankId = 'Bank account is required for bank payments';
    }
    
    if (state.document.paymentType === 'cheque') {
      if (!state.document.chequeNumber) {
        errors.chequeNumber = 'Cheque number is required';
      }
      
      if (!state.document.chequeDate) {
        errors.chequeDate = 'Cheque date is required';
      }
    }
    
    return errors;
  };
  
  // Create context value
  const contextValue: DocumentContextType = {
    state,
    dispatch,
    calculateTotals,
    isItemsValid,
    isPartyValid,
    isPaymentValid,
    validateAll
  };
  
  return (
    <DocumentContext.Provider value={contextValue}>
      {children}
    </DocumentContext.Provider>
  );
};

// Custom hook to use the document context
export const useDocument = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  
  return context;
};