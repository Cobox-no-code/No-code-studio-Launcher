"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { openModal } from "@/redux/slices/modal";
import {
  useGetPartiesQuery,
  useGetGroupsQuery,
  useDeletePartyMutation,
} from "@/redux/api/partiesApi";
import { openEditForm as openPayments } from "@/redux/slices/paymentSlice";
// UI Components
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import {
  EllipsisVertical,
  AlertCircle,
  Plus,
  Search,
  Users,
  ArrowUpDown,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  History,
  Loader2,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  UserRound,
  BadgeIndianRupee,
  Settings,
  Pencil,
  Tag,
  Delete,
  Edit,
  ArrowRightLeft,
  Printer,
} from "lucide-react";
import { openCreateForm, openEditForm } from "@/redux/slices/partySlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import {
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
} from "@/redux/api/documentApi";
import {
  useDeletePaymentMutation,
  useGetPaymentsQuery,
} from "@/redux/api/paymentApi";
import { PaymentDirection } from "@/models/payment/payment.model";
import { useDeleteActions } from "@/hooks/useDeleteAction";
import { useRouter } from "next/navigation";
import { DocumentType } from "@/models/document/document.model";
import { hasPermission } from "@/lib/role-permissions-mapping";
import { useAppSelector } from "@/redux/hooks";

// Helper to format currency
const formatCurrency = (amount: string | number | bigint) => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

