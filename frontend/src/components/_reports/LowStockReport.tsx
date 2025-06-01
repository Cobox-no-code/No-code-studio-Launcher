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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isProduct } from "@/models/item/item.model";
import { useGetUnitsQuery } from "@/redux/api";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { useGetItemsQuery } from "@/redux/api/itemsApi";
import { format } from "date-fns";
import {
  AlertCircle as AlertCircleIcon,
  Bell,
  BellRing,
  FileText as FileTextIcon,
  Mail,
  Package,
  Printer as PrinterIcon,
  RefreshCw as RefreshCwIcon,
  Search as SearchIcon,
  ShoppingBag,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

// Bar chart component using recharts
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#FF8042",
  "#FFBB28",
  "#00C49F",
  "#0088FE",
  "#8884d8",
  "#82ca9d",
];
const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  notice: "bg-blue-100 text-blue-800 border-blue-200",
};

const LowStockAlertPage = () => {
  // State for filters
  const [categoryId, setCategoryId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("severity");
  const [activeTab, setActiveTab] = useState<string>("alerts");

  const printRef = useRef<HTMLDivElement>(null);

  // Fetch products, categories, units
  const {
    data: items,
    isLoading: isLoadingItems,
    isError: isItemsError,
    refetch: refetchItems,
  } = useGetItemsQuery({});

  const { data: categories } = useGetCategoriesQuery();
  const { data: units } = useGetUnitsQuery();

  // Calculate severity based on stock level vs minimum stock level
  const calculateSeverity = (item: any) => {
    if (
      !isProduct(item) ||
      item.minStockLevel === undefined ||
      item.currentQuantity === undefined
    ) {
      return null;
    }

    const stockLevel = item.currentQuantity;
    const minStockLevel = item.minStockLevel;

    // Skip items with no minimum stock level set
    if (minStockLevel <= 0) return null;

    const stockPercentage = (stockLevel / minStockLevel) * 100;

    if (stockPercentage <= 25) {
      return "critical";
    } else if (stockPercentage <= 50) {
      return "warning";
    } else if (stockPercentage <= 75) {
      return "notice";
    }

    return null; // Not low stock
  };

  // Calculate days to reorder based on average daily consumption
  const calculateDaysToReorder = (item: any) => {
    // This would ideally be calculated based on historical consumption data
    // For this example, we'll use a simple estimation
    if (!isProduct(item) || item.currentQuantity === undefined) return null;

    // Let's assume a fixed consumption rate for demo purposes
    // In a real system, you would calculate this from sales history
    const estimatedDailyConsumption = 0.5;

    if (estimatedDailyConsumption <= 0) return null;

    return Math.ceil(item.currentQuantity / estimatedDailyConsumption);
  };

  // Process low stock items
  const lowStockItems = React.useMemo(() => {
    if (!items) return [];

    return items
      .filter((item) => {
        // Must be a product
        if (!isProduct(item)) return false;

        // Must have a severity level (i.e., be below threshold)
        const severity = calculateSeverity(item);
        if (!severity) return false;

        // Apply severity filter if set
        if (severityFilter !== "all" && severity !== severityFilter) {
          return false;
        }

        // Apply search filter if set
        if (searchTerm) {
          return (
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.itemCode &&
              item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        return true;
      })
      .map((item) => {
        const severity = calculateSeverity(item);
        const daysToReorder = calculateDaysToReorder(item);
        const category = categories?.find((cat) => cat.id === item.categoryId);
        const unit = units?.find((u) => u.id === item.unit_conversionId);

        return {
          ...item,
          severity,
          daysToReorder,
          categoryName: category?.name || "N/A",
          unitName: unit?.shortname || "pcs",
        };
      })
      .sort((a, b) => {
        // Sort by the selected criteria
        switch (sortBy) {
          case "severity":
            // Order: critical, warning, notice
            const severityOrder = { critical: 0, warning: 1, notice: 2 };
            return (
              (severityOrder[a.severity as keyof typeof severityOrder] || 0) -
              (severityOrder[b.severity as keyof typeof severityOrder] || 0)
            );
          case "quantity":
            return (a.currentQuantity || 0) - (b.currentQuantity || 0);
          case "percentage":
            const aPercent =
              ((a.currentQuantity || 0) / (a.minStockLevel || 1)) * 100;
            const bPercent =
              ((b.currentQuantity || 0) / (b.minStockLevel || 1)) * 100;
            return aPercent - bPercent;
          case "name":
            return a.name.localeCompare(b.name);
          case "days":
            return (a.daysToReorder || 0) - (b.daysToReorder || 0);
          default:
            return 0;
        }
      });
  }, [items, categories, units, searchTerm, severityFilter, sortBy]);

  // Get severity counts for summary
  const severityCounts = React.useMemo(() => {
    const counts = {
      critical: 0,
      warning: 0,
      notice: 0,
      total: 0,
    };

    if (!items) return counts;

    items.forEach((item) => {
      const severity = calculateSeverity(item);
      if (severity) {
        counts[severity as keyof typeof counts]++;
        counts.total++;
      }
    });

    return counts;
  }, [items]);

  // Create data for severity distribution chart
  const severityChartData = React.useMemo(() => {
    if (severityCounts.total === 0) return [];

    return [
      { name: "Critical", value: severityCounts.critical, color: "#EF4444" },
      { name: "Warning", value: severityCounts.warning, color: "#F59E0B" },
      { name: "Notice", value: severityCounts.notice, color: "#3B82F6" },
    ].filter((item) => item.value > 0);
  }, [severityCounts]);

  // Create data for category distribution of low stock items
  const categoryChartData = React.useMemo(() => {
    if (lowStockItems.length === 0) return [];

    const categoryMap = new Map();

    lowStockItems.forEach((item) => {
      const categoryName = item.categoryName;

      if (categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName) + 1);
      } else {
        categoryMap.set(categoryName, 1);
      }
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [lowStockItems]);

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Low Stock Alert Report",
    pageStyle: `
      @page {
        size: A4;
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
      ? localStorage.getItem("firmPhone") || ""
      : "";

  // Generate purchase order suggestions based on low stock items
  const purchaseOrderSuggestions = React.useMemo(() => {
    if (lowStockItems.length === 0) return [];

    // Group by supplier (in a real system, you'd have supplier data)
    // For now, we'll just group by category as a demonstration
    const supplierMap = new Map();

    lowStockItems.forEach((item) => {
      const categoryName = item.categoryName; // Using category as a proxy for supplier

      const orderQuantity = Math.max(
        (item.minStockLevel ?? 0) - (item.currentQuantity ?? 0),
        0
      );
      if (orderQuantity <= 0) return;

      if (supplierMap.has(categoryName)) {
        supplierMap.get(categoryName).items.push({
          id: item.id,
          name: item.name,
          currentStock: item.currentQuantity || 0,
          minStock: item.minStockLevel || 0,
          orderQuantity,
          unitName: item.unitName,
        });
      } else {
        supplierMap.set(categoryName, {
          supplier: categoryName,
          items: [
            {
              id: item.id,
              name: item.name,
              currentStock: item.currentQuantity || 0,
              minStock: item.minStockLevel || 0,
              orderQuantity,
              unitName: item.unitName,
            },
          ],
        });
      }
    });

    return Array.from(supplierMap.values());
  }, [lowStockItems]);

  // Format date for display
  const today = new Date();
  const formattedDate = format(today, "dd MMMM yyyy");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center">
          <BellRing className="mr-2 h-6 w-6 text-amber-500" />
          Low Stock Alerts
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrint()}
            className="flex items-center gap-1"
          >
            <PrinterIcon className="h-4 w-4" />
            Print Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Mail className="h-4 w-4" />
            Email Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="severity">Severity Level</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger id="severity">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sortBy">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="severity">
                    Severity (Highest First)
                  </SelectItem>
                  <SelectItem value="quantity">
                    Current Quantity (Lowest First)
                  </SelectItem>
                  <SelectItem value="percentage">
                    Stock Percentage (Lowest First)
                  </SelectItem>
                  <SelectItem value="days">
                    Days to Reorder (Lowest First)
                  </SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => refetchItems()} className="h-10 gap-1">
              <RefreshCwIcon className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <Card
          className={`border-red-200 ${
            lowStockItems.filter((item) => item.severity === "critical")
              .length > 0
              ? "bg-red-50"
              : "bg-gray-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Critical</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">
                  {severityCounts.critical}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Need immediate action
                </p>
              </div>
              <AlertCircleIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-amber-200 ${
            lowStockItems.filter((item) => item.severity === "warning").length >
            0
              ? "bg-amber-50"
              : "bg-gray-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Warning</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600">
                  {severityCounts.warning}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Reorder soon</p>
              </div>
              <Bell className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-blue-200 ${
            lowStockItems.filter((item) => item.severity === "notice").length >
            0
              ? "bg-blue-50"
              : "bg-gray-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Notice</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-600">
                  {severityCounts.notice}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Monitor closely</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Alerts</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-600">
                  {severityCounts.total}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  All low stock items
                </p>
              </div>
              <Package className="h-8 w-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs
        defaultValue="alerts"
        className="print:hidden"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="orders">Purchase Order Suggestions</TabsTrigger>
        </TabsList>

        {/* Low Stock Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Severity Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">
                  Alert Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingItems ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={severityChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {severityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} items`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>

                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {severityChartData.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-sm">
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Low Stock by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingItems ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={categoryChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Number of Items"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-gray-500">
                    No data available for chart
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Items Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <AlertCircleIcon className="h-4 w-4 mr-2 text-primary" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : isItemsError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load item data. Please try again.
                  </AlertDescription>
                </Alert>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No low stock items found
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                    All your items have sufficient stock levels. You can adjust
                    the filters or minimum stock levels if needed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">
                          Current Stock
                        </TableHead>
                        <TableHead className="text-center">
                          Min. Stock
                        </TableHead>
                        <TableHead className="text-center">Stock %</TableHead>
                        <TableHead className="text-center">
                          Est. Days Left
                        </TableHead>
                        <TableHead className="text-center w-[120px]">
                          Severity
                        </TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((item) => {
                        const stockPercentage =
                          ((item.currentQuantity || 0) /
                            (item.minStockLevel || 1)) *
                          100;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                              {item.itemCode && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Code: {item.itemCode}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{item.categoryName}</TableCell>
                            <TableCell className="text-center">
                              {item.currentQuantity?.toFixed(2)} {item.unitName}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.minStockLevel?.toFixed(2)} {item.unitName}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span
                                  className={`text-sm ${
                                    stockPercentage <= 25
                                      ? "text-red-600"
                                      : stockPercentage <= 50
                                      ? "text-amber-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {stockPercentage.toFixed(0)}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      stockPercentage <= 25
                                        ? "bg-red-600"
                                        : stockPercentage <= 50
                                        ? "bg-amber-600"
                                        : "bg-blue-600"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        stockPercentage,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.daysToReorder !== null ? (
                                <Badge
                                  className={`
                                  ${
                                    item.daysToReorder <= 3
                                      ? "bg-red-100 text-red-800"
                                      : item.daysToReorder <= 7
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                  }
                                `}
                                >
                                  {item.daysToReorder} days
                                </Badge>
                              ) : (
                                <span className="text-gray-500">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={`capitalize ${
                                  SEVERITY_COLORS[
                                    item.severity as keyof typeof SEVERITY_COLORS
                                  ]
                                }`}
                              >
                                {item.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                              >
                                <ShoppingBag className="h-3 w-3" />
                                Order
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Order Suggestions Tab */}
        <TabsContent value="orders" className="space-y-6">
          {isLoadingItems ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : purchaseOrderSuggestions.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">
                No purchase orders needed
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                There are no items that need to be ordered at this time.
              </p>
            </div>
          ) : (
            <>
              {purchaseOrderSuggestions.map((suggestion, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-gray-50">
                    <CardTitle className="text-md flex items-center justify-between">
                      <div className="flex items-center">
                        <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
                        Suggested Order: {suggestion.supplier}
                      </div>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <FileTextIcon className="h-3 w-3" />
                        Create PO
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-[300px]">Item</TableHead>
                          <TableHead className="text-center">
                            Current Stock
                          </TableHead>
                          <TableHead className="text-center">
                            Min. Stock
                          </TableHead>
                          <TableHead className="text-center">
                            Order Quantity
                          </TableHead>
                          <TableHead className="text-center">Unit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestion.items.map((item: any, idx: any) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.currentStock.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.minStock.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.orderQuantity.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.unitName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Printable report - only visible when printing */}
      <div ref={printRef} className="hidden print:block">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{companyName}</h2>
          {companyPhone && <p className="text-sm">Phone: {companyPhone}</p>}
          <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">
            Low Stock Alert Report
          </h3>
          <p className="text-sm mt-2">Date: {formattedDate}</p>
        </div>

        {/* Summary section */}
        <div className="mb-8 border border-gray-300 p-4 bg-gray-50">
          <h4 className="text-base font-medium mb-3">Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p>
                <strong>Critical Items:</strong> {severityCounts.critical}
              </p>
            </div>
            <div>
              <p>
                <strong>Warning Items:</strong> {severityCounts.warning}
              </p>
            </div>
            <div>
              <p>
                <strong>Notice Items:</strong> {severityCounts.notice}
              </p>
            </div>
          </div>
          <p className="mt-3">
            <strong>Total Low Stock Items:</strong> {severityCounts.total}
          </p>
        </div>

        {/* Low Stock Items Table */}
        <div className="mb-6">
          <h4 className="text-base font-medium mb-3 border-b border-gray-300 pb-2">
            Low Stock Items
          </h4>
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-left">Item</th>
                <th className="border border-gray-300 p-2 text-left">
                  Category
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Current Stock
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Min. Stock
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Stock %
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Est. Days Left
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item, index) => {
                const stockPercentage =
                  ((item.currentQuantity || 0) / (item.minStockLevel || 1)) *
                  100;

                return (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {item.name}
                      {item.itemCode && (
                        <div className="text-xs text-gray-500">
                          Code: {item.itemCode}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {item.categoryName}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {item.currentQuantity?.toFixed(2)} {item.unitName}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {item.minStockLevel?.toFixed(2)} {item.unitName}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {stockPercentage.toFixed(0)}%
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {item.daysToReorder !== null
                        ? `${item.daysToReorder} days`
                        : "N/A"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {item.severity}
                    </td>
                  </tr>
                );
              })}
              {lowStockItems.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-gray-300 p-2 text-center"
                  >
                    No low stock items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Purchase Order Suggestions */}
        <div className="mb-6">
          <h4 className="text-base font-medium mb-3 border-b border-gray-300 pb-2">
            Purchase Order Suggestions
          </h4>
          {purchaseOrderSuggestions.length === 0 ? (
            <p className="text-center py-4">
              No purchase orders needed at this time.
            </p>
          ) : (
            purchaseOrderSuggestions.map((suggestion, index) => (
              <div key={index} className="mb-6">
                <h5 className="text-sm font-medium mb-2">
                  Suggested Order: {suggestion.supplier}
                </h5>
                <table className="w-full border-collapse mb-4">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 p-2 text-left">
                        Item
                      </th>
                      <th className="border border-gray-300 p-2 text-center">
                        Current Stock
                      </th>
                      <th className="border border-gray-300 p-2 text-center">
                        Min. Stock
                      </th>
                      <th className="border border-gray-300 p-2 text-center">
                        Order Quantity
                      </th>
                      <th className="border border-gray-300 p-2 text-center">
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestion.items.map((item: any, idx: any) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 font-medium">
                          {item.name}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {item.currentStock.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {item.minStock.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-medium">
                          {item.orderQuantity.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {item.unitName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>

        {/* Note */}
        <div className="mt-8 p-3 border border-gray-300 bg-gray-50 text-sm">
          <p>
            <strong>Note:</strong> This report shows items that have fallen
            below their minimum stock levels. Items are categorized by severity
            based on the percentage of current stock compared to minimum stock:
            Critical (&lt;25%), Warning (25-50%), Notice (50-75%).
          </p>
        </div>
      </div>

      {/* Custom print styles */}
      <style jsx global>{`
        @media print {
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
          td,
          th {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default LowStockAlertPage;
