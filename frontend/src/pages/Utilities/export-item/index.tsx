'use client'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Item, ItemType, Product } from '@/models/item/item.model'
import { useGetCategoriesQuery } from '@/redux/api/categoriesApi'
import { useGetItemsQuery } from '@/redux/api/itemsApi'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { ArrowRight, CheckCircle, Download, FileSpreadsheetIcon as FilePdf, FileSpreadsheet, FileText, Filter, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

type ExportFormat = 'csv' | 'excel' | 'pdf';
type ExportType = 'all' | 'selected' | 'filtered';

interface ExportSettings {
  includeImages: boolean;
  includeStockHistory: boolean;
  includePriceHistory: boolean;
}

interface ExportResult {
  success: boolean;
  fileName: string;
  records: number;
  url?: string; // URL for downloading the generated file
}

interface Category {
  id: string;
  name: string;
}

const ExportItem = () => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [exportType, setExportType] = useState<ExportType>('all')
  const [step, setStep] = useState<number>(1)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedItemType, setSelectedItemType] = useState<string>('all')
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    includeImages: false,
    includeStockHistory: false,
    includePriceHistory: false
  })
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false)
  const [exporting, setExporting] = useState<boolean>(false)
  
  // Fetch actual data from API
  const { data: itemsData = [], isLoading: itemsLoading, isError: itemsError } = useGetItemsQuery({})
  const { data: categoriesData = [], isLoading: categoriesLoading } = useGetCategoriesQuery()
  
  const items: Item[] = itemsData as Item[];
  const categories: Category[] = categoriesData as Category[];
  
  // Select all items by default when items are loaded
  useEffect(() => {
    if (items.length > 0 && selectedItems.length === 0) {
      setSelectedItems(items.map(item => item.id))
    }
  }, [items])
  
  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const handleExportSettingChange = (key: keyof ExportSettings, value: boolean) => {
    setExportSettings({ ...exportSettings, [key]: value })
  }

  const getFilteredItems = () => {
    return items.filter(item => {
      if (selectedItemType !== 'all' && item.type !== selectedItemType) return false
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false
      return true
    })
  }
  
  // Helper to get items based on export type
  const getItemsToExport = () => {
    if (exportType === 'all') {
      return items
    } else if (exportType === 'selected') {
      return items.filter(item => selectedItems.includes(item.id))
    } else {
      return getFilteredItems()
    }
  }
  
  // Function to prepare item data for export
  const prepareItemsForExport = (itemsToExport: Item[]) => {
    return itemsToExport.map(item => {
      const category = categories.find(c => c.id === item.categoryId)
      
      // Base fields for all items
      const exportData: any = {
        ID: item.id,
        Name: item.name,
        Type: item.type === ItemType.PRODUCT ? 'Product' : 'Service',
        Category: category?.name || '',
        'HSN/SAC Code': item.hsnCode || '',
        'Item Code': item.itemCode || '',
        Description: item.description || '',
        'Sale Price': item.salePrice || 0,
        'Wholesale Price': item.wholesalePrice || 0,
      }
      
      // Add product-specific fields if the item is a product
      if (item.type === ItemType.PRODUCT) {
        const product = item as Product
        exportData['Purchase Price'] = product.purchasePrice || 0
        exportData['Current Stock'] = product.currentQuantity || 0
        exportData['Min Stock Level'] = product.minStockLevel || 0
        exportData['Sale Price Tax Inclusive'] = product.salePriceTaxInclusive ? 'Yes' : 'No'
        exportData['Purchase Price Tax Inclusive'] = product.purchasePriceTaxInclusive ? 'Yes' : 'No'
        exportData['Location'] = product.location || ''
      }
      
      return exportData
    })
  }
  
  // Generate and download CSV
  const exportAsCSV = (data: any[]) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    return url
  }
  
  // Generate and download Excel
  const exportAsExcel = (data: any[]) => {
    // Create a workbook
    const workbook = XLSX.utils.book_new()
    
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items")
    
    // Generate Excel file
    const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    
    // Create Blob and URL
    const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    
    return url
  }
  
  // Generate and download PDF
  const exportAsPDF = (data: any[]) => {
    // Create new PDF document
    const doc :any = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('Item Export', 14, 22)
    
    // Add date
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
    
    // Create the table structure for products and services
    const headers = Object.keys(data[0] || {})
    const rows = data.map(item => Object.values(item))
    
    // Add the table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 35,
      styles: { overflow: 'ellipsize', cellWidth: 'wrap' },
      columnStyles: { 0: { cellWidth: 30 } },
    })
    
    // Create blob from PDF document
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    
    return url
  }
  
  // Main export function
  const exportItems = async () => {
    setExporting(true)
    
    try {
      // Determine items to export
      const itemsToExport = getItemsToExport()
      
      // Prepare data for export
      const exportData = prepareItemsForExport(itemsToExport)
      
      // Generate the file based on selected format
      let fileUrl = ''
      const timestamp = new Date().toISOString().split('T')[0]
      let fileName = `items_export_${timestamp}`
      
      if (selectedFormat === 'csv') {
        fileUrl = exportAsCSV(exportData)
        fileName += '.csv'
      } else if (selectedFormat === 'excel') {
        fileUrl = exportAsExcel(exportData)
        fileName += '.xlsx'
      } else if (selectedFormat === 'pdf') {
        fileUrl = exportAsPDF(exportData)
        fileName += '.pdf'
      }
      
      setExportResult({
        success: true,
        fileName: fileName,
        records: itemsToExport.length,
        url: fileUrl
      })
      
      setShowResultDialog(true)
    } catch (error) {
      console.error('Export error:', error)
      setExportResult({
        success: false,
        fileName: '',
        records: 0
      })
      setShowResultDialog(true)
    } finally {
      setExporting(false)
    }
  }
  
  // Function to trigger the file download
  const downloadExportedFile = () => {
    if (exportResult?.url) {
      const link = document.createElement('a')
      link.href = exportResult.url
      link.setAttribute('download', exportResult.fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getExportIcon = () => {
    switch (selectedFormat) {
      case 'csv':
        return <FileText className="w-16 h-16 text-blue-500" />
      case 'excel':
        return <FileSpreadsheet className="w-16 h-16 text-green-500" />
      case 'pdf':
        return <FilePdf className="w-16 h-16 text-red-500" />
      default:
        return <FileText className="w-16 h-16 text-gray-500" />
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <p className="text-2xl font-semibold">Select Export Format</p>
            <div className="flex gap-6 flex-wrap justify-center">
              <RadioGroup 
                value={selectedFormat} 
                onValueChange={(value: string) => setSelectedFormat(value as ExportFormat)}
                className="flex flex-wrap justify-center gap-6"
              >
                <Label htmlFor="csv-option" className="cursor-pointer">
                  <Card className={`w-80 h-80 bg-[#fbfbfb] transition-all duration-200 ${selectedFormat === 'csv' ? 'border-blue-600 ring-1 ring-blue-600' : 'hover:border-blue-200'}`}>
                    <CardHeader>
                      <CardTitle className="flex justify-end">
                        <RadioGroupItem value="csv" id="csv-option" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                        <FileText className="w-12 h-12 text-blue-500" />
                      </div>
                      <p className="text-lg font-medium">CSV</p>
                      <p className="text-sm text-gray-500 font-normal text-center">
                        Export your items to a CSV file. Compatible with 
                        most spreadsheet applications and data processing tools.
                      </p>
                    </CardContent>
                  </Card>
                </Label>
                
                <Label htmlFor="excel-option" className="cursor-pointer">
                  <Card className={`w-80 h-80 bg-[#fbfbfb] transition-all duration-200 ${selectedFormat === 'excel' ? 'border-blue-600 ring-1 ring-blue-600' : 'hover:border-blue-200'}`}>
                    <CardHeader>
                      <CardTitle className="flex justify-end">
                        <RadioGroupItem value="excel" id="excel-option" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                        <FileSpreadsheet className="w-12 h-12 text-green-500" />
                      </div>
                      <p className="text-lg font-medium">Excel</p>
                      <p className="text-sm text-gray-500 font-normal text-center">
                        Export your items to an Excel file. Includes formatting 
                        and multiple sheets for different item types.
                      </p>
                    </CardContent>
                  </Card>
                </Label>

                <Label htmlFor="pdf-option" className="cursor-pointer">
                  <Card className={`w-80 h-80 bg-[#fbfbfb] transition-all duration-200 ${selectedFormat === 'pdf' ? 'border-blue-600 ring-1 ring-blue-600' : 'hover:border-blue-200'}`}>
                    <CardHeader>
                      <CardTitle className="flex justify-end">
                        <RadioGroupItem value="pdf" id="pdf-option" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                        <FilePdf className="w-12 h-12 text-red-500" />
                      </div>
                      <p className="text-lg font-medium">PDF</p>
                      <p className="text-sm text-gray-500 font-normal text-center">
                        Export your items to a PDF file. Perfect for printing 
                        or sharing inventory reports with others.
                      </p>
                    </CardContent>
                  </Card>
                </Label>
              </RadioGroup>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="flex flex-col w-full max-w-4xl mx-auto gap-6 py-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Select Items to Export</h2>
              <Button onClick={() => setStep(1)} variant="outline" size="sm">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
            </div>
            
            {itemsLoading ? (
              <Card>
                <CardContent className="p-6 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
                  <p>Loading items...</p>
                </CardContent>
              </Card>
            ) : itemsError ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load items. Please try again later.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>
                      Choose what items you want to export
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={exportType} 
                      onValueChange={(value: string) => setExportType(value as ExportType)}
                      className="space-y-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="export-all" />
                        <Label htmlFor="export-all" className="cursor-pointer">
                          Export all items ({items.length})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="selected" id="export-selected" />
                        <Label htmlFor="export-selected" className="cursor-pointer">
                          Export selected items ({selectedItems.length})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="filtered" id="export-filtered" />
                        <Label htmlFor="export-filtered" className="cursor-pointer">
                          Export filtered items ({getFilteredItems().length})
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
                
                {exportType === 'filtered' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filter Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="category-filter">Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger id="category-filter">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="type-filter">Item Type</Label>
                        <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                          <SelectTrigger id="type-filter">
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value={ItemType.PRODUCT}>Products</SelectItem>
                            <SelectItem value={ItemType.SERVICE}>Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {exportType === 'selected' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Items</CardTitle>
                      <CardDescription>
                        Check the items you want to include in the export
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead className="text-right">Stock</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map(item => {
                              const category = categories.find(c => c.id === item.categoryId)
                              const isProduct = item.type === ItemType.PRODUCT
                              const productItem = isProduct ? item as Product : null
                              
                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="text-center">
                                    <Checkbox 
                                      checked={selectedItems.includes(item.id)}
                                      onCheckedChange={() => toggleItemSelection(item.id)}
                                    />
                                  </TableCell>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={isProduct ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}>
                                      {isProduct ? 'Product' : 'Service'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{category?.name || ''}</TableCell>
                                  <TableCell className="text-right">${item.salePrice.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">{isProduct && productItem ? productItem.currentQuantity : 'N/A'}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="text-sm text-gray-500">
                        {selectedItems.length} of {items.length} items selected
                      </div>
                    </CardFooter>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle>Export Settings</CardTitle>
                    <CardDescription>
                      Choose what additional data to include in the export
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-images"
                          checked={exportSettings.includeImages}
                          onCheckedChange={(checked) => handleExportSettingChange('includeImages', !!checked)}
                        />
                        <Label htmlFor="include-images" className="cursor-pointer">Include Images</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-stock-history"
                          checked={exportSettings.includeStockHistory}
                          onCheckedChange={(checked) => handleExportSettingChange('includeStockHistory', !!checked)}
                        />
                        <Label htmlFor="include-stock-history" className="cursor-pointer">Include Stock History</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-price-history"
                          checked={exportSettings.includePriceHistory}
                          onCheckedChange={(checked) => handleExportSettingChange('includePriceHistory', !!checked)}
                        />
                        <Label htmlFor="include-price-history" className="cursor-pointer">Include Price History</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={exportItems}
                    disabled={exportType === 'selected' && selectedItems.length === 0 || exporting}
                    className="gap-2"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </> 
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export {selectedFormat.toUpperCase()}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <main className="h-full w-full flex flex-col">
      <section className="w-full h-14 bg-white flex items-center justify-between p-3 gap-3">
        <p className="flex items-center gap-2 text-xl font-semibold">
          Export Items
        </p>
      </section>
      
      <section className="bg-[#fbfbfb] m-1 flex-1 p-3 flex flex-col justify-between overflow-auto">
        {renderStepContent()}
        
        {step === 1 && (
          <div className="border-t px-3 pt-3 flex gap-4 justify-end">
            <Button
              variant="default"
              className="w-32 rounded-full"
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}
      </section>
      
      {/* Export Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {exportResult?.success ? 'Completed' : 'Failed'}</DialogTitle>
            <DialogDescription>
              {exportResult?.success 
                ? 'Your items have been exported successfully' 
                : 'There was an error exporting your items'}
            </DialogDescription>
          </DialogHeader>
          
          {exportResult?.success ? (
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="flex items-center justify-center mb-2">
                {getExportIcon()}
                <div className="ml-3">
                  <h3 className="text-lg font-medium">{exportResult.fileName}</h3>
                  <p className="text-sm text-gray-500">{exportResult.records} items exported</p>
                </div>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200 mt-4">
                <AlertTitle className="text-blue-600">Success</AlertTitle>
                <AlertDescription>
                  Your export has been processed successfully. Click the download button below to save the file.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="py-6">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  There was an error generating your export. Please try again or contact support if the issue persists.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
            {exportResult?.success && (
              <Button onClick={downloadExportedFile}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default ExportItem