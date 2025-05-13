'use client'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import { useAppDispatch } from '@/redux/hooks'
import DateRangeInput from '@/components/DateRangeInput'
import FloatingInput from '@/components/ui/floating-input'

// UI Components
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Icons
import {
  EllipsisVertical,
  AlertCircle,
  Plus,
  SlidersVertical,
  Search,
  Package2,
  ArrowUpDown,
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
  ShoppingCart,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Share,
  Equal,
  X,
  Receipt,
  Clock,
  Users,
  RefreshCcw,
  CreditCardIcon,
  ShoppingBag
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { openCreateForm } from '@/redux/slices/purchaseInoviceFormSlice'
import { useGetPurchaseInvoicesQuery, useDeletePurchaseInvoiceMutation } from '@/redux/api/purchaseApi'
import { useRouter } from 'next/navigation'
import InvoicePdfGenerator from '@/components/pdf/Regular'

// Helper to format currency
const formatCurrency = (amount: string | number | bigint) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numericAmount)
}


// Helper to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const PurchaseInvoicePage = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  // State management
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [filterInvoice, setFilterInvoice] = useState('')
  const [currentTab, setCurrentTab] = useState('all')
  const [selectedDates, setSelectedDates] = useState<{
    date1: string
    date2: string
  }>({
    date1: '',
    date2: '',
  })

  // Function to receive data from the date range component
  const handleDateChange = (date1: string, date2: string) => {
    setSelectedDates({ date1, date2 })
  }

  // Use RTK Query to fetch invoices with date filter
  const { 
    data: invoices, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetPurchaseInvoicesQuery({
    startDate: selectedDates.date1,
    endDate: selectedDates.date2
  })

  // Delete invoice mutation
  const [deleteInvoice, { isLoading: isDeleting }] = useDeletePurchaseInvoiceMutation()

  // Handle invoice selection
  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id)
  }

  // Open create form modal
  const openAddInvoiceForm = () => {
    router.push('/purchaseTab')
  }

  // Get the selected invoice details
  const selectedInvoice = selectedInvoiceId
    ? invoices?.find((invoice) => invoice.id === selectedInvoiceId)
    : null

  // Filter invoices based on search and tab
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = (
      (invoice.supplier?.toLowerCase() || '').includes(filterInvoice.toLowerCase()) ||
      (invoice.invoiceNumber?.toLowerCase() || '').includes(filterInvoice.toLowerCase())
    )

    if (currentTab === 'all') return matchesSearch
    if (currentTab === 'cash' && invoice.purchaseType === 'cash') return matchesSearch
    if (currentTab === 'credit' && invoice.purchaseType === 'credit') return matchesSearch
    if (currentTab === 'due' && invoice.balanceAmount > 0) return matchesSearch

    return false
  })

  // Invoice summary calculations
  const calculateTotals = () => {
    let total = 0
    let totalPaid = 0
    let totalUnpaid = 0

    invoices?.forEach(invoice => {
      total += invoice.total || 0
      totalPaid += invoice.paidAmount || 0
      totalUnpaid += invoice.balanceAmount || 0
    })

    return {
      totalAmount: total,
      totalPaid,
      totalUnpaid
    }
  }

  const totals = calculateTotals()

  // Delete invoice
  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice(id).unwrap()
      // If the deleted invoice was selected, clear selection
      if (id === selectedInvoiceId) {
        setSelectedInvoiceId(null)
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    }
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header with stats */}
      <section className="w-full flex justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col gap-2">
          {/* <DateRangeInput onDateChange={handleDateChange}   /> */}
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="h-24 w-36 rounded-xl flex flex-col gap-2 items-center justify-center bg-[#b9f3e7] font-semibold">
                <p>PAID</p>
                {formatCurrency(totals.totalPaid)}
              </span>
            </div>
            <Plus />
            <div>
              <span className="h-24 w-36 rounded-xl flex flex-col gap-2 items-center justify-center bg-[#cfe6fe] font-semibold">
                <p>UNPAID</p>
                {formatCurrency(totals.totalUnpaid)}
              </span>
            </div>
            <Equal />
            <div>
              <span className="h-24 w-36 rounded-xl flex flex-col gap-2 items-center justify-center bg-[#f8c888] font-semibold">
                <p>TOTAL</p>
                {formatCurrency(totals.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - Invoices List */}
        <Card className="w-full md:w-2/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Purchase Invoices</CardTitle>
              <Button onClick={openAddInvoiceForm}>
                <Plus className="h-4 w-4 mr-1" /> Add Purchase
              </Button>
            </div>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by supplier name or invoice number..."
                value={filterInvoice}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFilterInvoice(e.target.value)
                }
                className="pl-9 pr-9"
              />
              {filterInvoice && (
                <button
                  onClick={() => setFilterInvoice('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            <Tabs
              defaultValue="all"
              className="mt-2"
              onValueChange={(value) => setCurrentTab(value)}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="cash">Cash</TabsTrigger>
                <TabsTrigger value="credit">Credit</TabsTrigger>
                <TabsTrigger value="due">Due</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden">
            <div className="h-[calc(100vh-400px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Invoice Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-5 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {error?.toString() || 'Failed to load invoices'}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices?.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedInvoiceId === invoice.id ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleSelectInvoice(invoice.id)}
                      >
                        <TableCell className="pl-4">
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{invoice.supplier}</span>
                            {invoice.phone && (
                              <span className="text-xs text-muted-foreground">
                                {invoice.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={invoice.purchaseType === 'cash' ? 'outline' : 'secondary'}
                            className={invoice.purchaseType === 'cash' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          >
                            {invoice.purchaseType === 'cash' ? 'Cash' : 'Credit'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.balanceAmount > 0 ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              Due: {formatCurrency(invoice.balanceAmount)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Paid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right w-10">
                          <Popover>
                            <PopoverTrigger>
                              <EllipsisVertical className="h-4 w-4 text-gray-500" />
                            </PopoverTrigger>
                            <PopoverContent className="w-40">
                              <div className="flex flex-col space-y-1">
                                <Button 
                                  variant="ghost" 
                                  className="justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Implement print functionality
                                  }}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Implement share functionality
                                  }}
                                >
                                  <Share className="mr-2 h-4 w-4" />
                                  Share
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteInvoice(invoice.id)
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Invoice Details */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedInvoice ? (
                  <div className="flex items-center gap-2">
                    Invoice Details
                    <Badge
                      variant={selectedInvoice.purchaseType === 'cash' ? 'outline' : 'secondary'}
                      className={selectedInvoice.purchaseType === 'cash' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    >
                      {selectedInvoice.purchaseType === 'cash' ? 'Cash' : 'Credit'}
                    </Badge>
                  </div>
                ) : (
                  'Invoice Details'
                )}
              </CardTitle>
              {/* {selectedInvoice && (
                <InvoicePdfGenerator invoice={selectedInvoice}/>
              )} */}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedInvoice ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-2" />
                <p className="text-lg font-medium text-gray-500">
                  Select an invoice to view details
                </p>
                <p className="text-sm text-gray-400 max-w-md mt-1">
                  Click on any invoice from the list to view its detailed
                  information and items
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Invoice info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice Number</p>
                    <p className="text-sm font-medium">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{formatDate(selectedInvoice.invoiceDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="text-sm font-medium">{selectedInvoice.supplier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selectedInvoice.phone || '—'}</p>
                  </div>
               
                </div>

                {/* Payment details */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">Payment Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-semibold">{formatCurrency(selectedInvoice.total)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Type</p>
                        <p className="text-lg font-semibold capitalize">{selectedInvoice.paymentType}</p>
                      </div>
                      {selectedInvoice.paymentType === 'bank' && selectedInvoice.bankId && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground flex items-center">
                            <CreditCardIcon className="h-3 w-3 mr-1" />Bank Account
                          </p>
                          <p className="text-sm font-medium">{selectedInvoice.bankId}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Paid Amount</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Balance Due</p>
                        <p className={`text-lg font-semibold ${selectedInvoice.balanceAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(selectedInvoice.balanceAmount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items details */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Items ({selectedInvoice.items.length})
                  </h3>
                  <div className="max-h-64 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.item}</TableCell>
                            <TableCell className="text-right">{item.qty} {item.unit}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.pricePerUnit || 0)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Additional costs */}
                  <div className="pt-2 space-y-1 border-t">
                    {selectedInvoice.discount && parseFloat(selectedInvoice?.discount?.amount?.toString()) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span>-{formatCurrency(selectedInvoice.discount.amount)}</span>
                      </div>
                    )}
                    {selectedInvoice.tax && parseFloat(selectedInvoice.tax?.amount?.toString()) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>+{formatCurrency(selectedInvoice.tax.amount)}</span>
                      </div>
                    )}
                    {selectedInvoice.shipping && parseFloat(selectedInvoice.shipping.toString()) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>+{formatCurrency(selectedInvoice.shipping)}</span>
                      </div>
                    )}
                    {selectedInvoice.roundOff !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Round Off</span>
                        <span>{selectedInvoice.roundOff > 0 ? '+' : ''}{formatCurrency(selectedInvoice.roundOff)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Transportation details */}
                {(selectedInvoice.transportName || 
                  selectedInvoice.vehicleNumber || 
                  selectedInvoice.deliveryDate || 
                  selectedInvoice.deliveryLocation) && (
                  <Card className="border-0 shadow-none bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">Transportation Details</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {selectedInvoice.transportName && (
                          <div>
                            <p className="text-xs text-muted-foreground">Transport Name</p>
                            <p className="text-sm font-medium">{selectedInvoice.transportName}</p>
                          </div>
                        )}
                        {selectedInvoice.vehicleNumber && (
                          <div>
                            <p className="text-xs text-muted-foreground">Vehicle Number</p>
                            <p className="text-sm font-medium">{selectedInvoice.vehicleNumber}</p>
                          </div>
                        )}
                        {selectedInvoice.deliveryDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Delivery Date</p>
                            <p className="text-sm font-medium">{formatDate(selectedInvoice.deliveryDate)}</p>
                          </div>
                        )}
                        {selectedInvoice.deliveryLocation && (
                          <div>
                            <p className="text-xs text-muted-foreground">Delivery Location</p>
                            <p className="text-sm font-medium">{selectedInvoice.deliveryLocation}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PurchaseInvoicePage