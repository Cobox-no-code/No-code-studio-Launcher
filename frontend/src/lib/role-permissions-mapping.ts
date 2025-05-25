// Role Permissions Mapping
export type PermissionLevel = "allowed" | "restricted" | "not_applicable";

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

// Permission mapping for each role
export const ROLE_PERMISSIONS_MAPPING = {
  // Biller Permissions
  biller: {
    // Sales transactions
    sale: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    payment_in: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    sale_order: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    credit_note: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    delivery_challan: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    estimate: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    expense: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    party: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "not_applicable",
    },
    item: {
      view: "allowed",
      create: "not_applicable",
      edit: "not_applicable",
      share: "not_applicable",
      delete: "not_applicable",
    },
  } as RolePermissions,

  // Biller and Salesman Permissions
  biller_salesman: {
    sale: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    payment_in: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    sale_order: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    credit_note: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    delivery_challan: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    estimate: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    expense: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
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
  } as RolePermissions,

  // CA/Accountant Permissions (Read-only except reports)
  ca_accountant: {
    all_transactions: {
      view: "allowed",
      create: "not_applicable",
      edit: "not_applicable",
      share: "allowed",
      delete: "not_applicable",
    },
    settings: {
      view: "not_applicable",
      create: "not_applicable",
      edit: "not_applicable",
      share: "not_applicable",
      delete: "not_applicable",
    },
    sync_settings: {
      view: "not_applicable",
      create: "not_applicable",
      edit: "not_applicable",
      share: "not_applicable",
      delete: "not_applicable",
    },
    reports: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "allowed",
    },
    stock_transfer: {
      view: "allowed",
      create: "not_applicable",
      edit: "not_applicable",
      share: "allowed",
      delete: "not_applicable",
    },
  } as RolePermissions,

  // Stock Keeper Permissions
  stock_keeper: {
    purchase: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "not_applicable",
      delete: "not_applicable",
    },
    payment_out: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "not_applicable",
      delete: "not_applicable",
    },
    purchase_order: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "not_applicable",
      delete: "not_applicable",
    },
    debit_note: {
      view: "allowed",
      create: "allowed",
      edit: "restricted",
      share: "not_applicable",
      delete: "not_applicable",
    },
    stock_transfer: {
      view: "restricted",
      create: "allowed",
      edit: "not_applicable",
      share: "allowed",
      delete: "not_applicable",
    },
  } as RolePermissions,

  // Salesman Permissions
  salesman: {
    sale: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    payment_in: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    sale_order: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    credit_note: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    delivery_challan: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    estimate: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
    expense: {
      view: "restricted",
      create: "allowed",
      edit: "restricted",
      share: "allowed",
      delete: "not_applicable",
    },
  } as RolePermissions,

  // CA/Accountant (Edit Access) - Full permissions
  ca_account_edit: {
    all_transactions: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "allowed",
    },
    settings: {
      view: "allowed",
      create: "not_applicable",
      edit: "allowed",
      share: "not_applicable",
      delete: "not_applicable",
    },
    sync_settings: {
      view: "not_applicable",
      create: "not_applicable",
      edit: "not_applicable",
      share: "not_applicable",
      delete: "not_applicable",
    },
    reports: {
      view: "allowed",
      create: "not_applicable",
      edit: "not_applicable",
      share: "allowed",
      delete: "not_applicable",
    },
    stock_transfer: {
      view: "allowed",
      create: "allowed",
      edit: "not_applicable",
      share: "allowed",
      delete: "allowed",
    },
    party_smart_connect: {
      view: "not_applicable",
      create: "not_applicable",
      edit: "not_applicable",
      share: "not_applicable",
      delete: "not_applicable",
    },
  } as RolePermissions,

  // Secondary Admin - Near full access
  secondary_admin: {
    // Similar to full admin but may have some restrictions
    all_transactions: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "allowed",
    },
    settings: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "restricted",
    },
    sync_settings: {
      view: "allowed",
      create: "restricted",
      edit: "restricted",
      share: "restricted",
      delete: "restricted",
    },
    reports: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "allowed",
    },
    stock_transfer: {
      view: "allowed",
      create: "allowed",
      edit: "allowed",
      share: "allowed",
      delete: "allowed",
    },
    user_management: {
      view: "allowed",
      create: "restricted",
      edit: "restricted",
      share: "restricted",
      delete: "restricted",
    },
  } as RolePermissions,
};

// Helper function to check if a user has permission for a specific action
export const hasPermission = (
  role: keyof typeof ROLE_PERMISSIONS_MAPPING,
  transaction: string,
  action: keyof Permission
): boolean => {
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
