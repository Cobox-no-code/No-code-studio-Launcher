"use client";

import {
  openCreateForm as openBankForm,
  openEditForm,
} from "@/redux/slices/bankAccountFormSlice";
import { AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// API Hooks
import {
  useDeleteBankAccountMutation,
  useGetBankAccountsQuery,
  useGetBankTransactionsQuery,
} from "@/redux/api/bankingApi";

// Icons
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  EllipsisVertical,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import TransactionDropdown from "@/components/Dropdown/TransactionDropdown";
import { BankTransactionType } from "@/models/banking/banking.model";
import { useGetPaymentsQuery } from "@/redux/api/paymentApi";
import { useGetPurchaseInvoicesQuery, useGetSaleInvoicesQuery } from "@/redux/api/documentApi";
import { PaymentType } from "@/models/document/document.model";
import { PaymentDirection } from "@/models/payment/payment.model";

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

const BankAccountPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  // State for search and selected bank
  const [searchInput, setSearchInput] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [deleteBank] = useDeleteBankAccountMutation();
  
  // Fetch bank accounts
  const {
    data: bankAccounts = [],
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
    refetch,
  } = useGetBankAccountsQuery();

  // Fetch payments
  const {
    data: payments,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useGetPaymentsQuery({});

  // Fetch sale invoices
  const {
    data: saleInvoices,
    isLoading: isLoadingSales,
    isError: isSalesError,
    refetch: refetchSales,
  } = useGetSaleInvoicesQuery({});

  // Fetch purchase invoices
  const {
    data: purchaseInvoices,
    isLoading: isLoadingPurchases,
    isError: isPurchasesError,
    refetch: refetchPurchases,
  } = useGetPurchaseInvoicesQuery({});

  // Only fetch bank transactions when a bank is selected
  const { data: bankTransactions = [], isLoading: isLoadingBankTransactions } =
    useGetBankTransactionsQuery(
      { bankAccountId: selectedBankId || "" },
      { skip: !selectedBankId }
    );

  // Select the first bank initially
  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBankId) {
      setSelectedBankId(bankAccounts[0].id);
    }
  }, [bankAccounts, selectedBankId]);

  const openEditModal = (itemId: string) => {
    dispatch(openEditForm(itemId));
  };

  // Get the currently selected bank
  const selectedBank =
    bankAccounts.find((bank) => bank.id === selectedBankId) || null;

  // Filter bank accounts based on search input
  const filteredBankAccounts = bankAccounts.filter((account) =>
    account.displayName?.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Combine all transactions for the selected bank
  const getAllTransactionsForBank = () => {
    if (!selectedBankId) return [];

    const allTransactions = [];

    // 1. Bank transactions (deposits, withdrawals, transfers)
    bankTransactions.forEach((transaction) => {
      allTransactions.push({
        ...transaction,
        id: `bank-${transaction.id}`,
        date: transaction.transactionDate,
        type: transaction.transactionType,
        description: transaction.description,
        amount: transaction.amount,
        counterparty: transaction.transactionType || '',
        sourceType: 'bank_transaction',
        isIncoming: transaction.transactionType === BankTransactionType.DEPOSIT,
        isOutgoing: transaction.transactionType === BankTransactionType.WITHDRAWAL,
      });
    });

    // 2. Bank payments (payment type = bank and matching bank account)
    const bankPayments = payments?.filter(
      (payment) => 
        payment.paymentType?.toLowerCase() === 'bank' && 
        payment.bankAccountId === selectedBankId
    ) || [];

    bankPayments.forEach((payment) => {
      allTransactions.push({
        ...payment,
        id: `payment-${payment.id}`,
        date: payment.paymentDate,
        type: payment.direction === PaymentDirection.IN ? 'Payment In' : 'Payment Out',
        description: `Payment ${payment.direction === PaymentDirection.IN ? 'from' : 'to'} ${payment.partyName}`,
        amount: payment.amount,
        documentNumber: payment.receiptNumber || `PMT-${payment.id.substring(0, 8)}`,
        counterparty: payment.partyName,
        sourceType: 'payment',
        isIncoming: payment.direction === PaymentDirection.IN,
        isOutgoing: payment.direction === PaymentDirection.OUT,
      });
    });

    // 3. Sale invoices with bank payment type and matching bank account
    const bankSaleInvoices = saleInvoices?.filter(
      (invoice) => 
        invoice.paymentType === PaymentType.BANK && 
        invoice.bankId=== selectedBankId &&
        (invoice.paidAmount || 0) > 0
    ) || [];

    bankSaleInvoices.forEach((invoice) => {
      allTransactions.push({
        ...invoice,
        id: `sale-${invoice.id}`,
        date: invoice.documentDate,
        type: 'Sale Invoice',
        description: `Sale to ${invoice.partyName} - ${invoice.documentNumber}`,
        amount: invoice.paidAmount || 0,
        documentNumber: invoice.documentNumber,
        counterparty: invoice.partyName,
        sourceType: 'sale_invoice',
        isIncoming: true,
        isOutgoing: false,
      });
    });

    // 4. Purchase invoices with bank payment type and matching bank account
    const bankPurchaseInvoices = purchaseInvoices?.filter(
      (invoice) => 
        invoice.paymentType === PaymentType.BANK && 
        invoice.bankId === selectedBankId &&
        (invoice.paidAmount || 0) > 0
    ) || [];

    bankPurchaseInvoices.forEach((invoice) => {
      allTransactions.push({
        ...invoice,
        id: `purchase-${invoice.id}`,
        date: invoice.documentDate,
        type: 'Purchase Invoice',
        description: `Purchase from ${invoice.partyName} - ${invoice.documentNumber}`,
        amount: invoice.paidAmount || 0,
        documentNumber: invoice.documentNumber,
        counterparty: invoice.partyName,
        sourceType: 'purchase_invoice',
        isIncoming: false,
        isOutgoing: true,
      });
    });

    // Sort by date (newest first)
    return allTransactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  };

  const allTransactions = getAllTransactionsForBank();

  // Filter transactions based on search input
  const filteredTransactions = allTransactions.filter(
    (transaction) =>
      transaction.type?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      transaction.counterparty?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      transaction.documentNumber?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  // Handle adding a new bank account
  const handleAddBankAccount = () => {
    dispatch(openBankForm());
  };

  // Handle bank selection
  const handleSelectBank = (bankId: string) => {
    setSelectedBankId(bankId);
  };

  // Get badge variant based on transaction type
  const getBadgeVariant = (transaction: any) => {
    if (transaction.isIncoming) return "default";
    if (transaction.isOutgoing) return "destructive";
    return "secondary";
  };

  // Get badge color classes
  const getBadgeColorClass = (transaction: any) => {
    if (transaction.isIncoming) {
      return "bg-green-100 text-green-800 hover:bg-green-100";
    }
    return "";
  };

  // Get amount color class
  const getAmountColorClass = (transaction: any) => {
    if (transaction.isIncoming) return "text-green-600";
    if (transaction.isOutgoing) return "text-red-600";
    return "";
  };

  // Get amount prefix
  const getAmountPrefix = (transaction: any) => {
    if (transaction.isIncoming) return "+ ";
    if (transaction.isOutgoing) return "- ";
    return "";
  };

  // Get transaction icon
  const getTransactionIcon = (transaction: any) => {
    if (transaction.isIncoming) {
      return <ArrowDownLeft className="mr-1 h-3 w-3" />;
    }
    if (transaction.isOutgoing) {
      return <ArrowUpRight className="mr-1 h-3 w-3" />;
    }
    return <RefreshCw className="mr-1 h-3 w-3" />;
  };

  useEffect(() => {
    // Immediately refetch data when component mounts
    refetch();

    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetch();
    }, 5000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch]);

  const isLoadingTransactions = isLoadingBankTransactions || isLoadingPayments || isLoadingSales || isLoadingPurchases;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-semibold">Bank Accounts</h1>
      </header>

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left panel - Bank accounts list */}
        <Card className="w-1/3 max-w-md">
          <CardHeader className="px-4 py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Banks</CardTitle>
              <Button size="sm" onClick={handleAddBankAccount}>
                <Plus className="w-4 h-4 mr-1" /> Add Bank
              </Button>
            </div>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search banks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1.5 h-7 w-7"
                  onClick={() => setSearchInput("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-230px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Account</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAccounts ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading accounts...
                      </TableCell>
                    </TableRow>
                  ) : filteredBankAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchInput
                          ? "No matching accounts"
                          : "No bank accounts found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBankAccounts.map((account) => (
                      <TableRow
                        key={account.id}
                        className={`cursor-pointer ${
                          account.id === selectedBankId ? "bg-slate-50" : ""
                        }`}
                        onClick={() => handleSelectBank(account.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CreditCard
                              className={`h-5 w-5 ${
                                account.id === selectedBankId
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span>{account.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(account.currentBalance || 0)}
                        </TableCell>

                        <TableCell className="text-right w-10">
                          <Popover>
                            <PopoverTrigger
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EllipsisVertical className="h-4 w-4 text-gray-500" />
                            </PopoverTrigger>
                            <PopoverContent className="w-40" align="end">
                              <div className="flex flex-col space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(account.id);
                                  }}
                                >
                                  Edit Bank
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBank(account.id);
                                  }}
                                >
                                  Delete Bank
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
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right panel - Selected bank details and transactions */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Bank details card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">
                    {selectedBank?.displayName || "Select a bank account"}
                  </CardTitle>
                  <CardDescription>
                    {selectedBank
                      ? formatCurrency(selectedBank.currentBalance || 0)
                      : "No account selected"}
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <TransactionDropdown
                    selectedBankId={selectedBankId}
                    label="Add Transaction"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {selectedBank && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Account Holder
                    </h3>
                    <p className="text-sm mt-1">
                      {selectedBank.accountHolderName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Account Number
                    </h3>
                    <p className="text-sm mt-1">
                      {selectedBank.accountNumber || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      IFSC Code
                    </h3>
                    <p className="text-sm mt-1">
                      {selectedBank.ifscCode || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      UPI ID
                    </h3>
                    <p className="text-sm mt-1">
                      {selectedBank.upiId || "Not specified"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions card */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">All Bank Transactions</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    className="pl-9"
                  />
                  {transactionSearch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1.5 h-7 w-7"
                      onClick={() => setTransactionSearch("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[12%]">Date</TableHead>
                      <TableHead className="w-[18%]">Type</TableHead>
                      <TableHead className="w-[35%]">Description</TableHead>
                      <TableHead className="w-[20%]">Counterparty</TableHead>
                      <TableHead className="text-right w-[15%]">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedBankId ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Select a bank account to view transactions
                        </TableCell>
                      </TableRow>
                    ) : isLoadingTransactions ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Loading transactions...
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {transactionSearch
                            ? "No matching transactions"
                            : "No transactions found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            {formatDate(transaction.date)}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={getBadgeVariant(transaction)}
                              className={`text-xs ${getBadgeColorClass(transaction)}`}
                            >
                              {getTransactionIcon(transaction)}
                              {transaction.type}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm">
                            {transaction.description}
                          </TableCell>

                          <TableCell className="text-sm">
                            {transaction.counterparty.length > 30
                              ? `${transaction.counterparty.substring(0, 30)}...`
                              : transaction.counterparty}
                          </TableCell>

                          <TableCell
                            className={`text-right text-sm font-medium ${getAmountColorClass(transaction)}`}
                          >
                            {getAmountPrefix(transaction)}
                            {formatCurrency(transaction.amount)}
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
    </div>
  );
};

export default BankAccountPage;