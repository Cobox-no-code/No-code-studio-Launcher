export interface QuotationItem {
  id: string // unique line item ID
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

  // Optional fields for dynamic use
  freeQuantity?: number
  purchasePrice?: number
}

export interface Quotation {
  id: string

  // 🔹 Party & Header Info
  partyId: string
  partyName?: string
  quotationNumber: string
  invoiceDate: string // ISO
  expiryDate?: string
  stateOfSupply?: string
  status?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected'
  prefix?: string

  // 🔹 Line Items
  items: QuotationItem[]

  // 🔹 Tax & Discount Flags (settings-driven)
  inclusiveTaxRate?: boolean
  transactionLevelTaxEnabled?: boolean
  transactionLevelDiscountEnabled?: boolean

  // 🔹 Totals
  totalBeforeTax: number
  totalTax: number
  totalDiscount: number
  additionalCharges?: number
  roundOffEnabled?: boolean
  roundOffValue?: number
  totalAmount: number

  // 🔹 Optional Content
  description?: string
  imageUrl?: string

  // 🔹 Dynamic fields (based on toggled settings)
  additionalFields?: {
    poNumber?: string
    transporterName?: string
    vehicleNumber?: string
    dispatchThrough?: string
    deliveryNote?: string
    termsAndConditions?: string
    footerNote?: string
    packingCharge?: number
    loadingCharge?: number
    otherCharges?: number
    [key: string]: any // allow more flexible extension
  }

  // 🔹 Audit
  createdAt: string
  updatedAt: string
}
