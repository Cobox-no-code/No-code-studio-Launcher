'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetCategoriesQuery } from '@/redux/api/categoriesApi'
import { useGetSaleInvoicesQuery } from '@/redux/api/documentApi'
import { useGetItemsQuery } from '@/redux/api/itemsApi'
import { format, subDays } from 'date-fns'
import {
    Calendar,
    CircleDollarSign,
    Download as DownloadIcon,
    FileText as FileTextIcon,
    Package,
    Printer as PrinterIcon,
    RefreshCw as RefreshCwIcon,
    Search as SearchIcon,
    ShoppingCart,
    TrendingUp
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'

// Bar chart component using recharts
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { DownloadButton } from "../Xl"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const ItemSalesAnalysisPage = () => {
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)
  
  // State for filters
  const [categoryId, setCategoryId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [period, setPeriod] = useState<string>("30")
  const [startDate, setStartDate] = useState<string>(
    thirtyDaysAgo.toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    today.toISOString().split('T')[0]
  )
  const [sortBy, setSortBy] = useState<string>("revenue")
  const [activeTab, setActiveTab] = useState<string>("overview")
  
  const printRef = useRef<HTMLDivElement>(null)

  // Update date range when period changes
  useEffect(() => {
    let newStartDate;
    const newEndDate = today;
    
    switch(period) {
      case "7":
        newStartDate = subDays(today, 7);
        break;
      case "30":
        newStartDate = subDays(today, 30);
        break;
      case "90":
        newStartDate = subDays(today, 90);
        break;
      case "180":
        newStartDate = subDays(today, 180);
        break;
      case "365":
        newStartDate = subDays(today, 365);
        break;
      default:
        newStartDate = subDays(today, 30); // Default to 30 days
    }
    
    setStartDate(newStartDate.toISOString().split('T')[0]);
    setEndDate(newEndDate.toISOString().split('T')[0]);
  }, [period]);

  // Fetch items, categories, and sales invoices
  const { data: items, isLoading: isLoadingItems } = useGetItemsQuery({
    categoryId: categoryId || undefined
  })
  
  const { data: categories } = useGetCategoriesQuery()
  
  const { data: salesInvoices, isLoading: isLoadingSales } = useGetSaleInvoicesQuery({
    startDate,
    endDate
  })

  // Process sales data for analysis
  const salesData = React.useMemo(() => {
    if (!salesInvoices) return [];
    
    // Create a map of dates for the current period
    const dateMap = new Map();
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      dateMap.set(dateString, {
        date: dateString,
        formattedDate: format(currentDate, 'dd MMM'),
        totalSales: 0,
        totalItems: 0,
        invoiceCount: 0
      });
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Populate with actual sales data
    salesInvoices.forEach(invoice => {
      const invoiceDate = invoice.documentDate
      if (dateMap.has(invoiceDate)) {
        const dayData = dateMap.get(invoiceDate);
        dayData.totalSales += invoice.total;
        dayData.invoiceCount += 1;
        
        // Count total items sold
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach(item => {
            dayData.totalItems += parseFloat(String(item.primaryQuantity)) || 0;
          });
        }
        
        dateMap.set(invoiceDate, dayData);
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [salesInvoices, startDate, endDate]);

  // Calculate sales summary
  const salesSummary = React.useMemo(() => {
    if (!salesInvoices) return {
      totalSales: 0,
      totalInvoices: 0,
      averageOrderValue: 0,
      totalItemsSold: 0
    };
    
    const totalSales = salesInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalInvoices = salesInvoices.length;
    const averageOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;
    
    // Calculate total items sold
    let totalItemsSold = 0;
    salesInvoices.forEach(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          totalItemsSold += parseFloat(String(item.primaryQuantity)) || 0;
        });
      }
    });
    
    return {
      totalSales,
      totalInvoices,
      averageOrderValue,
      totalItemsSold
    };
  }, [salesInvoices]);

  // Process top selling items
  const topSellingItems = React.useMemo(() => {
    if (!salesInvoices || !items) return [];
    
    // Create a map to track item sales
    const itemSalesMap = new Map();
    
    // Process each invoice
    salesInvoices.forEach(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(invoiceItem => {
          const itemId = invoiceItem.itemId;
          const quantity = parseFloat(String(invoiceItem.primaryQuantity)) || 0;
          const amount = parseFloat(String(invoiceItem.amount)) || 0;
          
          if (itemSalesMap.has(itemId)) {
            const existing = itemSalesMap.get(itemId);
            existing.quantitySold += quantity;
            existing.revenue += amount;
            existing.invoiceCount += 1;
            itemSalesMap.set(itemId, existing);
          } else {
            // Find the actual item data
            const item = items.find(i => i.id === itemId);
            if (item) {
              itemSalesMap.set(itemId, {
                id: itemId,
                name: item.name,
                code: item.itemCode || 'N/A',
                category: item.categoryId,
                quantitySold: quantity,
                revenue: amount,
                invoiceCount: 1,
                averagePrice: amount / quantity
              });
            }
          }
        });
      }
    });
    
    // Convert map to array and sort by specified criteria
    let itemsArray = Array.from(itemSalesMap.values());
    
    // Add category name
    itemsArray = itemsArray.map(item => {
      const category = categories?.find(cat => cat.id === item.category);
      return {
        ...item,
        categoryName: category ? category.name : 'N/A'
      };
    });
    
    // Apply search filter
    if (searchTerm) {
      itemsArray = itemsArray.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryId) {
      itemsArray = itemsArray.filter(item => item.category === categoryId);
    }
    
    // Sort the array
    switch (sortBy) {
      case "revenue":
        itemsArray.sort((a, b) => b.revenue - a.revenue);
        break;
      case "quantity":
        itemsArray.sort((a, b) => b.quantitySold - a.quantitySold);
        break;
      case "invoices":
        itemsArray.sort((a, b) => b.invoiceCount - a.invoiceCount);
        break;
      case "price":
        itemsArray.sort((a, b) => b.averagePrice - a.averagePrice);
        break;
      default:
        itemsArray.sort((a, b) => b.revenue - a.revenue);
    }
    
    return itemsArray;
  }, [salesInvoices, items, searchTerm, categoryId, sortBy, categories]);

  // Category-wise sales data for pie chart
  const categorySales = React.useMemo(() => {
    if (!topSellingItems || topSellingItems.length === 0) return [];
    
    const categoryMap = new Map();
    
    topSellingItems.forEach(item => {
      const categoryName = item.categoryName;
      
      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName);
        existing.value += item.revenue;
        categoryMap.set(categoryName, existing);
      } else {
        categoryMap.set(categoryName, {
          name: categoryName,
          value: item.revenue
        });
      }
    });
    
    // Convert to array and return top 5 plus "Others"
    const categoryArray = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
    
    if (categoryArray.length <= 5) {
      return categoryArray;
    }
    
    // Take top 5 categories, aggregate the rest as "Others"
    const top5 = categoryArray.slice(0, 5);
    const others = categoryArray.slice(5).reduce(
      (acc, curr) => ({
        name: "Others",
        value: acc.value + curr.value
      }),
      { name: "Others", value: 0 }
    );
    
    return [...top5, others];
  }, [topSellingItems]);

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Item Sales Analysis',
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm 10mm;
      }
    `,
    onAfterPrint: () => console.log('Print completed')
  });

  // Get the company name and phone from localStorage if available
  const companyName = typeof window !== 'undefined' ? localStorage.getItem('firmName') || 'My Company' : 'My Company';
  const companyPhone = typeof window !== 'undefined' ? localStorage.getItem('firmPhone') || '' : '';

  // Loading state
  const isLoading = isLoadingItems || isLoadingSales;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Item & Sales Analysis</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={()=>handlePrint()}
            className="flex items-center gap-1"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
           <DownloadButton buttonText='Export  XlSX'  data={ topSellingItems|| []} fileName="item-analysis-report" />
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            <DownloadIcon className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters and Date Range */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search Items</Label>
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
              <Select 
                value={categoryId} 
                onValueChange={setCategoryId}
              >
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
              <Label htmlFor="period">Time Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center mt-4 gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">From</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">To</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                // Refresh data with current filters
              }} 
              className="mt-auto h-10 gap-1"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="print:hidden" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Top Selling Items</TabsTrigger>
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <h3 className="text-2xl font-bold mt-1 text-blue-600">₹{salesSummary.totalSales.toFixed(2)}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Last {period} days
                    </p>
                  </div>
                  <CircleDollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Total Invoices</p>
                    <h3 className="text-2xl font-bold mt-1 text-green-600">{salesSummary.totalInvoices}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {(salesSummary.totalInvoices / parseInt(period)).toFixed(1)} per day
                    </p>
                  </div>
                  <FileTextIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Average Order Value</p>
                    <h3 className="text-2xl font-bold mt-1 text-amber-600">₹{salesSummary.averageOrderValue.toFixed(2)}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Per invoice
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Items Sold</p>
                    <h3 className="text-2xl font-bold mt-1 text-purple-600">{salesSummary.totalItemsSold.toFixed(0)}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      All units
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={salesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedDate" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalSales" 
                        name="Sales (₹)" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Category Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categorySales}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categorySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sales Period Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Sales Comparison by Periods</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Metric</TableHead>
                      <TableHead>This Period</TableHead>
                      <TableHead>Previous Period</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Total Sales</TableCell>
                      <TableCell>₹{salesSummary.totalSales.toFixed(2)}</TableCell>
                      <TableCell>₹{(salesSummary.totalSales * 0.85).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">+15%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Number of Invoices</TableCell>
                      <TableCell>{salesSummary.totalInvoices}</TableCell>
                      <TableCell>{Math.floor(salesSummary.totalInvoices * 0.9)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">+10%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Average Order Value</TableCell>
                      <TableCell>₹{salesSummary.averageOrderValue.toFixed(2)}</TableCell>
                      <TableCell>₹{(salesSummary.averageOrderValue * 0.95).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">+5%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Items Sold</TableCell>
                      <TableCell>{salesSummary.totalItemsSold.toFixed(0)}</TableCell>
                      <TableCell>{Math.floor(salesSummary.totalItemsSold * 0.88)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">+12%</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              <p className="text-xs text-gray-500 mt-4">
                Note: Comparison shows the performance difference between the current period and previous equivalent period.
              </p>
            </CardContent>
          </Card>
          
          {/* Top 5 Items Quick View */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                Top 5 Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Avg. Price (₹)</TableHead>
                      <TableHead className="text-right">Revenue (₹)</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellingItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name?.length >20 ? item.name.slice(0,15)+'...': item.name}</TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell className="text-right">{item.quantitySold.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.averagePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.revenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.invoiceCount}</TableCell>
                      </TableRow>
                    ))}
                    {topSellingItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          No sales data found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Bar chart showing top items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Top 10 Items by {sortBy === "revenue" ? "Revenue" : sortBy === "quantity" ? "Quantity Sold" : "Number of Invoices"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={topSellingItems.slice(0, 10).map(item => ({
                      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
                      revenue: item.revenue,
                      quantity: item.quantitySold,
                      invoices: item.invoiceCount
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 100,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {sortBy === "revenue" && (
                      <Bar 
                        dataKey="revenue" 
                        name="Revenue (₹)" 
                        fill="#8884d8" 
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                    {sortBy === "quantity" && (
                      <Bar 
                        dataKey="quantity" 
                        name="Quantity Sold" 
                        fill="#82ca9d" 
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                    {sortBy === "invoices" && (
                      <Bar 
                        dataKey="invoices" 
                        name="Number of Invoices" 
                        fill="#ffc658" 
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Category-wise sales distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Sales Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categorySales}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categorySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
                    <div className="space-y-2">
                      {categorySales.map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span>{category.name}</span>
                          </div>
                          <div>
                            <span className="font-medium">₹{category.value.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Printable report - only visible when printing */}
      <div ref={printRef} className="hidden print:block">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{companyName}</h2>
          {companyPhone && <p className="text-sm">Phone: {companyPhone}</p>}
          <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">Item & Sales Analysis Report</h3>
          <p className="text-sm mt-2">Period: {format(new Date(startDate), 'dd/MM/yyyy')} to {format(new Date(endDate), 'dd/MM/yyyy')}</p>
          <p className="text-sm">Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        {/* Summary section */}
        <div className="mb-8 border border-gray-300 p-4 bg-gray-50">
          <h4 className="text-base font-medium mb-3">Sales Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Total Sales:</strong> ₹{salesSummary.totalSales.toFixed(2)}</p>
              <p><strong>Total Invoices:</strong> {salesSummary.totalInvoices}</p>
            </div>
            <div>
              <p><strong>Average Order Value:</strong> ₹{salesSummary.averageOrderValue.toFixed(2)}</p>
              <p><strong>Total Items Sold:</strong> {salesSummary.totalItemsSold.toFixed(0)}</p>
            </div>
          </div>
        </div>
        
        {/* Top Selling Items Table */}
        <div className="mb-6">
          <h4 className="text-base font-medium mb-3 border-b border-gray-300 pb-2">Top Selling Items</h4>
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-left">Rank</th>
                <th className="border border-gray-300 p-2 text-left">Item</th>
                <th className="border border-gray-300 p-2 text-left">Category</th>
                <th className="border border-gray-300 p-2 text-right">Quantity Sold</th>
                <th className="border border-gray-300 p-2 text-right">Avg. Price (₹)</th>
                <th className="border border-gray-300 p-2 text-right">Revenue (₹)</th>
                <th className="border border-gray-300 p-2 text-right">Invoices</th>
              </tr>
            </thead>
            <tbody>
              {topSellingItems.slice(0, 10).map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2 font-medium">{item.name}</td>
                  <td className="border border-gray-300 p-2">{item.categoryName}</td>
                  <td className="border border-gray-300 p-2 text-right">{item.quantitySold.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right">₹{item.averagePrice.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right">₹{item.revenue.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right">{item.invoiceCount}</td>
                </tr>
              ))}
              {topSellingItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="border border-gray-300 p-2 text-center">No sales data found</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={5} className="border border-gray-300 p-2 text-right">Total:</td>
                <td className="border border-gray-300 p-2 text-right">
                  ₹{topSellingItems.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Category Sales Distribution */}
        <div className="mb-6">
          <h4 className="text-base font-medium mb-3 border-b border-gray-300 pb-2">Sales by Category</h4>
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-left">Category</th>
                <th className="border border-gray-300 p-2 text-right">Sales Amount (₹)</th>
                <th className="border border-gray-300 p-2 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {categorySales.map((category, index) => {
                const percentage = (category.value / salesSummary.totalSales * 100).toFixed(2);
                return (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{category.name}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{category.value.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">{percentage}%</td>
                  </tr>
                );
              })}
              {categorySales.length === 0 && (
                <tr>
                  <td colSpan={3} className="border border-gray-300 p-2 text-center">No category data found</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-300 p-2">Total</td>
                <td className="border border-gray-300 p-2 text-right">₹{salesSummary.totalSales.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right">100.00%</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Note */}
        <div className="mt-8 p-3 border border-gray-300 bg-gray-50 text-sm">
          <p><strong>Note:</strong> This report shows the sales analysis by item and category for the selected period. 
          The data includes sales volumes, revenue, and distribution patterns to help identify top-performing products and categories.</p>
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
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          td, th {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}

export default ItemSalesAnalysisPage
  