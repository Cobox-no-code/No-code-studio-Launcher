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
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'
import { DownloadButton } from '../Xl'

const GSTReport = () => {
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
  const [activeTab, setActiveTab] = useState<string>("summary")
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

  // Filter and process data to get GST information
  const processTaxData = () => {
    const partyTaxMap = new Map()
    
    // Process Sale Invoices - Tax In
    if (saleInvoices && saleInvoices.length > 0) {
      saleInvoices.forEach(invoice => {
        const partyId = invoice.partyId || invoice.partyName
        const partyName = invoice.partyName
        
        if (!partyTaxMap.has(partyId)) {
          partyTaxMap.set(partyId, {
            partyId,
            partyName,
            taxIn: 0,
            taxOut: 0,
            saleTotal: 0,
            purchaseTotal: 0
          })
        }
        
        const partyData = partyTaxMap.get(partyId)
        
        // Calculate tax from items
        let invoiceTaxTotal = 0
        invoice.items && invoice.items.forEach(item => {
          const taxAmount = parseFloat(item.taxAmount?.toString() || '0') || 0
          invoiceTaxTotal += taxAmount
        })
        
        partyData.taxIn += invoiceTaxTotal
        partyData.saleTotal += invoice.total
        partyTaxMap.set(partyId, partyData)
      })
    }
    
    // Process Purchase Invoices - Tax Out
    if (purchaseInvoices && purchaseInvoices.length > 0) {
      purchaseInvoices.forEach(invoice => {
        const partyId = invoice.partyId || invoice.partyName
        const partyName = invoice.partyName
        
        if (!partyTaxMap.has(partyId)) {
          partyTaxMap.set(partyId, {
            partyId,
            partyName,
            taxIn: 0,
            taxOut: 0,
            saleTotal: 0,
            purchaseTotal: 0
          })
        }
        
        const partyData = partyTaxMap.get(partyId)
        
        // Calculate tax from items
        let invoiceTaxTotal = 0
        invoice.items && invoice.items.forEach(item => {
          const taxAmount = parseFloat(item.taxAmount?.toString() || '0') || 0
          invoiceTaxTotal += taxAmount
        })
        
        partyData.taxOut += invoiceTaxTotal
        partyData.purchaseTotal += invoice.total
        partyTaxMap.set(partyId, partyData)
      })
    }
    
    return Array.from(partyTaxMap.values())
  }

  const taxData = processTaxData()

  // Calculate summary totals
  const calculateSummary = () => {
    let totalTaxIn = 0
    let totalTaxOut = 0
    let totalSales = 0
    let totalPurchases = 0
    
    taxData.forEach(item => {
      totalTaxIn += item.taxIn
      totalTaxOut += item.taxOut
      totalSales += item.saleTotal
      totalPurchases += item.purchaseTotal
    })
    
    return {
      totalTaxIn,
      totalTaxOut,
      netTax: totalTaxIn - totalTaxOut,
      totalSales,
      totalPurchases
    }
  }

  const summary = calculateSummary()

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'GST Report',
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm 10mm;
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
        <h1 className="text-2xl font-semibold">GST Report</h1>
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
          <DownloadButton buttonText='Export XlSX'  data={ taxData|| []} fileName="gst-report" />
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

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Output Tax (Sales)</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600">₹{summary.totalTaxIn.toFixed(2)}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Total Sales: ₹{summary.totalSales.toFixed(2)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Input Tax (Purchases)</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-600">₹{summary.totalTaxOut.toFixed(2)}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Total Purchases: ₹{summary.totalPurchases.toFixed(2)}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={summary.netTax >= 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">
                  {summary.netTax >= 0 ? "Net Tax Payable" : "Tax Credit Balance"}
                </p>
                <h3 className={`text-2xl font-bold mt-1 ${
                  summary.netTax >= 0 ? "text-red-600" : "text-green-600"
                }`}>
                  ₹{Math.abs(summary.netTax).toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.netTax >= 0 
                    ? "Output Tax > Input Tax" 
                    : "Input Tax > Output Tax"}
                </p>
              </div>
              {summary.netTax >= 0 
                ? <ArrowUpRight className="h-8 w-8 text-red-500" />
                : <ArrowDownLeft className="h-8 w-8 text-green-500" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Data Table with Tabs */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
            GST Tax Details
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
              <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="partywise">Party-wise Tax</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Total Taxable Sales</TableCell>
                        <TableCell className="text-right">{(summary.totalSales - summary.totalTaxIn).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Output Tax (on Sales)</TableCell>
                        <TableCell className="text-right text-green-600">{summary.totalTaxIn.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Taxable Purchases</TableCell>
                        <TableCell className="text-right">{(summary.totalPurchases - summary.totalTaxOut).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Input Tax (on Purchases)</TableCell>
                        <TableCell className="text-right text-blue-600">{summary.totalTaxOut.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-gray-50">
                        <TableCell className="font-bold">
                          {summary.netTax >= 0 ? "Net Tax Payable" : "Tax Credit Balance"}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${
                          summary.netTax >= 0 ? "text-red-600" : "text-green-600"
                        }`}>
                          {Math.abs(summary.netTax).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="partywise">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Party Name</TableHead>
                        <TableHead className="text-right">Sales Amount</TableHead>
                        <TableHead className="text-right">Output Tax (Sales)</TableHead>
                        <TableHead className="text-right">Purchase Amount</TableHead>
                        <TableHead className="text-right">Input Tax (Purchases)</TableHead>
                        <TableHead className="text-right">Net Tax Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxData.length > 0 ? (
                        taxData.sort((a, b) => b.taxIn + b.taxOut - (a.taxIn + a.taxOut))
                          .map((party, index) => {
                          const netTax = party.taxIn - party.taxOut
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{party.partyName}</TableCell>
                              <TableCell className="text-right">{party.saleTotal.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-green-600">{party.taxIn.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{party.purchaseTotal.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-blue-600">{party.taxOut.toFixed(2)}</TableCell>
                              <TableCell className={`text-right font-medium ${
                                netTax >= 0 ? "text-red-600" : "text-green-600"
                              }`}>
                                {Math.abs(netTax).toFixed(2)}
                                {netTax >= 0 ? " (Payable)" : " (Credit)"}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            No tax data found for the selected period
                          </TableCell>
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
              <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">GST Report</h3>
            </div>
            
            {/* Period */}
            <p className="mb-4">Period: {format(new Date(startDate), 'dd/MM/yyyy')} to {format(new Date(endDate), 'dd/MM/yyyy')}</p>
            
            {/* Summary */}
            <div className="mb-6 border border-gray-300 p-4 bg-gray-50">
              <h4 className="text-base font-medium mb-3">GST Summary</h4>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td width="40%"><strong>Total Taxable Sales:</strong></td>
                    <td width="20%" className="text-right">₹{(summary.totalSales - summary.totalTaxIn).toFixed(2)}</td>
                    <td width="40%"></td>
                  </tr>
                  <tr>
                    <td><strong>Output Tax (on Sales):</strong></td>
                    <td className="text-right">₹{summary.totalTaxIn.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><strong>Total Taxable Purchases:</strong></td>
                    <td className="text-right">₹{(summary.totalPurchases - summary.totalTaxOut).toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><strong>Input Tax (on Purchases):</strong></td>
                    <td className="text-right">₹{summary.totalTaxOut.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="font-bold">
                    <td>{summary.netTax >= 0 ? "Net Tax Payable:" : "Tax Credit Balance:"}</td>
                    <td className="text-right">₹{Math.abs(summary.netTax).toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Party-wise Tax Data */}
            <h4 className="text-base font-medium mb-3">Party-wise Tax Details</h4>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">Party Name</th>
                  <th className="border border-gray-300 p-2 text-left">Sales Amount</th>
                  <th className="border border-gray-300 p-2 text-left">Output Tax (Sales)</th>
                  <th className="border border-gray-300 p-2 text-left">Purchase Amount</th>
                  <th className="border border-gray-300 p-2 text-left">Input Tax (Purchases)</th>
                  <th className="border border-gray-300 p-2 text-left">Net Tax Amount</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && !isError && taxData.length > 0 ? (
                  taxData.sort((a, b) => b.taxIn + b.taxOut - (a.taxIn + a.taxOut))
                    .map((party, index) => {
                    const netTax = party.taxIn - party.taxOut
                    return (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2">{party.partyName}</td>
                        <td className="border border-gray-300 p-2 text-right">₹{party.saleTotal.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right">₹{party.taxIn.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right">₹{party.purchaseTotal.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right">₹{party.taxOut.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right">
                          ₹{Math.abs(netTax).toFixed(2)}
                          {netTax >= 0 ? " (Payable)" : " (Credit)"}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 p-2 text-center">No tax data found for the selected period</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-2">Total</td>
                  <td className="border border-gray-300 p-2 text-right">₹{summary.totalSales.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right">₹{summary.totalTaxIn.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right">₹{summary.totalPurchases.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right">₹{summary.totalTaxOut.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    ₹{Math.abs(summary.netTax).toFixed(2)}
                    {summary.netTax >= 0 ? " (Payable)" : " (Credit)"}
                  </td>
                </tr>
              </tfoot>
            </table>
            
            {/* Note */}
            <div className="mt-6 p-3 border border-gray-300 bg-gray-50 text-sm">
              <p><strong>Note:</strong> This report shows the GST tax amounts collected from sales (Output Tax) and paid on purchases (Input Tax). 
              The difference between Output Tax and Input Tax is either payable to the government {`(if Input > Output)`} or 
              can be claimed as credit {`(if Input > Output)`} .</p>
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

export default GSTReport