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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DownloadIcon,
  FileTextIcon,
  PrinterIcon,
  SearchIcon,
  AlertCircleIcon,
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SalesReport = () => {
  // State for filters
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [saleType, setSaleType] = useState<string>('')
  const [customerId, setCustomerId] = useState<string>('')
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch sales invoices with filters
  const { 
    data: salesInvoices, 
    isLoading, 
    isError, 
    refetch 
  } = useGetSaleInvoicesQuery({ 
    startDate,
    endDate,
    partyId: customerId || undefined 
  })

  // Handle printing
  const handlePrint = useReactToPrint({
  contentRef : printRef,
    documentTitle: 'Sales Report',
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
    if (!salesInvoices) return { count: 0, total: 0, received: 0, balance: 0 }
    
    const total = salesInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const received = salesInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0)
    const balance = salesInvoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0)
    
    return {
      count: salesInvoices.length,
      total,
      received,
      balance
    }
  }

  const totals = calculateTotals()

  // Get the company name and phone from localStorage if available
  const companyName = typeof window !== 'undefined' ? localStorage.getItem('firmName') || 'My Company' : 'My Company'
  const companyPhone = typeof window !== 'undefined' ? localStorage.getItem('firmPhone') || '9752133459' : '9752133459'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Sales Report</h1>
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

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center">
            <FilterIcon className="h-4 w-4 mr-2 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="saleType">Sale Type</Label>
              <Select value={saleType} onValueChange={setSaleType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">All Types</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => refetch()} 
                className="w-full gap-1"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <h3 className="text-2xl font-bold mt-1">{totals.count}</h3>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <h3 className="text-2xl font-bold mt-1">₹{totals.total.toFixed(2)}</h3>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Received Amount</p>
            <h3 className="text-2xl font-bold mt-1 text-green-600">₹{totals.received.toFixed(2)}</h3>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Balance Amount</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-600">₹{totals.balance.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
            Sales Invoices
          </CardTitle>
        </CardHeader>
        
        {/* Content for both screen and print */}
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 print:hidden">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
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
            // This div is for the screen view
            <div className="overflow-x-auto print:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesInvoices?.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.documentNumber}</TableCell>
                      <TableCell>
                        {invoice.documentDate ? format(new Date(invoice.documentDate), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>{invoice.partyName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.transactionType === 'cash' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {invoice.transactionType.charAt(0).toUpperCase() + invoice.transactionType.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₹{invoice.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{invoice.paidAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        ₹{invoice.balanceAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Printable section - always rendered but only visible when printing */}
          <div ref={printRef} className="hidden print:block">
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{companyName}</h2>
              <p className="text-sm">Phone no.: {companyPhone}</p>
              <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">Sale Report</h3>
            </div>
            
            {/* Duration */}
            <p className="mb-4">Duration: From {format(new Date(startDate), 'dd/MM/yyyy')} to {format(new Date(endDate), 'dd/MM/yyyy')}</p>
            
            {/* Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">DATE</th>
                  <th className="border border-gray-300 p-2 text-left">INVOICE NO.</th>
                  <th className="border border-gray-300 p-2 text-left">PARTY NAME</th>
                  <th className="border border-gray-300 p-2 text-left">TRANSACTION TYPE</th>
                  <th className="border border-gray-300 p-2 text-left">TOTAL</th>
                  <th className="border border-gray-300 p-2 text-left">PAYMENT TYPE</th>
                  <th className="border border-gray-300 p-2 text-left">RECEIVED / PAID</th>
                  <th className="border border-gray-300 p-2 text-left">BALANCE DUE</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && !isError && salesInvoices?.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="border border-gray-300 p-2">{invoice.documentDate ? format(new Date(invoice.documentDate), 'dd/MM/yyyy') : '-'}</td>
                    <td className="border border-gray-300 p-2">{invoice.documentNumber}</td>
                    <td className="border border-gray-300 p-2">{invoice.partyName}</td>
                    <td className="border border-gray-300 p-2">Sale</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.total.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2">{invoice.paymentType.charAt(0).toUpperCase() + invoice.paymentType.slice(1)}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.paidAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2">₹ {invoice.balanceAmount.toFixed(2)}</td>
                  </tr>
                ))}
                {(!salesInvoices || salesInvoices.length === 0) && (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 p-2 text-center">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Footer */}
            <div className="text-right mt-4">
              <p className="font-semibold">Total Sale: ₹ {totals.total.toFixed(2)}</p>
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
        }
      `}</style>
    </div>
  )
}

export default SalesReport