// Helper to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Parties = () => {
  const dispatch = useDispatch<AppDispatch>();
  const role = useAppSelector((state) => state.firm.role);
  // State management
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterParty, setFilterParty] = useState("");
  const [filterTransaction, setFilterTransaction] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const { deleteParty ,deletePayment} = useDeleteActions();
  const [deletePartyMutation, { isLoading: isDeleting, error: deleteError }] =
    useDeletePartyMutation();

  const [deletePaymentMutation] = useDeletePaymentMutation();
  const { data: documents ,refetch:refetchDocuments} = useGetDocumentsQuery({});
  const { data: payments, refetch:refecthPayments } = useGetPaymentsQuery({});
  const router = useRouter();
  // Use RTK Query to fetch parties
  const {
    data: parties,
    isLoading,
    isError,
    error,
    refetch:refetchParties,
  } = useGetPartiesQuery(
    {},
    {
      // Refetch on window focus (when user comes back to this tab)
      refetchOnFocus: true,

      // Refetch when reconnecting after being offline
      refetchOnReconnect: true,
    }
  );
  const { deleteDocument } = useDeleteActions();

  // Delete document mutation
  const [deleteDocumentMutation, { isLoading: isDeletingDoc }] =
    useDeleteDocumentMutation();

  useEffect(() => {
    // Immediately refetch data when component mounts
    refetchParties();
    refecthPayments();
    refetchDocuments();

    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
        refetchParties();
    refecthPayments();
    refetchDocuments();
    }, 2000); // Adjust this time as needed

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refecthPayments, refetchDocuments, refetchParties]);
  // Use RTK Query to fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useGetGroupsQuery();

  // Handle party selection
  const handleSelectParty = (id: string) => {
    setSelectedId(id);
  };

  // Open modal with specific type
  const openCreateModal = () => {
    dispatch(openCreateForm());
  };

  const openEditModal = (itemId: string) => {
    dispatch(openEditForm(itemId));
  };

  // Get the selected party details
  const selectedParty = selectedId
    ? parties?.find((party) => party.id === selectedId)
    : null;

  // Filter parties based on search and tab
  const filteredParties = parties?.filter((party) => {
    const matchesSearch =
      party.name.toLowerCase().includes(filterParty.toLowerCase()) ||
      (party.phone && party.phone.includes(filterParty)) ||
      (party.email &&
        party.email.toLowerCase().includes(filterParty.toLowerCase())) ||
      (party.gstNumber &&
        party.gstNumber.toLowerCase().includes(filterParty.toLowerCase()));

    if (currentTab === "all") return matchesSearch;
    if (currentTab === "credit" && party.creditLimitType === "custom")
      return matchesSearch;
    if (
      currentTab === "to_pay" &&
      party.currentBalanceType === "to_pay" &&
      party?.currentBalance > 0
    )
      return matchesSearch;
    if (
      currentTab === "to_receive" &&
      party.currentBalanceType === "to_receive" &&
      party?.currentBalance > 0
    )
      return matchesSearch;

    return false;
  });

  // Get group name for a party
  const getGroupName = (groupId?: string) => {
    if (!groupId || !groups) return "—";
    const group = groups.find((g) => g.id === groupId);
    return group ? group.groupName : "—";
  };

  // Parties summary
  const totalParties = parties?.length || 0;
  const totalWithCredit =
    parties?.filter((party) => party.creditLimitType === "custom").length || 0;
  const totalToPay =
    parties?.filter(
      (party) =>
        party.currentBalanceType === "to_pay" && party.currentBalance > 0
    ).length || 0;
  const totalToReceive =
    parties?.filter(
      (party) =>
        party.currentBalanceType === "to_receive" && party.currentBalance > 0
    ).length || 0;

  // Get transaction history data (mock data)

  const getTransactionHistory = () => {
    if (!selectedParty) return [];

    const transactions = [];

    // Add documents (only sale and purchase bills)
    if (documents) {
      const partyDocuments = documents.filter(
        (document) =>
          document.partyId === selectedId &&
          (document.documentType.toLowerCase().includes("sale") ||
            document.documentType.toLowerCase().includes("purchase") || (document.documentType.toLowerCase().startsWith("challan")))
      );

      transactions.push(
        ...partyDocuments.map((doc) => ({
          id: doc.id,
          transactionType: doc.documentType,
          documentNumber: doc.documentNumber,
          documentDate: doc.documentDate,
          total: doc.total,
          balanceAmount: doc.balanceAmount || 0,
          direction: doc.documentType.toLowerCase().includes("sale")
            ? "in"
            : "out",
          sourceType: "document",
        }))
      );
    }

    // Add payments
    if (payments) {
      const partyPayments = payments.filter(
        (payment) => payment.partyId === selectedId
      );

      transactions.push(
        ...partyPayments.map((payment) => ({
          id: payment.id,
          transactionType:
            payment.direction === PaymentDirection.IN
              ? "Payment In"
              : "Payment Out",
          documentNumber:
            payment.receiptNumber || `PMT-${payment.id.substring(0, 8)}`,
          documentDate: payment.paymentDate,
          total: payment.amount,
          balanceAmount: 0, // Payments don't have balance
          direction: payment.direction.toLowerCase(),
          sourceType: "payment",
        }))
      );
    }

    // Sort by date (newest first)
    return transactions;
  };

  // Use this function to get complete transaction history
  const transactionHistory = getTransactionHistory();

  // Filter transactions (same as before)
  const filteredTransactions = transactionHistory.filter(
    (transaction) =>
      transaction.transactionType
        .toLowerCase()
        .includes(filterTransaction.toLowerCase()) ||
      transaction.documentNumber
        .toLowerCase()
        .includes(filterTransaction.toLowerCase())
  );
  function convertDocumentTypeToApiParam(type: DocumentType): string {
    switch (type) {
      case DocumentType.SALE_INVOICE:
        return "sale_invoice";
      case DocumentType.SALE_ORDER:
        return "sale_order";
      case DocumentType.SALE_RETURN:
        return "sale_return";
      case DocumentType.SALE_QUOTATION:
        return "sale_quotation";
      case DocumentType.DELIVERY_CHALLAN:
        return "delivery_challan";
      case DocumentType.PURCHASE_INVOICE:
        return "purchase_invoice";
      case DocumentType.PURCHASE_ORDER:
        return "purchase_order";
      case DocumentType.PURCHASE_RETURN:
        return "purchase_return";
      default:
        return "sale_invoice";
    }
  }
  // Open edit form
  const handleEditDocument = (id: string, documentType: DocumentType) => {
    const direction = documentType.includes("Payment In") ?  PaymentDirection.IN : PaymentDirection.OUT;
    if(!documentType) {
    router.push(`/document/${documentType}?id=${id}`);}
    else{
    dispatch(openPayments(id))
    }
  };
  const handleDeleteDocument = async (
    id: string,
    documentType: DocumentType
  ) => {
    const direction = documentType.includes("Payment In") ?  PaymentDirection.IN : PaymentDirection.OUT;
    try {
      const documentTypeFinal =
        convertDocumentTypeToApiParam(documentType) || "sale_invoice";
      if (!documentType.includes("Payment")) {
        deleteDocument(id, documentTypeFinal, deleteDocumentMutation);
      } else {
        deletePayment(id, direction, deletePaymentMutation);
      }
      // If the deleted document was selected, clear selection
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };
  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header with stats */}
      <div className="flex flex-wrap gap-4">
        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Parties</p>
              <p className="text-2xl font-bold">{totalParties}</p>
            </div>
            <Users className="h-8 w-8 text-primary opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">To Pay</p>
              <p className="text-2xl font-bold">{totalToPay}</p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-red-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">To Receive</p>
              <p className="text-2xl font-bold">{totalToReceive}</p>
            </div>
            <ArrowDownRight className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">With Credit</p>
              <p className="text-2xl font-bold">{totalWithCredit}</p>
            </div>
            <CreditCard className="h-8 w-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - Parties List */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Party Directory</CardTitle>
              {hasPermission(role, "party", "create") && (
                <Button onClick={() => openCreateModal()}>
                  <Plus className="h-4 w-4 mr-1" /> Add Party
                </Button>
              )}
            </div>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search parties..."
                value={filterParty}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFilterParty(e.target.value)
                }
                className="pl-9 pr-9"
              />
              {filterParty && (
                <button
                  onClick={() => setFilterParty("")}
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
              <TabsList className="grid w-full grid-cols-3 ">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="to_pay">To Pay</TabsTrigger>
                <TabsTrigger value="to_receive">To Receive</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden">
            <div className=" overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Party</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
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
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-5 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {error?.toString() || "Failed to load parties"}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredParties?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No parties found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParties?.map((party) => (
                      <TableRow
                        key={party.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedId === party.id ? "bg-primary/5" : ""
                        }`}
                        onClick={() => handleSelectParty(party.id)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            {party.name.length > 30
                              ? party.name.slice(0, 30) + "..."
                              : party.name}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  party.gstType === "Consumer"
                                    ? "secondary"
                                    : party.gstType === "Unregistered"
                                    ? "outline"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {party.gstType}
                              </Badge>
                              {party.groupId && (
                                <Badge variant="outline" className="text-xs">
                                  {getGroupName(party.groupId)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {party.currentBalance ? (
                            <span
                              className={
                                party.currentBalanceType === "to_pay"
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {formatCurrency(party.currentBalance)}
                            </span>
                          ) : (
                            "₹0.00"
                          )}
                        </TableCell>
                        <TableCell className="text-right w-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <EllipsisVertical className="h-4 w-4 text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {hasPermission(role, "party", "edit") && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(party.id);
                                  }}
                                >
                                  Edit Item
                                </DropdownMenuItem>
                              )}
                              {hasPermission(role, "party", "delete") && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteParty(
                                      party.id,
                                      party.name,
                                      deletePartyMutation
                                    );
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  Delete Item
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Party Details */}
        <div className="flex flex-col gap-4 w-full md:w-2/3">
          {/* Party Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedParty ? (
                    <div className="flex items-center gap-2">
                      {selectedParty.name.length > 30
                        ? selectedParty.name.slice(0, 30) + "..."
                        : selectedParty.name}
                      <Badge
                        variant={
                          selectedParty.gstType === "Consumer"
                            ? "secondary"
                            : selectedParty.gstType === "Unregistered"
                            ? "outline"
                            : "default"
                        }
                        className="ml-2"
                      >
                        {selectedParty.gstType}
                      </Badge>
                    </div>
                  ) : (
                    "Party Details"
                  )}
                </CardTitle>
                {selectedParty && hasPermission(role, "party", "edit") && (
                  <Button
                    variant="outline"
                    onClick={() => openEditModal(selectedParty.id)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit Party
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedParty ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-16 w-16 text-gray-300 mb-2" />
                  <p className="text-lg font-medium text-gray-500">
                    Select a party to view details
                  </p>
                  <p className="text-sm text-gray-400 max-w-md mt-1">
                    Click on any party from the list to view contact information
                    and transaction history
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <Card className="border-0 shadow-none bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">
                            Contact Information
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Phone Number
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.phone || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Email Address
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.email || "—"}
                            </p>
                          </div>
                          {selectedParty.gstType === "Regular" && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                GST Number
                              </p>
                              <p className="text-base font-medium">
                                {selectedParty.gstNumber || "—"}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Group
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.groupId
                                ? getGroupName(selectedParty.groupId)
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-none bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">
                            Address Information
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              State
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.state || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Billing Address
                            </p>
                            <p className="text-base font-medium whitespace-pre-line">
                              {selectedParty.billingAddress || "—"}
                            </p>
                          </div>
                          {selectedParty.shippingEnabled &&
                            selectedParty.shippingAddress && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Shipping Address
                                </p>
                                <p className="text-base font-medium whitespace-pre-line">
                                  {selectedParty.shippingAddress}
                                </p>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card className="border-0 shadow-none bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BadgeIndianRupee className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">
                            Credit & Balance
                          </h3>
                        </div>
                        <div className="space-y-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Opening Balance
                            </p>
                            <div className="flex items-center">
                              <p
                                className={`text-lg font-semibold ${
                                  selectedParty.openingBalance &&
                                  selectedParty.openingBalanceType === "to_pay"
                                    ? "text-red-600"
                                    : selectedParty.openingBalance &&
                                      selectedParty.openingBalanceType ===
                                        "to_receive"
                                    ? "text-green-600"
                                    : ""
                                }`}
                              >
                                {selectedParty.openingBalance
                                  ? formatCurrency(selectedParty.openingBalance)
                                  : "₹0.00"}
                              </p>
                              {selectedParty?.openingBalance > 0 && (
                                <Badge
                                  className="ml-2"
                                  variant={
                                    selectedParty.openingBalanceType ===
                                    "to_pay"
                                      ? "destructive"
                                      : "default"
                                  }
                                >
                                  {selectedParty.openingBalanceType === "to_pay"
                                    ? "To Pay"
                                    : "To Receive"}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              As of Date
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.openingBalanceDate
                                ? formatDate(selectedParty.openingBalanceDate)
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Credit Limit
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.creditLimitType === "custom" &&
                              selectedParty.creditLimitValue
                                ? formatCurrency(selectedParty.creditLimitValue)
                                : "No Limit"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-none bg-gray-50 mt-6">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">
                            Additional Fields
                          </h3>
                        </div>
                        <div className="space-y-4 mt-4">
                          {selectedParty.additionalFields &&
                          selectedParty.additionalFields.length > 0 ? (
                            selectedParty.additionalFields.map(
                              (field, index) => (
                                <div key={index}>
                                  <p className="text-xs text-muted-foreground">
                                    {field.key}
                                  </p>
                                  <p className="text-base font-medium">
                                    {field.value || "—"}
                                  </p>
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No additional fields
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-none bg-gray-50 mt-6">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">
                            Additional Settings
                          </h3>
                        </div>
                        <div className="space-y-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Payment Reminders
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.paymentReminderEnabled
                                ? `Enabled (${
                                    selectedParty.paymentReminderDays || 0
                                  } days)`
                                : "Disabled"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Loyalty Points
                            </p>
                            <p className="text-base font-medium">
                              {selectedParty.loyaltyPointsEnabled
                                ? "Enabled"
                                : "Disabled"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          {hasPermission(role, "sale_invoice", "view") &&
            hasPermission(role, "purchase_invoice", "view") && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-4 w-4" /> Transaction History
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search transactions..."
                        value={filterTransaction}
                        onChange={(e) => setFilterTransaction(e.target.value)}
                        className="pl-9 pr-9"
                      />
                      {filterTransaction && (
                        <button
                          onClick={() => setFilterTransaction("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <X className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Sl.No</TableHead>
                          <TableHead className="w-[120px]">Type</TableHead>
                          <TableHead className="w-[120px]">
                            Invoice No.
                          </TableHead>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead className="w-[120px]">
                            <div className="flex items-center">
                              Total
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!selectedParty ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-10 text-muted-foreground"
                            >
                              Select a party to view their transaction history
                            </TableCell>
                          </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-10 text-muted-foreground"
                            >
                              No transactions found for this party
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.map((transaction, index) => (
                            <TableRow
                              key={`${transaction.sourceType}-${transaction.id}`}
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {transaction.direction === "in" ? (
                                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                                  )}
                                  <span
                                    className={
                                      transaction.direction === "in"
                                        ? "text-green-600"
                                        : "text-blue-600"
                                    }
                                  >
                                    {transaction.transactionType}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {transaction.documentNumber}
                              </TableCell>
                              <TableCell>
                                {formatDate(transaction.documentDate)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={
                                    transaction.direction === "in"
                                      ? "text-green-600"
                                      : "text-blue-600"
                                  }
                                >
                                  {formatCurrency(transaction.total)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.sourceType === "payment" ? (
                                  <span className="text-gray-500">—</span>
                                ) : (
                                  <span
                                    className={
                                      transaction.balanceAmount > 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }
                                  >
                                    {formatCurrency(transaction.balanceAmount)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right w-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                      <EllipsisVertical className="h-4 w-4 text-gray-500" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                  >
                                    <DropdownMenuItem
                                      className="justify-start"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditDocument(
                                          transaction.id,
                                          transaction.transactionType
                                        );
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>

                                    {!transaction.transactionType.includes(
                                      "Payment In"
                                    ) &&
                                      !transaction.transactionType.includes(
                                        "Payment Out"
                                      ) && (
                                        <DropdownMenuItem
                                          className="justify-start"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                              `/viewer?Id=${transaction.id}`
                                            );
                                          }}
                                        >
                                          <Printer className="mr-2 h-4 w-4" />
                                          Print
                                        </DropdownMenuItem>
                                      )}
                                    <DropdownMenuItem
                                      className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDocument(
                                          transaction.id,
                                          transaction.transactionType
                                        );
                                      }}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default Parties;
