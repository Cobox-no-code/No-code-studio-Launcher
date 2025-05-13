export interface PaymentIn {
  id: string

  // 🔹 Linked Party
  partyId: string
  partyName?: string

  // 🔹 Payment Details
  paymentType: 'Cash' | 'Bank' | 'UPI' | 'Cheque' | 'Card' | 'Other'
  receivedAmount: number
  date: string // ISO date
  receiptNumber: string
  prefix?: string

  // 🔹 Settings-Driven Additions
  description?: string
  imageUrl?: string
  roundOffEnabled?: boolean
  roundOffValue?: number
  transactionLevelDiscountEnabled?: boolean

  // 🔹 Extra/Dynamic Fields from toggled settings (catch-all)
  additionalFields?: {
    bankName?: string
    upiTxnId?: string
    chequeNo?: string
    chequeDate?: string
    receiptVia?: string
    poReference?: string
    transportMode?: string
    [key: string]: any
  }

  // 🔹 Audit
  createdAt: string
  updatedAt: string
}
