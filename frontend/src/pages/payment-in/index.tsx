"use client";

import {
    openCreatePaymentInForm,
    openEditForm as openPaymentsEditForm,
} from "@/redux/slices/paymentSlice";

import { AppDispatch } from "@/redux/store";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// API Hooks
import { useGetPartiesQuery } from "@/redux/api/partiesApi";
import {
    useDeletePaymentMutation,
    useGetPaymentInsQuery,
} from "@/redux/api/paymentApi";

// Icons
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteActions } from "@/hooks/useDeleteAction";
import { PaymentType } from "@/models/document/document.model";
import {
    ArrowDownLeft,
    Banknote,
    Calendar,
    CreditCard,
    EllipsisVertical,
    FileText,
    Plus,
    Receipt,
    Users
} from "lucide-react";

// Utility function to format currency
const formatCurrency = (amount: number | null) => {
  if (amount === null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Utility function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const PaymentInPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  // State for filters
  const [searchInput, setSearchInput] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string | null>(
    null
  );
  const { deletePayment } = useDeleteActions();
  const [deletePaymentMutation] = useDeletePaymentMutation();
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Fetch payments
  const {
    data: payments = [],
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
    refetch,
  } = useGetPaymentInsQuery( selectedPartyId !="all"? {
    partyId: selectedPartyId || undefined,
    paymentType: paymentTypeFilter || undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
  }:{ });

  // Fetch parties for filter
  const { data: parties = [], isLoading: isLoadingParties } =
    useGetPartiesQuery({});

  // Calculate summary totals
  const totalReceived = payments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );
  const cashTotal = payments
    .filter((payment) => payment.paymentType === PaymentType.CASH)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const bankTotal = payments
    .filter((payment) => payment.paymentType === PaymentType.BANK)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const chequeTotal = payments
    .filter((payment) => payment.paymentType === PaymentType.CHEQUE)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Filter payments based on search input
  const filteredPayments = payments.filter(
    (payment) =>
      payment.partyName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchInput.toLowerCase()) ||
      payment.referenceNumber?.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Handle adding a new payment
  const handleAddPayment = () => {
    dispatch(openCreatePaymentInForm());
  };

  // Handle filter changes
  const handleClearFilters = () => {
    setSelectedPartyId(null);
    setPaymentTypeFilter(null);
    setDateRange({ startDate: "", endDate: "" });
  };

  useEffect(() => {
    // Immediately refetch data when component mounts
    refetch();

    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetch();
    }, 2000); // Adjust this time as needed

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-semibold">Payments Received</h1>
      </header>

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left panel - Filters and summary */}
        <Card className="w-1/3 max-w-md">
          <CardHeader className="px-4 ">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button
                size="sm"
                onClick={handleAddPayment}
                className=" bg-black"
              >
                <Plus className="w-4 h-4 mr-1" /> New Payment
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4  space-y-2">
            {/* Search filter */}

            {/* Party filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Customer/Party</Label>
              <Select
                value={selectedPartyId || ""}
                onValueChange={(value) => setSelectedPartyId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All parties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All parties</SelectItem>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment type filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Type</Label>
              <Select
                value={paymentTypeFilter || ""}
                onValueChange={(value) => setPaymentTypeFilter(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All payment types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">All payment types</SelectItem>
                  <SelectItem value={PaymentType.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentType.BANK}>
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value={PaymentType.CHEQUE}>Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Clear filters button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>

            {/* Summary cards */}
            <div className="pt-4 border-t mt-4">
              <h3 className="font-medium mb-3">Summary</h3>

              <div className="space-y-3">
                <Card className="bg-green-50 border-green-100">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Banknote className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">
                          Total Received
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-700">
                        {formatCurrency(totalReceived)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-2">
                  <Card>
                    <CardContent className="p-2">
                      <div className="text-xs text-muted-foreground">Cash</div>
                      <div className="font-medium">
                        {formatCurrency(cashTotal)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2">
                      <div className="text-xs text-muted-foreground">Bank</div>
                      <div className="font-medium">
                        {formatCurrency(bankTotal)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2">
                      <div className="text-xs text-muted-foreground">
                        Cheque
                      </div>
                      <div className="font-medium">
                        {formatCurrency(chequeTotal)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Payments list */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="px-4 py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Payment History</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[12%]">Date</TableHead>
                    <TableHead className="w-[22%]">Party</TableHead>
                    <TableHead className="w-[12%]">Type</TableHead>
                    <TableHead className="w-[14%]">Reference</TableHead>
                    <TableHead className="w-[25%]">Description</TableHead>
                    <TableHead className="text-right w-[15%]">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPayments ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading payments...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchInput ||
                        selectedPartyId ||
                        paymentTypeFilter ||
                        dateRange.startDate ||
                        dateRange.endDate
                          ? "No payments match your filters"
                          : "No payments received yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                            {formatDate(payment.paymentDate)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                            {payment.partyName.length > 20 ? payment.partyName.slice(0,15) +'...': payment.partyName}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`
                              ${
                                payment.paymentType === PaymentType.CASH
                                  ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                                  : ""
                              }
                              ${
                                payment.paymentType === PaymentType.BANK
                                  ? "bg-green-50 text-green-700 hover:bg-green-50"
                                  : ""
                              }
                              ${
                                payment.paymentType === PaymentType.CHEQUE
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                  : ""
                              }
                            `}
                          >
                            {payment.paymentType === PaymentType.CASH && (
                              <Banknote className="mr-1 h-3 w-3" />
                            )}
                            {payment.paymentType === PaymentType.BANK && (
                              <CreditCard className="mr-1 h-3 w-3" />
                            )}
                            {payment.paymentType === PaymentType.CHEQUE && (
                              <Receipt className="mr-1 h-3 w-3" />
                            )}
                            {payment.paymentType}
                          </Badge>
                        </TableCell>

                        <TableCell>{payment.referenceNumber || "-"}</TableCell>

                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                            {payment.description || "No description"}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-medium text-green-600">
                          <div className="flex items-center justify-end">
                            <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
                            {formatCurrency(payment.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <EllipsisVertical className="h-4 w-4 text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                 console.log("Edit payment", payment.id);
                                  dispatch(openPaymentsEditForm(payment.id));
                                }}
                              >
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePayment(
                                    payment.id,
                                    payment.direction,
                                    deletePaymentMutation
                                  );
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                Delete Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper label component for the filters
const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <label className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

export default PaymentInPage;
