'use client'

import React, { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useGetSaleInvoicesQuery } from '@/redux/api/documentApi'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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

const GSTR1Report = () => {
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
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch all sale invoices for the period
  const { 
    data: saleInvoices, 
    isLoading, 
    isError, 
    refetch 
  } = useGetSaleInvoicesQuery({ 
    startDate,
    endDate
  })

  // Filter invoices by GST type
  const gstInvoices = saleInvoices?.filter(invoice => {
    // Only include invoices that have GST
    const hasGst = invoice.items?.some(item => 
      item.taxType && 
      (item.taxType.includes('GST') || item.taxType.includes('IGST'))
    )
    return hasGst
  })

  // Calculate totals for summary
  const calculateTotals = () => {
    if (!gstInvoices) return { totalInvoices: 0, totalValue: 0, taxableValue: 0, totalTax: 0 }
    
    let totalValue = 0
    let taxableValue = 0
    let totalTax = 0
    
    gstInvoices.forEach(invoice => {
      totalValue += invoice.total
      
      invoice.items && invoice?.items.forEach(item => {
        const amount = parseFloat(item.amount.toString()) || 0
        const taxAmount = parseFloat(String(item.taxAmount)) || 0
        
        taxableValue += (amount - taxAmount)
        totalTax += taxAmount
      })
    })
    
    return {
      totalInvoices: gstInvoices.length,
      totalValue,
      taxableValue,
      totalTax
    }
  }

  const totals = calculateTotals()

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef:  printRef,
    documentTitle: 'GSTR-1 Report',
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
        <h1 className="text-2xl font-semibold">GSTR-1 Report</h1>
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
          <DownloadButton buttonText='Export XlSX'  data={gstInvoices|| []} fileName="gstr-1-report" />
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
              onClick={() => refetch()} 
              className="mb-2 gap-1 w-full md:w-auto"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <h3 className="text-2xl font-bold mt-1">{totals.totalInvoices}</h3>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-600">₹{totals.totalValue.toFixed(2)}</h3>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Taxable Value</p>
            <h3 className="text-2xl font-bold mt-1 text-green-600">₹{totals.taxableValue.toFixed(2)}</h3>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Tax</p>
            <h3 className="text-2xl font-bold mt-1 text-purple-600">₹{totals.totalTax.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* GST Invoices Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
            GST Sales Invoices
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
                Failed to load sales data. Please try again.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto print:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Customer</TableHead>
                  
                   
                    <TableHead className="text-right">Invoice Value</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">Tax Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gstInvoices && gstInvoices.length > 0 ? (
                    gstInvoices.map((invoice) => {
                      // Calculate taxable value and tax amounts for this invoice
                      let taxableValue = 0
                      let taxAmount = 0
                      
                     invoice.items && invoice?.items.forEach(item => {
                        const amount = parseFloat(item.amount.toString()) || 0
                        const itemTaxAmount = parseFloat(String(item.taxAmount)) || 0
                        
                        taxableValue += (amount - itemTaxAmount)
                        taxAmount += itemTaxAmount
                      })
                      
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.documentNumber}</TableCell>
                          <TableCell>{format(new Date(invoice.documentDate), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{invoice.partyName.length>20 ? invoice.partyName.slice(0,15)+'...': invoice.partyName}</TableCell>
                    
                          <TableCell className="text-right">₹{invoice.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{taxableValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{taxAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                        No GST invoices found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Printable report */}
          <div ref={printRef} className="hidden print:block">
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{companyName}</h2>
              <p className="text-sm">Phone no.: {companyPhone}</p>
              <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">GSTR-1 Report</h3>
            </div>
            
            {/* Period */}
            <p className="mb-4">Period: {format(new Date(startDate), 'dd/MM/yyyy')} to {format(new Date(endDate), 'dd/MM/yyyy')}</p>
            
            {/* Summary */}
            <div className="mb-6 border border-gray-300 p-4 bg-gray-50">
              <h4 className="text-base font-medium mb-3">Summary</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p><strong>Total Invoices:</strong> {totals.totalInvoices}</p>
                </div>
                <div>
                  <p><strong>Total Value:</strong> ₹{totals.totalValue.toFixed(2)}</p>
                </div>
                <div>
                  <p><strong>Taxable Value:</strong> ₹{totals.taxableValue.toFixed(2)}</p>
                </div>
                <div>
                  <p><strong>Total Tax:</strong> ₹{totals.totalTax.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            {/* GST Invoices Table */}
            <h4 className="text-base font-medium mb-2">GST Sales Invoices</h4>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">Invoice Number</th>
                  <th className="border border-gray-300 p-2 text-left">Invoice Date</th>
                  <th className="border border-gray-300 p-2 text-left">Customer</th>
                  <th className="border border-gray-300 p-2 text-left">GSTIN</th>
                  <th className="border border-gray-300 p-2 text-left">Place of Supply</th>
                  <th className="border border-gray-300 p-2 text-left">Invoice Value</th>
                  <th className="border border-gray-300 p-2 text-left">Taxable Value</th>
                  <th className="border border-gray-300 p-2 text-left">Tax Amount</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && !isError && gstInvoices && gstInvoices.length > 0 ? (
                  gstInvoices.map((invoice) => {
                    // Calculate taxable value and tax amounts for this invoice
                    let taxableValue = 0
                    let taxAmount = 0
                    
                   invoice.items && invoice.items.forEach(item => {
                      const amount = parseFloat(item.amount.toString()) || 0
                      const itemTaxAmount = parseFloat(String(item.taxAmount)) || 0
                      
                      taxableValue += (amount - itemTaxAmount)
                      taxAmount += itemTaxAmount
                    })
                    
                    return (
                      <tr key={invoice.id}>
                        <td className="border border-gray-300 p-2">{invoice.documentNumber}</td>
                        <td className="border border-gray-300 p-2">{format(new Date(invoice.documentDate), 'dd/MM/yyyy')}</td>
                        <td className="border border-gray-300 p-2">{invoice.partyName}</td>
                        <td className="border border-gray-300 p-2">{invoice.partyId || '-'}</td>
                        <td className="border border-gray-300 p-2">{invoice.stateOfSupply || '-'}</td>
                        <td className="border border-gray-300 p-2">₹{invoice.total.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">₹{taxableValue.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">₹{taxAmount.toFixed(2)}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 p-2 text-center">No GST invoices found</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={5} className="border border-gray-300 p-2 text-right font-semibold">Total:</td>
                  <td className="border border-gray-300 p-2 font-semibold">₹{totals.totalValue.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 font-semibold">₹{totals.taxableValue.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 font-semibold">₹{totals.totalTax.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
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
        }
      `}</style>
    </div>
  )
}

export default GSTR1Report