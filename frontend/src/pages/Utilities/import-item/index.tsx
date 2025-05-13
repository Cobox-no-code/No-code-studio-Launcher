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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ItemType } from '@/models/item/item.model'
import { useCreateItemMutation } from '@/redux/api/itemsApi'
import { AlertCircle, ArrowRight, BarChart, Check, Download, FileSpreadsheet, FileUp, Loader2, X } from 'lucide-react'
import { ChangeEvent, useState } from 'react'

// Define types for CSV import
interface CsvValidation {
  valid: boolean;
  errors: string[];
}

interface ImportResults {
  success: number;
  errors: number;
  total: number;
}

interface CsvRow {
  [key: string]: string;
}

type ImportMethod = 'barcode' | 'excel';

const ImportItem = () => {
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>('barcode')
  const [step, setStep] = useState<number>(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<CsvRow[]>([])
  const [previewData, setPreviewData] = useState<CsvRow[]>([])
  const [csvValidation, setCsvValidation] = useState<CsvValidation>({ valid: true, errors: [] })
  const [importing, setImporting] = useState<boolean>(false)
  const [importResults, setImportResults] = useState<ImportResults>({ success: 0, errors: 0, total: 0 })
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false)
  
  const [createItem] = useCreateItemMutation()

  // Updated sample CSV template data with new model fields
  const sampleCsvData = `name,type,hsnCode,itemCode,description,categoryId,salePrice,wholesalePrice,taxRate,unit_conversionId,purchasePrice,primaryOpeningQuantity,secondaryOpeningQuantity,pricePerUnit,openingStockDate,openingQuantity,currentQuantity,minStockLevel,location,purchasePriceTaxInclusive,salePriceTaxInclusive
Product 1,PRODUCT,12345,P001,Sample product description,category-1,100,90,tax-1,unit-1,80,5,0,20,2025-01-01,10,10,5,Warehouse A,true,false
Service 1,SERVICE,,S001,Sample service description,category-2,150,130,tax-2,,,,,,,,,,,false,true
`;

  const downloadSampleCsv = (): void => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'item_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      readCsvFile(selectedFile)
    }
  }

  const readCsvFile = (file: File): void => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const content = e.target?.result as string
      if (content) {
        parseCsvContent(content)
      }
    }
    reader.readAsText(file)
  }

  const parseCsvContent = (content: string): void => {
    // Basic CSV parsing (in production, use a robust CSV parsing library)
    const lines = content.split('\n')
    const headers = lines[0].split(',')
    
    const data: CsvRow[] = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue
      
      const values = lines[i].split(',')
      const row: CsvRow = {}
      
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j]
      }
      
      data.push(row)
    }
    
    setFileData(data)
    setPreviewData(data.slice(0, 5)) // Preview first 5 rows
    validateCsvData(data, headers)
  }

  const validateCsvData = (data: CsvRow[], headers: string[]): void => {
    const requiredFields = ['name', 'type', 'categoryId', 'salePrice']
    const errors: string[] = []
    
    // Check required headers
    for (const field of requiredFields) {
      if (!headers.includes(field)) {
        errors.push(`Missing required column: ${field}`)
      }
    }
    
    // Validate data rows
    data.forEach((row, index) => {
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${index + 1}: Missing item name`)
      }
      
      if (!row.type || !['PRODUCT', 'SERVICE'].includes(row.type)) {
        errors.push(`Row ${index + 1}: Invalid type (must be PRODUCT or SERVICE)`)
      }
      
      if (row.type === 'PRODUCT' && !row.unit_conversionId) {
        errors.push(`Row ${index + 1}: Products must have a unit_conversionId`)
      }
      
      if (!row.salePrice || isNaN(parseFloat(row.salePrice))) {
        errors.push(`Row ${index + 1}: Sale price must be a valid number`)
      }
      
      // Product-specific validations
      if (row.type === 'PRODUCT') {
        if (!row.purchasePrice || isNaN(parseFloat(row.purchasePrice))) {
          errors.push(`Row ${index + 1}: Products must have a valid purchase price`)
        }
        
        if (row.primaryOpeningQuantity && isNaN(parseFloat(row.primaryOpeningQuantity))) {
          errors.push(`Row ${index + 1}: Primary opening quantity must be a valid number`)
        }
        
        if (row.secondaryOpeningQuantity && isNaN(parseFloat(row.secondaryOpeningQuantity))) {
          errors.push(`Row ${index + 1}: Secondary opening quantity must be a valid number`)
        }
        
        if (row.openingStockDate && isNaN(Date.parse(row.openingStockDate))) {
          errors.push(`Row ${index + 1}: Opening stock date must be a valid date format (YYYY-MM-DD)`)
        }

        if (row.openingQuantity && isNaN(parseFloat(row.openingQuantity))) {
          errors.push(`Row ${index + 1}: Opening quantity must be a valid number`)
        }
      }
    })
    
    setCsvValidation({
      valid: errors.length === 0,
      errors: errors
    })
  }

  const importItems = async (): Promise<void> => {
    setImporting(true)
    let successCount = 0
    let errorCount = 0
    
    for (const item of fileData) {
      try {
        // Convert string values to appropriate types and prepare item object
        const isProduct = item.type === 'PRODUCT'
        
        // Common properties for both product and service
        const baseItemData: any = {
          name: item.name,
          type: isProduct ? ItemType.PRODUCT : ItemType.SERVICE,
          hsnCode: item.hsnCode || undefined,
          itemCode: item.itemCode || undefined,
          description: item.description || undefined,
          categoryId: item.categoryId,
          salePrice: parseFloat(item.salePrice),
          wholesalePrice: item.wholesalePrice ? parseFloat(item.wholesalePrice) : undefined,
          taxRate: item.taxRate || undefined,
        }
        
        // Create product or service based on type
        if (isProduct) {
          const productData: any = {
            ...baseItemData,
            type: ItemType.PRODUCT,
            unit_conversionId: item.unit_conversionId,
            purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : 0,
            purchasePriceTaxInclusive: item.purchasePriceTaxInclusive === 'true',
            salePriceTaxInclusive: item.salePriceTaxInclusive === 'true',
            primaryOpeningQuantity: item.primaryOpeningQuantity ? parseFloat(item.primaryOpeningQuantity) : 0,
            secondaryOpeningQuantity: item.secondaryOpeningQuantity ? parseFloat(item.secondaryOpeningQuantity) : 0,
            pricePerUnit: item.pricePerUnit ? parseFloat(item.pricePerUnit) : parseFloat(item.salePrice),
            openingStockDate: item.openingStockDate ? new Date(item.openingStockDate) : undefined,
            minStockLevel: item.minStockLevel ? parseFloat(item.minStockLevel) : undefined,
            location: item.location || undefined
          }
          await createItem(productData).unwrap()
        } else {
          const serviceData: any = {
            ...baseItemData,
            type: ItemType.SERVICE,
            unit_conversionId: item.unit_conversionId || undefined,
            salePriceTaxInclusive: item.salePriceTaxInclusive === 'true'
          }
          await createItem(serviceData).unwrap()
        }
        
        successCount++
      } catch (error) {
        console.error('Error importing item:', error)
        errorCount++
      }
    }
    
    setImportResults({
      success: successCount,
      errors: errorCount,
      total: fileData.length
    })
    
    setImporting(false)
    setShowResultDialog(true)
  }

  const resetImport = (): void => {
    setFile(null)
    setFileData([])
    setPreviewData([])
    setCsvValidation({ valid: true, errors: [] })
    setStep(1)
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <p className="text-2xl font-semibold">Select Import Method</p>
            <div className="flex gap-6 flex-wrap justify-center">
              <RadioGroup 
                value={selectedMethod} 
                onValueChange={(value: string) => setSelectedMethod(value as ImportMethod)}
                className="flex flex-wrap justify-center gap-6"
              >
                <Label htmlFor="barcode-option" className="cursor-pointer">
                  <Card className={`w-80 h-96 bg-[#fbfbfb] transition-all duration-200 ${selectedMethod === 'barcode' ? 'border-blue-600 ring-1 ring-blue-600' : 'hover:border-blue-200'}`}>
                    <CardHeader>
                      <CardTitle className="flex justify-end">
                        <RadioGroupItem value="barcode" id="barcode-option" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                      <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center">
                        <BarChart className="w-16 h-16 text-blue-500" />
                      </div>
                      <p className="text-lg font-medium">Import From Barcode</p>
                      <p className="text-sm text-gray-500 font-normal text-center">
                        Import item details by scanning barcodes. Uses a library of 100 Mn+ 
                        standard barcodes to fetch all details of your items in seconds.
                      </p>
                    </CardContent>
                  </Card>
                </Label>
                
                <Label htmlFor="excel-option" className="cursor-pointer">
                  <Card className={`w-80 h-96 bg-[#fbfbfb] transition-all duration-200 ${selectedMethod === 'excel' ? 'border-blue-600 ring-1 ring-blue-600' : 'hover:border-blue-200'}`}>
                    <CardHeader>
                      <CardTitle className="flex justify-end">
                        <RadioGroupItem value="excel" id="excel-option" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                      <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center">
                        <FileSpreadsheet className="w-16 h-16 text-green-500" />
                      </div>
                      <p className="text-lg font-medium">Import From CSV</p>
                      <p className="text-sm text-gray-500 font-normal text-center">
                        Import item data from CSV files. Download our template, 
                        fill your data and upload to quickly import multiple items.
                      </p>
                    </CardContent>
                  </Card>
                </Label>
              </RadioGroup>
            </div>
          </div>
        )
      
      case 2:
        if (selectedMethod === 'barcode') {
          return (
            <div className="flex flex-col items-center justify-center gap-6 py-8">
              <p className="text-xl font-semibold">Barcode Import</p>
              <p className="text-sm text-gray-500">This feature is coming soon.</p>
              <Button onClick={() => setStep(1)} variant="outline">
                Go Back
              </Button>
            </div>
          )
        } else {
          return (
            <div className="flex flex-col w-full max-w-4xl mx-auto gap-6 py-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">CSV Import</h2>
                <Button onClick={() => setStep(1)} variant="outline" size="sm">
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Back
                </Button>
              </div>
              
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                  <TabsTrigger value="template">Download Template</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="py-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload your CSV file</CardTitle>
                      <CardDescription>
                        Upload a CSV file with your items. Make sure it follows the required format.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!file ? (
                        <div 
                          className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => document.getElementById('csv-file-input')?.click()}
                        >
                          <FileUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
                          <p className="text-sm text-gray-500">Support for CSV files only</p>
                          <Input 
                            id="csv-file-input" 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center">
                              <FileSpreadsheet className="w-6 h-6 text-blue-500 mr-3" />
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                  {(file.size / 1024).toFixed(2)} KB • {fileData.length} items
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={resetImport}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {!csvValidation.valid && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Validation Errors</AlertTitle>
                              <AlertDescription>
                                <ul className="list-disc pl-4 mt-2 text-sm">
                                  {csvValidation.errors.slice(0, 5).map((error, index) => (
                                    <li key={index}>{error}</li>
                                  ))}
                                  {csvValidation.errors.length > 5 && (
                                    <li>...and {csvValidation.errors.length - 5} more errors</li>
                                  )}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {previewData.length > 0 && (
                            <div>
                              <h3 className="text-lg font-medium mb-3">Preview</h3>
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {previewData[0] && Object.keys(previewData[0]).map(header => (
                                        <TableHead key={header}>{header}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {previewData.map((row, i) => (
                                      <TableRow key={i}>
                                        {Object.values(row).map((cell, j) => (
                                          <TableCell key={j}>{cell}</TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {previewData.length < fileData.length && (
                                  <div className="p-3 bg-gray-50 text-sm text-gray-500 text-center border-t">
                                    Showing {previewData.length} of {fileData.length} rows
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="justify-between">
                      <div>
                        {file && (
                          <Badge variant={csvValidation.valid ? "default" : "destructive"} className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            {csvValidation.valid ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Valid CSV
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3 mr-1" />
                                {csvValidation.errors.length} errors
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        disabled={!file || !csvValidation.valid || importing}
                        onClick={importItems}
                      >
                        {importing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          'Import Items'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="template" className="py-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Download CSV Template</CardTitle>
                      <CardDescription>
                        Use our template to prepare your data for import.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Required Fields</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="font-medium">name</p>
                            <p className="text-sm text-gray-500">Item name</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">type</p>
                            <p className="text-sm text-gray-500">PRODUCT or SERVICE</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">categoryId</p>
                            <p className="text-sm text-gray-500">Category identifier</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">salePrice</p>
                            <p className="text-sm text-gray-500">Selling price</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">unit_conversionId</p>
                            <p className="text-sm text-gray-500">Unit conversion identifier (required for PRODUCT)</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">purchasePrice</p>
                            <p className="text-sm text-gray-500">Purchase price (required for PRODUCT)</p>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-4 mt-6">Common Optional Fields</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="font-medium">hsnCode</p>
                            <p className="text-sm text-gray-500">HSN/SAC code</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">itemCode</p>
                            <p className="text-sm text-gray-500">Your internal item code</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">description</p>
                            <p className="text-sm text-gray-500">Item description</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">taxRate</p>
                            <p className="text-sm text-gray-500">Tax rate identifier</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">wholesalePrice</p>
                            <p className="text-sm text-gray-500">Wholesale price</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">imageUrl</p>
                            <p className="text-sm text-gray-500">URL to item image</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">salePriceTaxInclusive</p>
                            <p className="text-sm text-gray-500">Whether sale price includes tax (true/false)</p>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-4 mt-6">Product-Specific Fields</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="font-medium">openingQuantity</p>
                            <p className="text-sm text-gray-500">Initial inventory</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">currentQuantity</p>
                            <p className="text-sm text-gray-500">Current inventory (defaults to opening quantity)</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">primaryOpeningQuantity</p>
                            <p className="text-sm text-gray-500">Primary unit opening quantity</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">secondaryOpeningQuantity</p>
                            <p className="text-sm text-gray-500">Secondary unit opening quantity</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">pricePerUnit</p>
                            <p className="text-sm text-gray-500">Price per unit (defaults to sale price)</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">openingStockDate</p>
                            <p className="text-sm text-gray-500">Date of opening stock (YYYY-MM-DD)</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">minStockLevel</p>
                            <p className="text-sm text-gray-500">Minimum stock level for alerts</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">location</p>
                            <p className="text-sm text-gray-500">Storage location</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">purchasePriceTaxInclusive</p>
                            <p className="text-sm text-gray-500">Whether purchase price includes tax (true/false)</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={downloadSampleCsv} className="ml-auto">
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )
        }
      
      default:
        return null
    }
  }

  return (
    <main className="h-full w-full flex flex-col">
      <section className="w-full h-14 bg-white flex items-center justify-between p-3 gap-3">
        <p className="flex items-center gap-2 text-xl font-semibold">
          Import Items
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
      
      {/* Import Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
            <DialogDescription>
              Summary of your CSV import operation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center bg-blue-50">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{importResults.total}</p>
              </Card>
              <Card className="p-4 text-center bg-green-50">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
              </Card>
              <Card className="p-4 text-center bg-red-50">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{importResults.errors}</p>
              </Card>
            </div>
            
            {importResults.errors > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Errors</AlertTitle>
                <AlertDescription>
                  Some items could not be imported. Check your data and try again.
                </AlertDescription>
              </Alert>
            )}
            
            {importResults.success > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Success</AlertTitle>
                <AlertDescription>
                  {importResults.success} items were successfully imported.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetImport}>
              Import More Items
            </Button>
            <DialogClose asChild>
              <Button>
                Done
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default ImportItem