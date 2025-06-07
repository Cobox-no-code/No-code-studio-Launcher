"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isProduct } from "@/models/item/item.model";
import { useGetUnitConversionsQuery, useGetUnitsQuery } from "@/redux/api";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { useGetItemsQuery } from "@/redux/api/itemsApi";
import {
  AlertCircle as AlertCircleIcon,
  BarChart as BarChartIcon,
  Boxes,
  Download as DownloadIcon,
  FileText as FileTextIcon,
  Package,
  Printer as PrinterIcon,
  RefreshCw as RefreshCwIcon,
  Search as SearchIcon,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

const StockDetailsPage = () => {
  // State for filters
  const [categoryId, setCategoryId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const printRef = useRef<HTMLDivElement>(null);

  // Fetch products, categories, units, and conversions
  const {
    data: items,
    isLoading: isLoadingItems,
    isError: isItemsError,
    refetch: refetchItems,
  } = useGetItemsQuery({});

  const { data: categories } = useGetCategoriesQuery();
  const { data: units } = useGetUnitsQuery();
  const { data: unitConversions } = useGetUnitConversionsQuery();

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    if (!items) return [];

    // First, filter items
    let filtered = items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode &&
          item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const isLowStockProduct =
        lowStockOnly && isProduct(item)
          ? item.minStockLevel && item.currentQuantity < item.minStockLevel
          : true;

      // Filter by category if selected
      const matchesCategory = !categoryId || item.categoryId === categoryId;

      return (
        matchesSearch && isLowStockProduct && matchesCategory && isProduct(item)
      );
    });

    // Then, sort the filtered items
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = (a.salePrice || 0) - (b.salePrice || 0);
          break;
        case "quantity":
          const quantityA = isProduct(a) ? a.currentQuantity || 0 : 0;
          const quantityB = isProduct(b) ? b.currentQuantity || 0 : 0;
          comparison = quantityA - quantityB;
          break;
        case "value":
          const valueA = isProduct(a)
            ? (a.currentQuantity || 0) * (a.salePrice || 0)
            : 0;
          const valueB = isProduct(b)
            ? (b.currentQuantity || 0) * (b.salePrice || 0)
            : 0;
          comparison = valueA - valueB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [items, searchTerm, lowStockOnly, categoryId, sortBy, sortOrder]);

  // Create lookup maps for units and conversions
  const unitMap = React.useMemo(() => {
    return (
      units?.reduce((acc, unit) => {
        acc[unit.id] = unit;
        return acc;
      }, {} as Record<string, any>) || {}
    );
  }, [units]);

  const conversionMap = React.useMemo(() => {
    return (
      unitConversions?.reduce((acc, conv) => {
        acc[conv.id] = conv;
        return acc;
      }, {} as Record<string, any>) || {}
    );
  }, [unitConversions]);

  // Calculate stock values
  const stockValues = React.useMemo(() => {
    if (!filteredItems)
      return {
        totalStockValue: 0,
        totalItems: 0,
        lowStockItems: 0,
        categories: 0,
      };

    const totalStockValue = filteredItems.reduce((acc, item) => {
      if (isProduct(item)) {
        return acc + (item.currentQuantity || 0) * (item.salePrice || 0);
      }
      return acc;
    }, 0);

    const lowStockItems = filteredItems.filter((item) => {
      return (
        isProduct(item) &&
        item.minStockLevel &&
        item.currentQuantity < item.minStockLevel
      );
    }).length;

    const uniqueCategories = new Set(
      filteredItems.map((item) => item.categoryId)
    );

    return {
      totalStockValue,
      totalItems: filteredItems.length,
      lowStockItems,
      categories: uniqueCategories.size,
    };
  }, [filteredItems]);

  // Get unit names for an item
  const getUnitNames = React.useCallback(
    (item: any) => {
      if (!item.unit_conversionId || !conversionMap[item.unit_conversionId]) {
        return { primary: "N/A", secondary: "N/A", conversionRate: 0 };
      }

      const conversion = conversionMap[item.unit_conversionId];
      const primaryUnit = unitMap[conversion.primaryUnitId];
      const secondaryUnit = unitMap[conversion.secondaryUnitId];

      return {
        primary: primaryUnit ? primaryUnit.shortname : "N/A",
        secondary: secondaryUnit ? secondaryUnit.shortname : "N/A",
        conversionRate: conversion.conversionRate,
      };
    },
    [conversionMap, unitMap]
  );

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Stock Details",
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 15mm 10mm;
      }
    `,
    onAfterPrint: () => console.log("Print completed"),
  });

  // Get the company name and phone from localStorage if available
  const companyName =
    typeof window !== "undefined"
      ? localStorage.getItem("firmName") || "My Company"
      : "My Company";
  const companyPhone =
    typeof window !== "undefined"
      ? localStorage.getItem("firmPhone") || "9752133459"
      : "9752133459";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Stock Details</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrint()}
            className="flex items-center gap-1"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={() => handlePrint()}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <DownloadIcon className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="searchTerm"
                  placeholder="Search by name or code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lowStockOnly"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="lowStockOnly">Low Stock Only</Label>
              </div>

              <Button onClick={() => refetchItems()} className="h-10 gap-1">
                <RefreshCwIcon className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Sorting options */}
          <div className="flex flex-wrap gap-4 mt-4 items-center">
            <Label>Sort by:</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("name");
                    setSortOrder("asc");
                  }
                }}
              >
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>

              <Button
                variant={sortBy === "price" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "price") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("price");
                    setSortOrder("asc");
                  }
                }}
              >
                Price {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>

              <Button
                variant={sortBy === "quantity" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "quantity") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("quantity");
                    setSortOrder("asc");
                  }
                }}
              >
                Quantity{" "}
                {sortBy === "quantity" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>

              <Button
                variant={sortBy === "value" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "value") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("value");
                    setSortOrder("desc"); // Default to highest value first
                  }
                }}
              >
                Stock Value{" "}
                {sortBy === "value" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Stock Value</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-600">
                  ₹{stockValues.totalStockValue.toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {stockValues.totalItems} products
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600">
                  {stockValues.categories}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Product categories</p>
              </div>
              <BarChartIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600">
                  {stockValues.lowStockItems}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
              <AlertCircleIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600">
                  {stockValues.totalItems}
                </h3>
                <p className="text-xs text-gray-500 mt-1">In inventory</p>
              </div>
              <Boxes className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Details Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
            Stock Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoadingItems ? (
            <div className="space-y-3 print:hidden">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isItemsError ? (
            <Alert variant="destructive" className="print:hidden">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Failed to load stock data. Please try again.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto print:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                   
                    <TableHead>Item Name</TableHead>
                   
                    <TableHead className="text-right"> Primary Quantity</TableHead>
                      <TableHead className="text-right"> Secondary Quantity</TableHead>
                       <TableHead className="text-right"> Price Per unit</TableHead>
                    <TableHead className="text-right">
                      Stock Value (₹)
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      if (!isProduct(item)) return null;

                      const unitInfo = getUnitNames(item);
                      const stockValue =
                        (item.primaryQuantity || 0) * (item.salePrice || item.pricePerUnit || item.purchasePrice || 0);
                      const isLowStock =
                        item.minStockLevel &&
                        (item.primaryQuantity || 0) < item.minStockLevel;
                      const category = categories?.find(
                        (cat) => cat.id === item.categoryId
                      );

                      return (
                        <TableRow key={item.id}>
                       
                          <TableCell className="font-medium">
                             {item.name.length > 30
                                  ? item.name.slice(0, 20) + "..."
                                  : item.name}
                          </TableCell>
                     
                          <TableCell className="text-right">
                            {(item.primaryQuantity || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(item.secondaryQuantity || 0).toFixed(2)}
                          </TableCell>
                        
                          <TableCell className="text-right">
                            ₹{(item.purchasePrice || item.pricePerUnit).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{stockValue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            {isLowStock ? (
                              <Badge
                                variant="destructive"
                                className="bg-red-100 text-red-800 hover:bg-red-100"
                              >
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                In Stock
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-4 text-gray-500"
                      >
                        No stock items found matching your criteria
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
              <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">
                Stock Details Report
              </h3>
              <p className="text-sm mt-2">
                Generated on: {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Summary */}
            <div className="mb-6 border border-gray-300 p-4 bg-gray-50">
              <h4 className="text-base font-medium mb-3">Inventory Summary</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p>
                    <strong>Total Stock Value:</strong> ₹
                    {stockValues.totalStockValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Total Products:</strong> {stockValues.totalItems}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Low Stock Items:</strong>{" "}
                    {stockValues.lowStockItems}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Categories:</strong> {stockValues.categories}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Table */}
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">
                    Item Code
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Item Name
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Category
                  </th>
                  <th className="border border-gray-300 p-2 text-right">
                    Quantity
                  </th>
                  <th className="border border-gray-300 p-2 text-center">
                    Unit
                  </th>
                  <th className="border border-gray-300 p-2 text-right">
                    Sale Price (₹)
                  </th>
                  <th className="border border-gray-300 p-2 text-right">
                    Purchase Price (₹)
                  </th>
                  <th className="border border-gray-300 p-2 text-right">
                    Stock Value (₹)
                  </th>
                  <th className="border border-gray-300 p-2 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {!isLoadingItems &&
                !isItemsError &&
                filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    if (!isProduct(item)) return null;

                    const unitInfo = getUnitNames(item);
                    const stockValue =
                      (item.currentQuantity || 0) * (item.salePrice || 0);
                    const isLowStock =
                      item.minStockLevel &&
                      (item.currentQuantity || 0) < item.minStockLevel;
                    const category = categories?.find(
                      (cat) => cat.id === item.categoryId
                    );

                    return (
                      <tr key={item.id}>
                        <td className="border border-gray-300 p-2">
                          {item.itemCode || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-2 font-medium">
                          {item.name}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {category?.name || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {(item.currentQuantity || 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {unitInfo.primary}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {(item.salePrice || 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {(item.purchasePrice || 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {stockValue.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {isLowStock ? "Low Stock" : "In Stock"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="border border-gray-300 p-2 text-center"
                    >
                      No stock items found
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td
                    colSpan={7}
                    className="border border-gray-300 p-2 text-right"
                  >
                    Total:
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    ₹{stockValues.totalStockValue.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              </tfoot>
            </table>

            {/* Note */}
            <div className="mt-6 p-3 border border-gray-300 bg-gray-50 text-sm">
              <p>
                <strong>Note:</strong> This report shows detailed inventory
                levels and valuation for all products in stock. Stock value is
                calculated based on the current quantity and sale price of each
                item. Items marked as Low Stock have current quantities below
                their defined minimum stock levels.
              </p>
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
          td,
          th {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default StockDetailsPage;
