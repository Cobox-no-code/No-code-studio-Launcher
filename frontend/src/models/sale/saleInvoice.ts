// Type for individual invoice item
export interface InvoiceItem {
  id?: string;                    // Optional ID for the invoice item itself
  itemId: string;                 // Reference to the Item
  item: string;                   // Item name (for display purposes)
  
  // Quantity fields - replacing the single qty field
  primaryQuantity: string | number;  // Quantity in primary unit
  secondaryQuantity?: string | number; // Quantity in secondary unit (optional)
  
  unitId: string;                 // Foreign key to primary Unit
  unit: string;                   // Primary unit name (for display purposes)
  
  // Secondary unit fields (new)
  secondaryUnitId?: string;       // Foreign key to secondary Unit
  secondaryUnit?: string;         // Secondary unit name (for display purposes)
  
  pricePerUnit: string | number;
  mfgDate?: string;
  taxType: string;
  taxRateId?: string;             // Foreign key to TaxRate
  taxAmount: string | number;
  amount: string | number;
  categoryId: string;             // Foreign key to Category
  category: string;               // Category name (for display purposes)
  itemCode?: string;
  hsnCode?: string;
  serialNo?: string;
  description?: string;
  batchNo?: string;
  modelNo?: string;
  expDate?: string;
  mrp?: string | number;
  size?: string;
  discountPercent?: string | number;
  discountAmount?: string | number;
}
  // Type for charge detail
  export interface ChargeDetail {
    id?: string;
    name: string;
    amount: number;
  }
  
  // Type for transportation detail
  export interface TransportationDetail {
    id?: string;
    type: string;
    detail: string;
    amount?: number;
  }
  
  // Type for discount or tax
  export interface AmountWithPercentage {
    percentage: string | number;
    amount: string | number;
  }
  
  // Main SaleInvoice model
  export interface SaleInvoice {
    id: string;
    saleType: 'credit' | 'cash';
    customerId: string;            // Foreign key to Party
    customer: string;              // Customer name (for display purposes)
    phone?: string;
    charges: ChargeDetail[];
    ewaybill?: string;
    billingAddress?: string;
    billingName?: string;
    invoiceNumber: string;
    invoiceTime?: string;
    poDate?: string;
    poNumber?: string;
    invoiceDate: string;
    stateOfSupply?: string;
    items: InvoiceItem[];
    roundOff: number;
    total: number;
    transportName?: string;
    vehicleNumber?: string;
    deliveryDate?: string;
    deliveryLocation?: string;
    shipping?: string | number;
    packaging?: string | number;
    adjustment?: string | number;
    paymentType: 'cash' | 'online' | 'cheque' | string;
    description?: string;
    image?: string;
    discount: AmountWithPercentage;
    tax: AmountWithPercentage;
    balanceAmount: number;
    receivedAmount: number;
    transportationDetails: TransportationDetail[];
    
    // Audit fields
    createdAt: string;
    updatedAt: string;
  }