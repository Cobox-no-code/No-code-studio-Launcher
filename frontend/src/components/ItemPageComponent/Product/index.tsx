"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  useGetItemsQuery,
  useGetCategoriesQuery,
  useGetUnitsQuery,
  useGetUnitConversionsQuery,
  useDeleteItemMutation,
} from "@/redux/api";

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
  SlidersVertical,
  Search,
  Package2,
  ArrowUpDown,
  Calendar,
  CreditCard,
  Tag,
  BarChart3,
  History,
  Loader2,
  X,
  FileText,
  TrendingUp,
  ShoppingCart,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppDispatch } from "@/redux/hooks";
import { openCreateForm, openEditForm } from "@/redux/slices/itemsSlice";
import toast from "react-hot-toast";
import { useGetDocumentsQuery } from "@/redux/api/documentApi";
import { useDeleteActions } from "@/hooks/useDeleteAction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const Items = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { deleteItem } = useDeleteActions();
  // State management
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterProduct, setFilterProduct] = useState("");
  const [filterTransaction, setFilterTransaction] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const { data: documents } = useGetDocumentsQuery({});
  // Use RTK Query to fetch items, categories, and units
  const {
    data: items,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetItemsQuery({});
  const { data: categories, isLoading: isLoadingCategories } =
    useGetCategoriesQuery();
  const { data: units, isLoading: isLoadingUnits } = useGetUnitsQuery();
  const { data: unitConversions, isLoading: isLoadingConversions } =
    useGetUnitConversionsQuery();
  const [deleteItemMutation, { isLoading: isDeleting, error: deleteError }] =
    useDeleteItemMutation();
  // Helper functions to get names from IDs
  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId || !categories) return "—";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "—";
  };

  // Get unit details based on unitId or unit_conversionId
  const getUnitInfo = (item: any) => {
    if (!units) return { name: "—", shortName: "" };

    // First try to get unit from unit_conversionId
    if (item.unit_conversionId && unitConversions) {
      const conversion = unitConversions.find(
        (uc) => uc.id === item.unit_conversionId
      );
      if (conversion) {
        const unit = units.find((u) => u.id === conversion.primaryUnitId);
        return {
          name: unit ? unit.fullname : "—",
          shortName: unit ? unit.shortname : "",
          secondaryUnitId: conversion.secondaryUnitId,
          conversionRate: conversion.conversionRate || 1,
        };
      }
    }

    // Fallback to unitId for backward compatibility
    if (item.unitId) {
      const unit = units.find((u) => u.id === item.unitId);
      return {
        name: unit ? unit.fullname : "—",
        shortName: unit ? unit.shortname : "",
        conversionRate: 1,
      };
    }

    return { name: "—", shortName: "", conversionRate: 1 };
  };

  // Get secondary unit info
  const getSecondaryUnitInfo = (secondaryUnitId: any) => {
    if (!secondaryUnitId || !units) return { name: "—", shortName: "" };
    const unit = units.find((u) => u.id === secondaryUnitId);
    return {
      name: unit ? unit.fullname : "—",
      shortName: unit ? unit.shortname : "",
    };
  };
  useEffect(() => {
    // Immediately refetch data when component mounts
    refetch();

    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetch();
    }, 5000); // Adjust this time as needed

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch]);
  // Calculate stock value considering both primary and secondary quantities
  const calculateStockValue = (item: any) => {
    if (!item || !item.purchasePrice) return "—";

    let totalValue = 0;

    // Add primary quantity value
    if (item.primaryQuantity) {
      totalValue += item.primaryQuantity * item.purchasePrice;
    }

    // Add secondary quantity value if exists
    if (item.secondaryQuantity && item.unit_conversionId) {
      const unitInfo = getUnitInfo(item);
      if (unitInfo.conversionRate) {
        // Convert secondary units to primary units for value calculation
        const primaryEquivalent =
          item.secondaryQuantity / unitInfo.conversionRate;
        totalValue += primaryEquivalent * item.purchasePrice;
      }
    }

    return totalValue > 0 ? formatCurrency(totalValue) : "—";
  };

  // Handle item selection
  const handleSelectItem = (id: string) => {
    setSelectedId(id);
  };

  // Open modals
  const openCreateModal = () => {
    dispatch(openCreateForm());
  };

  const openEditModal = (itemId: string) => {
    dispatch(openEditForm(itemId));
  };

  // Get the selected item details
  const selectedItem = selectedId
    ? items?.find((item) => item.id === selectedId)
    : null;

  // Filter products based on search and tab
  const filteredItems = items?.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(filterProduct.toLowerCase());

    if (currentTab === "all") return matchesSearch;
    if (currentTab === "products" && item.type === "PRODUCT")
      return matchesSearch;
    if (currentTab === "services" && item.type === "SERVICE")
      return matchesSearch;
    if (
      currentTab === "lowStock" &&
      item.type === "PRODUCT" &&
      "primaryOpeningQuantity" in item &&
      "minStockLevel" in item &&
      item.primaryOpeningQuantity <= (item.minStockLevel || 0)
    )
      return matchesSearch;

    return false;
  });

  // Items summary
  const totalItems = items?.length || 0;
  const totalProducts =
    items?.filter((item) => item.type === "PRODUCT").length || 0;
  const totalServices =
    items?.filter((item) => item.type === "SERVICE").length || 0;
  const lowStockItems =
    items?.filter(
      (item) =>
        item.type === "PRODUCT" &&
        "primaryOpeningQuantity" in item &&
        "minStockLevel" in item &&
        item.primaryOpeningQuantity <= (item.minStockLevel || 0)
    ).length || 0;
  const getTransactionHistory = () => {
    if (!selectedItem) return [];

    const transactions = [];

    // Add documents (only sale and purchase bills) that contain this item
    if (documents) {
      const itemDocuments = documents.filter(
        (document) =>
          // Check if document contains this item in its items array
          document.items &&
          document.items.some((item) => item.itemId === selectedId) &&
          (document.documentType.toLowerCase().includes("sale") ||
            document.documentType.toLowerCase().includes("purchase"))
      );

      transactions.push(
        ...itemDocuments.map((doc) => {
          // Find the specific item in this document to get quantity and price
          const itemInDoc = doc.items.find(
            (item) => item.itemId === selectedId
          );

          return {
            id: doc.id,
            transactionType: doc.documentType,
            documentNumber: doc.documentNumber,
            documentDate: doc.documentDate,
            total: doc.total,
            balanceAmount: doc.balanceAmount || 0,
            direction: doc.documentType.toLowerCase().includes("sale")
              ? "out"
              : "in", // Sale = stock out, Purchase = stock in
            sourceType: "document",
            // Additional item-specific information
            quantity: itemInDoc ? itemInDoc.primaryQuantity : 0,
            rate: itemInDoc ? itemInDoc.conversionRate : 0,
            itemTotal: itemInDoc
              ? itemInDoc.primaryQuantity * itemInDoc.conversionRate
              : 0,
            partyName: doc.partyName || "Unknown",
          };
        })
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
        .includes(filterTransaction.toLowerCase()) ||
      transaction.partyName
        .toLowerCase()
        .includes(filterTransaction.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header with stats */}
      <div className="flex flex-wrap gap-4">
        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
            <Package2 className="h-8 w-8 text-primary opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Services</p>
              <p className="text-2xl font-bold">{totalServices}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(25%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockItems}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - Items List */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Item Inventory</CardTitle>
              <Button onClick={() => openCreateModal()}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={filterProduct}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFilterProduct(e.target.value)
                }
                className="pl-9 pr-9"
              />
              {filterProduct && (
                <button
                  onClick={() => setFilterProduct("")}
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
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="lowStock">Low Stock</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden">
            <div className="h-[calc(100vh-400px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Item</TableHead>
                    <TableHead className="text-right">Primary Qty</TableHead>
                    <TableHead className="text-right">Secondary Qty</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || isLoadingUnits || isLoadingConversions ? (
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
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-5 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {error?.toString() || "Failed to load items"}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredItems?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems?.map((item) => {
                      const unitInfo = getUnitInfo(item);
                      return (
                        <TableRow
                          key={item.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedId === item.id ? "bg-primary/5" : ""
                          }`}
                          onClick={() => handleSelectItem(item.id)}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    item.type === "PRODUCT"
                                      ? "outline"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {item.type === "PRODUCT"
                                    ? "Product"
                                    : "Service"}
                                </Badge>
                                {item.categoryId && (
                                  <Badge variant="outline" className="text-xs">
                                    {getCategoryName(item.categoryId)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.type === "PRODUCT" &&
                            "primaryQuantity" in item ? (
                              <span
                                className={
                                  "minStockLevel" in item &&
                                  (item.primaryQuantity ?? 0) <=
                                    (item.minStockLevel || 0)
                                    ? "text-red-600 font-medium"
                                    : ""
                                }
                              >
                                {item.primaryQuantity} {unitInfo.shortName}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.type === "PRODUCT" &&
                            "secondaryQuantity" in item &&
                            (item.secondaryQuantity ?? 0) > 0 &&
                            unitInfo.secondaryUnitId ? (
                              <span>
                                {item.secondaryQuantity}{" "}
                                {
                                  getSecondaryUnitInfo(unitInfo.secondaryUnitId)
                                    .shortName
                                }
                              </span>
                            ) : (
                              "—"
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
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(item.id);
                                  }}
                                >
                                  Edit Item
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteItem(
                                      item.id,
                                      item.name,
                                      deleteItemMutation
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Item Details */}
        <div className="flex flex-col gap-4 w-full md:w-2/3">
          {/* Item Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedItem ? (
                    <div className="flex items-center gap-2">
                      {selectedItem.name}
                      <Badge
                        variant={
                          selectedItem.type === "PRODUCT"
                            ? "outline"
                            : "secondary"
                        }
                        className="ml-2"
                      >
                        {selectedItem.type === "PRODUCT"
                          ? "Product"
                          : "Service"}
                      </Badge>
                    </div>
                  ) : (
                    "Item Details"
                  )}
                </CardTitle>
                {selectedItem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(selectedItem.id)}
                  >
                    Edit Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedItem ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package2 className="h-16 w-16 text-gray-300 mb-2" />
                  <p className="text-lg font-medium text-gray-500">
                    Select an item to view details
                  </p>
                  <p className="text-sm text-gray-400 max-w-md mt-1">
                    Click on any item from the list to view its detailed
                    information and transaction history
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <Card className="border-0 shadow-none bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">
                            Pricing Information
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Sale Price
                            </p>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(selectedItem.salePrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Wholesale Price
                            </p>
                            <p className="text-lg font-semibold">
                              {selectedItem.wholesalePrice
                                ? formatCurrency(selectedItem.wholesalePrice)
                                : "—"}
                            </p>
                          </div>
                          {selectedItem.type === "PRODUCT" && (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Purchase Price
                                </p>
                                <p className="text-lg font-semibold">
                                  {"purchasePrice" in selectedItem &&
                                  selectedItem.purchasePrice
                                    ? formatCurrency(selectedItem.purchasePrice)
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Tax Rate
                                </p>
                                <p className="text-lg font-semibold">
                                  {selectedItem.taxRate
                                    ? `${selectedItem.taxRate}`
                                    : "No Tax"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {selectedItem.type === "PRODUCT" && (
                      <Card className="border-0 shadow-none bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <h3 className="font-medium text-sm">
                              Stock Information
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {(() => {
                              const unitInfo = getUnitInfo(selectedItem);
                              const secondaryUnitInfo = unitInfo.secondaryUnitId
                                ? getSecondaryUnitInfo(unitInfo.secondaryUnitId)
                                : null;

                              return (
                                <>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Primary Opening Quantity
                                    </p>
                                    <p
                                      className={`text-lg font-semibold ${
                                        "minStockLevel" in selectedItem &&
                                        selectedItem.primaryOpeningQuantity <=
                                          (selectedItem.minStockLevel || 0)
                                          ? "text-red-600"
                                          : ""
                                      }`}
                                    >
                                      {"primaryOpeningQuantity" in selectedItem
                                        ? `${
                                            selectedItem.primaryOpeningQuantity ||
                                            0
                                          } ${unitInfo.shortName}`
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Secondary Opening Quantity
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {"secondaryOpeningQuantity" in
                                        selectedItem &&
                                      selectedItem.secondaryOpeningQuantity >
                                        0 &&
                                      secondaryUnitInfo
                                        ? `${selectedItem.secondaryOpeningQuantity} ${secondaryUnitInfo.shortName}`
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Minimum Stock Level
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {"minStockLevel" in selectedItem
                                        ? `${selectedItem.minStockLevel || 0} ${
                                            unitInfo.shortName
                                          }`
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Stock Value
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {calculateStockValue(selectedItem)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Storage Location
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {"location" in selectedItem &&
                                      selectedItem.location
                                        ? selectedItem.location
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Price per Unit
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {"pricePerUnit" in selectedItem &&
                                      selectedItem.pricePerUnit
                                        ? `${formatCurrency(
                                            selectedItem.pricePerUnit
                                          )} / ${unitInfo.name}`
                                        : "—"}
                                    </p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div>
                    <Card className="border-0 shadow-none bg-gray-50 h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">
                            Additional Details
                          </h3>
                        </div>
                        <div className="space-y-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Item Code
                            </p>
                            <p className="text-base font-medium">
                              {selectedItem.itemCode || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              HSN Code
                            </p>
                            <p className="text-base font-medium">
                              {selectedItem.hsnCode || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Category
                            </p>
                            <p className="text-base font-medium">
                              {getCategoryName(selectedItem.categoryId)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Unit
                            </p>
                            <p className="text-base font-medium">
                              {(() => {
                                const unitInfo = getUnitInfo(selectedItem);
                                return `${unitInfo.name} (${unitInfo.shortName})`;
                              })()}
                            </p>
                          </div>

                          {selectedItem.unit_conversionId &&
                            unitConversions && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Unit Conversion
                                </p>
                                <p className="text-base font-medium">
                                  {(() => {
                                    const unitInfo = getUnitInfo(selectedItem);
                                    const secondaryUnitInfo =
                                      unitInfo.secondaryUnitId
                                        ? getSecondaryUnitInfo(
                                            unitInfo.secondaryUnitId
                                          )
                                        : null;

                                    return secondaryUnitInfo
                                      ? `1 ${unitInfo.name} = ${unitInfo.conversionRate} ${secondaryUnitInfo.name}`
                                      : "—";
                                  })()}
                                </p>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
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
                      <TableHead className="w-[120px]">Invoice No.</TableHead>
                      <TableHead className="w-[120px]">Party</TableHead>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[100px]">Rate</TableHead>
                      <TableHead className="text-right">Item Total</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {!selectedItem ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground"
                        >
                          Select an item to view its transaction history
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No transactions found for this item
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
                          <TableCell>{transaction.documentNumber}</TableCell>
                          <TableCell>{transaction.partyName}</TableCell>
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
                              {transaction.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                transaction.direction === "in"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }
                            >
                              {formatCurrency(transaction.rate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                transaction.direction === "in"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }
                            >
                              {formatCurrency(transaction.itemTotal)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Items;
