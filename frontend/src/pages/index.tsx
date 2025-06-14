"use client";
import DateRangeSelect from "@/components/DateRangeSelect";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyINR } from "@/hooks/utils";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowDown,
  ReceiptIndianRupee,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { useGetBankAccountsQuery } from "@/redux/api/bankingApi";
import {
  useGetPurchaseInvoicesQuery,
  useGetSaleInvoicesQuery,
} from "@/redux/api/documentApi";
import { useGetItemsQuery } from "@/redux/api/itemsApi";
import { useGetUnitConversionsQuery } from "@/redux/api/unitConversionsApi";
import { useGetUnitsQuery } from "@/redux/api/unitsApi";
const HomePage = () => {
  const [salesRange, setSalesRange] = useState("week");
  const [chartView, setChartView] = useState("line");
  function getDateRange(range: string) {
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);

    // Set times to start/end of day to ensure we capture all entries
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    switch (range) {
      case "today":
        // Start and end dates are already today
        break;
      case "week":
        // Start date is 7 days ago
        startDate.setDate(today.getDate() - 6);
        break;
      case "month":
        // Start date is first day of current month
        startDate.setDate(1);
        break;
      case "quarter":
        // Start date is 3 months ago, first day of month
        startDate.setMonth(today.getMonth() - 2, 1);
        break;
      case "year":
        // Start date is January 1st of current year
        startDate.setMonth(0, 1);
        break;
      default:
        // Default to week if invalid range
        startDate.setDate(today.getDate() - 6);
    }

    return {
      startDate: startDate,
      endDate: endDate,
    };
  }
  const { startDate: salesStart, endDate: salesEnd } = useMemo(() => {
    return getDateRange(salesRange);
  }, [salesRange]);

  const { data: units, isLoading: isLoadingUnits } = useGetUnitsQuery();
   const { data: unitConversions, isLoading: isLoadingConversions } =
     useGetUnitConversionsQuery();
  // Fetch data using RTK Query
  const {
    data: salesInvoices = [],
    isLoading: isLoadingSales,
    refetch: refetchSales,
  } = useGetSaleInvoicesQuery({
    startDate: format(salesStart, "yyyy-MM-dd"),
    endDate: format(salesEnd, "yyyy-MM-dd"),
  });

  const {
    data: purchaseInvoices = [],
    isLoading: isLoadingPurchases,
    refetch: refetchPurchase,
  } = useGetPurchaseInvoicesQuery({
    startDate: format(salesStart, "yyyy-MM-dd"),
    endDate: format(salesEnd, "yyyy-MM-dd"),
  });

  const {
    data: items = [],
    isLoading: isLoadingItems,
    refetch: refetchItems,
  } = useGetItemsQuery({});

  const {
    data: bankAccounts = [],
    isLoading: isLoadingBankAccounts,
    refetch: refetchBank,
  } = useGetBankAccountsQuery();

  const filteredSales = salesInvoices || [];
  const filteredPurchases = purchaseInvoices || [];
  // Calculate low stock items
  const lowStockItems = useMemo(() => {
    return items
      .filter(
        (item) =>
          item.type === "PRODUCT" &&
          item.primaryQuantity !== undefined &&
          item.minStockLevel !== undefined &&
          item.primaryQuantity <= item.minStockLevel
      )
      .map((item: any) => ({
        name: item.name,
        quantity: item.primaryQuantity,
        unit: "pcs", // Get actual unit from unit conversion
        minQuantity: item.minStockLevel,
        price: item.purchasePrice || 0,
      }))
      .sort((a, b) => a.quantity / a.minQuantity - b.quantity / b.minQuantity)
      .slice(0, 5);
  }, [items]);

  // Calculate totals
  const totalSales = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    [filteredSales]
  );

  // Calculate receivables
  const totalReceivables = useMemo(
    () =>
      filteredSales.reduce((sum, sale) => sum + (sale.balanceAmount || 0), 0),
    [filteredSales]
  );
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
  const formatCurrency = (amount: string | number | bigint) => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericAmount);
};
   // Calculate stock value considering both primary and secondary quantities
  const calculateStockValue = (item: any) => {
    if (!item || !item.purchasePrice) return 0;

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
    console.log("Calculating stock value for item:", totalValue, item);
    return totalValue > 0 ? totalValue : 0;
  };
  // Calculate stock value
  const stockValue = useMemo(
    () =>
      items
        .filter((item) => item.type === "PRODUCT")
        .reduce(
          (sum, item) =>
            sum + Number(calculateStockValue(item)),
          0
        ),
    [items]
  );

  // Format chart data by date
  const chartData = useMemo(() => {
    console.log("Re-calculating chart data");

    // Ensure dates are proper Date objects
    const start = new Date(salesStart);
    const end = new Date(salesEnd);

    console.log("Start date:", start.toISOString());
    console.log("End date:", end.toISOString());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Invalid date objects");
      return [];
    }

    // Create a map of dates to easily aggregate data
    const dateMap = new Map();

    // Initialize with dates from the date range
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      dateMap.set(dateStr, {
        date: format(currentDate, "dd MMM"),
        rawDate: dateStr,
        sales: 0,
        purchases: 0,
      });
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    console.log("Date map keys:", Array.from(dateMap.keys()));


    // Add sales data
    if (salesInvoices && salesInvoices.length > 0) {
      salesInvoices.forEach((sale) => {
        // Make sure we get just the date part and handle potential format issues
        const dateStr =
          typeof sale.documentDate === "string"
            ? sale.documentDate.split("T")[0]
            : format(new Date(sale.documentDate), "yyyy-MM-dd");

        if (dateMap.has(dateStr)) {
          const entry = dateMap.get(dateStr);
          entry.sales += Number(sale.total) || 0;
          dateMap.set(dateStr, entry);
        } else {
          console.log("Missing date in map:", dateStr);
        }
      });
    }

    // Add purchase data
    if (purchaseInvoices && purchaseInvoices.length > 0) {
      purchaseInvoices.forEach((purchase) => {
        // Make sure we get just the date part and handle potential format issues
        const dateStr =
          typeof purchase.documentDate === "string"
            ? purchase.documentDate.split("T")[0]
            : format(new Date(purchase.documentDate), "yyyy-MM-dd");

        if (dateMap.has(dateStr)) {
          const entry = dateMap.get(dateStr);
          entry.purchases += Number(purchase.total) || 0;
          dateMap.set(dateStr, entry);
        } else {
          console.log("Missing date in map:", dateStr);
        }
      });
    }

    // Convert map to array and sort by date
    const result = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
    );

    console.log("Chart data result:", result);
    return result;
  }, [salesInvoices, purchaseInvoices, salesStart, salesEnd]);
  // Calculate bank balances
  const totalCashInHand = useMemo(() => {
    const cashAccount = bankAccounts.find((account) =>
      account.displayName.toLowerCase().includes("cash")
    );
    return cashAccount?.currentBalance || 0;
  }, [bankAccounts]);

  const bankAccountsData = useMemo(
    () =>
      bankAccounts.filter(
        (account) => !account.displayName.toLowerCase().includes("cash")
      ),
    [bankAccounts]
  );

  const totalBankBalance = useMemo(
    () =>
      bankAccountsData.reduce(
        (sum, account) => sum + (account.currentBalance || 0),
        0
      ),
    [bankAccountsData]
  );
  useEffect(() => {
    // Immediately refetch data when component mounts
    refetchPurchase();
    refetchBank();
    refetchItems();
    refetchSales();
    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetchPurchase();
      refetchBank();
      refetchItems();
      refetchSales();
    }, 2000); // Adjust this time as needed

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetchPurchase, refetchBank, refetchItems, refetchSales]);
  return (
    <main className="flex flex-col md:flex-row gap-4 p-4 pt-3 w-full h-full bg-slate-50">
      <section className="gap-2 w-full md:w-3/4 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-xl">
                <div className="flex items-center gap-2">
                  <ReceiptIndianRupee className="text-amber-500" />
                  <span>Sales</span>
                </div>
                <DateRangeSelect
                  className="w-28"
                  onChange={(newRange) => {
                    setSalesRange(newRange);
                  }}
                  initialValue="month"
                />
              </CardTitle>
              <CardDescription>
                {isLoadingSales ? (
                  <Skeleton className="h-8 w-32 mb-2" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-black">
                      {formatCurrencyINR(totalSales)}
                    </p>
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp size={16} />
                      <span className="text-sm">
                        {filteredSales.length} invoices this {salesRange}
                      </span>
                    </div>
                  </>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Purchases Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 text-lg items-center">
                <ShoppingCart className="text-sky-500" strokeWidth={2.5} />
                Purchases
              </CardTitle>
              <CardDescription>
                {isLoadingPurchases ? (
                  <Skeleton className="h-8 w-32 mb-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-black">
                      {formatCurrencyINR(
                        filteredPurchases.reduce(
                          (sum, p) => sum + (p.total || 0),
                          0
                        )
                      )}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {filteredPurchases.length} purchase invoices
                    </p>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                value={
                  filteredPurchases.length > 0
                    ? (filteredPurchases.reduce(
                        (sum, p) => sum + (p.total || 0),
                        0
                      ) /
                        (totalSales || 1)) *
                      100
                    : 0
                }
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sales and Purchases Chart */}
        <Card className="w-full">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                Sales & Purchases Overview
              </CardTitle>
              <Tabs
                defaultValue="line"
                value={chartView}
                onValueChange={setChartView}
              >
                <TabsList className="grid w-48 grid-cols-3">
                  <TabsTrigger value="line">Line</TabsTrigger>
                  <TabsTrigger value="area">Area</TabsTrigger>
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {isLoadingSales || isLoadingPurchases ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-gray-500">
                  No sales or purchase data to display
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === "line" ? (
                  <LineChart
                    key={`line-${salesRange}`}
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatCurrencyINR(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#cb8c20"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="purchases"
                      stroke="#9c71e8"
                      strokeWidth={2}
                    />
                  </LineChart>
                ) : chartView === "area" ? (
                  <AreaChart
                    key={`area-${salesRange}`}
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatCurrencyINR(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      fill="#cb8c20"
                      stroke="#cb8c20"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="purchases"
                      fill="#9c71e8"
                      stroke="#9c71e8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    key={`bar-${salesRange}`}
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatCurrencyINR(value)}
                    />
                    <Legend />
                    <Bar dataKey="sales" fill="#cb8c20" />
                    <Bar dataKey="purchases" fill="#9c71e8" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Receivables Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 text-lg items-center">
                <ArrowDown className="text-emerald-500" strokeWidth={2.5} />
                You&apos;ll Receive
              </CardTitle>
              <CardDescription>
                {isLoadingSales ? (
                  <Skeleton className="h-8 w-32 mb-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-black">
                      {formatCurrencyINR(totalReceivables)}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Outstanding payments
                    </p>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                value={
                  totalReceivables > 0
                    ? (totalReceivables / (totalSales || 1)) * 100
                    : 0
                }
                className="h-2"
              />
            </CardContent>
          </Card>

          {/* Stock Value Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 text-lg items-center">
                <ShoppingCart className="text-sky-500" strokeWidth={2.5} />
                Stock Value
              </CardTitle>
              <CardDescription>
                {isLoadingItems ? (
                  <Skeleton className="h-8 w-32 mb-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-black">
                      {formatCurrencyINR(stockValue)}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {items.filter((i) => i.type === "PRODUCT").length}{" "}
                      products in inventory
                    </p>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={100} className="h-2" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="w-full md:w-1/4 flex flex-col gap-4">
        {/* Low Stock Items */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {isLoadingItems ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              ) : lowStockItems && lowStockItems.length > 0 ? (
                <div className="divide-y">
                  {lowStockItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium">
                          {" "}
                          {item.name.length > 30
                            ? item.name.slice(0, 20) + "..."
                            : item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} {item.unit} left
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.quantity <= item.minQuantity / 3
                            ? "destructive"
                            : "default"
                        }
                      >
                        Low
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No low stock items
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cash & Bank Section */}
        {/* <div className="mt-2">
          <h3 className="text-sm font-medium ml-1 mb-2 text-gray-500">Cash & Bank</h3>
          <Card className="p-4">
            <CardTitle className="text-lg mb-3">Cash In Hand</CardTitle>
            {isLoadingBankAccounts ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-green-600 font-semibold text-xl">
                {formatCurrencyINR(totalCashInHand)}
              </p>
            )}
          </Card>
        </div> */}

        {/* Bank Accounts */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {isLoadingBankAccounts ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : bankAccountsData && bankAccountsData.length > 0 ? (
                <div className="divide-y">
                  {bankAccountsData.map((account, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium">{account.displayName}</p>
                        <p className="text-sm text-gray-500">
                          {account.accountHolderName}
                        </p>
                      </div>
                      <p
                        className={`font-semibold ${
                          account.currentBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrencyINR(account.currentBalance)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No bank accounts added
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default HomePage;
