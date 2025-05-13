'use client'
import { useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useCreatePartyMutation } from '@/redux/api/partiesApi' // Assume this exists
import { AlertCircle, Download, FileUp, X, Check, Loader2, FileSpreadsheet, ArrowRight, Users } from 'lucide-react'

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

// Additional field model for custom fields
interface AdditionalField {
  key: string;
  value: string;
}

// Updated Party interface with new model structure
interface Party {
  id: string;
  name: string;
  gstNumber?: string;
  phone?: string;
  email?: string;
  groupId?: string;
  gstType: 'Unregistered' | 'Regular' | 'Composition' | 'Consumer' | string;
  state?: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingEnabled?: boolean;
  openingBalance?: number;
  openingBalanceType?: 'to_pay' | 'to_receive';
  openingBalanceDate?: string;
  creditLimitType?: 'none' | 'custom';
  creditLimitValue?: number;
  additionalFields?: AdditionalField[];
  paymentReminderEnabled?: boolean;
  paymentReminderDays?: number;
  loyaltyPointsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

const ImportParties = () => {
  const [step, setStep] = useState<number>(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<CsvRow[]>([])
  const [previewData, setPreviewData] = useState<CsvRow[]>([])
  const [csvValidation, setCsvValidation] = useState<CsvValidation>({ valid: true, errors: [] })
  const [importing, setImporting] = useState<boolean>(false)
  const [importResults, setImportResults] = useState<ImportResults>({ success: 0, errors: 0, total: 0 })
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false)
  
  const [createParty] = useCreatePartyMutation()

  // Updated sample CSV template data with new model fields
  const sampleCsvData = `name,gstNumber,phone,email,groupId,gstType,state,billingAddress,shippingAddress,shippingEnabled,openingBalance,openingBalanceType,openingBalanceDate,creditLimitType,creditLimitValue,additionalField1Key,additionalField1Value,additionalField2Key,additionalField2Value,additionalField3Key,additionalField3Value,additionalField4Key,additionalField4Value,paymentReminderEnabled,paymentReminderDays,loyaltyPointsEnabled
ABC Company,29AABCU9603R1ZJ,9876543210,abc@example.com,group-1,Regular,Karnataka,"123 Main St, Bengaluru","123 Main St, Bengaluru",true,5000,to_receive,2025-01-01,custom,10000,Account Manager,John,Category,A,Source,Referral,Notes,Priority client,true,7,true
XYZ Enterprises,,8765432109,xyz@example.com,group-2,Unregistered,Kerala,"456 Park Ave, Kochi","456 Park Ave, Kochi",false,2500,to_pay,2025-01-15,none,,Contact,Sarah,Category,B,Source,Website,Notes,New client,false,0,false
Individual Customer,,,customer@example.com,,Consumer,Tamil Nadu,"789 Lake View, Chennai",,,0,to_pay,,none,,,,,,,,,,false,0,false`;

  const downloadSampleCsv = (): void => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'party_import_template.csv'
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
    try {
      // Split into lines, respecting line breaks
      const lines = content.split(/\r?\n/)
      
      // Skip empty lines
      const nonEmptyLines = lines.filter(line => line.trim() !== '')
      if (nonEmptyLines.length === 0) {
        setCsvValidation({
          valid: false,
          errors: ['The file appears to be empty or contains no data']
        })
        return
      }
      
      // Extract header line
      const headerLine = nonEmptyLines[0]
      const headers = parseCSVRow(headerLine)
      
      const data: CsvRow[] = []
      
      // Process each data row
      for (let i = 1; i < nonEmptyLines.length; i++) {
        // Parse CSV row properly handling quotes
        const values = parseCSVRow(nonEmptyLines[i])
        
        // Skip if row has no values
        if (values.length === 0) continue
        
        const row: CsvRow = {}
        
        // Map values to headers
        for (let j = 0; j < headers.length; j++) {
          if (j < values.length) {
            row[headers[j]] = values[j]
          } else {
            // If value is missing for this header, set as empty string
            row[headers[j]] = ''
          }
        }
        
        data.push(row)
      }
      
      setFileData(data)
      setPreviewData(data.slice(0, 5)) // Preview first 5 rows
      validateCsvData(data, headers)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      setCsvValidation({
        valid: false,
        errors: ['Failed to parse CSV file. Please make sure it is in valid CSV format.']
      })
    }
  }

