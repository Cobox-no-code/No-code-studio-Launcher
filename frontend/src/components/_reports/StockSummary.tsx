"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useGetItemsQuery } from "@/redux/api/itemsApi";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { useGetUnitConversionsQuery, useGetUnitsQuery } from "@/redux/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download as DownloadIcon,
  FileText as FileTextIcon,
  Printer as PrinterIcon,
  AlertCircle as AlertCircleIcon,
  Search as SearchIcon,
  RefreshCw as RefreshCwIcon,
  FileSpreadsheet,
  Package,
  Boxes,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StockSummaryReport = () => {
  // State for filters
  const [categoryId, setCategoryId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

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

  // Filter items by search term and low stock if enabled
  const filteredItems = items?.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemCode &&
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const isLowStock = lowStockOnly
      ? item.minStockLevel && item.primaryOpeningQuantity < item.minStockLevel
      : true;

    return matchesSearch && isLowStock && item.type === "PRODUCT";
  });

  // Create lookup maps for units and conversions
  const unitMap =
    units?.reduce((acc, unit) => {
      acc[unit.id] = unit;
      return acc;
    }, {} as Record<string, any>) || {};

  const conversionMap =
    unitConversions?.reduce((acc, conv) => {
      acc[conv.id] = conv;
      return acc;
    }, {} as Record<string, any>) || {};

  // Calculate stock values
  const calculateStockValues = () => {
    if (!filteredItems)
      return { totalStockValue: 0, totalPrimaryQty: 0, totalSecondaryQty: 0 };

    return filteredItems.reduce(
      (acc, item) => {
        const stockValue = item.primaryOpeningQuantity * item.salePrice;

        acc.totalStockValue += stockValue;
        acc.totalPrimaryQty += item.primaryOpeningQuantity || 0;
        acc.totalSecondaryQty += item.secondaryOpeningQuantity || 0;

        return acc;
      },
      { totalStockValue: 0, totalPrimaryQty: 0, totalSecondaryQty: 0 }
    );
  };

  const stockValues = calculateStockValues();

  // Get unit names for an item
  const getUnitNames = (item: any) => {
    if (!item.unit_conversionId || !conversionMap[item.unit_conversionId]) {
      return { primary: "N/A", secondary: "N/A" };
    }

    const conversion = conversionMap[item.unit_conversionId];
    const primaryUnit = unitMap[conversion.primaryUnitId];
    const secondaryUnit = unitMap[conversion.secondaryUnitId];

    return {
      primary: primaryUnit ? primaryUnit.shortname : "N/A",
      secondary: secondaryUnit ? secondaryUnit.shortname : "N/A",
    };
  };

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Stock Summary",
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
        <h1 className="text-2xl font-semibold">Stock Summary</h1>
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
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handlePrint()}
          >
            <DownloadIcon className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
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
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Stock Value</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-600">
                  ₹{stockValues.totalStockValue.toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredItems?.length || 0} products
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
                <p className="text-sm text-gray-500">Total Primary Quantity</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600">
                  {stockValues.totalPrimaryQty.toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Various units</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">
                  Total Secondary Quantity
                </p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600">
                  {stockValues.totalSecondaryQty.toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Various units</p>
              </div>
              <Boxes className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Summary Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
            Stock Items
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

                    <TableHead className="text-right">Primary Qty</TableHead>

                    <TableHead className="text-right">Secondary Qty</TableHead>

                    <TableHead className="text-right">
                      Stock Value (₹)
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems && filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const unitNames = getUnitNames(item);
                      const stockValue =
                        (item.primaryOpeningQuantity || 0) *
                        (item.salePrice || 0);
                      const isLowStock =
                        item.minStockLevel &&
                        (item.primaryOpeningQuantity || 0) < item.minStockLevel;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>

                          <TableCell className="text-right">
                            {(item.primaryOpeningQuantity || 0).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right">
                            {(item.secondaryOpeningQuantity || 0).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right font-medium">
                            {stockValue.toFixed(2)}
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
                        colSpan={10}
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
                Stock Summary
              </h3>
            </div>

            {/* Summary */}
            <div className="mb-6 border border-gray-300 p-4 bg-gray-50">
              <h4 className="text-base font-medium mb-3">Inventory Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p>
                    <strong>Total Stock Value:</strong> ₹
                    {stockValues.totalStockValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Primary Quantity:</strong>{" "}
                    {stockValues.totalPrimaryQty.toFixed(2)} units
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Secondary Quantity:</strong>{" "}
                    {stockValues.totalSecondaryQty.toFixed(2)} units
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
                  <th className="border border-gray-300 p-2 text-left">
                    Primary Qty
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Primary Unit
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Secondary Qty
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Secondary Unit
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Sale Price (₹)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Stock Value (₹)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {!isLoadingItems &&
                !isItemsError &&
                filteredItems &&
                filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const unitNames = getUnitNames(item);
                    const stockValue =
                      (item.primaryOpeningQuantity || 0) *
                      (item.salePrice || 0);
                    const isLowStock =
                      item.minStockLevel &&
                      (item.primaryOpeningQuantity || 0) < item.minStockLevel;

                    return (
                      <tr key={item.id}>
                        <td className="border border-gray-300 p-2">
                          {item.itemCode || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-2 font-medium">
                          {item.name}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {categories?.find((cat) => cat.id === item.categoryId)
                            ?.name || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {(item.primaryOpeningQuantity || 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {unitNames.primary}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {(item.secondaryOpeningQuantity || 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {unitNames.secondary}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {(item.salePrice || 0).toFixed(2)}
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
                      colSpan={10}
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
                    colSpan={8}
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
                <strong>Note:</strong> This report shows the current stock
                levels with primary and secondary quantities. Primary quantities
                represent the base unit (e.g., boxes), while secondary
                quantities show the equivalent in another unit (e.g., individual
                items). Stock value is calculated based on the sales price of
                each item.
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

export default StockSummaryReport;
