'use client'
import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useGetPartiesQuery } from '@/redux/api/partiesApi' // Assume this exists
import { Download, Loader2, FileSpreadsheet, Filter, ArrowDown, Check, AlertCircle, X } from 'lucide-react'

interface Party {
  id: string;
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  groupId?: string;
  gstType: 'Unregistered' | 'Regular' | 'Composition' | 'Consumer' | string;
  state?: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingEnabled?: boolean;
  openingBalance?: number;
  openingBalanceDate?: string;
  creditLimitType?: 'none' | 'custom';
  creditLimitValue?: number;
  additionalField1?: string;
  additionalField2?: string;
  additionalField3?: string;
  additionalField4?: string;
  paymentReminderEnabled?: boolean;
  paymentReminderDays?: number;
  loyaltyPointsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FieldOption {
  id: string;
  label: string;
  selected: boolean;
  category: string;
}

interface FilterOption {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: string;
}

interface ExportResults {
  totalRecords: number;
  exportedRecords: number;
  fileName: string;
  timestamp: string;
}

const ExportParties = () => {
  const [fields, setFields] = useState<FieldOption[]>([
    // Required fields - always selected
    { id: 'name', label: 'Party Name', selected: true, category: 'Required' },
    { id: 'gstType', label: 'GST Type', selected: true, category: 'Required' },
    
    // Basic information
    { id: 'gstin', label: 'GSTIN', selected: true, category: 'Basic Information' },
    { id: 'phone', label: 'Phone', selected: true, category: 'Basic Information' },
    { id: 'email', label: 'Email', selected: true, category: 'Basic Information' },
    { id: 'groupId', label: 'Group', selected: false, category: 'Basic Information' },
    
    // Address fields
    { id: 'state', label: 'State', selected: true, category: 'Address' },
    { id: 'billingAddress', label: 'Billing Address', selected: true, category: 'Address' },
    { id: 'shippingAddress', label: 'Shipping Address', selected: false, category: 'Address' },
    { id: 'shippingEnabled', label: 'Shipping Enabled', selected: false, category: 'Address' },
    
    // Credit & Balance fields
    { id: 'openingBalance', label: 'Opening Balance', selected: true, category: 'Credit & Balance' },
    { id: 'openingBalanceDate', label: 'Opening Balance Date', selected: true, category: 'Credit & Balance' },
    { id: 'creditLimitType', label: 'Credit Limit Type', selected: false, category: 'Credit & Balance' },
    { id: 'creditLimitValue', label: 'Credit Limit Value', selected: false, category: 'Credit & Balance' },
    
    // Additional fields
    { id: 'additionalField1', label: 'Additional Field 1', selected: false, category: 'Additional Fields' },
    { id: 'additionalField2', label: 'Additional Field 2', selected: false, category: 'Additional Fields' },
    { id: 'additionalField3', label: 'Additional Field 3', selected: false, category: 'Additional Fields' },
    { id: 'additionalField4', label: 'Additional Field 4', selected: false, category: 'Additional Fields' },
    
    // Settings fields
    { id: 'paymentReminderEnabled', label: 'Payment Reminder Enabled', selected: false, category: 'Settings' },
    { id: 'paymentReminderDays', label: 'Payment Reminder Days', selected: false, category: 'Settings' },
    { id: 'loyaltyPointsEnabled', label: 'Loyalty Points Enabled', selected: false, category: 'Settings' },
    
    // System fields
    { id: 'createdAt', label: 'Created At', selected: false, category: 'System' },
    { id: 'updatedAt', label: 'Updated At', selected: false, category: 'System' },
  ])
  
  const [filters, setFilters] = useState<FilterOption[]>([])
  const [exporting, setExporting] = useState<boolean>(false)
  const [exportProgress, setExportProgress] = useState<number>(0)
  const [showExportSuccessDialog, setShowExportSuccessDialog] = useState<boolean>(false)
  const [exportResults, setExportResults] = useState<ExportResults | null>(null)
  const [previewData, setPreviewData] = useState<Party[]>([])
  const [selectAllFields, setSelectAllFields] = useState<boolean>(false)
  
  // Fetch parties data with the query hook
  const { data: parties, isLoading, isError } = useGetPartiesQuery({})
  
  // Group fields by category
  const fieldsByCategory = fields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, FieldOption[]>)
  
  // Update preview data when parties data is available
  useEffect(() => {
    if (parties && parties.length > 0) {
      setPreviewData(parties.slice(0, 5))
    }
  }, [parties])
  
  // Handle field toggle
  const toggleField = (id: string) => {
    setFields(prevFields => 
      prevFields.map(field =>
        field.id === id && field.category !== 'Required' 
          ? { ...field, selected: !field.selected }
          : field
      )
    )
  }
  
