'use client'

import React, { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useGetSaleInvoicesQuery } from '@/redux/api/documentApi'
import { useGetPurchaseInvoicesQuery } from '@/redux/api/documentApi'
import { useGetPartiesQuery } from '@/redux/api/partiesApi'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Download as DownloadIcon,
  FileText as FileTextIcon,
  Printer as PrinterIcon,
  AlertCircle as AlertCircleIcon,
  User as UserIcon,
  Search as SearchIcon,
  RefreshCw as RefreshCwIcon,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PartyStatementReport = () => {
  // State for party filter
  const [selectedPartyId, setSelectedPartyId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch parties for dropdown
  const { data: parties, isLoading: isLoadingParties } = useGetPartiesQuery({ search: searchTerm })

  // Fetch sale invoices for the selected party
  const { 
    data: saleInvoices, 
    isLoading: isLoadingSales, 
    isError: isSalesError,
    refetch: refetchSales
  } = useGetSaleInvoicesQuery({ 
    partyId: selectedPartyId || undefined
  }, { skip: !selectedPartyId })

  // Fetch purchase invoices for the selected party
  const { 
    data: purchaseInvoices, 
    isLoading: isLoadingPurchases, 
    isError: isPurchasesError,
    refetch: refetchPurchases 
  } = useGetPurchaseInvoicesQuery({ 
    partyId: selectedPartyId || undefined
  }, { skip: !selectedPartyId })

  // Get selected party details
  const selectedParty = parties?.find(party => party.id === selectedPartyId)

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Party Statement - ${selectedParty?.name || 'Unknown Party'}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm 10mm;
      }
    `,

    onAfterPrint: () => console.log('Print completed')
  })

  // Calculate summary
  const calculateSummary = () => {
    const salesTotal = saleInvoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0
    const salesReceived = saleInvoices?.reduce((sum, invoice) => sum + invoice.paidAmount, 0) || 0
    const salesDue = saleInvoices?.reduce((sum, invoice) => sum + invoice.balanceAmount, 0) || 0
    
    const purchasesTotal = purchaseInvoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0
    const purchasesPaid = purchaseInvoices?.reduce((sum, invoice) => sum + invoice.paidAmount, 0) || 0
    const purchasesDue = purchaseInvoices?.reduce((sum, invoice) => sum + invoice.balanceAmount, 0) || 0
    
    return {
      salesCount: saleInvoices?.length || 0,
      purchasesCount: purchaseInvoices?.length || 0,
      salesTotal,
      salesReceived,
      salesDue,
      purchasesTotal,
      purchasesPaid,
      purchasesDue,
      netBalance: salesDue - purchasesDue // Positive means customer owes money, negative means we owe money
    }
  }

  const summary = calculateSummary()

  // Combine and sort transactions for "All" tab
  const allTransactions = [...(saleInvoices || []), ...(purchaseInvoices || [])]
    .map(invoice => {
      const isSale = 'receivedAmount' in invoice
      return {
        ...invoice,
        transactionType: isSale ? 'Sale' : 'Purchase',
        amountReceived: isSale ? (invoice as any).receivedAmount : 0,
        amountPaid: !isSale ? (invoice as any).paidAmount : 0,
        balanceAmount: invoice.balanceAmount
      }
    })
    .sort((a, b) => {
      // Sort by date, newest first
      return new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
    })

  const refreshAllData = () => {
    if (selectedPartyId) {
      refetchSales()
      refetchPurchases()
    }
  }

  // Get the company name and phone from localStorage if available
  const companyName = typeof window !== 'undefined' ? localStorage.getItem('firmName') || 'My Company' : 'My Company'
  const companyPhone = typeof window !== 'undefined' ? localStorage.getItem('firmPhone') || '9752133459' : '9752133459'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Party Statement</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={()=>handlePrint()}
            className="flex items-center gap-1"
            disabled={!selectedPartyId}
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={()=>handlePrint()}
            disabled={!selectedPartyId}
          >
            <DownloadIcon className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Party Selection Filter */}
      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center">
            <UserIcon className="h-4 w-4 mr-2 text-primary" />
            Select Party
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2 w-full md:w-3/4">
              <Label htmlFor="partySearch">Search Party</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="partySearch"
                  placeholder="Search by name or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2 w-full md:w-3/4">
              <Label htmlFor="partySelect">Select Party</Label>
              <Select 
                value={selectedPartyId} 
                onValueChange={setSelectedPartyId}
              >
                <SelectTrigger id="partySelect" className="w-full">
                  <SelectValue placeholder="Select a party" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingParties ? (
                    <div className="p-2 text-center">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : parties && parties.length > 0 ? (
                    parties.map(party => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name} {party.phone ? `(${party.phone})` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-gray-500">No parties found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={refreshAllData} 
              className="h-10 gap-1 w-full md:w-auto"
              disabled={!selectedPartyId}
            >
              <RefreshCwIcon className="h-4 w-4" />
              Load Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Party Details */}
      {selectedParty && (
        <Card className="bg-primary/5 border-primary/20 print:hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Party Details</h3>
                <p className="text-lg font-semibold">{selectedParty.name}</p>
                {selectedParty.phone && (
                  <p className="text-sm text-gray-600">Phone: {selectedParty.phone}</p>
                )}
                {selectedParty.email && (
                  <p className="text-sm text-gray-600">Email: {selectedParty.email}</p>
                )}
                {selectedParty.gstNumber && (
                  <p className="text-sm text-gray-600">GST: {selectedParty.gstNumber}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                {selectedParty.billingAddress ? (
                  <p className="text-sm whitespace-pre-line">{selectedParty.billingAddress}</p>
                ) : (
                  <p className="text-sm text-gray-500">No address available</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Balance Summary</h3>
                {summary.netBalance > 0 ? (
                  <p className="text-sm text-red-600">
                    Party owes: ₹{summary.netBalance.toFixed(2)}
                  </p>
                ) : summary.netBalance < 0 ? (
                  <p className="text-sm text-green-600">
                    We owe: ₹{Math.abs(summary.netBalance).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">No pending balance</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {selectedParty && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <h3 className="text-xl font-bold mt-1 text-green-600">₹{summary.salesTotal.toFixed(2)}</h3>
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-gray-600">Received: ₹{summary.salesReceived.toFixed(2)}</p>
                    <p className="text-red-500">Due: ₹{summary.salesDue.toFixed(2)}</p>
                  </div>
                </div>
                <ArrowUpCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <h3 className="text-xl font-bold mt-1 text-blue-600">₹{summary.purchasesTotal.toFixed(2)}</h3>
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-gray-600">Paid: ₹{summary.purchasesPaid.toFixed(2)}</p>
                    <p className="text-amber-500">Due: ₹{summary.purchasesDue.toFixed(2)}</p>
                  </div>
                </div>
                <ArrowDownCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${summary.netBalance >= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Net Balance</p>
                  <h3 className="text-xl font-bold mt-1">₹{Math.abs(summary.netBalance).toFixed(2)}</h3>
                  <div className="text-xs mt-2">
                    {summary.netBalance > 0 ? (
                      <p className="text-red-600">Party owes us</p>
                    ) : summary.netBalance < 0 ? (
                      <p className="text-green-600">We owe party</p>
                    ) : (
                      <p className="text-gray-600">No pending balance</p>
                    )}
                  </div>
                </div>
                {summary.netBalance >= 0 ? (
                  <ArrowUpCircle className="h-8 w-8 text-red-500" />
                ) : (
                  <ArrowDownCircle className="h-8 w-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table with Tabs */}
      {selectedParty && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="pb-3 print:hidden">
            <CardTitle className="text-md flex items-center">
              <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
              Transaction History
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
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Received/Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransactions.length > 0 ? (
                          allTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {format(new Date(transaction.documentDate), 'dd/MM/yyyy')}
                              </TableCell>
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
                              <TableCell className="text-right">₹{transaction.total.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                {transaction.transactionType === 'Sale' 
                                  ? `₹${transaction.amountReceived.toFixed(2)}` 
                                  : `₹${transaction.amountPaid.toFixed(2)}`
                                }
                              </TableCell>
                              <TableCell className="text-right">₹{transaction.balanceAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                              No transactions found for this party
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
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Payment Type</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Received</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        { saleInvoices && saleInvoices?.length > 0 ? (
                          saleInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                {format(new Date(invoice.documentDate), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell className="font-medium">{invoice.documentNumber}</TableCell>
                              <TableCell>{invoice.paymentType}</TableCell>
                              <TableCell className="text-right">₹{invoice.total.toFixed(2)}</TableCell>
                              <TableCell className="text-right">₹{invoice.paidAmount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">₹{invoice.balanceAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                              No sales found for this party
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
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice #</TableHead>
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
                              <TableCell>
                                {format(new Date(invoice.documentDate), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell className="font-medium">{invoice.documentNumber}</TableCell>
                              <TableCell>{invoice.paymentType}</TableCell>
                              <TableCell className="text-right">₹{invoice.total.toFixed(2)}</TableCell>
                              <TableCell className="text-right">₹{invoice.paidAmount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">₹{invoice.balanceAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                              No purchases found for this party
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
            {selectedParty && (
              <div ref={printRef} className="hidden print:block">
                {/* Header */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">{companyName}</h2>
                  <p className="text-sm">Phone no.: {companyPhone}</p>
                  <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">Party Statement</h3>
                </div>
                
                {/* Party Information */}
                <div className="mb-6 grid grid-cols-2">
                  <div>
                    <h4 className="font-medium">Party Details:</h4>
                    <p><strong>Name:</strong> {selectedParty.name}</p>
                    {selectedParty.phone && <p><strong>Phone:</strong> {selectedParty.phone}</p>}
                    {selectedParty.email && <p><strong>Email:</strong> {selectedParty.email}</p>}
                    {selectedParty.gstNumber && <p><strong>GST:</strong> {selectedParty.gstNumber}</p>}
                  </div>
                  <div>
                    <h4 className="font-medium">Address:</h4>
                    <p className="whitespace-pre-line">{selectedParty.billingAddress || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Transactions */}
                <h4 className="font-medium border-b mb-2">Transaction History</h4>
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 p-2 text-left">DATE</th>
                      <th className="border border-gray-300 p-2 text-left">INVOICE NO.</th>
                      <th className="border border-gray-300 p-2 text-left">TYPE</th>
                      <th className="border border-gray-300 p-2 text-left">PAYMENT MODE</th>
                      <th className="border border-gray-300 p-2 text-left">AMOUNT</th>
                      <th className="border border-gray-300 p-2 text-left">RECEIVED/PAID</th>
                      <th className="border border-gray-300 p-2 text-left">BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.length > 0 ? (
                      allTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="border border-gray-300 p-2">
                            {format(new Date(transaction.documentDate), 'dd/MM/yyyy')}
                          </td>
                          <td className="border border-gray-300 p-2">{transaction.documentNumber}</td>
                          <td className="border border-gray-300 p-2">{transaction.transactionType}</td>
                          <td className="border border-gray-300 p-2">{transaction.paymentType}</td>
                          <td className="border border-gray-300 p-2">₹ {transaction.total.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2">
                            ₹ {transaction.transactionType === 'Sale' 
                              ? transaction.amountReceived.toFixed(2) 
                              : transaction.amountPaid.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 p-2">₹ {transaction.balanceAmount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="border border-gray-300 p-2 text-center">No transactions found for this party</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Summary */}
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <h3 className="text-md font-semibold mb-3 border-b pb-2">Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Total Sales:</strong> ₹ {summary.salesTotal.toFixed(2)}</p>
                      <p><strong>Received Amount:</strong> ₹ {summary.salesReceived.toFixed(2)}</p>
                      <p><strong>Sales Balance:</strong> ₹ {summary.salesDue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p><strong>Total Purchases:</strong> ₹ {summary.purchasesTotal.toFixed(2)}</p>
                      <p><strong>Paid Amount:</strong> ₹ {summary.purchasesPaid.toFixed(2)}</p>
                      <p><strong>Purchase Balance:</strong> ₹ {summary.purchasesDue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-300">
                    <p className="font-bold text-lg">
                      Net Balance: ₹ {Math.abs(summary.netBalance).toFixed(2)} 
                      {summary.netBalance > 0 
                        ? " (Party owes us)" 
                        : summary.netBalance < 0 
                          ? " (We owe party)" 
                          : " (No pending balance)"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No party selected message */}
      {!selectedPartyId && !isLoadingParties && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <UserIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <h3 className="text-lg font-medium mb-1">No Party Selected</h3>
            <p>Please select a party from the dropdown above to view their statement.</p>
          </CardContent>
        </Card>
      )}

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

export default PartyStatementReport