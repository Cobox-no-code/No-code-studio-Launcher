export interface SaleOrder {
  id: string

  // 🔹 Party Info
  partyId: string
  partyName?: string
  phone?: string

  // 🔹 Order Info
  orderNumber: string
  orderDate: string // ISO
  dueDate?: string
  stateOfSupply?: string
  prefix?: string
  status?: 'Draft' | 'Confirmed' | 'Dispatched' | 'Cancelled'

  // 🔹 Payment Info
  paymentType?: 'Cash' | 'Bank' | 'UPI' | 'Credit' | 'Card' | 'Other'

  // 🔹 Line Items
  items: SaleOrderItem[]

  // 🔹 Tax & Discount Flags
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

  // 🔹 Optional Description/Image
  description?: string
  imageUrl?: string

  // 🔹 Dynamic Additional Fields
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
export interface SaleOrderItem {
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

  // Optional: support free qty, etc.
  freeQuantity?: number
  purchasePrice?: number
}
