'use client'
import React, { ChangeEvent, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import { openModal } from '@/redux/slices/modal'
import { 
  useGetCategoriesQuery, 
  useGetItemsQuery, 
  useGetUnitsQuery,
  useGetUnitConversionsQuery
} from '@/redux/api'

// UI Components
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Icons
import {
  EllipsisVertical,
  AlertCircle,
  Plus,
  Search,
  Archive,
  Package2,
  FileBox,
  FolderOpen,
  X,
  FileText,
  Layers,
  LoaderCircle,
  Tag,
  FolderClosed
} from 'lucide-react'
import { openCreateForm, openEditForm } from '@/redux/slices/categorySlice'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Helper to format currency
const formatCurrency = (amount: string | number) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(numericAmount);
};

const Categories = () => {
  const dispatch = useDispatch<AppDispatch>()
  
  // State for search filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterItems, setFilterItems] = useState('')
  
  // State for selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  // Use RTK Query to fetch categories and items
  const {
    data: categories,
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    error: categoriesError
  } = useGetCategoriesQuery();
  
  const {
    data: items,
    isLoading: isLoadingItems,
    isError: isItemsError,
    error: itemsError
  } = useGetItemsQuery({});

  const { data: units, isLoading: isLoadingUnits } = useGetUnitsQuery();
  const { data: unitConversions, isLoading: isLoadingConversions } = useGetUnitConversionsQuery();
    
  // Helper functions to get names from IDs
  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId || !categories) return '—'
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : '—'
  }
  
  // Get unit details based on unitId or unit_conversionId
  const getUnitInfo = (item:any) => {
    if (!units) return { name: '—', shortName: '' }
    
    // First try to get unit from unit_conversionId
    if (item.unit_conversionId && unitConversions) {
      const conversion = unitConversions.find(uc => uc.id === item.unit_conversionId)
      if (conversion) {
        const unit = units.find(u => u.id === conversion.primaryUnitId)
        return {
          name: unit ? unit.fullname : '—',
          shortName: unit ? unit.shortname : '',
          secondaryUnitId: conversion.secondaryUnitId,
          conversionRate: conversion.conversionRate || 1
        }
      }
    }
    
    // Fallback to unitId for backward compatibility
    if (item.unitId) {
      const unit = units.find(u => u.id === item.unitId)
      return {
        name: unit ? unit.fullname : '—',
        shortName: unit ? unit.shortname : '',
        conversionRate: 1
      }
    }
    
    return { name: '—', shortName: '', conversionRate: 1 }
  }
  
  // Get secondary unit info
  const getSecondaryUnitInfo = (secondaryUnitId:any) => {
    if (!secondaryUnitId || !units) return { name: '—', shortName: '' }
    const unit = units.find(u => u.id === secondaryUnitId)
    return {
      name: unit ? unit.fullname : '—',
      shortName: unit ? unit.shortname : ''
    }
  }
  
  // Calculate stock value for a single item
  const calculateItemStockValue = (item:any) => {
    if (!item || item.type !== 'PRODUCT' || !item.purchasePrice) return 0;
    
    let totalValue = 0;
    const unitInfo = getUnitInfo(item);
    
    // Add primary quantity value
    if (item.primaryOpeningQuantity) {
      totalValue += item.primaryOpeningQuantity * item.purchasePrice;
    }
    
    // Add secondary quantity value if exists
    if (item.secondaryOpeningQuantity && unitInfo.conversionRate) {
      // Convert secondary units to primary units for value calculation
      const primaryEquivalent = item.secondaryOpeningQuantity / unitInfo.conversionRate;
      totalValue += primaryEquivalent * item.purchasePrice;
    }
    
    return totalValue;
  }
  
  // Get items without a category
  const uncategorizedItems = items?.filter(item => !item.categoryId || item.categoryId === '');
  
  // Get items for the selected category
  const categoryItems = selectedCategoryId 
    ? items?.filter(item => item.categoryId === selectedCategoryId)
    : uncategorizedItems;
  
  // Filtered items based on search input
  const filteredCategoryItems = categoryItems?.filter(item => 
    item.name.toLowerCase().includes(filterItems.toLowerCase())
  );
  
  // Filtered categories based on search input
  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(filterCategory.toLowerCase())
  );
  
  // Selected category details
  const selectedCategory = selectedCategoryId 
    ? categories?.find(category => category.id === selectedCategoryId) 
    : null;
  
  // Calculate summary statistics
  const totalCategories = categories?.length || 0;
  const totalItems = items?.length || 0;
  const uncategorizedItemsCount = uncategorizedItems?.length || 0;
  const selectedCategoryItemsCount = categoryItems?.length || 0;
  
  // Calculate total stock value of selected category items
  const calculateTotalStockValue = (items: any[] | undefined) => {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      return total + calculateItemStockValue(item);
    }, 0);
  };
  
  const totalStockValue = calculateTotalStockValue(categoryItems);
  
  // Open modals
  const openCreateModal = () => {
    dispatch(openCreateForm())
  }
  
  const openEditModal = (itemId: string) => {
    dispatch(openEditForm(itemId))
  }
  
  const open = (types: string, id: string = '') => {
    if (types === 'Category') {
      dispatch(
        openModal({
          type: types,
          index: id,
        })
      )
    } else {
      dispatch(
        openModal({
          type: types,
        })
      )
    }
  }
  
  // Handle move items to category
  const handleMoveToCategory = () => {
    if (!selectedCategoryId) return;
    
    dispatch(
      openModal({
        type: 'MoveToCategory',
        index: selectedCategoryId,
      })
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header with stats */}
      <div className="flex flex-wrap gap-4">
        <Card className="w-full md:w-[calc(33.33%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{totalCategories}</p>
            </div>
            <FolderClosed className="h-8 w-8 text-primary opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(33.33%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
            <Package2 className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-[calc(33.33%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Uncategorized Items
              </p>
              <p className="text-2xl font-bold">{uncategorizedItemsCount}</p>
            </div>
            <Archive className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - Categories List */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Categories Directory</CardTitle>
              <Button onClick={() => openCreateModal()}>
                <Plus className="h-4 w-4 mr-1" /> Add Category
              </Button>
            </div>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={filterCategory}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFilterCategory(e.target.value)
                }
                className="pl-9 pr-9"
              />
              {filterCategory && (
                <button
                  onClick={() => setFilterCategory('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden">
            <div className="h-[calc(100vh-320px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">CATEGORY</TableHead>
                    <TableHead className="text-right">ITEMS</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Special row for uncategorized items */}
                  <TableRow
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedCategoryId === null ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    <TableCell className="font-medium">
                      Items not in any Category
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {uncategorizedItems?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right w-10"></TableCell>
                  </TableRow>

                  {isLoadingCategories ? (
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
                  ) : isCategoriesError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {categoriesError?.toString() ||
                              'Failed to load categories'}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredCategories?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories?.map((category) => {
                      const categoryItemsList =
                        items?.filter((item) => item.categoryId === category.id) || [];
                        
                      const itemCount = categoryItemsList.length;
                      const categoryStockValue = calculateTotalStockValue(categoryItemsList);

                      return (
                        <TableRow
                          key={category.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedCategoryId === category.id
                              ? 'bg-primary/5'
                              : ''
                          }`}
                          onClick={() => setSelectedCategoryId(category.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{category.name}</span>
                              {categoryStockValue > 0 && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  Value: {formatCurrency(categoryStockValue)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{itemCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right w-10">
                            <Popover>
                              <PopoverTrigger>
                                <EllipsisVertical className="h-4 w-4 text-gray-500" />
                              </PopoverTrigger>
                              <PopoverContent className='flex flex-col w-fit p-2'>
                                <Button
                                  variant={'ghost'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditModal(category.id)
                                  }}
                                >
                                  View / Edit
                                </Button>
                                <Button
                                  variant={'ghost'}
                                  // onClick={(e) => {
                                  //   e.stopPropagation()
                                  //   openEditModal(item.id)
                                  // }}
                                >
                                  Delete
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Category Details & Items */}
        <div className="flex flex-col gap-4 w-full md:w-2/3">
          {/* Category Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedCategory ? (
                    <div className="flex items-center gap-2">
                      {selectedCategory.name}
                    </div>
                  ) : (
                    'Items not in any Category'
                  )}
                </CardTitle>
                {selectedCategoryId !== null && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation() 
                        selectedCategory && openEditModal(selectedCategoryId)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" /> Edit Category
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package2 className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">Item Count</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {selectedCategoryItemsCount}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">Total Stock Value</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2 text-green-600">
                      {formatCurrency(totalStockValue)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">Category Status</h3>
                    </div>
                    <div className="mt-2">
                      {selectedCategoryId === null ? (
                        <Badge variant="secondary">Uncategorized Items</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileBox className="h-4 w-4" /> Items
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by item name..."
                      value={filterItems}
                      onChange={(e) => setFilterItems(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {filterItems && (
                      <button
                        onClick={() => setFilterItems('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Primary Quantity</TableHead>
                      <TableHead className="text-right">Secondary Quantity</TableHead>
                      <TableHead className="text-right">Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingItems || isLoadingUnits || isLoadingConversions ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          <LoaderCircle className="w-5 h-5 mx-auto animate-spin text-blue-500" />
                        </TableCell>
                      </TableRow>
                    ) : isItemsError ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-red-500"
                        >
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                              {itemsError?.toString() || 'Failed to load items'}
                            </AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    ) : filteredCategoryItems?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-10 text-muted-foreground"
                        >
                          {selectedCategoryId === null
                            ? 'No uncategorized items found'
                            : `No items found in ${selectedCategory?.name}`}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategoryItems?.map((item) => {
                        const unitInfo = getUnitInfo(item);
                        const secondaryUnitInfo = unitInfo.secondaryUnitId 
                          ? getSecondaryUnitInfo(unitInfo.secondaryUnitId) 
                          : null;
                        const stockValue = calculateItemStockValue(item);
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{item.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={item.type === 'PRODUCT' ? 'outline' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {item.type === 'PRODUCT' ? 'Product' : 'Service'}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.type === 'PRODUCT' && 'primaryOpeningQuantity' in item ? (
                                <Badge variant="outline">
                                  {item.primaryOpeningQuantity || 0} {unitInfo.shortName}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.type === 'PRODUCT' && 
                               'secondaryOpeningQuantity' in item && 
                               item.secondaryOpeningQuantity > 0 &&
                               secondaryUnitInfo ? (
                                <Badge variant="outline">
                                  {item.secondaryOpeningQuantity} {secondaryUnitInfo.shortName}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.type === 'PRODUCT' && stockValue > 0 ? (
                                <Badge variant="secondary" className="font-mono">
                                  {formatCurrency(stockValue)}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
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
        </div>
      </div>
    </div>
  )
}

export default Categories