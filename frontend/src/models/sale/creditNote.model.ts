export interface CreditNote {
  id: string

  // 🔹 Party
  partyId: string
  partyName?: string
  phone?: string

  // 🔹 Credit Note Info
  returnNumber: string
  invoiceNumber?: string
  invoiceDate?: string
  creditNoteDate: string
  stateOfSupply?: string
  prefix?: string
  status?: 'Draft' | 'Issued' | 'Settled' | 'Cancelled'

  // 🔹 Payment
  paymentType?: 'Cash' | 'Bank' | 'UPI' | 'Card' | 'Other'

  // 🔹 Line Items
  items: CreditNoteItem[]

  // 🔹 Tax, Discount, Round Off
  inclusiveTaxRate?: boolean
  transactionLevelTaxEnabled?: boolean
  transactionLevelDiscountEnabled?: boolean
  totalBeforeTax: number
  totalTax: number
  totalDiscount: number
  additionalCharges?: number
  roundOffEnabled?: boolean
  roundOffValue?: number
  totalAmount: number

  // 🔹 Optional
  description?: string
  imageUrl?: string

  // 🔹 Settings-Driven Fields
  additionalFields?: {
    transporterName?: string
    vehicleNumber?: string
    poNumber?: string
    dispatchThrough?: string
    deliveryNote?: string
    remarks?: string
    [key: string]: any
  }

  // 🔹 Audit
  createdAt: string
  updatedAt: string
}
export interface CreditNoteItem {
  id: string
  itemId: string
  itemName?: string
  unit?: string
  quantity: number
  pricePerUnit: number
  isTaxIncluded: boolean
  discountPercent?: number
  discountAmount?: number
  taxPercent?: number
  taxAmount?: number
  total: number
  freeQuantity?: number
  purchasePrice?: number
}
