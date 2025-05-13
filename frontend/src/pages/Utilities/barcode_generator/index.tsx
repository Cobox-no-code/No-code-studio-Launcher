'use client'
import { Button } from '@/components/ui/button'
import {
  Card
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'

import { BarcodeSize, PrinterType } from '@/models/utility/barcode.model'
import {
  useDeleteBarcodeMutation,
  useGenerateBarcodeMutation,
  useGetBarcodesQuery,
  useGetBarcodeTemplatesQuery,
  useGetPrintersQuery
} from '@/redux/api/barcodeApi'
import {
  BarChart4,
  Eye,
  FileText,
  Info,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
const BarcodeGenerator = () => {
  
  // Form state
  const [itemName, setItemName] = useState('')
  const [itemCode, setItemCode] = useState('')
  const [numberOfLabels, setNumberOfLabels] = useState('1')
  const [header, setHeader] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [salePrice, setSalePrice] = useState<string>('')
  
  // Dropdown selections
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterType>('Regular Printer')
  const [selectedSize, setSelectedSize] = useState<BarcodeSize>('65 Labels (38 × 21mm)')
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  
  // API hooks
  const { data: barcodes, isLoading: isLoadingBarcodes } = useGetBarcodesQuery()
  const { data: templates } = useGetBarcodeTemplatesQuery()
  const { data: printers } = useGetPrintersQuery()
  const [generateBarcode, { isLoading: isGenerating }] = useGenerateBarcodeMutation()
  const [deleteBarcode] = useDeleteBarcodeMutation()
  
  // Get default selections for printer and size from API data
  useEffect(() => {
    if (printers?.length) {
      const defaultPrinter = printers.find(p => p.isDefault)
      if (defaultPrinter) {
        setSelectedPrinter(defaultPrinter.name as PrinterType)
      }
    }
    
    if (templates?.length) {
      const defaultTemplate = templates.find(t => t.isDefault)
      if (defaultTemplate) {
        setSelectedSize(defaultTemplate.size as BarcodeSize)
      }
    }
  }, [printers, templates])
  
  // Handle barcode generation
  const handleGenerate = async () => {
    if (!itemName || !itemCode || !numberOfLabels) {
      toast(
       "Please fill in all required fields."
      )
      return
    }
    
    try {
      const response = await generateBarcode({
        itemName,
        itemCode,
        numberOfLabels: parseInt(numberOfLabels),
        header,
        line1,
        line2,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
      }).unwrap()
      
      toast( "Barcode generated successfully")
      
      resetForm()
    } catch (error) {
      toast(
        "An error occurred while generating the barcode.",
      )
    }
  }
  
  // Handle barcode deletion
  const handleDelete = async (id: string) => {
    try {
      await deleteBarcode(id).unwrap()
      toast(
       "The barcode has been deleted successfully.",
      )
    } catch (error) {
      toast(
        "An error occurred while deleting the barcode.",
      )
    }
  }
  
  // Reset form fields
  const resetForm = () => {
    setItemName('')
    setItemCode('')
    setNumberOfLabels('1')
    setHeader('')
    setLine1('')
    setLine2('')
    setSalePrice('')
  }
  
  // Handle form field changes
  const handleFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case 'itemName':
        setItemName(value)
        break
      case 'itemCode':
        setItemCode(value)
        break
      case 'numberOfLabels':
        // Only allow numbers
        if (/^\d*$/.test(value)) {
          setNumberOfLabels(value)
        }
        break
      case 'header':
        setHeader(value)
        break
      case 'line1':
        setLine1(value)
        break
      case 'line2':
        setLine2(value)
        break
      case 'salePrice':
        // Allow only numbers and decimal point
        if (/^\d*\.?\d*$/.test(value)) {
          setSalePrice(value)
        }
        break
      default:
        break
    }
  }
  
  // Add a barcode to the generation list
  const handleAddBarcode = () => {
    if (!itemName || !itemCode) {
      toast(
        "Item Name and Item Code are required.",
      )
      return
    }
    
    // In a real implementation, this would add the barcode to a list
    // For now, we'll just use toast to demonstrate
    toast( `Added ${itemName} to the generation list.`,
    )
  }
  
  // Format currency value
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return ''
    return value.toFixed(2)
  }
  
  return (
    <main className="h-full w-full flex flex-col">
      <section className="w-full h-14 bg-white flex items-center justify-between p-3 gap-3 border-b">
        <p className="flex items-center gap-2 text-xl font-semibold">
          <BarChart4 className="h-5 w-5 text-gray-600" />
          Barcode Generator
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Generate and print barcode labels for your items.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="printer-select" className="whitespace-nowrap">Printer:</Label>
            <Select value={selectedPrinter} onValueChange={(value) => setSelectedPrinter(value as PrinterType)}>
              <SelectTrigger id="printer-select" className="w-40">
                <SelectValue placeholder="Select printer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular Printer">Regular Printer</SelectItem>
                <SelectItem value="Thermal Printer">Thermal Printer</SelectItem>
                <SelectItem value="Label Printer">Label Printer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="size-select" className="whitespace-nowrap">Size:</Label>
            <Select value={selectedSize} onValueChange={(value) => setSelectedSize(value as BarcodeSize)}>
              <SelectTrigger id="size-select" className="w-44">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="65 Labels (38 × 21mm)">65 Labels (38 × 21mm)</SelectItem>
                <SelectItem value="40 Labels (48 × 25mm)">40 Labels (48 × 25mm)</SelectItem>
                <SelectItem value="24 Labels (64 × 34mm)">24 Labels (64 × 34mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
      
      <section className="bg-[#f8f8f8] flex-1 p-4 flex flex-col gap-6">
        {/* Form and Preview Area */}
        <div className="flex gap-6">
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <Label htmlFor="item-name" className="text-sm font-medium flex items-center">
                  Item Name
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="item-name"
                  value={itemName}
                  onChange={(e) => handleFieldChange('itemName', e.target.value)}
                  placeholder="Enter Item Name"
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="item-code" className="text-sm font-medium flex items-center">
                  Item Code
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="item-code"
                  value={itemCode}
                  onChange={(e) => handleFieldChange('itemCode', e.target.value)}
                  placeholder="Assign Code"
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="number-of-labels" className="text-sm font-medium flex items-center">
                  No of Labels
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="number-of-labels"
                  value={numberOfLabels}
                  onChange={(e) => handleFieldChange('numberOfLabels', e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="header" className="text-sm font-medium">
                  Header
                </Label>
                <Input
                  id="header"
                  value={header}
                  onChange={(e) => handleFieldChange('header', e.target.value)}
                  placeholder="Enter Header"
                  className="mt-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" className="h-auto p-0 mt-1 text-xs text-blue-600">
                      Choose placeholder
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm" 
                        onClick={() => setHeader("<Company Name>")}
                      >
                        &lt;Company Name&gt;
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm"
                        onClick={() => setHeader("<Item Name>")}
                      >
                        &lt;Item Name&gt;
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm"
                        onClick={() => setHeader("<Sale Price>")}
                      >
                        &lt;Sale Price&gt;
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="line1" className="text-sm font-medium">
                  Line 1
                </Label>
                <Input
                  id="line1"
                  value={line1}
                  onChange={(e) => handleFieldChange('line1', e.target.value)}
                  placeholder="Enter Line 1"
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="line2" className="text-sm font-medium">
                  Line 2
                </Label>
                <Input
                  id="line2"
                  value={line2}
                  onChange={(e) => handleFieldChange('line2', e.target.value)}
                  placeholder="Enter Line 2"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleAddBarcode}
                className="bg-blue-500 hover:bg-blue-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add for Barcode
              </Button>
            </div>
          </div>
          
          {/* Preview Card */}
          <div className="w-80 bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <h3 className="text-center mb-4">
              Sale Price: {salePrice ? `${salePrice}` : '87'}
            </h3>
            
            <div className="h-24 w-full flex items-center justify-center">
              {/* Barcode Image (placeholder) */}
              <svg className="w-full" height="60">
                <rect x="10" y="5" width="3" height="50" />
                <rect x="15" y="5" width="1" height="50" />
                <rect x="20" y="5" width="2" height="50" />
                <rect x="25" y="5" width="1" height="50" />
                <rect x="30" y="5" width="3" height="50" />
                <rect x="35" y="5" width="2" height="50" />
                <rect x="40" y="5" width="1" height="50" />
                <rect x="45" y="5" width="2" height="50" />
                <rect x="50" y="5" width="3" height="50" />
                <rect x="55" y="5" width="1" height="50" />
                <rect x="60" y="5" width="3" height="50" />
                <rect x="65" y="5" width="2" height="50" />
                <rect x="70" y="5" width="1" height="50" />
                <rect x="75" y="5" width="3" height="50" />
                <rect x="80" y="5" width="1" height="50" />
                <rect x="85" y="5" width="2" height="50" />
                <rect x="90" y="5" width="3" height="50" />
                <rect x="95" y="5" width="1" height="50" />
                <rect x="100" y="5" width="2" height="50" />
                <rect x="105" y="5" width="3" height="50" />
                <rect x="110" y="5" width="2" height="50" />
                <rect x="115" y="5" width="1" height="50" />
                <rect x="120" y="5" width="3" height="50" />
                <rect x="125" y="5" width="2" height="50" />
                <rect x="130" y="5" width="1" height="50" />
                <rect x="135" y="5" width="3" height="50" />
                <rect x="140" y="5" width="2" height="50" />
                <rect x="145" y="5" width="3" height="50" />
                <rect x="150" y="5" width="1" height="50" />
                <rect x="155" y="5" width="2" height="50" />
                <rect x="160" y="5" width="3" height="50" />
                <rect x="165" y="5" width="1" height="50" />
                <rect x="170" y="5" width="3" height="50" />
                <rect x="175" y="5" width="2" height="50" />
                <rect x="180" y="5" width="3" height="50" />
                <rect x="185" y="5" width="1" height="50" />
                <rect x="190" y="5" width="3" height="50" />
                <rect x="195" y="5" width="2" height="50" />
                <rect x="200" y="5" width="3" height="50" />
                <rect x="205" y="5" width="1" height="50" />
                <rect x="210" y="5" width="2" height="50" />
                <rect x="215" y="5" width="3" height="50" />
                <rect x="220" y="5" width="2" height="50" />
              </svg>
            </div>
            
            <div className="text-center mt-2">
              <p className="text-sm">{itemCode || 'ItemCode'}</p>
              <p className="text-sm">{line1 || 'test'}</p>
              <p className="text-sm">{line2 || 'Line2'}</p>
            </div>
            
            <div className="mt-4 w-full">
              <Input
                value={salePrice}
                onChange={(e) => handleFieldChange('salePrice', e.target.value)}
                placeholder="Enter Sale Price"
                className="mb-2"
              />
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <span className="mr-2">Generating...</span>
                    <span className="animate-spin">⏳</span>
                  </>
                ) : (
                  <>Generate</>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Barcode History Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader className="bg-blue-50">
              <TableRow>
                <TableHead className="w-1/5">Item Name</TableHead>
                <TableHead className="w-1/5">No of Labels</TableHead>
                <TableHead className="w-1/5">Sale Price</TableHead>
                <TableHead className="w-1/5">Line 1</TableHead>
                <TableHead className="w-1/5">Line 2</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingBarcodes ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : barcodes && barcodes.length > 0 ? (
                barcodes.map((barcode) => (
                  <TableRow key={barcode.id}>
                    <TableCell>{barcode.itemName}</TableCell>
                    <TableCell>{barcode.numberOfLabels}</TableCell>
                    <TableCell>{barcode.salePrice ? `${formatCurrency(barcode.salePrice)}` : '-'}</TableCell>
                    <TableCell>{barcode.line1 || '-'}</TableCell>
                    <TableCell>{barcode.line2 || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(barcode.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            setItemName(barcode.itemName);
                            setItemCode(barcode.itemCode);
                            setNumberOfLabels(barcode.numberOfLabels.toString());
                            setHeader(barcode.header || '');
                            setLine1(barcode.line1 || '');
                            setLine2(barcode.line2 || '');
                            setSalePrice(barcode.salePrice?.toString() || '');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No barcodes generated yet. Create your first barcode above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      
      {/* Paper size info */}
      <section className="bg-white p-3 border-t flex justify-between items-center">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-orange-500" />
          <span className="text-sm text-orange-500">You will need 1 pages for printing.</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Paper Size: A4
          </div>
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            className="bg-red-500 hover:bg-red-600"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="mr-2">Generating...</span>
                <span className="animate-spin">⏳</span>
              </>
            ) : (
              <>Generate</>
            )}
          </Button>
        </div>
      </section>
      
      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Barcode Preview</DialogTitle>
            <DialogDescription>
              Preview how your barcodes will look when printed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            {Array.from({ length: Math.min(parseInt(numberOfLabels) || 1, 6) }).map((_, index) => (
              <Card key={index} className="border p-4 flex flex-col items-center">
                <p className="text-center mb-2">
                  Sale Price: {salePrice ? `${salePrice}` : '87'}
                </p>
                
                <div className="h-16 w-full flex items-center justify-center">
                  {/* Barcode Image (placeholder) */}
                  <svg className="w-full" height="40">
                    <rect x="5" y="5" width="2" height="30" />
                    <rect x="9" y="5" width="1" height="30" />
                    <rect x="12" y="5" width="1" height="30" />
                    <rect x="15" y="5" width="2" height="30" />
                    <rect x="19" y="5" width="1" height="30" />
                    <rect x="22" y="5" width="2" height="30" />
                    <rect x="25" y="5" width="1" height="30" />
                    <rect x="28" y="5" width="1" height="30" />
                    <rect x="31" y="5" width="2" height="30" />
                    <rect x="34" y="5" width="1" height="30" />
                    <rect x="37" y="5" width="2" height="30" />
                    <rect x="40" y="5" width="1" height="30" />
                    <rect x="43" y="5" width="1" height="30" />
                    <rect x="46" y="5" width="2" height="30" />
                    <rect x="49" y="5" width="1" height="30" />
                    <rect x="52" y="5" width="2" height="30" />
                    <rect x="55" y="5" width="1" height="30" />
                    <rect x="58" y="5" width="2" height="30" />
                    <rect x="61" y="5" width="1" height="30" />
                    <rect x="64" y="5" width="1" height="30" />
                    <rect x="67" y="5" width="2" height="30" />
                    <rect x="70" y="5" width="1" height="30" />
                    <rect x="73" y="5" width="2" height="30" />
                    <rect x="76" y="5" width="1" height="30" />
                    <rect x="79" y="5" width="1" height="30" />
                    <rect x="82" y="5" width="2" height="30" />
                    <rect x="85" y="5" width="1" height="30" />
                    <rect x="88" y="5" width="2" height="30" />
                    <rect x="91" y="5" width="1" height="30" />
                    <rect x="94" y="5" width="1" height="30" />
                    <rect x="97" y="5" width="2" height="30" />
                    <rect x="100" y="5" width="1" height="30" />
                  </svg>
                </div>
                
                <div className="text-center mt-2">
                  <p className="text-xs">{itemCode || 'ItemCode'}</p>
                  <p className="text-xs">{line1 || 'test'}</p>
                  <p className="text-xs">{line2 || 'Line2'}</p>
                </div>
              </Card>
            ))}
          </div>
          
          {parseInt(numberOfLabels) > 6 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Showing 6 of {numberOfLabels} labels
            </p>
          )}
          
          <div className="mt-6 text-right">
            <Button variant="default" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default BarcodeGenerator