'use client'

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, BarChart } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { ReactNode } from 'react'
import AllPartiesReport from './AllParties'
import AllTransactionsReport from './AllTransactionsReport'
import DayBookReport from './DayBook'
import GSTR1Report from './GSTR-1'
import GSTR2Report from './GSTR-2'
import GSTRateReport from './GSTRateReport'
import GSTReport from './GSTReport'
import ItemSalesAnalysisPage from './ItemAnalysis'
import LowStockAlertPage from './LowStockReport'
import PartyStatementReport from './PartyStatmentReport'
import PurchasesReport from './PurchaseReport'
import SalesReport from './SaleReport'
import StockDetailsPage from './StockDetails'
import StockSummaryReport from './StockSummary'

export default function ReportPage() {
  const pathname = usePathname()
  const path = pathname.replace('/report', '').split('/').filter(Boolean)
  
  // Get the report type from the URL
  const reportType = path[0] || 'dashboard'
  
  // Render the appropriate report component based on the URL
  const renderReportContent = () => {
    switch (reportType) {
      case '/':
        return <ReportDashboard />
      case 'sales':
        return <SalesReport />
      case 'purchases':
        return <PurchasesReport />
      case 'day-book':
        return <DayBookReport />
      case 'all-transactions':
        return <AllTransactionsReport />
      case 'profit-loss':
        return <ProfitLossReport />
      case 'balance-sheet':
        return <BalanceSheetReport />
      case 'party-statement':
        return <PartyStatementReport />
      case 'all-parties':
        return <AllPartiesReport />
      case 'gstr-1':
        return <GSTR1Report />
      case 'gstr-2':
        return <GSTR2Report />
      case 'gst-analysis':
        return <GSTReport />
      case 'gst-rate':
        return <GSTRateReport />
      case 'stock-summary':
        return <StockSummaryReport />
      case 'stock-details':
        return <StockDetailsPage/>
      case 'item-sales':
        return <ItemSalesAnalysisPage />
      case 'low-stock':
        return <LowStockAlertPage />
      case 'bank-statement':
        return <BankStatementReport />
      case 'cash-flow':
        return <CashFlowReport />
      case 'expense-summary':
        return <ExpenseSummaryReport />
      case 'expense-category':
        return <ExpenseCategoryReport />
      case 'expense-item':
        return <ExpenseItemReport />
      default:
        return <ReportNotFound />
    }
  }
  
  return (
    <div className="flex h-[calc(100vh-56px)] w-full">
      <main className="flex-1 p-6 overflow-auto bg-gray-50 w-full">
        {renderReportContent()}
      </main>
    </div>
  )
}

// Placeholder components for each report type
// In a real implementation, these would be imported from separate files

const ReportDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-semibold">Reports Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ReportCard 
        title="Sales Overview" 
        icon={<BarChart className="h-5 w-5 text-primary" />}
        description="View your sales performance and trends"
        link="/reports/sales"
      />
      <ReportCard 
        title="Purchase Analysis" 
        icon={<BarChart className="h-5 w-5 text-primary" />}
        description="Track your purchase expenses and suppliers"
        link="/reports/purchases"
      />
      <ReportCard 
        title="Profit & Loss" 
        icon={<BarChart className="h-5 w-5 text-primary" />}
        description="Analyze your business profitability"
        link="/reports/profit-loss"
      />
      {/* Add more report cards as needed */}
    </div>
  </div>
)

interface ReportCardProps {
    title: string;
    icon: ReactNode;
    description: string;
    link: string;
  }
const ReportCard: React.FC<ReportCardProps> = ({ title, icon, description, link }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-500">{description}</p>
    </CardContent>
  </Card>
)







const ProfitLossReport = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-6">Profit & Loss</h1>
    <Card>
      <CardContent className="p-6">
        <p>Profit & Loss content will be displayed here</p>
      </CardContent>
    </Card>
  </div>
)

const BalanceSheetReport = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-6">Balance Sheet</h1>
    <Card>
      <CardContent className="p-6">
        <p>Balance sheet content will be displayed here</p>
      </CardContent>
    </Card>
  </div>
)



















const BankStatementReport = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-6">Bank Statement</h1>
    <Card>
      <CardContent className="p-6">
        <p>Bank statement content will be displayed here</p>
      </CardContent>
    </Card>
  </div>
)

const CashFlowReport = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-6">Cash Flow</h1>
    <Card>
      <CardContent className="p-6">
        <p>Cash flow content will be displayed here</p>
      </CardContent>
    </Card>
  </div>
)

const ExpenseSummaryReport = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-6">Expense Summary</h1>
    <Card>
      <CardContent className="p-6">
        <p>Expense summary content will be displayed here</p>
      </CardContent>
    </Card>
  </div>
)

const ExpenseCategoryReport = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-6">Expense By Category</h1>
    <Card>
      <CardContent className="p-6">
        <p>Expense by category content will be displayed here</p>
      </CardContent>
    </Card>
  </div>
)

const ExpenseItemReport = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-6">Expense By Item</h1>
    <Card>
      <CardContent className="p-6">
        <p>Expense by item content will be displayed here</p>
      </CardContent>
    </Card>
  </div>
)

const ReportNotFound = () => (
  <div className="h-full flex items-center justify-center">
    <Alert variant="destructive" className="max-w-md">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="mt-2">
        The requested report does not exist. Please select a valid report from the sidebar.
      </AlertDescription>
    </Alert>
  </div>
)