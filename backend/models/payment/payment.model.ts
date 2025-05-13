// models/payment/payment.model.ts

import { PaymentType } from "../document/document.model";

// Payment direction enum
export enum PaymentDirection {
  IN = 'in',
  OUT = 'out'
}

// Base payment interface with common properties
export interface Payment {
  id: string;
  firmId: string;
  amount: number;
  paymentType: PaymentType; // 'cash' | 'cheque' | 'bank'
  paymentDate: string;
  referenceNumber?: string;
  partyId?: string;
  partyName?: string;
  description?: string;
  receiptNumber?: string;
  bankAccountId?: string; // Only used for bank payments
  chequeNumber?: string; // Only used for cheque payments
  chequeDate?: string; // Only used for cheque payments
  imageUrl?: string; // For receipt/cheque image
  direction: PaymentDirection; // 'in' or 'out'
  linkedDocumentId?: string; // Optional reference to an invoice or purchase
  linkedDocumentType?: string; // Type of document (sale_invoice, purchase_invoice, etc.)
  isReconciled?: boolean; // For bank reconciliation
  createdAt: string;
  updatedAt: string;
}

// Payment-In specific interface
export interface PaymentIn extends Payment {
  direction: PaymentDirection.IN;
}

// Payment-Out specific interface
export interface PaymentOut extends Payment {
  direction: PaymentDirection.OUT;
}

// DTO for creating a new payment
export interface CreatePaymentDTO {
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  referenceNumber?: string;
  partyId?: string;
  partyName?: string;
  description?: string;
  receiptNumber?: string;
  bankAccountId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  imageUrl?: string;
  direction: PaymentDirection;
  linkedDocumentId?: string;
  linkedDocumentType?: string;
}

// DTO for updating an existing payment
export interface UpdatePaymentDTO {
  amount?: number;
  paymentType?: PaymentType;
  paymentDate?: string;
  referenceNumber?: string;
  partyId?: string;
  partyName?: string;
  description?: string;
  receiptNumber?: string;
  bankAccountId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  imageUrl?: string;
  isReconciled?: boolean;
}