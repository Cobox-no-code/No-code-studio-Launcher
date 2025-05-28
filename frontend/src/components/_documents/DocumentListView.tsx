"use client";
import { useRouter } from "next/navigation";
import React, { ChangeEvent, useState } from "react";

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertCircle,
  ArrowRightLeft,
  ArrowUpDown,
  Edit,
  EllipsisVertical,
  Equal,
  FileCog,
  FileText,
  Package2,
  Plus,
  Printer,
  Receipt,
  Search,
  Share,
  ShoppingBag,
  TruckIcon,
  X,
} from "lucide-react";

// API Hooks and other imports
import {
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
} from "@/redux/api/documentApi";
import { DocumentType } from "@/models/document/document.model";
import { useDeleteActions } from "@/hooks/useDeleteAction";

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

// Get document type information
const getDocumentInfo = (type: DocumentType) => {
  switch (type) {
    case DocumentType.SALE_INVOICE:
      return {
        title: "Sale Invoice",
        icon: <Receipt className="h-4 w-4 mr-2" />,
        badge: "blue",
        convertOptions: [],
      };
    case DocumentType.SALE_ORDER:
      return {
        title: "Sale Order",
        icon: <ShoppingBag className="h-4 w-4 mr-2" />,
        badge: "green",
        convertOptions: [
          {
            type: DocumentType.SALE_INVOICE,
            label: "Convert to Invoice",
          },
        ],
      };
    case DocumentType.SALE_RETURN:
      return {
        title: "Sale Return",
        icon: <ArrowRightLeft className="h-4 w-4 mr-2" />,
        badge: "red",
        convertOptions: [],
      };
    case DocumentType.SALE_QUOTATION:
      return {
        title: "Quotation",
        icon: <FileText className="h-4 w-4 mr-2" />,
        badge: "purple",
        convertOptions: [
          {
            type: DocumentType.SALE_ORDER,
            label: "Convert to Order",
          },
          {
            type: DocumentType.SALE_INVOICE,
            label: "Convert to Invoice",
          },
        ],
      };
    case DocumentType.DELIVERY_CHALLAN:
      return {
        title: "Delivery Challan",
        icon: <TruckIcon className="h-4 w-4 mr-2" />,
        badge: "orange",
        convertOptions: [
          {
            type: DocumentType.SALE_INVOICE,
            label: "Convert to Invoice",
          },
        ],
      };
    case DocumentType.PURCHASE_INVOICE:
      return {
        title: "Purchase Invoice",
        icon: <Receipt className="h-4 w-4 mr-2" />,
        badge: "blue",
        convertOptions: [],
      };
    case DocumentType.PURCHASE_ORDER:
      return {
        title: "Purchase Order",
        icon: <Package2 className="h-4 w-4 mr-2" />,
        badge: "green",
        convertOptions: [
          {
            type: DocumentType.PURCHASE_INVOICE,
            label: "Convert to Invoice",
          },
        ],
      };
    case DocumentType.PURCHASE_RETURN:
      return {
        title: "Purchase Return",
        icon: <ArrowRightLeft className="h-4 w-4 mr-2" />,
        badge: "red",
        convertOptions: [],
      };
    default:
      return {
        title: "Document",
        icon: <FileText className="h-4 w-4 mr-2" />,
        badge: "gray",
        convertOptions: [],
      };
  }
};

