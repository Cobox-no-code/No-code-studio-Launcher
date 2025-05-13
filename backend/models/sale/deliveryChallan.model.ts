export interface DeliveryChallan {
  id: string

  // 🔹 Party Info
  partyId: string
  partyName?: string

  // 🔹 Challan Info
  challanNumber: string
  invoiceDate: string // ISO
  dueDate?: string
  stateOfSupply?: string
  prefix?: string
  status?: 'Draft' | 'Dispatched' | 'Delivered' | 'Cancelled'

  // 🔹 Items
  items: DeliveryChallanItem[]

  // 🔹 Totals & Flags
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

  // 🔹 Dynamic (settings-driven)
  additionalFields?: {
    deliveryNote?: string
    poNumber?: string
    transporterName?: string
    vehicleNumber?: string
    dispatchThrough?: string
    remarks?: string
    [key: string]: any
  }

  // 🔹 Audit
  createdAt: string
  updatedAt: string
}
export interface DeliveryChallanItem {
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
