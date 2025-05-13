import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight, 
  BarChart3, 
  Users, 
  FileText, 
  Package, 
  CreditCard, 
  ReceiptText, 
  DollarSign 
} from 'lucide-react'

interface ReportCategoryProps {
  title: string
  icon: React.ReactNode
  items: { name: string; path: string }[]
  initialExpanded?: boolean
}

const ReportCategory: React.FC<ReportCategoryProps> = ({ 
  title, 
  icon, 
  items,
  initialExpanded = false
}) => {
  const [expanded, setExpanded] = useState(initialExpanded)
  const router = useRouter()

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
          {items.map((item, index) => (
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
  )
}

const ReportSidebar = () => {
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
        <ReportCategory
          title="Transaction Reports"
          icon={<FileText className="h-4 w-4 text-primary" />}
          initialExpanded={true}
          items={[
            { name: "Sales Report", path: "/sales" },
            { name: "Purchase Report", path: "/purchases" },
            { name: "Day Book", path: "/day-book" },
            { name: "All Transactions", path: "/all-transactions" },
            // { name: "Profit & Loss", path: "/profit-loss" },
            // { name: "Balance Sheet", path: "/balance-sheet" }
          ]}
        />
        
        <ReportCategory
          title="Party Reports"
          icon={<Users className="h-4 w-4 text-primary" />}
          items={[
            { name: "Party Statement", path: "/party-statement" },
            { name: "All Parties", path: "/all-parties" }
          ]}
        />
        
        <ReportCategory
          title="GST Reports"
          icon={<ReceiptText className="h-4 w-4 text-primary" />}
          items={[
            { name: "GSTR-1", path: "/gstr-1" },
            { name: "GSTR-2", path: "/gstr-2" },
          ]}
        />
                <ReportCategory
          title="Taxes"
          icon={<ReceiptText className="h-4 w-4 text-primary" />}
          items={[
            { name: "GST Report", path: "/gst-analysis" },
            { name: "GST Rate Report", path: "/gst-rate" }
          ]}
        />
        <ReportCategory
          title="Inventory Reports"
          icon={<Package className="h-4 w-4 text-primary" />}
          items={[
            { name: "Stock Summary", path: "/stock-summary" },
            { name: "Stock Details", path: "/stock-details" },
            { name: "Item Sales Analysis", path: "/item-sales" },
            { name: "Low Stock Alert", path: "/low-stock" }
          ]}
        />
        
    
      </div>
    </div>
  )
}

export default ReportSidebar