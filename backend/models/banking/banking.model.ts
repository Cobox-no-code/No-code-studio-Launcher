/**
 * Bank Account Model
 * Represents a bank account in the system
 */
export interface BankAccount {
    id: string;
    displayName: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    upiId?: string;
    openingBalance: number;
    currentBalance: number;
    asOfDate?: string;
    printUpiQrOnInvoices?: boolean;
    printBankDetailsOnInvoices: boolean;
    isActive: boolean;
    notes?: string;
    
    // Audit fields
    createdAt: string;
    updatedAt: string;
  }
  
  /**
   * Data structure for creating a new bank account
   */
  export type CreateBankAccountDTO = Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'> & {
    openingBalance: number;
  };
  
  /**
   * Data structure for updating an existing bank account
   */
  export type UpdateBankAccountDTO = Partial<Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>>;
  
  /**
   * Bank account transaction types
   */
  export enum BankTransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    TRANSFER = 'transfer',
    INTEREST = 'interest',
    CHARGE = 'charge',
    PAYMENT = 'payment',
    RECEIPT = 'receipt'
  }
  
  /**
   * Bank account transaction model
   */
  export interface BankTransaction {
    id: string;
    bankAccountId: string;
    amount: number;
    transactionType: BankTransactionType;
    transactionDate: string;
    description: string;
    referenceNumber?: string;
    relatedEntityId?: string;  // Can be linked to invoices, payments, etc.
    relatedEntityType?: string;
    
    // Audit fields
    createdAt: string;
    updatedAt: string;
  }
  
  /**
   * Data for creating a bank transaction
   */
  export type CreateBankTransactionDTO = Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'>;