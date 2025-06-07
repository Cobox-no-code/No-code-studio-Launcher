// TypeScript models for document-related entities

/**
 * Document Types Enum
 */
export enum DocumentType {
  SALE_INVOICE = "sale_invoice",
  SALE_ORDER = "sale_order",
  SALE_RETURN = "sale_return",
  SALE_QUOTATION = "sale_quotation",
  DELIVERY_CHALLAN = "delivery_challan",
  PURCHASE_INVOICE = "purchase_invoice",
  PURCHASE_ORDER = "purchase_order",
  PURCHASE_RETURN = "purchase_return",
}

/**
 * Transaction Types Enum
 */
export enum TransactionType {
  CREDIT = "credit",
  CASH = "cash",
}

/**
 * Payment Types Enum
 */
export enum PaymentType {
  CASH = "cash",
  CHEQUE = "cheque",
  BANK = "bank",
  UPI = "upi",
  ONLINE = "online",
}

/**
 * Relationship Types Enum
 */
export enum RelationshipType {
  CONVERTED = "converted",
  FULFILLED = "fulfilled",
  RETURNED = "returned",
  PARTIAL_FULFILLED = "partial_fulfilled",
  PARTIAL_RETURNED = "partial_returned",
  REFERENCED = "referenced",
}

/**
 * Movement Types Enum
 */
export enum MovementType {
  IN = "in",
  OUT = "out",
  ADJUSTMENT = "adjustment",
  CONVERSION = "conversion",
}

/**
 * Base interface for all models
 */
export interface BaseModel {
  id: string;
  firmId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document Model (covers all document types)
 */
export interface Document extends BaseModel {
  documentType: DocumentType;
  documentNumber: string;
  documentDate: string;
  documentTime?: string;

  // Party information
  partyId?: string;
  partyName: string;
  partyType: string; // Customer, Supplier, etc.
  phone?: string;

  // Transaction details
  transactionType: TransactionType;
  status: string; // Simple string status (draft, confirmed, etc.)

  // Common fields
  ewaybill?: string;
  billingAddress?: string;
  shippingAddress?: string;
  billingName?: string;
  poDate?: string;
  poNumber?: string;
  stateOfSupply?: string;
  roundOff: number;
  total: number;

  // Shipping details
  transportName?: string;
  vehicleNumber?: string;
  deliveryDate?: string;
  deliveryLocation?: string;

  // Additional charges
  shipping?: number;
  packaging?: number;
  adjustment?: number;

  // Payment details
  paymentType: PaymentType;
  bankId?: string;
  chequeNumber?: string;
  chequeDate?: string;

  // Other fields
  description?: string;
  image?: string;

  // Discount and tax fields
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;

  // Payment amounts
  balanceAmount: number;
  paidAmount: number;

  // Relationship to other models (optional for API responses)
  items?: DocumentItem[];
  charges?: DocumentCharge[];
  transportation?: DocumentTransportation[];
}

/**
 * Document Item Model
 */
export interface DocumentItem extends BaseModel {
  documentId?: string;
  itemId?: string;
  itemName: string;

  // Quantity with primary/secondary unit
  primaryQuantity: number;
  secondaryQuantity?: number;

  // Units
  primaryUnitId: string;
  primaryUnitName: string;
  secondaryUnitId?: string;
  secondaryUnitName?: string;
  unit_conversionId?: string;
  conversionRate?: number;

  wholesaleQuantity: number;

  wholesalePrice?: number;
  // Pricing
  pricePerUnit: number;
  amount: number;

  // Batch details
  mfgDate?: string;
  batchNo?: string;
  expDate?: string;

  // Tax details
  taxType?: string;
  taxRateId?: string;
  taxAmount?: number;
  taxRate?: number;
  // Category
  categoryId?: string;
  categoryName?: string;

  // Additional details
  itemCode?: string;
  hsnCode?: string;
  serialNo?: string;
  description?: string;
  modelNo?: string;
  mrp?: number;
  size?: string;
  discountPercent?: number;
  discountAmount?: number;
}

/**
 * Document Charge Model
 */
export interface DocumentCharge extends BaseModel {
  documentId: string;
  name: string;
  amount: number;
}

/**
 * Document Transportation Model
 */
export interface DocumentTransportation extends BaseModel {
  documentId: string;
  type: string;
  detail: string;
  amount?: number;
}

/**
 * Document Relationship Model
 */
export interface DocumentRelationship extends BaseModel {
  sourceDocumentId: string;
  targetDocumentId: string;
  relationshipType: RelationshipType;
}

/**
 * Stock Movement Model
 */
export interface StockMovement extends BaseModel {
  itemId: string;
  documentId: string;
  documentItemId?: string;

  // Movement details
  movementType: MovementType;

  // Primary unit quantities
  primaryQuantity: number;
  primaryUnitId: string;

  // Secondary unit quantities (if applicable)
  secondaryQuantity?: number;
  secondaryUnitId?: string;

  // Additional information
  batchNumber?: string;
  expiryDate?: string;
  mfgDate?: string;
  notes?: string;
}

// DTOs for API operations

/**
 * Create Document DTO
 */
export type CreateDocumentDTO = Omit<
  Document,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Update Document DTO
 */
export type UpdateDocumentDTO = Partial<
  Omit<Document, "id" | "createdAt" | "updatedAt">
>;

/**
 * Create Document Item DTO
 */
export type CreateDocumentItemDTO = Omit<
  DocumentItem,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Create Document Charge DTO
 */
export type CreateDocumentChargeDTO = Omit<
  DocumentCharge,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Create Stock Movement DTO
 */
export type CreateStockMovementDTO = Omit<
  StockMovement,
  "id" | "createdAt" | "updatedAt"
>;