// Get badge color based on document type
const getBadgeClass = (type: DocumentType) => {
  const docInfo = getDocumentInfo(type);

  switch (docInfo.badge) {
    case "blue":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "green":
      return "bg-green-50 text-green-700 border-green-200";
    case "red":
      return "bg-red-50 text-red-700 border-red-200";
    case "purple":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "orange":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};
// Add this to your page.tsx file or create a utils file
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
interface DocumentListProps {
  documentType?: DocumentType;
  title?: string;
}

const DocumentListView: React.FC<DocumentListProps> = ({
  documentType,
  title = "Documents",
}) => {
  const router = useRouter();

  // State management
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [filterDocument, setFilterDocument] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [selectedDates, setSelectedDates] = useState<{
    date1: string;
    date2: string;
  }>({
    date1: "",
    date2: "",
  });

  // Function to receive data from the date range component
  const handleDateChange = (date1: string, date2: string) => {
    setSelectedDates({ date1, date2 });
  };

  // Use RTK Query to fetch documents with date filter
  const {
    data: documents,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDocumentsQuery({
    documentType: documentType
      ? convertDocumentTypeToApiParam(documentType)
      : "sale_invoice",
    startDate: selectedDates.date1,
    endDate: selectedDates.date2,
  });
  const { deleteDocument } = useDeleteActions();

  // Delete document mutation
  const [deleteDocumentMutation, { isLoading: isDeleting }] =
    useDeleteDocumentMutation();

  // Handle document selection
  const handleSelectDocument = (id: string) => {
    setSelectedDocumentId(id);
  };

  // Open create form
  const handleCreateNew = () => {
    router.push(`/document/${documentType}`);
  };

  // Open edit form
  const handleEditDocument = (id: string) => {
    router.push(`/document/${documentType}?id=${id}`);
  };

  // Handle document conversion (e.g., order to invoice)
  const handleConvertDocument = (id: string, targetType: DocumentType) => {
    router.push(`/document/${targetType}?id=${id}&convertFrom=${documentType}`);
  };

  // Get the selected document details
  const selectedDocument = selectedDocumentId
    ? documents?.find((doc) => doc.id === selectedDocumentId)
    : null;

  // Filter documents based on search and tab
  const filteredDocuments = documents?.filter((document) => {
    const matchesSearch =
      (document.partyName?.toLowerCase() || "").includes(
        filterDocument.toLowerCase()
      ) ||
      (document.documentNumber?.toLowerCase() || "").includes(
        filterDocument.toLowerCase()
      );

    if (currentTab === "all") return matchesSearch;
    if (currentTab === "cash" && document.transactionType === "cash")
      return matchesSearch;
    if (currentTab === "credit" && document.transactionType === "credit")
      return matchesSearch;
    if (currentTab === "due" && document.balanceAmount > 0)
      return matchesSearch;

    return false;
  });

  // Document summary calculations
  const calculateTotals = () => {
    let total = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    documents?.forEach((document) => {
      total += document.total || 0;
      totalPaid += document.paidAmount || 0;
      totalUnpaid += document.balanceAmount || 0;
    });

    return {
      totalAmount: total,
      totalPaid,
      totalUnpaid,
    };
  };

  const totals = calculateTotals();

  // Delete document
  const handleDeleteDocument = async (id: string) => {
    try {
      const documentTypeFinal =
        convertDocumentTypeToApiParam(documentType) || "sale_invoice";


      deleteDocument(id, documentTypeFinal, deleteDocumentMutation);
      // If the deleted document was selected, clear selection
      if (id === selectedDocumentId) {
        setSelectedDocumentId(null);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  // Get document info for the main type
  const mainDocInfo = documentType
    ? getDocumentInfo(documentType)
    : { title: "Documents" };

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header with stats */}
      <section className="w-full flex justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold flex items-center">
            {documentType && getDocumentInfo(documentType).icon}
            {mainDocInfo.title}
          </h1>
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

        <div className="flex items-start gap-4">
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-1" /> New {mainDocInfo.title}
          </Button>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - Documents List */}
        <Card className="w-full md:w-2/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>{mainDocInfo.title} List</CardTitle>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-1" /> Add New
              </Button>
            </div>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, number or phone..."
                value={filterDocument}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFilterDocument(e.target.value)
                }
                className="pl-9 pr-9"
              />
              {filterDocument && (
                <button
                  onClick={() => setFilterDocument("")}
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
                    <TableHead className="pl-4">Document Number</TableHead>
                    <TableHead>{documentType ? "Party" : "Type"}</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Transaction</TableHead>
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
                            {error?.toString() || "Failed to load documents"}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No documents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments?.map((document) => {
                      const docInfo = getDocumentInfo(document.documentType);
                      const badgeClass = getBadgeClass(document.documentType);

                      return (
                        <TableRow
                          key={document.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedDocumentId === document.id
                              ? "bg-primary/5"
                              : ""
                          }`}
                          onClick={() => handleSelectDocument(document.id)}
                        >
                          <TableCell className="pl-4">
                            <div className="font-medium">
                              {document.documentNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            {!documentType ? (
                              <Badge variant="outline" className={badgeClass}>
                                {docInfo.title}
                              </Badge>
                            ) : (
                              <div className="flex flex-col">
                                <span>{document.partyName}</span>
                                {document.phone && (
                                  <span className="text-xs text-muted-foreground">
                                    {document.phone}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDate(document.documentDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                document.transactionType === "cash"
                                  ? "outline"
                                  : "secondary"
                              }
                              className={
                                document.transactionType === "cash"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : ""
                              }
                            >
                              {document.transactionType === "cash"
                                ? "Cash"
                                : "Credit"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(document.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* {document.balanceAmount > 0 ? (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Due: {formatCurrency(document.balanceAmount)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Paid
                              </Badge>
                            )} */}
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              {document.status}
                            </Badge>
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
                                  className="justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDocument(document.id);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>

                                {/* Convert options */}
                                {docInfo.convertOptions.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="justify-start w-full"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                        Convert
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="start"
                                      className="w-48"
                                    >
                                      {docInfo.convertOptions.map(
                                        (option, idx) => (
                                          <DropdownMenuItem
                                            key={idx}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleConvertDocument(
                                                document.id,
                                                option.type
                                              );
                                            }}
                                          >
                                            {option.label}
                                          </DropdownMenuItem>
                                        )
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}

                                <DropdownMenuItem
                                  className="justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/viewer?Id=${document.id}`);
                                  }}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDocument(document.id);
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Document Details */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedDocument ? (
                  <div className="flex items-center gap-2">
                    {getDocumentInfo(selectedDocument.documentType).icon}
                    {getDocumentInfo(selectedDocument.documentType).title}{" "}
                    Details
                    <Badge
                      variant={
                        selectedDocument.transactionType === "cash"
                          ? "outline"
                          : "secondary"
                      }
                      className={
                        selectedDocument.transactionType === "cash"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : ""
                      }
                    >
                      {selectedDocument.transactionType === "cash"
                        ? "Cash"
                        : "Credit"}
                    </Badge>
                  </div>
                ) : (
                  "Document Details"
                )}
              </CardTitle>
              {selectedDocument && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(`/viewer?Id=${selectedDocument.id}`)
                    }
                  >
                    <Printer className="h-4 w-4 mr-1" /> Print
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedDocument ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileCog className="h-16 w-16 text-gray-300 mb-2" />
                <p className="text-lg font-medium text-gray-500">
                  Select a document to view details
                </p>
                <p className="text-sm text-gray-400 max-w-md mt-1">
                  Click on any document from the list to view its detailed
                  information and items
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Document info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Document Number
                    </p>
                    <p className="text-sm font-medium">
                      {selectedDocument.documentNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">
                      {formatDate(selectedDocument.documentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {selectedDocument.partyType === "customer"
                        ? "Customer"
                        : "Supplier"}
                    </p>
                    <p className="text-sm font-medium">
                      {selectedDocument.partyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">
                      {selectedDocument.phone || "—"}
                    </p>
                  </div>
                </div>

                {/* Payment details */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">
                        Payment Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Amount
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(selectedDocument.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Payment Type
                        </p>
                        <p className="text-lg font-semibold capitalize">
                          {selectedDocument.paymentType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {selectedDocument.partyType === "customer"
                            ? "Received"
                            : "Paid"}{" "}
                          Amount
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(selectedDocument.paidAmount)}
                        </p>
                      </div>
                      {selectedDocument.documentType !=
                        DocumentType.SALE_QUOTATION && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Balance Due
                          </p>
                          <p
                            className={`text-lg font-semibold ${
                              selectedDocument.balanceAmount > 0
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatCurrency(selectedDocument.balanceAmount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Items details */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-primary" />
                    Items ({selectedDocument.items?.length || 0})
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
                        {selectedDocument.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell className="text-right">
                              {item.primaryQuantity} {item.primaryUnitName}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.pricePerUnit || 0)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Additional costs */}
                  {selectedDocument && (
                    <div className="pt-2 space-y-1 border-t">
                      {(selectedDocument.discountAmount ?? 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Discount
                          </span>
                          <span>
                            -
                            {formatCurrency(
                              Number(selectedDocument.discountAmount)
                            )}
                          </span>
                        </div>
                      )}
                      {selectedDocument.taxAmount &&
                        selectedDocument.taxAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax</span>
                            <span>
                              +{formatCurrency(selectedDocument.taxAmount || 0)}
                            </span>
                          </div>
                        )}
                      {selectedDocument.shipping &&
                        selectedDocument.shipping > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Shipping
                            </span>
                            <span>
                              +{formatCurrency(selectedDocument.shipping || 0)}
                            </span>
                          </div>
                        )}
                      {selectedDocument.packaging &&
                        selectedDocument.packaging > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Packaging
                            </span>
                            <span>
                              +{formatCurrency(selectedDocument.packaging || 0)}
                            </span>
                          </div>
                        )}
                      {selectedDocument.roundOff !== 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Round Off
                          </span>
                          <span>
                            {selectedDocument.roundOff > 0 ? "+" : ""}
                            {formatCurrency(selectedDocument.roundOff)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(selectedDocument.total)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transportation details */}
                {(selectedDocument.transportName ||
                  selectedDocument.vehicleNumber ||
                  selectedDocument.deliveryDate ||
                  selectedDocument.deliveryLocation) && (
                  <Card className="border-0 shadow-none bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TruckIcon className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">
                          Transportation Details
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {selectedDocument.transportName && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Transport Name
                            </p>
                            <p className="text-sm font-medium">
                              {selectedDocument.transportName}
                            </p>
                          </div>
                        )}
                        {selectedDocument.vehicleNumber && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Vehicle Number
                            </p>
                            <p className="text-sm font-medium">
                              {selectedDocument.vehicleNumber}
                            </p>
                          </div>
                        )}
                        {selectedDocument.deliveryDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Delivery Date
                            </p>
                            <p className="text-sm font-medium">
                              {formatDate(selectedDocument.deliveryDate)}
                            </p>
                          </div>
                        )}
                        {selectedDocument.deliveryLocation && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Delivery Location
                            </p>
                            <p className="text-sm font-medium">
                              {selectedDocument.deliveryLocation}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Document conversion options if any */}
                {getDocumentInfo(selectedDocument.documentType).convertOptions
                  .length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      Convert Document
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getDocumentInfo(
                        selectedDocument.documentType
                      ).convertOptions.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleConvertDocument(
                              selectedDocument.id,
                              option.type
                            )
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentListView;
