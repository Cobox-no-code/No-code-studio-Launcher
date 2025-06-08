'use client'

import React, { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useGetSaleInvoicesQuery } from '@/redux/api/documentApi'
import { useGetPurchaseInvoicesQuery } from '@/redux/api/documentApi'
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
  CalendarIcon,
  RefreshCw as RefreshCwIcon,
  FileSpreadsheet
} from 'lucide-react'
import { DownloadButton } from '../Xl'

const GSTRateReport = () => {
  // State for report period
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  const [startDate, setStartDate] = useState<string>(
    firstDayOfMonth.toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    lastDayOfMonth.toISOString().split('T')[0]
  )
  const [activeTab, setActiveTab] = useState<string>("sales")
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch all sale invoices for the period
  const { 
    data: saleInvoices, 
    isLoading: isLoadingSales, 
    isError: isSalesError,
    refetch: refetchSales
  } = useGetSaleInvoicesQuery({ 
    startDate,
    endDate
  })

  // Fetch all purchase invoices for the period
  const { 
    data: purchaseInvoices, 
    isLoading: isLoadingPurchases, 
    isError: isPurchasesError,
    refetch: refetchPurchases
  } = useGetPurchaseInvoicesQuery({ 
    startDate,
    endDate
  })

  const isLoading = isLoadingSales || isLoadingPurchases
  const isError = isSalesError || isPurchasesError

  // Refetch both sales and purchases
  const refetchAll = () => {
    refetchSales()
    refetchPurchases()
  }

  // Process tax data by rate for sales
  const processSalesTaxByRate = () => {
    if (!saleInvoices) return []
    
    const rateData = new Map()
    
    saleInvoices.forEach(invoice => {
      invoice.items && invoice.items.forEach(item => {
        // Extract tax type and rate
        const taxType = item.taxType || ''
        let rate = 0
        let isIGST = false
        
        // Extract rate from tax type
        const rateMatch = taxType.match(/(\d+)%/)
        if (rateMatch && rateMatch[1]) {
          rate = parseInt(rateMatch[1])
        }
        
        // Determine if it's IGST or CGST/SGST
        isIGST = taxType.includes('IGST')
        
        // Create key for the rate map
        const key = `${rate}-${isIGST ? 'IGST' : 'GST'}`
        
        if (!rateData.has(key)) {
          rateData.set(key, {
            rate,
            taxType: isIGST ? 'IGST' : 'GST',
            taxableValue: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            totalTax: 0,
            totalValue: 0,
            transactions: 0
          })
        }
        
        const data = rateData.get(key)
        const amount = parseFloat(item.amount?.toString() || '0') || 0
        const taxAmount = parseFloat(item.taxAmount?.toString() || '0') || 0
        const taxableValue = amount - taxAmount
        
        data.taxableValue += taxableValue
        data.totalValue += amount
        data.transactions += 1
        
        if (isIGST) {
          data.igst += taxAmount
        } else {
          // Split between CGST and SGST
          data.cgst += taxAmount / 2
          data.sgst += taxAmount / 2
        }
        
        data.totalTax += taxAmount
        rateData.set(key, data)
      })
    })
    
    return Array.from(rateData.values()).sort((a, b) => b.rate - a.rate)
  }

  // Process tax data by rate for purchases
  const processPurchasesTaxByRate = () => {
    if (!purchaseInvoices) return []
    
    const rateData = new Map()
    
    purchaseInvoices.forEach(invoice => {
      invoice.items && invoice.items.forEach(item => {
        // Extract tax type and rate
        const taxType = item.taxType || ''
        let rate = 0
        let isIGST = false
        
        // Extract rate from tax type
        const rateMatch = taxType.match(/(\d+)%/)
        if (rateMatch && rateMatch[1]) {
          rate = parseInt(rateMatch[1])
        }
        
        // Determine if it's IGST or CGST/SGST
        isIGST = taxType.includes('IGST')
        
        // Create key for the rate map
        const key = `${rate}-${isIGST ? 'IGST' : 'GST'}`
        
        if (!rateData.has(key)) {
          rateData.set(key, {
            rate,
            taxType: isIGST ? 'IGST' : 'GST',
            taxableValue: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            totalTax: 0,
            totalValue: 0,
            transactions: 0
          })
        }
        
        const data = rateData.get(key)
        const amount = parseFloat(item.amount?.toString() || '0') || 0
        const taxAmount = parseFloat(item.taxAmount?.toString() || '0') || 0
        const taxableValue = amount - taxAmount
        
        data.taxableValue += taxableValue
        data.totalValue += amount
        data.transactions += 1
        
        if (isIGST) {
          data.igst += taxAmount
        } else {
          // Split between CGST and SGST
          data.cgst += taxAmount / 2
          data.sgst += taxAmount / 2
        }
        
        data.totalTax += taxAmount
        rateData.set(key, data)
      })
    })
    
    return Array.from(rateData.values()).sort((a, b) => b.rate - a.rate)
  }

  const salesTaxByRate = processSalesTaxByRate()
  const purchasesTaxByRate = processPurchasesTaxByRate()

  // Calculate totals
  const calculateTotals = (data:any) => {
    return data.reduce((acc:any, item:any) => {
      acc.taxableValue += item.taxableValue
      acc.igst += item.igst
      acc.cgst += item.cgst
      acc.sgst += item.sgst
      acc.totalTax += item.totalTax
      acc.totalValue += item.totalValue
      acc.transactions += item.transactions
      return acc
    }, {
      taxableValue: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      totalTax: 0,
      totalValue: 0,
      transactions: 0
    })
  }

  const salesTotals = calculateTotals(salesTaxByRate)
  const purchasesTotals = calculateTotals(purchasesTaxByRate)

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'GST Rate Report',
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 15mm 10mm;
      }
    `,
  
    onAfterPrint: () => console.log('Print completed')
  })

  // Get the company name and phone from localStorage if available
  const companyName = typeof window !== 'undefined' ? localStorage.getItem('firmName') || 'My Company' : 'My Company'
  const companyPhone = typeof window !== 'undefined' ? localStorage.getItem('firmPhone') || '9752133459' : '9752133459'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">GST Rate Report</h1>
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
          <DownloadButton buttonText='Export Sale XlSX'  data={ salesTaxByRate|| []} fileName="sale-rate-report" />
          <DownloadButton buttonText='Export Purchase XlSX'  data={ purchasesTaxByRate|| []} fileName="purchase-rate-report" />
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
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2 flex-grow">
              <Label htmlFor="startDate">From Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2 flex-grow">
              <Label htmlFor="endDate">To Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Button 
              onClick={refetchAll} 
              className="mb-2 gap-1 w-full md:w-auto"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GST Rate Data Table with Tabs */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
            GST Rate Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 print:hidden">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="print:hidden">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Failed to load tax data. Please try again.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="print:hidden">
              <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="sales">Sales GST Rates</TabsTrigger>
                  <TabsTrigger value="purchases">Purchase GST Rates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sales">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rate %</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">IGST</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">Total Tax</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesTaxByRate.length > 0 ? (
                        salesTaxByRate.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.rate}%</TableCell>
                            <TableCell>{item.taxType}</TableCell>
                            <TableCell className="text-right">₹{item.taxableValue.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.igst.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.cgst.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.sgst.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.totalTax.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.totalValue.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{item.transactions}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                            No GST sales data found for the selected period
                          </TableCell>
                        </TableRow>
                      )}
                      {salesTaxByRate.length > 0 && (
                        <TableRow className="bg-gray-50 font-medium">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">₹{salesTotals.taxableValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{salesTotals.igst.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{salesTotals.cgst.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{salesTotals.sgst.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{salesTotals.totalTax.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{salesTotals.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{salesTotals.transactions}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="purchases">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rate %</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">IGST</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">Total Tax</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchasesTaxByRate.length > 0 ? (
                        purchasesTaxByRate.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.rate}%</TableCell>
                            <TableCell>{item.taxType}</TableCell>
                            <TableCell className="text-right">₹{item.taxableValue.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.igst.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.cgst.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.sgst.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.totalTax.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.totalValue.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{item.transactions}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                            No GST purchase data found for the selected period
                          </TableCell>
                        </TableRow>
                      )}
                      {purchasesTaxByRate.length > 0 && (
                        <TableRow className="bg-gray-50 font-medium">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">₹{purchasesTotals.taxableValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{purchasesTotals.igst.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{purchasesTotals.cgst.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{purchasesTotals.sgst.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{purchasesTotals.totalTax.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{purchasesTotals.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{purchasesTotals.transactions}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Printable report */}
          <div ref={printRef} className="hidden print:block">
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{companyName}</h2>
              <p className="text-sm">Phone no.: {companyPhone}</p>
              <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">GST Rate Report</h3>
            </div>
            
            {/* Period */}
            <p className="mb-4">Period: {format(new Date(startDate), 'dd/MM/yyyy')} to {format(new Date(endDate), 'dd/MM/yyyy')}</p>
            
            {/* Sales GST Rates */}
            <h4 className="text-base font-medium mb-3">Sales GST Rates</h4>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">Rate %</th>
                  <th className="border border-gray-300 p-2 text-left">Type</th>
                  <th className="border border-gray-300 p-2 text-left">Taxable Value</th>
                  <th className="border border-gray-300 p-2 text-left">IGST</th>
                  <th className="border border-gray-300 p-2 text-left">CGST</th>
                  <th className="border border-gray-300 p-2 text-left">SGST</th>
                  <th className="border border-gray-300 p-2 text-left">Total Tax</th>
                  <th className="border border-gray-300 p-2 text-left">Total Value</th>
                  <th className="border border-gray-300 p-2 text-left">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && !isError && salesTaxByRate.length > 0 ? (
                  salesTaxByRate.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{item.rate}%</td>
                      <td className="border border-gray-300 p-2">{item.taxType}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.taxableValue.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.igst.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.cgst.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.sgst.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.totalTax.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.totalValue.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.transactions}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 p-2 text-center">No GST sales data found</td>
                  </tr>
                )}
                {salesTaxByRate.length > 0 && (
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={2} className="border border-gray-300 p-2">Total</td>
                    <td className="border border-gray-300 p-2 text-right">₹{salesTotals.taxableValue.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{salesTotals.igst.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{salesTotals.cgst.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{salesTotals.sgst.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{salesTotals.totalTax.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{salesTotals.totalValue.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-center">{salesTotals.transactions}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Purchase GST Rates */}
            <h4 className="text-base font-medium mb-3 mt-8">Purchase GST Rates</h4>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">Rate %</th>
                  <th className="border border-gray-300 p-2 text-left">Type</th>
                  <th className="border border-gray-300 p-2 text-left">Taxable Value</th>
                  <th className="border border-gray-300 p-2 text-left">IGST</th>
                  <th className="border border-gray-300 p-2 text-left">CGST</th>
                  <th className="border border-gray-300 p-2 text-left">SGST</th>
                  <th className="border border-gray-300 p-2 text-left">Total Tax</th>
                  <th className="border border-gray-300 p-2 text-left">Total Value</th>
                  <th className="border border-gray-300 p-2 text-left">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && !isError && purchasesTaxByRate.length > 0 ? (
                  purchasesTaxByRate.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{item.rate}%</td>
                      <td className="border border-gray-300 p-2">{item.taxType}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.taxableValue.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.igst.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.cgst.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.sgst.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.totalTax.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.totalValue.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.transactions}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 p-2 text-center">No GST purchase data found</td>
                  </tr>
                )}
                {purchasesTaxByRate.length > 0 && (
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={2} className="border border-gray-300 p-2">Total</td>
                    <td className="border border-gray-300 p-2 text-right">₹{purchasesTotals.taxableValue.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{purchasesTotals.igst.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{purchasesTotals.cgst.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{purchasesTotals.sgst.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{purchasesTotals.totalTax.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{purchasesTotals.totalValue.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-center">{purchasesTotals.transactions}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Note */}
            <div className="mt-6 p-3 border border-gray-300 bg-gray-50 text-sm">
              <p><strong>Note:</strong> This report shows the breakdown of GST by tax rates. For intra-state transactions, 
              tax is split into CGST and SGST (each at half of the total rate). For inter-state transactions, 
              tax is applied as IGST (at the full rate). The transaction count represents the number of invoice line items 
              with the respective tax rate.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
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
          td, th {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}

export default GSTRateReport