// Updated Party model with dynamic fields and balance type
export interface Party {
  id: string;

  // 🔹 Basic Info
  name: string;
  gstNumber?: string; // Additional GST Number field
  phone?: string;
  email?: string;

  groupId?: string; // Reference to Group

  // 🔹 GST & Address
  gstType: "Unregistered" | "Regular" | "Composition" | "Consumer" | string;
  state?: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingEnabled?: boolean;

  // 🔹 Credit & Balance
  currentBalance?: number | any;
  openingBalance?: number | any;
  openingBalanceType?: "to_pay" | "to_receive"; // Added balance type
  currentBalanceType?: "to_pay" | "to_receive";
  openingBalanceDate?: string; // ISO format
  creditLimitType?: "none" | "custom";
  creditLimitValue?: number;

  // 🔹 Additional Fields (dynamic)
  additionalFields?: AdditionalField[]; // Changed to array of key-value pairs

  // 🔹 Settings-related
  paymentReminderEnabled?: boolean;
  paymentReminderDays?: number;
  loyaltyPointsEnabled?: boolean;

  // 🔹 Audit
  createdAt: string;
  updatedAt: string;
}

// Additional field model for custom fields
export interface AdditionalField {
  key: string;
  value: string;
}

// Group model
export interface Group {
  id: string;
  groupName: string;
  description?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}
