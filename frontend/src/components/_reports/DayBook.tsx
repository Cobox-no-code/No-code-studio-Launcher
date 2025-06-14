'use client'

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentDirection } from '@/models/payment/payment.model'
import { useGetDocumentsQuery, useGetPurchaseInvoicesQuery, useGetSaleInvoicesQuery } from '@/redux/api/documentApi'
import { useGetPaymentsQuery } from '@/redux/api/paymentApi'
import { format } from 'date-fns'
import {
    AlertCircleIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    CalendarIcon,
    DownloadIcon,
    FileTextIcon,
    PrinterIcon,
    RefreshCwIcon
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { DownloadButton } from '../Xl'

const DayBookReport = () => {
  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  // State for date filter
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [activeTab, setActiveTab] = useState<string>("all")
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch sale invoices for the selected date
  const { 
    data: saleInvoices, 
    isLoading: isLoadingSales, 
    isError: isSalesError,
    refetch: refetchSales
  } = useGetSaleInvoicesQuery({ 
    startDate: selectedDate,
    endDate: selectedDate
  })

  // Fetch purchase invoices for the selected date
  const { 
    data: purchaseInvoices, 
    isLoading: isLoadingPurchases, 
    isError: isPurchasesError,
    refetch: refetchPurchases 
  } = useGetPurchaseInvoicesQuery({ 
    startDate: selectedDate,
    endDate: selectedDate
  })
    const {
      data: documents,
      isLoading: isLoadingDocuments,
      isError: isErrorDocuments,
      refetch: refetchDocuments,
    } = useGetDocumentsQuery({
      startDate: selectedDate,
    endDate: selectedDate
    });
  
  const { 
    data: payments, 
    isLoading: isLoadingPayments, 
    isError: isPaymentsError,
    refetch: refetchPayments 
  } = useGetPaymentsQuery({ 
    startDate: selectedDate,
    endDate: selectedDate
  })

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef:  printRef,
    documentTitle: 'Day Book',
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm 10mm;
      }
    `,
  
    onAfterPrint: () => console.log('Print completed')
  })

  // Calculate totals
  const calculateTotals = () => {
    const salesTotal = saleInvoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0
    const purchasesTotal = purchaseInvoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0
    const paymentsTotal = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    return {
      salesCount: saleInvoices?.length || 0,
      purchasesCount: purchaseInvoices?.length || 0,
      salesTotal,
      purchasesTotal,
      paymentsTotal,
      netCashFlow: salesTotal - purchasesTotal
    }
  }

  const totals = calculateTotals()

  // Get the company name and phone from localStorage if available
  const companyName = typeof window !== 'undefined' ? localStorage.getItem('firmName') || 'My Company' : 'My Company'
  const companyPhone = typeof window !== 'undefined' ? localStorage.getItem('firmPhone') || '9752133459' : '9752133459'

  // Combine and sort transactions for "All" tab
  const allTransactions = [
    // Sales invoices
    ...(documents || []).map((invoice) => ({
      ...invoice,
      transactionType: invoice.documentType,
      counterparty: invoice.partyName,
      amountReceived: invoice.paidAmount || 0,
      amountPaid: 0,
      date: invoice.documentDate,
      sourceType: "invoice",
    })),



    // Payment transactions
    ...(payments || []).map((payment) => ({
      ...payment,
      transactionType:
        payment.direction === PaymentDirection.IN
          ? "Payment In"
          : "Payment Out",
      documentNumber:
        payment.receiptNumber || `PMT-${payment.id.substring(0, 8)}`,
      counterparty: payment.partyName,
      total: payment.amount,
      amountReceived:
        payment.direction === PaymentDirection.IN ? payment.amount : 0,
      amountPaid:
        payment.direction === PaymentDirection.OUT ? payment.amount : 0,
      date: payment.paymentDate,
      sourceType: "payment",
    })),
  ].sort((a, b) => {
    // Sort by date descending (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const refreshAllData = () => {
    refetchSales()
    refetchPurchases()
  }

  return (
    <div className="space-y-6 ">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Day Book</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={()=>handlePrint()}
            className="flex items-center gap-1"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <DownloadButton  buttonText='Export XLXS' data={allTransactions} fileName='day-book'/>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={()=>handlePrint()}
          >
            <DownloadIcon className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-grow">
              <Label htmlFor="selectedDate">Select Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Button 
              onClick={refreshAllData} 
              className="mb-2 gap-1"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Load Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <h3 className="text-2xl font-bold mt-1">{totals.salesCount + totals.purchasesCount } </h3>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-green-600">Sales: {totals.salesCount}</span>
              <span className="text-blue-600">Purchases: {totals.purchasesCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Sales Income</p>
            <h3 className="text-2xl font-bold mt-1 text-green-600">₹{totals.salesTotal.toFixed(2)}</h3>
            <div className="text-xs mt-2 flex items-center">
              <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              <span>Inflows</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Purchase Expenses</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-600">₹{totals.purchasesTotal.toFixed(2)}</h3>
            <div className="text-xs mt-2 flex items-center">
              <ArrowDownIcon className="h-3 w-3 text-blue-500 mr-1" />
              <span>Outflows</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`${totals.netCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Net Cash Flow</p>
            <h3 className={`text-2xl font-bold mt-1 ${totals.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(totals.netCashFlow).toFixed(2)}
            </h3>
            <div className="text-xs mt-2 flex items-center">
              {totals.netCashFlow >= 0 ? (
                <>
                  <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                  <span>Net Positive</span>
                </>
              ) : (
                <>
                  <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
                  <span>Net Negative</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table with Tabs */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
            Transactions for {format(new Date(selectedDate), 'dd MMM, yyyy')}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {(isLoadingSales || isLoadingPurchases) ? (
            <div className="space-y-3 print:hidden">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (isSalesError || isPurchasesError) ? (
            <Alert variant="destructive" className="print:hidden">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Failed to load transaction data. Please try again.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="print:hidden">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Transactions</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <Table>
                    <TableHeader>
                      <TableRow>
                       
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTransactions.length > 0 ? (
                        allTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                           
                            <TableCell className="font-medium">{transaction.documentNumber}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.transactionType === 'Sale' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {transaction.transactionType}
                              </span>
                            </TableCell>
                            <TableCell>{transaction.counterparty?.length >30?  transaction?.counterparty?.slice(0,15)+'...': transaction?.counterparty}</TableCell>
                            <TableCell className="text-right">₹{transaction.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {transaction.amountReceived > 0 ? `₹${transaction.amountReceived.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {transaction.amountPaid > 0 ? `₹${transaction.amountPaid.toFixed(2)}` : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                            No transactions found for this date
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="sales">
                  <Table>
                    <TableHeader>
                      <TableRow>
                       
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment Type</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleInvoices && saleInvoices?.length > 0 ? (
                        saleInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                          
                            <TableCell className="font-medium">{invoice.documentNumber}</TableCell>
                            <TableCell>{invoice.partyName}</TableCell>
                            <TableCell>{invoice.paymentType}</TableCell>
                            <TableCell className="text-right">₹{invoice.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{invoice.paidAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{invoice.balanceAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                            No sales found for this date
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="purchases">
                  <Table>
                    <TableHeader>
                      <TableRow>
            
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Payment Type</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseInvoices && purchaseInvoices?.length > 0 ? (
                        purchaseInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                           
                            <TableCell className="font-medium">{invoice.documentNumber}</TableCell>
                            <TableCell>{invoice.partyName}</TableCell>
                            <TableCell>{invoice.paymentType}</TableCell>
                            <TableCell className="text-right">₹{invoice.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{invoice.paidAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{invoice.balanceAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                            No purchases found for this date
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Printable section - always rendered but only visible when printing */}
          <div ref={printRef} className="hidden print:block">
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{companyName}</h2>
              <p className="text-sm">Phone no.: {companyPhone}</p>
              <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">Day Book</h3>
            </div>
            
            {/* Date */}
            <p className="mb-4">Date: {format(new Date(selectedDate), 'dd/MM/yyyy')}</p>
            
            {/* Sales Transactions Table */}
            <h3 className="text-md font-semibold mb-2">Sales Transactions</h3>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">TIME</th>
                  <th className="border border-gray-300 p-2 text-left">INVOICE NO.</th>
                  <th className="border border-gray-300 p-2 text-left">CUSTOMER</th>
                  <th className="border border-gray-300 p-2 text-left">PAYMENT TYPE</th>
                  <th className="border border-gray-300 p-2 text-left">TOTAL</th>
                  <th className="border border-gray-300 p-2 text-left">RECEIVED</th>
                  <th className="border border-gray-300 p-2 text-left">BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {!isLoadingSales && !isSalesError && saleInvoices?.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="border border-gray-300 p-2">
                      {invoice.documentTime ? 
                        format(new Date(`${invoice.documentDate}T${invoice.documentTime}`), 'hh:mm a') : 
                        '-'}
                    </td>
                    <td className="border border-gray-300 p-2">{invoice.documentNumber}</td>
                    <td className="border border-gray-300 p-2">{invoice.partyName}</td>
                    <td className="border border-gray-300 p-2">{invoice.paymentType}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.total.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.paidAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.balanceAmount.toFixed(2)}</td>
                  </tr>
                ))}
                {(!saleInvoices || saleInvoices.length === 0) && (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 p-2 text-center">No sales found for this date</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={4} className="border border-gray-300 p-2 text-right font-semibold">Total Sales:</td>
                  <td className="border border-gray-300 p-2 font-semibold">₹ {totals.salesTotal.toFixed(2)}</td>
                  <td colSpan={2} className="border border-gray-300 p-2"></td>
                </tr>
              </tfoot>
            </table>
            
            {/* Purchase Transactions Table */}
            <h3 className="text-md font-semibold mb-2">Purchase Transactions</h3>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">TIME</th>
                  <th className="border border-gray-300 p-2 text-left">INVOICE NO.</th>
                  <th className="border border-gray-300 p-2 text-left">SUPPLIER</th>
                  <th className="border border-gray-300 p-2 text-left">PAYMENT TYPE</th>
                  <th className="border border-gray-300 p-2 text-left">TOTAL</th>
                  <th className="border border-gray-300 p-2 text-left">PAID</th>
                  <th className="border border-gray-300 p-2 text-left">BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {!isLoadingPurchases && !isPurchasesError && purchaseInvoices?.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="border border-gray-300 p-2">
                      {invoice.documentTime ? 
                        format(new Date(`${invoice.documentDate}T${invoice.documentTime}`), 'hh:mm a') : 
                        '-'}
                    </td>
                    <td className="border border-gray-300 p-2">{invoice.documentNumber}</td>
                    <td className="border border-gray-300 p-2">{invoice.partyName}</td>
                    <td className="border border-gray-300 p-2">{invoice.paymentType}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.total.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.paidAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.balanceAmount.toFixed(2)}</td>
                  </tr>
                ))}
                {(!purchaseInvoices || purchaseInvoices.length === 0) && (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 p-2 text-center">No purchases found for this date</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={4} className="border border-gray-300 p-2 text-right font-semibold">Total Purchases:</td>
                  <td className="border border-gray-300 p-2 font-semibold">₹ {totals.purchasesTotal.toFixed(2)}</td>
                  <td colSpan={2} className="border border-gray-300 p-2"></td>
                </tr>
              </tfoot>
            </table>
            
            {/* Day Summary */}
            <div className="border border-gray-300 p-4 bg-gray-50">
              <h3 className="text-md font-semibold mb-2 border-b pb-2">Day Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>Total Transactions: <strong>{totals.salesCount + totals.purchasesCount}</strong></p>
                  <p>Sales Transactions: <strong>{totals.salesCount}</strong></p>
                  <p>Purchase Transactions: <strong>{totals.purchasesCount}</strong></p>
                </div>
                <div>
                  <p>Total Sales: <strong>₹ {totals.salesTotal.toFixed(2)}</strong></p>
                  <p>Total Purchases: <strong>₹ {totals.purchasesTotal.toFixed(2)}</strong></p>
                  <p>Net Cash Flow: <strong className={totals.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹ {totals.netCashFlow.toFixed(2)}
                  </strong></p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default DayBookReport