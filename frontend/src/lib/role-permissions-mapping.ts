// Role Permissions Mapping
export type PermissionLevel = "allowed" | "restricted" | "not_applicable";
const full = (): Permission => ({
  view: "allowed",
  create: "allowed",
  edit: "allowed",
  share: "allowed",
  delete: "allowed",
});

const restricted = (): Permission => ({
  view: "allowed",
  create: "allowed",
  edit: "restricted",
  share: "allowed",
  delete: "not_applicable",
});

const readOnly = (): Permission => ({
  view: "allowed",
  create: "not_applicable",
  edit: "not_applicable",
  share: "allowed",
  delete: "not_applicable",
});

const notApplicable = (): Permission => ({
  view: "not_applicable",
  create: "not_applicable",
  edit: "not_applicable",
  share: "not_applicable",
  delete: "not_applicable",
});

export interface Permission {
  view: PermissionLevel;
  create: PermissionLevel;
  edit: PermissionLevel;
  share: PermissionLevel;
  delete: PermissionLevel;
}

export interface RolePermissions {
  [key: string]: Permission;
}

export const ROLE_PERMISSIONS_MAPPING = {
  admin: {
    sale_invoice: full(),
    sale_order: full(),
    sale_return: full(),
    sale_quotation: full(),
    delivery_challan: full(),
    purchase_invoice: full(),
    purchase_order: full(),
    purchase_return: full(),
    payment_in: full(),
    payment_out: full(),
    party: full(),
    item: full(),
    settings: full(),
    sync_settings: full(),
    reports: full(),
    stock_transfer: full(),
    user_management: full(),
  },

  secondary_admin: {
    sale_invoice: full(),
    sale_order: full(),
    sale_return: full(),
    sale_quotation: full(),
    delivery_challan: full(),
    purchase_invoice: full(),
    purchase_order: full(),
    purchase_return: full(),
    payment_in: full(),
    payment_out: full(),
    party: full(),
    item: full(),
    settings: full(),
    sync_settings: full(),
    reports: full(),
    stock_transfer: full(),
    user_management: full(),
  },

  biller: {
    sale_invoice: restricted(),
    sale_order: restricted(),
    sale_return: restricted(),
    sale_quotation: restricted(),
    delivery_challan: restricted(),
    payment_in: restricted(),
    party: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "not_applicable",
    },
    item: readOnly(),
  },

  biller_salesman: {
    sale_invoice: restricted(),
    sale_order: restricted(),
    sale_return: restricted(),
    sale_quotation: restricted(),
    delivery_challan: restricted(),
    payment_in: restricted(),
    party: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "not_applicable",
    },
    item: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "not_applicable",
    },
  },

  salesman: {
    sale_invoice: restricted(),
    sale_order: restricted(),
    sale_return: restricted(),
    sale_quotation: restricted(),
    delivery_challan: restricted(),
    payment_in: restricted(),
    party: readOnly(),
    item: readOnly(),
  },

  stock_keeper: {
    purchase_invoice: restricted(),
    purchase_order: restricted(),
    purchase_return: restricted(),
    payment_out: restricted(),
    stock_transfer: {
      view: "restricted",
      create: "allowed",
      edit: "not_applicable",
      share: "allowed",
      delete: "not_applicable",
    },
    item: readOnly(),
  },

  ca_accountant: {
    sale_invoice: readOnly(),
    purchase_invoice: readOnly(),
    payment_in: readOnly(),
    payment_out: readOnly(),
    reports: full(),
    stock_transfer: readOnly(),
    settings: notApplicable(),
    sync_settings: notApplicable(),
    item: readOnly(),
    party: readOnly(),
  },

  ca_account_edit: {
    sale_invoice: full(),
    purchase_invoice: full(),
    payment_in: full(),
    payment_out: full(),
    reports: full(),
    stock_transfer: full(),
    settings: {
      view: "allowed",
      create: "not_applicable",
      edit: "allowed",
      share: "not_applicable",
      delete: "not_applicable",
    },
    sync_settings: notApplicable(),
    user_management: notApplicable(),
    item: readOnly(),
    party: full(),
  },
} satisfies Record<string, RolePermissions>;


// Helper function to check if a user has permission for a specific action
export const hasPermission = (
  role: keyof typeof ROLE_PERMISSIONS_MAPPING,
  transaction: string,
  action: keyof Permission
): boolean => {
  console.log(`Checking permission for role: ${role}, transaction: ${transaction}, action: ${action}`);
  const rolePermissions = ROLE_PERMISSIONS_MAPPING[role];
  if (!rolePermissions || !rolePermissions[transaction]) {
    return false;
  }

  const permission = rolePermissions[transaction][action];
  return permission === "allowed";
};

// Helper function to check if permission is restricted (needs approval)
export const isPermissionRestricted = (
  role: keyof typeof ROLE_PERMISSIONS_MAPPING,
  transaction: string,
  action: keyof Permission
): boolean => {
  const rolePermissions = ROLE_PERMISSIONS_MAPPING[role];
  if (!rolePermissions || !rolePermissions[transaction]) {
    return false;
  }

  const permission = rolePermissions[transaction][action];
  return permission === "restricted";
};

// Helper function to get all permissions for a role
export const getRolePermissions = (
  role: keyof typeof ROLE_PERMISSIONS_MAPPING
): RolePermissions | null => {
  return ROLE_PERMISSIONS_MAPPING[role] || null;
};

// Display friendly names for permissions
export const TRANSACTION_DISPLAY_NAMES = {
  sale: "Sale",
  payment_in: "Payment-In",
  sale_order: "Sale Order",
  credit_note: "Credit Note",
  delivery_challan: "Delivery Challan",
  estimate: "Estimate",
  expense: "Expense",
  party: "Party",
  item: "Item",
  purchase: "Purchase",
  payment_out: "Payment-Out",
  purchase_order: "Purchase Order",
  debit_note: "Debit Note",
  stock_transfer: "Stock Transfer",
  all_transactions: "All Transactions",
  settings: "Settings",
  sync_settings: "Sync Settings",
  reports: "Reports",
  party_smart_connect: "Party Smart Connect",
  user_management: "User Management",
};

// Action display names
export const ACTION_DISPLAY_NAMES = {
  view: "VIEW",
  create: "CREATE",
  edit: "EDIT",
  share: "SHARE",
  delete: "DELETE",
};

// Permission level colors for UI
export const PERMISSION_COLORS = {
  allowed: "text-green-600",
  restricted: "text-yellow-600",
  not_applicable: "text-red-600",
};

// Permission level icons
export const PERMISSION_ICONS = {
  allowed: "✓",
  restricted: "△",
  not_applicable: "✗",
};
