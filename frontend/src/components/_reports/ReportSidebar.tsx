
import { useApiUrl } from "@/hooks/useApiUrl";
import { useAppSelector } from "@/redux/hooks";
import axios from "axios";
import {
    BarChart3,
    ChevronDown,
    ChevronRight,
    FileText,
    Package,
    ReceiptText,
    Users
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

// Define role types (same as in AppSidebar)
type UserRole =
  | "admin"
  | "secondary_admin"
  | "salesman"
  | "biller"
  | "biller_salesman"
  | "ca_accountant"
  | "stock_keeper"
  | "ca_account_edit";

// Role-based report access control
const ROLE_REPORT_ACCESS = {
  admin: [
    "transaction-reports",
    "party-reports", 
    "gst-reports",
    "tax-reports",
    "inventory-reports"
  ],
  secondary_admin: [
    "transaction-reports",
    "party-reports",
    "gst-reports", 
    "tax-reports",
    "inventory-reports"
  ],
  biller: [
    "transaction-reports",
    "party-reports"
  ],
  biller_salesman: [
    "transaction-reports",
    "party-reports",
    "inventory-reports"
  ],
  salesman: [
    "transaction-reports",
    "party-reports"
  ],
  stock_keeper: [
    "transaction-reports",
    "inventory-reports"
  ],
  ca_accountant: [
    "transaction-reports",
    "party-reports",
    "gst-reports",
    "tax-reports"
  ],
  ca_account_edit: [
    "transaction-reports",
    "party-reports",
    "gst-reports",
    "tax-reports"
  ],
};

// Sub-report access control for each role
const ROLE_REPORT_SUB_ACCESS = {
  admin: {
    "transaction-reports": [
      "sales-report",
      "purchase-report", 
      "day-book",
      "all-transactions"
    ],
    "party-reports": [
      "party-statement",
      "all-parties"
    ],
    "gst-reports": [
      "gstr-1",
      "gstr-2"
    ],
    "tax-reports": [
      "gst-analysis",
      "gst-rate",
      "tax-analysis", 
      "tax-rate"
    ],
    "inventory-reports": [
      "stock-summary",
      "stock-details",
      "item-sales",
      "low-stock"
    ]
  },
  secondary_admin: {
    "transaction-reports": [
      "sales-report",
      "purchase-report",
      "day-book", 
      "all-transactions"
    ],
    "party-reports": [
      "party-statement",
      "all-parties"
    ],
    "gst-reports": [
      "gstr-1",
      "gstr-2"
    ],
    "tax-reports": [
      "gst-analysis",
      "gst-rate",
      "tax-analysis",
      "tax-rate"
    ],
    "inventory-reports": [
      "stock-summary",
      "stock-details",
      "item-sales",
      "low-stock"
    ]
  },
  biller: {
    "transaction-reports": [
      "sales-report",
      "day-book"
    ],
    "party-reports": [
      "party-statement",
      "all-parties"
    ]
  },
  biller_salesman: {
    "transaction-reports": [
      "sales-report",
      "day-book"
    ],
    "party-reports": [
      "party-statement", 
      "all-parties"
    ],
    "inventory-reports": [
      "stock-summary",
      "item-sales"
    ]
  },
  salesman: {
    "transaction-reports": [
      "sales-report"
    ],
    "party-reports": [
      "party-statement",
      "all-parties"
    ]
  },
  stock_keeper: {
    "transaction-reports": [
      "purchase-report",
      "day-book"
    ],
    "inventory-reports": [
      "stock-summary",
      "stock-details", 
      "item-sales",
      "low-stock"
    ]
  },
  ca_accountant: {
    "transaction-reports": [
      "sales-report",
      "purchase-report",
      "day-book",
      "all-transactions"
    ],
    "party-reports": [
      "party-statement",
      "all-parties"
    ],
    "gst-reports": [
      "gstr-1",
      "gstr-2"
    ],
    "tax-reports": [
      "gst-analysis",
      "gst-rate",
      "tax-analysis",
      "tax-rate"
    ]
  },
  ca_account_edit: {
    "transaction-reports": [
      "sales-report",
      "purchase-report",
      "day-book",
      "all-transactions"
    ],
    "party-reports": [
      "party-statement",
      "all-parties"
    ],
    "gst-reports": [
      "gstr-1",
      "gstr-2"
    ],
    "tax-reports": [
      "gst-analysis",
      "gst-rate",
      "tax-analysis",
      "tax-rate"
    ]
  }
};

// Helper functions
const canAccessReportCategory = (role: UserRole, categoryKey: string): boolean => {
  const allowedCategories = ROLE_REPORT_ACCESS[role] || ROLE_REPORT_ACCESS.admin;
  return allowedCategories.includes(categoryKey);
};

const canAccessReportItem = (
  role: UserRole,
  categoryKey: string,
  reportKey: string
): boolean => {
  const roleSubAccess = ROLE_REPORT_SUB_ACCESS[role] || ROLE_REPORT_SUB_ACCESS.admin;
  const allowedReports = roleSubAccess[categoryKey] || [];
  return allowedReports.includes(reportKey);
};

const getReportKey = (name: string): string => {
  const keyMap: { [key: string]: string } = {
    "Sales Report": "sales-report",
    "Purchase Report": "purchase-report",
    "Day Book": "day-book",
    "All Transactions": "all-transactions",
    "Party Statement": "party-statement",
    "All Parties": "all-parties",
    "GSTR-1": "gstr-1",
    "GSTR-2": "gstr-2",
    "GST Report": "gst-analysis",
    "GST Rate Report": "gst-rate",
    "Tax Report": "tax-analysis",
    "Tax Rate Report": "tax-rate",
    "Stock Summary": "stock-summary",
    "Stock Details": "stock-details",
    "Item Sales Analysis": "item-sales",
    "Low Stock Alert": "low-stock"
  };
  return keyMap[name] || name.toLowerCase().replace(/\s+/g, '-');
};

interface ReportCategoryProps {
  title: string;
  icon: React.ReactNode;
  items: { name: string; path: string }[];
  initialExpanded?: boolean;
  categoryKey: string;
  role: UserRole;
}

const ReportCategory: React.FC<ReportCategoryProps> = ({
  title,
  icon,
  items,
  initialExpanded = false,
  categoryKey,
  role
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  
  // Filter items based on role
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const reportKey = getReportKey(item.name);
      return canAccessReportItem(role, categoryKey, reportKey);
    });
  }, [items, categoryKey, role]);

  // Don't render category if no items are accessible
  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div
        className="flex items-center justify-between p-3 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center text-sm font-medium text-gray-700">
          {icon}
          <span className="ml-2">{title}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </div>

      {expanded && (
        <div className="bg-white">
          {filteredItems.map((item, index) => (
            <Link
              key={index}
              href={`/report${item.path}`}
              className="h-10 flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-l-2 border-transparent hover:border-primary"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const ReportSidebar = () => {
  // Get role from Redux store with fallback to 'admin'
  const role = (useAppSelector((state) => state.firm.role) as UserRole) || "admin";
    const apiUrl = useApiUrl()
  const [firmCountry, setFirmCountry] = useState("");
  const firmId = typeof window !== "undefined" ? localStorage.getItem("firmId") : null;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${apiUrl}/firms/${firmId}`);
        if (res.data) {
          setFirmCountry(res.data.country);
        }
      } catch (error) {
        console.error("Error fetching firm data:", error);
      }
    };
    if (firmId) {
      fetch();
    }
  }, [firmId]);

  // Determine if firm is in India
  const isIndianFirm = firmCountry === "IN";

  // Define report categories with role-based filtering
  const reportCategories = useMemo(() => {
    const categories = [];

    // Transaction Reports
    if (canAccessReportCategory(role, "transaction-reports")) {
      categories.push({
        key: "transaction-reports",
        title: "Transaction Reports",
        icon: <FileText className="h-4 w-4 text-primary" />,
        initialExpanded: true,
        items: [
          { name: "Sales Report", path: "/sales" },
          { name: "Purchase Report", path: "/purchases" },
          { name: "Day Book", path: "/day-book" },
          { name: "All Transactions", path: "/all-transactions" },
        ]
      });
    }

    // Party Reports
    if (canAccessReportCategory(role, "party-reports")) {
      categories.push({
        key: "party-reports",
        title: "Party Reports",
        icon: <Users className="h-4 w-4 text-primary" />,
        items: [
          { name: "Party Statement", path: "/party-statement" },
          { name: "All Parties", path: "/all-parties" },
        ]
      });
    }

    // GST Reports (only for Indian firms and authorized roles)
    if (isIndianFirm && canAccessReportCategory(role, "gst-reports")) {
      categories.push({
        key: "gst-reports", 
        title: "GST Reports",
        icon: <ReceiptText className="h-4 w-4 text-primary" />,
        items: [
          { name: "GSTR-1", path: "/gstr-1" },
          { name: "GSTR-2", path: "/gstr-2" },
        ]
      });
    }

    // Tax Reports
    if (canAccessReportCategory(role, "tax-reports")) {
      categories.push({
        key: "tax-reports",
        title: isIndianFirm ? "GST Analysis" : "Tax Reports",
        icon: <ReceiptText className="h-4 w-4 text-primary" />,
        items: isIndianFirm
          ? [
              { name: "GST Report", path: "/gst-analysis" },
              { name: "GST Rate Report", path: "/gst-rate" },
            ]
          : [
              { name: "Tax Report", path: "/tax-analysis" },
              { name: "Tax Rate Report", path: "/tax-rate" },
            ]
      });
    }

    // Inventory Reports
    if (canAccessReportCategory(role, "inventory-reports")) {
      categories.push({
        key: "inventory-reports",
        title: "Inventory Reports", 
        icon: <Package className="h-4 w-4 text-primary" />,
        items: [
          { name: "Stock Summary", path: "/stock-summary" },
          { name: "Stock Details", path: "/stock-details" },
          { name: "Item Sales Analysis", path: "/item-sales" },
          { name: "Low Stock Alert", path: "/low-stock" },
        ]
      });
    }

    return categories;
  }, [role, isIndianFirm]);

  // Debug: Log current role and accessible categories (remove in production)
  console.log("Current role (Reports):", role);
  console.log("Accessible report categories:", reportCategories.map(cat => cat.title));

  return (
    <div className="h-[calc(100vh-56px)] w-72 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10">
        <h3 className="font-semibold text-lg flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Reports
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          View and analyze your business data
        </p>
      </div>

      <div className="py-2">
        {reportCategories.map((category) => (
          <ReportCategory
            key={category.key}
            title={category.title}
            icon={category.icon}
            items={category.items}
            initialExpanded={category.initialExpanded}
            categoryKey={category.key}
            role={role}
          />
        ))}
      </div>
    </div>
  );
};

// Export role access functions for use in other components
export {
    canAccessReportCategory,
    canAccessReportItem,
    ROLE_REPORT_ACCESS,
    ROLE_REPORT_SUB_ACCESS
};

export default ReportSidebar;