  /**
   * Parse a single CSV row handling quoted fields properly
   */
  const parseCSVRow = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        // If we see a quote, toggle the inQuotes flag
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        // If we see a comma and we're not in quotes, end the current field
        result.push(current)
        current = ''
      } else {
        // Otherwise, add the character to the current field
        current += char
      }
    }
    
    // Add the last field
    result.push(current)
    
    // Trim spaces and remove quotes from values
    return result.map(val => {
      val = val.trim()
      // Remove surrounding quotes if they exist
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1)
      }
      return val
    })
  }

  const validateCsvData = (data: CsvRow[], headers: string[]): void => {
    const requiredFields = ['name', 'gstType']
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
        errors.push(`Row ${index + 1}: Missing party name`)
      }
      
      const validGstTypes = ['Unregistered', 'Regular', 'Composition', 'Consumer']
      if (!row.gstType || (!validGstTypes.includes(row.gstType) && row.gstType.trim() === '')) {
        errors.push(`Row ${index + 1}: Invalid GST type (must be one of: ${validGstTypes.join(', ')})`)
      }
      
      // Validate GSTIN format if provided (basic validation)
      if (row.gstNumber && row.gstNumber.trim() !== '' && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(row.gstNumber)) {
        errors.push(`Row ${index + 1}: Invalid GST Number format`)
      }
      
      // Validate email format if provided
      if (row.email && row.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`)
      }
      
      // Validate phone format if provided (basic validation)
      if (row.phone && row.phone.trim() !== '' && !/^\d{10}$/.test(row.phone)) {
        errors.push(`Row ${index + 1}: Invalid phone number (should be 10 digits)`)
      }
      
      // Validate numeric fields
      if (row.openingBalance && row.openingBalance.trim() !== '' && isNaN(parseFloat(row.openingBalance))) {
        errors.push(`Row ${index + 1}: Opening balance must be a valid number`)
      }
      
      // Validate opening balance type
      const validBalanceTypes = ['to_pay', 'to_receive']
      if (row.openingBalanceType && row.openingBalanceType.trim() !== '' && 
          !validBalanceTypes.includes(row.openingBalanceType)) {
        errors.push(`Row ${index + 1}: Opening balance type must be one of: ${validBalanceTypes.join(', ')}`)
      }
      
      if (row.creditLimitValue && row.creditLimitValue.trim() !== '' && isNaN(parseFloat(row.creditLimitValue))) {
        errors.push(`Row ${index + 1}: Credit limit value must be a valid number`)
      }
      
      if (row.paymentReminderDays && row.paymentReminderDays.trim() !== '' && isNaN(parseInt(row.paymentReminderDays))) {
        errors.push(`Row ${index + 1}: Payment reminder days must be a valid number`)
      }
      
      // Validate date format if provided
      if (row.openingBalanceDate && row.openingBalanceDate.trim() !== '' && isNaN(Date.parse(row.openingBalanceDate))) {
        errors.push(`Row ${index + 1}: Opening balance date must be a valid date format (YYYY-MM-DD)`)
      }
      
      // Validate boolean fields
      const booleanFields = ['shippingEnabled', 'paymentReminderEnabled', 'loyaltyPointsEnabled']
      booleanFields.forEach(field => {
        if (row[field] && row[field].trim() !== '' && !['true', 'false'].includes(row[field].toLowerCase())) {
          errors.push(`Row ${index + 1}: ${field} must be 'true' or 'false'`)
        }
      })
      
      // Validate credit limit type
      if (row.creditLimitType && row.creditLimitType.trim() !== '' && !['none', 'custom'].includes(row.creditLimitType)) {
        errors.push(`Row ${index + 1}: Credit limit type must be 'none' or 'custom'`)
      }
    })
    
    setCsvValidation({
      valid: errors.length === 0,
      errors: errors
    })
  }

  const importParties = async (): Promise<void> => {
    setImporting(true)
    let successCount = 0
    let errorCount = 0
    
    for (const row of fileData) {
      try {
        // Extract and process additional fields
        const additionalFields: AdditionalField[] = [];
        
        // Look for additionalField keys and values (up to 4 pairs)
        for (let i = 1; i <= 4; i++) {
          const keyField = `additionalField${i}Key`;
          const valueField = `additionalField${i}Value`;
          
          if (row[keyField] && row[keyField].trim() !== '') {
            additionalFields.push({
              key: row[keyField],
              value: row[valueField] || ''
            });
          }
        }
        
        // Prepare party data from CSV row with updated model structure
        const partyData: any = {
          name: row.name,
          gstNumber: row.gstNumber || undefined, // Changed from gstin to gstNumber
          phone: row.phone || undefined,
          email: row.email || undefined,
          groupId: row.groupId || undefined,
          gstType: row.gstType as Party['gstType'],
          state: row.state || undefined,
          billingAddress: row.billingAddress || undefined,
          shippingAddress: row.shippingAddress || undefined,
          shippingEnabled: row.shippingEnabled ? row.shippingEnabled.toLowerCase() === 'true' : undefined,
          openingBalance: row.openingBalance ? parseFloat(row.openingBalance) : undefined,
          openingBalanceType: row.openingBalanceType as 'to_pay' | 'to_receive' | undefined, // New field
          openingBalanceDate: row.openingBalanceDate || undefined,
          creditLimitType: row.creditLimitType as 'none' | 'custom' | undefined,
          creditLimitValue: row.creditLimitValue ? parseFloat(row.creditLimitValue) : undefined,
          additionalFields: additionalFields.length > 0 ? additionalFields : undefined, // Changed to array structure
          paymentReminderEnabled: row.paymentReminderEnabled ? row.paymentReminderEnabled.toLowerCase() === 'true' : undefined,
          paymentReminderDays: row.paymentReminderDays ? parseInt(row.paymentReminderDays) : undefined,
          loyaltyPointsEnabled: row.loyaltyPointsEnabled ? row.loyaltyPointsEnabled.toLowerCase() === 'true' : undefined
        }
        
        await createParty(partyData).unwrap()
        successCount++
      } catch (error) {
        console.error('Error importing party:', error)
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

  return (
    <main className="h-full w-full flex flex-col">
      <section className="w-full h-14 bg-white flex items-center justify-between p-3 gap-3">
        <p className="flex items-center gap-2 text-xl font-semibold">
          Import Parties
        </p>
      </section>
      
      <section className="bg-[#fbfbfb] m-1 flex-1 p-3 flex flex-col justify-between overflow-auto">
        {step === 1 ? (
          <div className="flex flex-col w-full max-w-4xl mx-auto gap-6 py-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold mb-2">Import Parties</h2>
              <p className="text-gray-500">Import your parties from a CSV file</p>
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
                      Upload a CSV file with your parties. Make sure it follows the required format.
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
                                {(file.size / 1024).toFixed(2)} KB • {fileData.length} parties
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
                            <div className="border rounded-lg overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {previewData[0] && Object.keys(previewData[0]).slice(0, 8).map(header => (
                                      <TableHead key={header}>{header}</TableHead>
                                    ))}
                                    {previewData[0] && Object.keys(previewData[0]).length > 8 && (
                                      <TableHead>...</TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {previewData.map((row, i) => (
                                    <TableRow key={i}>
                                      {Object.keys(row).slice(0, 8).map((key, j) => (
                                        <TableCell key={j}>{row[key]}</TableCell>
                                      ))}
                                      {Object.keys(row).length > 8 && (
                                        <TableCell>...</TableCell>
                                      )}
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
                      onClick={importParties}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        'Import Parties'
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
                          <p className="text-sm text-gray-500">Party name</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">gstType</p>
                          <p className="text-sm text-gray-500">GST type (Unregistered, Regular, Composition, Consumer)</p>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4 mt-6">Basic Information Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-medium">gstNumber</p>
                          <p className="text-sm text-gray-500">GST Identification Number</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">phone</p>
                          <p className="text-sm text-gray-500">Contact phone number</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">email</p>
                          <p className="text-sm text-gray-500">Email address</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">groupId</p>
                          <p className="text-sm text-gray-500">Group identifier</p>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4 mt-6">Address Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-medium">state</p>
                          <p className="text-sm text-gray-500">State name</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">billingAddress</p>
                          <p className="text-sm text-gray-500">Billing address</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">shippingAddress</p>
                          <p className="text-sm text-gray-500">Shipping address</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">shippingEnabled</p>
                          <p className="text-sm text-gray-500">Enable shipping (true/false)</p>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4 mt-6">Credit & Balance Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-medium">openingBalance</p>
                          <p className="text-sm text-gray-500">Opening balance amount</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">openingBalanceType</p>
                          <p className="text-sm text-gray-500">Balance type (to_pay/to_receive)</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">openingBalanceDate</p>
                          <p className="text-sm text-gray-500">Date of opening balance (YYYY-MM-DD)</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">creditLimitType</p>
                          <p className="text-sm text-gray-500">Credit limit type (none/custom)</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">creditLimitValue</p>
                          <p className="text-sm text-gray-500">Credit limit amount</p>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4 mt-6">Additional Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-medium">additionalField1Key</p>
                          <p className="text-sm text-gray-500">Custom field 1 name</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">additionalField1Value</p>
                          <p className="text-sm text-gray-500">Custom field 1 value</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">additionalField2Key</p>
                          <p className="text-sm text-gray-500">Custom field 2 name</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">additionalField2Value</p>
                          <p className="text-sm text-gray-500">Custom field 2 value</p>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4 mt-6">Settings Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-medium">paymentReminderEnabled</p>
                          <p className="text-sm text-gray-500">Enable payment reminders (true/false)</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">paymentReminderDays</p>
                          <p className="text-sm text-gray-500">Days for payment reminder</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium">loyaltyPointsEnabled</p>
                          <p className="text-sm text-gray-500">Enable loyalty points (true/false)</p>
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
        ) : null}
      </section>
      
      {/* Import Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
            <DialogDescription>
              Summary of your party import operation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center bg-blue-50">
                <p className="text-sm text-gray-600">Total Parties</p>
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
                  Some parties could not be imported. Check your data and try again.
                </AlertDescription>
              </Alert>
            )}
            
            {importResults.success > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Success</AlertTitle>
                <AlertDescription>
                  {importResults.success} parties were successfully imported.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetImport}>
              Import More Parties
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

export default ImportParties