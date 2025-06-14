import {
  AudioWaveform,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Command,
  GalleryVerticalEnd,
  Home,
  Landmark,
  Plus,
  ReceiptIndianRupee,
  RefreshCw,
  ShoppingBasket,
  ShoppingCart,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/SideBar/nav-main";
import {
  Sidebar,
  SidebarContent
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/redux/hooks";
import CompanySelector from "../CompanySelector";
import SubscriptionStatus from "../SubscriptionStatus";

// Define role types
type UserRole =
  | "admin"
  | "secondary_admin"
  | "salesman"
  | "biller"
  | "biller_salesman"
  | "ca_accountant"
  | "stock_keeper"
  | "ca_account_edit";

// Role-based navigation access control
const ROLE_ACCESS = {
  admin: [
    "home",
    "items",
    "parties",
    "sales",
    "purchase",
    "payment",
    "report",
    "cash-bank",
    "utilities",
    "pricing",
    "sync-share",
  ],
  secondary_admin: [
    "home",
    "items",
    "parties",
    "sales",
    "purchase",
    "payment",
    "report",
    "cash-bank",
    "utilities",
  ],
  biller: ["home", "parties", "sales", "payment", "report"],
  biller_salesman: ["home", "items", "parties", "sales", "payment", "report"],
  salesman: ["home", "parties", "sales", "report"],
  stock_keeper: ["home", "items", "purchase", "report"],
  ca_accountant: ["home", "report"],
  ca_account_edit: ["home", "report", "cash-bank"],
};

// Sub-item access control for each role
const ROLE_SUB_ACCESS = {
  admin: {
    sales: [
      "sale-invoice",
      "sale-quotation",
      "sale-order",
      "delivery-challan",
      "sale-return",
    ],
    purchase: ["purchase-bill", "purchase-order", "purchase-return"],
    payment: ["payment-in", "payment-out"],
    "cash-bank": ["bank-account", "cash-in-hand"],
    utilities: [
      "import-item",
      "import-parties",
      "export-item",
      "export-parties",
    ],
  },
  secondary_admin: {
    sales: [
      "sale-invoice",
      "sale-quotation",
      "sale-order",
      "delivery-challan",
      "sale-return",
    ],
    purchase: ["purchase-bill", "purchase-order", "purchase-return"],
    payment: ["payment-in", "payment-out"],
    "cash-bank": ["bank-account", "cash-in-hand"],
    utilities: [
      "import-item",
      "import-parties",
      "export-item",
      "export-parties",
    ],
  },
  biller: {
    sales: ["sale-invoice", "sale-quotation", "sale-order", "delivery-challan"],
    payment: ["payment-in"],
  },
  biller_salesman: {
    sales: ["sale-invoice", "sale-quotation", "sale-order", "delivery-challan"],
    payment: ["payment-in"],
  },
  salesman: {
    sales: ["sale-quotation", "sale-order"],
    payment: ["payment-in"],
  },
  stock_keeper: {
    purchase: ["purchase-bill", "purchase-order"],
  },
  ca_accountant: {},
  ca_account_edit: {
    "cash-bank": ["bank-account", "cash-in-hand"],
  },
};

// Helper function to check if user can access a navigation item
const canAccessNavItem = (role: UserRole, itemKey: string): boolean => {
  const allowedItems = ROLE_ACCESS[role] || ROLE_ACCESS.admin;
  return allowedItems.includes(itemKey);
};

// Helper function to check if user can access sub-items
const canAccessSubItem = (
  role: UserRole,
  parentKey: string,
  subItemKey: string
): boolean => {
  const roleSubAccess = ROLE_SUB_ACCESS[role] || ROLE_SUB_ACCESS.admin;
  const allowedSubItems = roleSubAccess[parentKey] || [];
  return allowedSubItems.includes(subItemKey);
};

// Filter navigation items based on role
const filterNavItems = (navItems: any[], role: UserRole) => {
  return navItems.filter((item) => {
    // Check main item access
    const itemKey = getItemKey(item.title);
    if (!canAccessNavItem(role, itemKey)) {
      return false;
    }

    // Filter sub-items if they exist
    if (item.items && item.items.length > 0) {
      item.items = item.items.filter((subItem: any) => {
        const subItemKey = getSubItemKey(subItem.title);
        return canAccessSubItem(role, itemKey, subItemKey);
      });
    }

    return true;
  });
};

// Helper function to convert title to key
const getItemKey = (title: string): string => {
  const keyMap: { [key: string]: string } = {
    Home: "home",
    Items: "items",
    Parties: "parties",
    Sales: "sales",
    Purchase: "purchase",
    Payment: "payment",
    Report: "report",
    "Cash & Bank": "cash-bank",
    Utilities: "utilities",
    Pricing: "pricing",
    "Sync, Share & Backup": "sync-share",
  };
  return keyMap[title] || title.toLowerCase();
};

// Helper function to convert sub-item title to key
const getSubItemKey = (title: string): string => {
  const keyMap: { [key: string]: string } = {
    "Sale Invoices": "sale-invoice",
    "Sale Quotation": "sale-quotation",
    "Sale Order": "sale-order",
    "Delivery Challan": "delivery-challan",
    "Sale Return/ Cr. Note": "sale-return",
    "Purchase Bill": "purchase-bill",
    "Purchase Order": "purchase-order",
    "Purchase Return/ Dr. Note": "purchase-return",
    "Payment In": "payment-in",
    "Payment Out": "payment-out",
    "Bank Account": "bank-account",
    "Cash Payments": "cash-in-hand",
    "Import Item": "import-item",
    "Import Parties": "import-parties",
    "Export Item": "export-item",
    "Export Parties": "export-parties",
  };
  return keyMap[title] || title.toLowerCase();
};

// Original navigation data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
      items: [],
    },
    {
      title: "Items",
      url: "/items",
      icon: ShoppingBasket,
      rightSideIcon: Plus,
      isActive: true,
      items: [],
    },
    {
      title: "Parties",
      url: "/parties",
      icon: Users,
      rightSideIcon: Plus,
      isActive: true,
      items: [],
    },
    {
      title: "Sales",
      url: "/documents/list/sale-invoice",
      icon: ReceiptIndianRupee,
      rightSideIcon: ChevronRight,
      isActive: true,
      items: [
        {
          title: "Sale Invoices",
          url: "/documents/list/sale-invoice",
          shortcut: "/saleTab",
        },
        {
          title: "Sale Quotation",
          url: "/documents/list/sale-quotation",
          shortcut: "/saleTab/estimate",
        },
        {
          title: "Sale Order",
          url: "/documents/list/sale-order",
          shortcut: "/saleTab/sale_order",
        },
        {
          title: "Delivery Challan",
          url: "/documents/list/delivery-challan",
          shortcut: "/saleTab/delivery_challan",
        },
        {
          title: "Sale Return/ Cr. Note",
          url: "/documents/list/sale-return",
          shortcut: "/saleTab/sale_return",
        },
      ],
    },
    {
      title: "Purchase",
      url: "/documents/list/purchase-invoice",
      icon: ShoppingCart,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: "Purchase Bill",
          url: "/documents/list/purchase-invoice",
          shortcut: "/purchaseTab",
        },
        {
          title: "Purchase Order",
          url: "/documents/list/purchase-order",
          shortcut: "/purchaseTab/purchase-order",
        },
        {
          title: "Purchase Return/ Dr. Note",
          url: "/documents/list/purchase-return",
          shortcut: "/purchaseTab/purchase-return",
        },
      ],
    },
    {
      title: "Payment",
      url: "/payment-in",
      icon: Wallet,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: "Payment In",
          url: "/payment-in",
        },
        {
          title: "Payment Out",
          url: "/payment-out",
        },
      ],
    },
    {
      title: "Report",
      url: "/report/sales",
      icon: ChartNoAxesColumnIncreasing,
      items: [],
    },
    {
      title: "Cash & Bank",
      url: "/cash-&-bank/bank-account",
      icon: Landmark,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: "Bank Account",
          url: "/cash-&-bank/bank-account",
        },
        {
          title: "Cash Payments",
          url: "/cash-&-bank/cash-in-hand",
        },
      ],
    },
    {
      title: "Utilities",
      url: "/Utilities/import-item",
      icon: Wrench,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: "Import Item",
          url: "/Utilities/import-item",
        },
        {
          title: "Import Parties",
          url: "/Utilities/import-parties",
        },
        {
          title: "Export Item",
          url: "/Utilities/export-item",
        },
        {
          title: "Export Parties",
          url: "/Utilities/export-parties",
        },
      ],
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: ShoppingBasket,
      items: [],
    },
    {
      title: "Sync, Share & Backup",
      url: "/sync-&-share/sync&share",
      icon: RefreshCw,
      items: [],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Get role from Redux store with fallback to 'admin'
  const role =
    (useAppSelector((state) => state.firm.role) as UserRole) || "admin";
  const [firmName, setFirmName] = React.useState<string>("");

  React.useEffect(() => {
    // Get firm name from localStorage
    const storedFirmName = localStorage.getItem("firmName");
    if (storedFirmName) {
      setFirmName(storedFirmName);
    }

    // Listen for storage changes (in case another component updates localStorage)
    const handleStorageChange = (): void => {
      const updatedFirmName = localStorage.getItem("firmName");
      setFirmName(updatedFirmName || "");
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Filter navigation items based on user role
  const filteredNavItems = React.useMemo(() => {
    return filterNavItems([...data.navMain], role);
  }, [role])
    filteredNavItems.map((item) => ({
      title: item.title,
      subItems: item.items?.map((sub: any) => sub.title),
    }))
  


  return (
    <Sidebar collapsible="icon" {...props}>
      {/* App Logo and Name */}
      <div className="flex items-center gap-2 p-4 mb-2">
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <img
            src="http://34.228.195.218/static/images/logo.png"
            alt="Logo"
            className="w-full h-full object-cover rounded-md"
          />
        </div>
        <span className="font-bold text-lg text-white">PAPERBILL</span>
      </div>

      {/* Main Navigation - Role-filtered */}
      <SidebarContent className="text-white flex-grow">
        <NavMain items={filteredNavItems} />
      </SidebarContent>

      <div className="mt-auto">
        <SubscriptionStatus />
        <CompanySelector isBottom={true} />
      </div>
    </Sidebar>
  );
}

// Optional: Export role access configuration for use in other components
export { canAccessNavItem, canAccessSubItem, ROLE_ACCESS, ROLE_SUB_ACCESS };