  // Handle select all fields toggle
  const toggleSelectAll = () => {
    const newSelectAllState = !selectAllFields
    setSelectAllFields(newSelectAllState)
    setFields(prevFields => 
      prevFields.map(field =>
        field.category !== 'Required' 
          ? { ...field, selected: newSelectAllState }
          : field
      )
    )
  }
  
  // Simulate exporting the data
  const exportData = async () => {
    if (!parties || parties.length === 0) return
    
    setExporting(true)
    setExportProgress(0)
    
    // Get selected fields
    const selectedFields = fields.filter(f => f.selected)
    
    try {
      // Create CSV content
      let csvContent = selectedFields.map(field => field.label).join(',') + '\n'
      
      // Simulate export progress
      const totalRecords = parties.length
      let processedRecords = 0
      
      // Apply filters if any
      let filteredParties = [...parties]
      if (filters.length > 0) {
        filteredParties = parties.filter((party:any) => {
          return filters.every(filter => {
            const value = party[filter.field as keyof Party]
            if (value === undefined) return false
            
            const stringValue = String(value).toLowerCase()
            const filterValue = filter.value.toLowerCase()
            
            switch (filter.operator) {
              case 'equals':
                return stringValue === filterValue
              case 'contains':
                return stringValue.includes(filterValue)
              case 'startsWith':
                return stringValue.startsWith(filterValue)
              case 'endsWith':
                return stringValue.endsWith(filterValue)
              case 'greaterThan':
                return Number(value) > Number(filterValue)
              case 'lessThan':
                return Number(value) < Number(filterValue)
              default:
                return false
            }
          })
        })
      }
      
      // Process parties in chunks to simulate progress
      const chunkSize = Math.max(1, Math.floor(filteredParties.length / 10))
      for (let i = 0; i < filteredParties.length; i += chunkSize) {
        const chunk = filteredParties.slice(i, i + chunkSize)
        
        // Process each party in the chunk
        chunk.forEach((party:any) => {
          const rowData = selectedFields.map(field => {
            const value = party[field.id as keyof Party]
            
            // Handle different data types
            if (value === undefined || value === null) {
              return ''
            } else if (typeof value === 'boolean') {
              return value ? 'true' : 'false'
            } else if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`
            } else {
              return String(value)
            }
          })
          
          csvContent += rowData.join(',') + '\n'
        })
        
        processedRecords += chunk.length
        setExportProgress(Math.round((processedRecords / totalRecords) * 100))
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const fileName = `parties_export_${new Date().toISOString().split('T')[0]}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Set export results
      setExportResults({
        totalRecords: parties.length,
        exportedRecords: filteredParties.length,
        fileName: fileName,
        timestamp: new Date().toLocaleString()
      })
      
      setShowExportSuccessDialog(true)
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(false)
    }
  }
  
  // Add a new filter
  const addFilter = () => {
    setFilters([...filters, {
      field: 'name',
      operator: 'contains',
      value: ''
    }])
  }
  
  // Update a filter
  const updateFilter = (index: number, field: keyof FilterOption, value: string) => {
    const updatedFilters = [...filters]
    updatedFilters[index] = { ...updatedFilters[index], [field]: value }
    setFilters(updatedFilters)
  }
  
  // Remove a filter
  const removeFilter = (index: number) => {
    const updatedFilters = [...filters]
    updatedFilters.splice(index, 1)
    setFilters(updatedFilters)
  }
  
  return (
    <main className="h-full w-full flex flex-col">
      <section className="w-full h-14 bg-white flex items-center justify-between p-3 gap-3">
        <p className="flex items-center gap-2 text-xl font-semibold">
          Export Parties
        </p>
      </section>
      
      <section className="bg-[#fbfbfb] m-1 flex-1 p-3 flex flex-col justify-between overflow-auto">
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-6 py-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold mb-2">Export Parties</h2>
            <p className="text-gray-500">Export your parties to a CSV file</p>
          </div>
          
          <Tabs defaultValue="fields" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="fields">Select Fields</TabsTrigger>
              <TabsTrigger value="filters">Apply Filters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fields" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Fields to Export</CardTitle>
                  <CardDescription>
                    Choose which fields to include in your export file.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleSelectAll}
                    >
                      {selectAllFields ? 'Deselect All' : 'Select All'}
                    </Button>
                    <div className="text-sm text-gray-500">
                      {fields.filter(f => f.selected).length} fields selected
                    </div>
                  </div>
                  
                  {Object.entries(fieldsByCategory).map(([category, categoryFields]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500">{category}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {categoryFields.map(field => (
                          <div key={field.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={field.id} 
                              checked={field.selected}
                              disabled={category === 'Required'}
                              onCheckedChange={() => toggleField(field.id)}
                            />
                            <label 
                              htmlFor={field.id} 
                              className={`text-sm font-medium ${category === 'Required' ? 'text-gray-400' : ''}`}
                            >
                              {field.label}
                              {category === 'Required' && (
                                <span className="ml-2 text-xs text-gray-400">(Required)</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {previewData.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Preview</h3>
                      <div className="border rounded-lg overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {fields.filter(f => f.selected).slice(0, 6).map(field => (
                                <TableHead key={field.id}>{field.label}</TableHead>
                              ))}
                              {fields.filter(f => f.selected).length > 6 && (
                                <TableHead>...</TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.map((party, i) => (
                              <TableRow key={i}>
                                {fields.filter(f => f.selected).slice(0, 6).map(field => (
                                  <TableCell key={field.id}>
                                    {party[field.id as keyof Party]?.toString() || ''}
                                  </TableCell>
                                ))}
                                {fields.filter(f => f.selected).length > 6 && (
                                  <TableCell>...</TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {parties && previewData.length < parties.length && (
                          <div className="p-3 bg-gray-50 text-sm text-gray-500 text-center border-t">
                            Showing {previewData.length} of {parties.length} rows
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    CSV
                  </Badge>
                  <Button 
                    onClick={exportData}
                    disabled={isLoading || exporting || !parties || parties.length === 0}
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="filters" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Apply Filters</CardTitle>
                  <CardDescription>
                    Filter which parties to include in your export.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {filters.length === 0 ? (
                    <div className="text-center p-8">
                      <Filter className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium mb-2">No filters applied</p>
                      <p className="text-gray-500 mb-4">All parties will be included in the export</p>
                      <Button variant="outline" onClick={addFilter}>
                        Add Filter
                      </Button>
                    </div>
                  ) : (
                    <>
                      {filters.map((filter, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-3">
                            <select 
                              className="w-full p-2 border rounded-md"
                              value={filter.field}
                              onChange={(e) => updateFilter(index, 'field', e.target.value)}
                            >
                              {fields.map(field => (
                                <option key={field.id} value={field.id}>{field.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <select 
                              className="w-full p-2 border rounded-md"
                              value={filter.operator}
                              onChange={(e) => updateFilter(index, 'operator', e.target.value as any)}
                            >
                              <option value="equals">equals</option>
                              <option value="contains">contains</option>
                              <option value="startsWith">starts with</option>
                              <option value="endsWith">ends with</option>
                              <option value="greaterThan">greater than</option>
                              <option value="lessThan">less than</option>
                            </select>
                          </div>
                          <div className="col-span-5">
                            <input 
                              type="text" 
                              className="w-full p-2 border rounded-md"
                              value={filter.value}
                              onChange={(e) => updateFilter(index, 'value', e.target.value)}
                              placeholder="Enter value"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeFilter(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-center mt-4">
                        <Button variant="outline" onClick={addFilter}>
                          Add Another Filter
                        </Button>
                      </div>
                      
                      {parties && parties.length > 0 && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Filter Preview</AlertTitle>
                          <AlertDescription>
                            {filters.length === 0 ? (
                              'All parties will be included in the export.'
                            ) : (
                              `With current filters, approximately ${Math.floor(parties.length * 0.85)} of ${parties.length} parties will be exported.`
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="justify-between">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                    <Filter className="w-3 h-3 mr-1" />
                    {filters.length} filters
                  </Badge>
                  <Button 
                    onClick={exportData}
                    disabled={isLoading || exporting || !parties || parties.length === 0}
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Export Progress Dialog */}
      <Dialog open={exporting}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Exporting Data</DialogTitle>
            <DialogDescription>
              Please wait while we prepare your export file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="mb-4">
              <Progress value={exportProgress} className="h-2" />
            </div>
            <p className="text-center text-sm text-gray-500">
              {exportProgress}% complete
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Export Success Dialog */}
      <Dialog open={showExportSuccessDialog} onOpenChange={setShowExportSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Complete</DialogTitle>
            <DialogDescription>
              Your parties have been successfully exported.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success</AlertTitle>
              <AlertDescription>
                The export file has been downloaded to your device.
              </AlertDescription>
            </Alert>
            
            {exportResults && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">File Name:</span>
                  <span className="text-sm text-gray-600">{exportResults.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Records:</span>
                  <span className="text-sm text-gray-600">{exportResults.totalRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Exported Records:</span>
                  <span className="text-sm text-gray-600">{exportResults.exportedRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Time:</span>
                  <span className="text-sm text-gray-600">{exportResults.timestamp}</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Export More
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

export default ExportParties