import React, { useState, useRef, useEffect } from 'react'
import { Dispatch } from '@reduxjs/toolkit'
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  PackageOpen,
  Hash,
  Calculator,
  ArrowDownUp,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SaleInvoice, InvoiceItem } from '../../../backend/models/sale/saleInvoice'
import {
  Item,
  Product,
  Service,
  ItemType,
  isProduct,
  UnitConversion,
} from '../../../backend/models/item/item.model'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  addItem,
  updateItem,
  removeItem,
  updateFormField,
} from '@/redux/slices/saleInvoiceFormSlice'
import { useGetItemsQuery } from '@/redux/api/itemsApi'
import { toast } from 'react-hot-toast'
import { useGetUnitsQuery, useGetUnitConversionsQuery } from '@/redux/api'
import {
  openCreateForm as openConversionForm,
  openCreateForm,
} from '@/redux/slices/unitConversionSlice'
import { countryTaxMap } from '@/lib/data'
import { openEditForm } from '@/redux/slices/itemsSlice'

interface SaleInvoiceTableProps {
  formData: Omit<SaleInvoice, 'id' | 'createdAt' | 'updatedAt'>
  dispatch: Dispatch
  validationErrors: Record<string, string>
}

const SaleInvoiceTable: React.FC<SaleInvoiceTableProps> = ({
  formData,
  dispatch,
  validationErrors,
}) => {
  // Local state
  const [focusedRow, setFocusRow] = useState<number | null>(null)
  const [showItemDropdown, setShowItemDropdown] = useState<number | null>(null)
  const [itemSearchTerm, setItemSearchTerm] = useState('')
  const [showDeleteWarning, setShowDeleteWarning] = useState<number | null>(null)
  const [showRowNumbers, setShowRowNumbers] = useState(true)
  const [countryCode, setCountryCode] = useState<string>('IN')
  const [selectedTaxRates, setSelectedTaxRates] = useState<Array<any>>([])
  const [prevTotals, setPrevTotals] = useState({
    totalTax: '0',
    totalDiscount: '0',
  })

  // Refs for dropdown handling
  const itemInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)

  // Fetch items, units, and unit conversions using RTK Query
  const {
    data: items,
    isLoading: isLoadingItems,
    error: itemsError,
    refetch: refetchItems,
  } = useGetItemsQuery({})

  const { data: unitOptions } = useGetUnitsQuery()
  const { data: unitConversions } = useGetUnitConversionsQuery()

  // Get country code from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const firmCountry = localStorage.getItem('firmCountry')
      if (firmCountry) {
        setCountryCode(firmCountry)
      }

      // Set available tax rates based on country
      const taxRates = countryTaxMap[firmCountry || 'IN'] || countryTaxMap['default']
      setSelectedTaxRates(taxRates)
    }
  }, [])

  // Helper function to find conversion rates from any source
  const findConversionRate = (primaryUnitId: string, secondaryUnitId: string): {rate: number, isReversed: boolean} => {
    // Default values
    let rate = 1;
    let isReversed = false;
    
    if (!primaryUnitId || !secondaryUnitId || primaryUnitId === secondaryUnitId) {
      return { rate, isReversed };
    }
    
    // Try to find the conversion
    if (unitConversions) {
      // Look for direct match
      const directMatch = unitConversions.find(
        uc => uc.primaryUnitId === primaryUnitId && uc.secondaryUnitId === secondaryUnitId
      );
      
      if (directMatch) {
        return { rate: directMatch.conversionRate, isReversed: false };
      }
      
      // Look for reversed match
      const reversedMatch = unitConversions.find(
        uc => uc.primaryUnitId === secondaryUnitId && uc.secondaryUnitId === primaryUnitId
      );
      
      if (reversedMatch) {
        return { rate: reversedMatch.conversionRate, isReversed: true };
      }
    }
    
    return { rate, isReversed };
  };

  // Helper function to get the conversion rate text consistently
  const getConversionRateText = (row: InvoiceItem, item?: Item): string => {
    if (!row.unitId || !row.secondaryUnitId || !row.unit || !row.secondaryUnit) {
      return '';
    }
    
    // First, try to find conversion through the selected item
    if (item && isProduct(item)) {
      const conversion = getUnitConversion(item.id);
      if (conversion) {
        return `1 ${row.unit} = ${conversion.conversionRate} ${row.secondaryUnit}`;
      }
    }
    
    // If no item provided or conversion not found via item, 
    // try to find conversion directly from unitConversions
    if (unitConversions) {
      // Look for direct match
      const directMatch = unitConversions.find(
        uc => uc.primaryUnitId === row.unitId && uc.secondaryUnitId === row.secondaryUnitId
      );
      
      if (directMatch) {
        return `1 ${row.unit} = ${directMatch.conversionRate} ${row.secondaryUnit}`;
      }
      
      // Look for reversed match
      const reversedMatch = unitConversions.find(
        uc => uc.primaryUnitId === row.secondaryUnitId && uc.secondaryUnitId === row.unitId
      );
      
      if (reversedMatch) {
        return `1 ${row.unit} = ${(1 / reversedMatch.conversionRate).toFixed(4)} ${row.secondaryUnit}`;
      }
    }
    
    return '';
  };

  // Filtered items based on search term
  const filteredItems = items
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
          (item.itemCode &&
            item.itemCode.toLowerCase().includes(itemSearchTerm.toLowerCase()))
      )
    : []

  // Create empty item row based on InvoiceItem model
  const createEmptyItemRow = (): InvoiceItem => ({
    itemId: '',
    item: '',
    primaryQuantity: '1',
    secondaryQuantity: '0',
    unitId: '',
    unit: 'pcs',
    secondaryUnitId: '',
    secondaryUnit: '',
    pricePerUnit: '',
    taxType: '',
    taxRateId: '',
    taxAmount: '0',
    amount: '0',
    categoryId: '',
    category: '',
    discountPercent: '0',
    discountAmount: '0',
    hsnCode: '',
  })

  // Add new item row
  const handleAddItemRow = () => {
    dispatch(addItem(createEmptyItemRow()))
    toast.success('New item row added')
  }

  // Get tax rate percentage from tax type
  const getTaxRateFromType = (taxType: string): number => {
    if (!taxType || taxType === 'None') return 0

    const taxOption = selectedTaxRates.find((tax) => tax.value === taxType)
    if (!taxOption) return 0

    // Extract the percentage from the label, e.g., "GST@18%" -> 18
    const match = taxOption.label.match(/(\d+(\.\d+)?)%/)
    return match ? parseFloat(match[1]) : 0
  }

  // Find unit conversion for an item
  const getUnitConversion = (itemId: string): UnitConversion | null => {
    if (!unitConversions || !items) return null

    const item = items.find((item) => item.id === itemId)
    if (!item || !isProduct(item)) return null

    const product = item as Product
    if (!product.unit_conversionId) return null

    return (
      unitConversions.find(
        (conversion) => conversion.id === product.unit_conversionId
      ) || null
    )
  }

  // Get unit name by ID
  const getUnitName = (unitId: string): string => {
    if (!unitOptions) return ''
    const unit = unitOptions.find((u) => u.id === unitId)
    return unit ? unit.shortname : ''
  }

  // Calculate total quantity in base units (e.g., pencils instead of boxes)
  const calculateTotalQuantity = (
    primaryQty: number,
    secondaryQty: number,
    conversionRate: number
  ): number => {
    // Total = (Primary Qty * Conversion Rate) + Secondary Qty
    return primaryQty * conversionRate + secondaryQty
  }

  // Calculate final amount based on pricing logic
  const calculateItemAmount = (
    primaryQty: number,
    secondaryQty: number,
    pricePerPrimaryUnit: number,
    conversionRate: number,
    discountPercent: number
  ) => {
    // Guard against invalid conversion rate
    if (!conversionRate || conversionRate <= 0) {
      conversionRate = 1; // Default to 1:1 if no conversion rate
    }

    // Calculate total quantity in base units (e.g., total pencils)
    const totalBaseUnits = (primaryQty * conversionRate) + secondaryQty;

    // Calculate price per base unit (e.g., price per pencil)
    const pricePerBaseUnit = pricePerPrimaryUnit / conversionRate;

    // Calculate gross amount before discount
    const grossAmount = totalBaseUnits * pricePerBaseUnit;

    // Calculate discount amount
    const discountAmount = (grossAmount * discountPercent) / 100;

    // Calculate amount before tax (after discount)
    const amountBeforeTax = grossAmount - discountAmount;

    return {
      totalBaseUnits,
      discountAmount,
      amountBeforeTax,
      grossAmount, // used for tax calculation
      pricePerBaseUnit, // Useful for debugging
      conversionRate, // Return the conversion rate used
    }
  }

  // Handle item selection from dropdown
  const handleItemSelection = (index: number, item: Item) => {
    let primaryUnitId = ''
    let primaryUnit = ''
    let secondaryUnitId = ''
    let secondaryUnit = ''
    let conversionRate = 0

    // Set correct unit information
    if (isProduct(item)) {
      const product = item as Product

      // Get unit information if available
      if (product.unit_conversionId && unitConversions) {
        const conversion = unitConversions.find(
          (uc) => uc.id === product.unit_conversionId
        )
        if (conversion) {
          conversionRate = conversion.conversionRate
          primaryUnitId = conversion.primaryUnitId
          primaryUnit = getUnitName(primaryUnitId)

          secondaryUnitId = conversion.secondaryUnitId
          secondaryUnit = getUnitName(secondaryUnitId)
        }
      }
    }

    // Determine default tax type based on country
    const defaultTaxType =
      selectedTaxRates.length > 0
        ? selectedTaxRates[1]?.value || 'None'
        : 'None'

    const updatedItem = {
      ...formData.items[index],
      item: item.name,
      itemId: item.id,
      pricePerUnit: item.salePrice?.toString() || '',
      unitId: primaryUnitId || '',
      unit: primaryUnit || 'pcs',
      secondaryUnitId: secondaryUnitId || '',
      secondaryUnit: secondaryUnit || '',
      primaryQuantity: '1', // Default to 1 for primary quantity
      secondaryQuantity: '0', // Default to 0 for secondary quantity
      hsnCode: item.hsnCode || '',
      taxType: defaultTaxType,
      taxRateId: item.taxRate || '',
      categoryId: item.categoryId || '',
      category: '', // Would need to fetch category name
      itemCode: item.itemCode || '',
    }

    // Calculate amounts based on unit conversion
    const primaryQty = parseFloat(updatedItem.primaryQuantity) || 0
    const secondaryQty = parseFloat(updatedItem.secondaryQuantity) || 0
    const price = parseFloat(updatedItem.pricePerUnit?.toString() || '0') || 0
    const discountPercent =
      parseFloat(updatedItem.discountPercent?.toString() || '0') || 0

    // Calculate amounts
    let discountAmount = 0
    let amountBeforeTax = 0

    if (conversionRate > 0) {
      // We have a conversion rate, calculate based on base units
      const result = calculateItemAmount(
        primaryQty,
        secondaryQty,
        price,
        conversionRate,
        discountPercent
      )
      discountAmount = result.discountAmount
      amountBeforeTax = result.amountBeforeTax
    } else {
      // No conversion rate, just use primary quantity
      discountAmount = (primaryQty * price * discountPercent) / 100
      amountBeforeTax = primaryQty * price - discountAmount
    }

    // Calculate tax
    const taxRate = getTaxRateFromType(updatedItem.taxType)
    const taxAmount = (amountBeforeTax * taxRate) / 100

    // Set calculated values
    updatedItem.discountAmount = discountAmount.toFixed(2)
    updatedItem.taxAmount = taxAmount.toFixed(2)
    updatedItem.amount = (amountBeforeTax + taxAmount).toFixed(2)

    dispatch(updateItem({ index, item: updatedItem }))
    setShowItemDropdown(null)
    setItemSearchTerm('')
  }

  const handleItemInputChange = (index: number, value: string) => {
    setItemSearchTerm(value)
    handleItemChange(index, 'item', value)
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        itemInputRef.current &&
        !itemInputRef.current.contains(event.target as Node)
      ) {
        setShowItemDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update item row with calculations
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string
  ) => {
    const updatedItem = { ...formData.items[index], [field]: value };
    const selectedItem = items?.find((i) => i.id === updatedItem.itemId);

    if (
      [
        'primaryQuantity',
        'secondaryQuantity',
        'pricePerUnit',
        'discountPercent',
        'taxType',
      ].includes(field)
    ) {
      // Convert to numbers safely
      const primaryQty = parseFloat(updatedItem.primaryQuantity?.toString() || '0') || 0;
      const secondaryQty = parseFloat(updatedItem.secondaryQuantity?.toString() || '0') || 0;
      const price = parseFloat(updatedItem.pricePerUnit?.toString() || '0') || 0;
      const discountPercent = parseFloat(updatedItem.discountPercent?.toString() || '0') || 0;

      // Update unit name if changed
      if (field === 'unitId' && value) {
        updatedItem.unit = getUnitName(value);
      }

      let discountAmount = 0;
      let amountBeforeTax = 0;
      let grossAmount = primaryQty * price;
      let conversionRate = 1;

      // First, check if the item has a unit conversion
      let hasConversion = false;
      
      if (selectedItem && isProduct(selectedItem)) {
        const conversion = getUnitConversion(selectedItem.id);
        if (conversion) {
          conversionRate = conversion.conversionRate;
          hasConversion = true;
        }
      }
      
      // If the item doesn't have a conversion but we have unitId and secondaryUnitId, 
      // try to find a conversion directly
      if (!hasConversion && updatedItem.unitId && updatedItem.secondaryUnitId && unitConversions) {
        const { rate, isReversed } = findConversionRate(updatedItem.unitId, updatedItem.secondaryUnitId);
        conversionRate = isReversed ? 1 / rate : rate;
        hasConversion = true;
      }

      if (hasConversion) {
        // We have a conversion rate, calculate based on base units
        const result = calculateItemAmount(
          primaryQty,
          secondaryQty,
          price,
          conversionRate,
          discountPercent
        );
        discountAmount = result.discountAmount;
        amountBeforeTax = result.amountBeforeTax;
        grossAmount = result.grossAmount || (primaryQty * price);
      } else {
        // No conversion
        discountAmount = (primaryQty * price * discountPercent) / 100;
        amountBeforeTax = primaryQty * price - discountAmount;
        grossAmount = primaryQty * price;
      }

      // Calculate tax based on net amount after discount
      const taxRate = getTaxRateFromType(updatedItem.taxType);
      const taxAmount = (amountBeforeTax * taxRate) / 100;

      // Final updates
      updatedItem.discountAmount = discountAmount.toFixed(2);
      updatedItem.taxAmount = taxAmount.toFixed(2);
      updatedItem.amount = (amountBeforeTax + taxAmount).toFixed(2); // discounted + tax
    }

    dispatch(updateItem({ index, item: updatedItem }));
  }

  // Handle swapping between primary and secondary units
  const handleSwapUnits = (index: number) => {
    const item = formData.items[index];
    if (!item.unitId || !item.secondaryUnitId) return;
    
    // Find the conversion rate between these units
    let conversionRate = 1;
    let isReversedConversion = false;
    
    // First, try to find conversion through the selected item
    const selectedItem = items?.find(i => i.id === item.itemId);
    if (selectedItem && isProduct(selectedItem)) {
      const itemConversion = getUnitConversion(selectedItem.id);
      if (itemConversion) {
        conversionRate = itemConversion.conversionRate;
        
        // Check if we need to reverse (if item's primary unit is the conversion's secondary unit)
        isReversedConversion = (item.unitId !== itemConversion.primaryUnitId);
      }
    }
    
    // If we couldn't find conversion through item, look directly in unitConversions
    if (conversionRate === 1 && unitConversions) {
      const { rate, isReversed } = findConversionRate(item.unitId, item.secondaryUnitId);
      conversionRate = rate;
      isReversedConversion = isReversed;
    }
    
    const updatedItem = { ...item };
    
    // Swap units
    const tempUnitId = updatedItem.unitId;
    const tempUnit = updatedItem.unit;
    
    updatedItem.unitId = updatedItem.secondaryUnitId ||'';
    updatedItem.unit = updatedItem.secondaryUnit ||'';
    updatedItem.secondaryUnitId = tempUnitId;
    updatedItem.secondaryUnit = tempUnit;
    
    // Calculate the new price per unit based on the conversion rate
    const price = parseFloat(updatedItem.pricePerUnit?.toString() || '0') || 0;
    
    // If we're already using a reversed conversion, we need to divide instead of multiply
    // If not, we need to multiply instead of divide
    const newPricePerUnit = isReversedConversion 
      ? price / conversionRate  // If we were using the inverted rate, now use direct rate
      : price * conversionRate; // If we were using direct rate, now use inverted rate
      
    updatedItem.pricePerUnit = newPricePerUnit.toFixed(2);
    
    // Recalculate amounts
    const primaryQty = parseFloat(updatedItem.primaryQuantity?.toString() || '0') || 0;
    const secondaryQty = parseFloat(updatedItem.secondaryQuantity?.toString() || '0') || 0;
    const discountPercent = parseFloat(updatedItem.discountPercent?.toString() || '0') || 0;
    
    // Calculate with the new swapped configuration
    const effectiveConversionRate = isReversedConversion ? conversionRate : 1 / conversionRate;
    
    const result = calculateItemAmount(
      primaryQty,
      secondaryQty,
      newPricePerUnit,
      effectiveConversionRate,
      discountPercent
    );
    
    updatedItem.discountAmount = result.discountAmount.toFixed(2);
    
    const taxRate = getTaxRateFromType(updatedItem.taxType);
    const taxAmount = (result.amountBeforeTax * taxRate) / 100;
    updatedItem.taxAmount = taxAmount.toFixed(2);
    
    updatedItem.amount = (result.amountBeforeTax + taxAmount).toFixed(2);
    
    dispatch(updateItem({ index, item: updatedItem }));
    toast.success(`Switched primary unit to ${updatedItem.unit}`);
  }

  // Open unit conversion dialog
  const handleAddConversion = (unitId?: string) => {
    if (unitId) {
      dispatch(openConversionForm(unitId))
      toast.success('Opening unit conversion form')
    } else {
      toast.error('Please select a unit first')
    }
  }

  // Delete item row
  const handleDeleteItemRow = (index: number) => {
    // If only one item left, just reset it instead of removing
    if (formData.items.length === 1) {
      dispatch(updateItem({ index, item: createEmptyItemRow() }))
    } else {
      dispatch(removeItem(index))
    }
    setShowDeleteWarning(null)
    toast.success('Item removed')
  }

  // Item search and selection
  const handleItemInputFocus = (index: number) => {
    setFocusRow(index)
    setShowItemDropdown(index)
    setItemSearchTerm(formData.items[index].item || '')
  }

  // Calculate totals for the table
  const calculateTotals = () => {
    let totalQty = 0
    let totalDiscount = 0
    let totalTax = 0
    let totalAmount = 0

    formData.items.forEach((item) => {
      const selectedItem = items?.find((i) => i.id === item.itemId)

      if (selectedItem && isProduct(selectedItem)) {
        const conversion = getUnitConversion(selectedItem.id)
        if (conversion) {
          // Calculate total quantity in base units
          const primaryQty =
            parseFloat(item.primaryQuantity?.toString() || '0') || 0
          const secondaryQty =
            parseFloat(item.secondaryQuantity?.toString() || '0') || 0
          totalQty += calculateTotalQuantity(
            primaryQty,
            secondaryQty,
            conversion.conversionRate
          )
        } else if (item.unitId && item.secondaryUnitId) {
          // Try to find a direct conversion
          const { rate, isReversed } = findConversionRate(item.unitId, item.secondaryUnitId);
          const conversionRate = isReversed ? 1 / rate : rate;
          
          const primaryQty = parseFloat(item.primaryQuantity?.toString() || '0') || 0;
          const secondaryQty = parseFloat(item.secondaryQuantity?.toString() || '0') || 0;
          totalQty += calculateTotalQuantity(primaryQty, secondaryQty, conversionRate);
        } else {
          // No conversion - just use primary quantity
          totalQty += parseFloat(item.primaryQuantity?.toString() || '0') || 0
        }
      } else {
        // Not a product or no item selected
        totalQty += parseFloat(item.primaryQuantity?.toString() || '0') || 0
      }

      // Add discount and tax amounts
      totalDiscount += parseFloat(item.discountAmount?.toString() || '0') || 0
      totalTax += parseFloat(item.taxAmount?.toString() || '0') || 0
      totalAmount += parseFloat(item.amount?.toString() || '0') || 0
    })

    return {
      totalQty: totalQty.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    }
  }

  const totals = calculateTotals()

  // Update invoice totals whenever items change, but avoid infinite update loops
  useEffect(() => {
    // Skip the first render
    if (isInitialMount.current) {
      isInitialMount.current = false
      setPrevTotals({
        totalTax: totals.totalTax,
        totalDiscount: totals.totalDiscount,
      })
      return
    }

    // Only update if the totals have actually changed
    if (
      prevTotals.totalTax !== totals.totalTax ||
      prevTotals.totalDiscount !== totals.totalDiscount
    ) {
      // Update form data with new totals
      dispatch(
        updateFormField({
          field: 'tax',
          value: {
            percentage: '',
            amount: totals.totalTax,
          },
        })
      )

      dispatch(
        updateFormField({
          field: 'discount',
          value: {
            percentage: '',
            amount: totals.totalDiscount,
          },
        })
      )

      // Update our saved previous totals
      setPrevTotals({
        totalTax: totals.totalTax,
        totalDiscount: totals.totalDiscount,
      })
    }
  }, [totals.totalTax, totals.totalDiscount])

  return (
    <Card className="border shadow-sm mb-4">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center">
          <PackageOpen className="mr-2 h-5 w-5 text-primary" />
          Invoice Items
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {itemsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-1" />
            <AlertDescription>
              Failed to load items. Please try refreshing.
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchItems()}
                className="ml-2 h-6"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 text-gray-700">
              <tr>
                <th
                  className={`p-2 text-left font-medium border-b border-r border-gray-200 cursor-pointer ${
                    showRowNumbers ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => setShowRowNumbers(!showRowNumbers)}
                  title="Click to toggle row numbers"
                  style={{ width: '40px' }}
                >
                  #
                </th>
                <th
                  className="p-2 text-left font-medium border-b border-r border-gray-200"
                  style={{ width: '25%' }}
                >
                  ITEM
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  HSN
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          PRIMARY QTY
                          <Info className="h-3 w-3 ml-1 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Quantity in primary unit</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  UNIT
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          SEC. QTY
                          <Info className="h-3 w-3 ml-1 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Quantity in secondary unit</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  PRICE/UNIT
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  DISC %
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  DISC AMT
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  TAX
                </th>
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  TAX AMT
                </th>
                <th
                  className="p-2 text-left font-medium border-b border-gray-200"
                  style={{ width: '10%' }}
                >
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-6 text-gray-500">
                    No items added. Click the Add Item button below to add your
                    first item.
                  </td>
                </tr>
              ) : (
                formData.items.map((row, index) => {
                  // Check if this item has a unit conversion
                  const selectedItem = items?.find(
                    (item) => item.id === row.itemId
                  )
                  const hasUnitConversion =
                    selectedItem &&
                    isProduct(selectedItem) &&
                    row.secondaryUnitId &&
                    row.secondaryUnit

                  return (
                    <tr
                      key={index}
                      className={`group hover:bg-gray-50 ${
                        index % 2 === 1 ? 'bg-gray-50' : ''
                      }`}
                    >
                      {/* Row Number */}
                      <td className="p-2 text-center border-r border-gray-200 relative">
                        {showRowNumbers && (
                          <span className="text-gray-500">{index + 1}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowDeleteWarning(index)}
                          className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                        {showDeleteWarning === index && (
                          <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
                            onClick={() => setShowDeleteWarning(null)}
                          >
                            <div
                              className="bg-white p-4 rounded-lg shadow-xl border border-gray-100 z-50 w-72 animate-in fade-in duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                                Delete Item
                              </h3>
                              <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to remove this item from
                                the invoice?
                              </p>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setShowDeleteWarning(null)}
                                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteItemRow(index)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors flex items-center"
                                >
                                  <Trash2 size={12} className="mr-1" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Item */}
                      <td className="p-2 border-r border-gray-200 relative">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <input
                            ref={
                              index === showItemDropdown
                                ? itemInputRef
                                : undefined
                            }
                            type="text"
                            className={`w-full pl-7 pr-2 py-1 text-sm rounded-md ${
                              focusedRow === index
                                ? 'border-primary ring-1 ring-primary/30'
                                : 'border-gray-200'
                            }`}
                            value={row.item}
                            placeholder="Search or enter item"
                            onFocus={() => handleItemInputFocus(index)}
                            onChange={(e) =>
                              handleItemInputChange(index, e.target.value)
                            }
                          />
                        </div>

                        {showItemDropdown === index && (
                          <div
                            ref={dropdownRef}
                            className="fixed z-50 bg-white shadow-lg max-h-48 rounded-md py-1 text-sm ring-1 ring-gray-200 overflow-auto focus:outline-none"
                            style={{
                              width: itemInputRef.current
                                ? itemInputRef.current.offsetWidth
                                : 'auto',
                              top: itemInputRef.current
                                ? itemInputRef.current.getBoundingClientRect()
                                    .bottom +
                                  window.scrollY +
                                  4
                                : 0,
                              left: itemInputRef.current
                                ? itemInputRef.current.getBoundingClientRect()
                                    .left + window.scrollX
                                : 0,
                            }}
                          >
                            {isLoadingItems ? (
                              <div className="px-4 py-2 text-gray-500 flex items-center">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                                Loading items...
                              </div>
                            ) : filteredItems.length > 0 ? (
                              filteredItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                                  onClick={() =>
                                    handleItemSelection(index, item)
                                  }
                                >
                                  <div className="font-medium">{item.name}</div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="h-5 px-1 bg-primary/5 text-primary border-primary/20"
                                    >
                                      ₹{item.salePrice}
                                    </Badge>
                                    {item.itemCode && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 px-1 bg-gray-50"
                                      >
                                        {item.itemCode}
                                      </Badge>
                                    )}
                                    {isProduct(item) && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 px-1 bg-blue-50 text-blue-500"
                                      >
                                        Product
                                      </Badge>
                                    )}
                                    {!isProduct(item) && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 px-1 bg-purple-50 text-purple-500"
                                      >
                                        Service
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-center">
                                No items found
                                <div className="border-t border-gray-100 mt-1 pt-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-primary text-xs flex items-center justify-center"
                                    onClick={() =>
                                      toast.success(
                                        'Add new item functionality will be implemented'
                                      )
                                    }
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add New
                                    Item
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* HSN Code */}
                      <td className="p-2 border-r border-gray-200">
                        <div className="flex items-center">
                          <Hash className="h-3 w-3 text-gray-400 mr-1" />
                          <input
                            type="text"
                            className={`w-full px-2 py-1 text-sm rounded-md ${
                              focusedRow === index
                                ? 'border-primary ring-1 ring-primary/30'
                                : 'border-gray-200'
                            }`}
                            value={row.hsnCode || ''}
                            placeholder="HSN"
                            onFocus={() => setFocusRow(index)}
                            onBlur={() => setFocusRow(null)}
                            onChange={(e) =>
                              handleItemChange(index, 'hsnCode', e.target.value)
                            }
                          />
                        </div>
                      </td>

                      {/* Primary Quantity */}
                      <td className="p-2 border-r border-gray-200">
                        <div className="relative">
                          <input
                            type="number"
                            className={`w-full px-2 py-1 rounded-md text-right text-sm ${
                              focusedRow === index
                                ? 'border-primary ring-1 ring-primary/30'
                                : 'border-gray-200'
                            } ${hasUnitConversion ? 'pr-9' : ''}`}
                            value={row.primaryQuantity}
                            placeholder="1"
                            min="0"
                            step="0.01"
                            onFocus={() => setFocusRow(index)}
                            onBlur={() => setFocusRow(null)}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'primaryQuantity',
                                e.target.value
                              )
                            }
                          />

                          {/* Display unit with quantity */}
                          {row.unit && (
                            <div className="text-xs text-gray-600 mt-1 text-right">
                              {row.unit}
                            </div>
                          )}

                          {/* Unit conversion toggle button */}
                          {hasUnitConversion && (
                            <button
                              type="button"
                              onClick={() => handleSwapUnits(index)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                              title="Switch primary and secondary units"
                            >
                              <ArrowDownUp size={16} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Unit Column with Conversion Display */}
                      <td className="p-2 border-r border-gray-200">
                        {!hasUnitConversion ? (
                          <div className="space-y-1">
                            <Select
                              value="None"
                              onValueChange={(conversionId) => {
                                if (conversionId === 'new') {
                                  dispatch(openCreateForm())
                                } else {
                                  // Handle selecting an existing conversion
                                  const conversion = unitConversions?.find(
                                    (c) => c.id === conversionId
                                  )
                                  if (conversion && unitOptions) {
                                    // Get primary and secondary unit names
                                    const primaryUnit = unitOptions.find(u => u.id === conversion.primaryUnitId)
                                    const secondaryUnit = unitOptions.find(u => u.id === conversion.secondaryUnitId)
                                    
                                    if (primaryUnit && secondaryUnit) {
                                      // Update the item with the selected conversion
                                      const updatedItem = {
                                        ...formData.items[index],
                                        unitId: conversion.primaryUnitId,
                                        unit: primaryUnit.shortname,
                                        secondaryUnitId: conversion.secondaryUnitId,
                                        secondaryUnit: secondaryUnit.shortname,
                                        primaryQuantity: '1', // Default to 1 for primary quantity
                                        secondaryQuantity: '0', // Default to 0 for secondary quantity
                                      }
                                      
                                      // Calculate new values based on this conversion
                                      const primaryQty = parseFloat(updatedItem.primaryQuantity) || 0
                                      const secondaryQty = parseFloat(updatedItem.secondaryQuantity) || 0
                                      const price = parseFloat(updatedItem.pricePerUnit?.toString() || '0') || 0
                                      const discountPercent = parseFloat(updatedItem.discountPercent?.toString() || '0') || 0
                                      
                                      // Calculate with the new conversion
                                      const result = calculateItemAmount(
                                        primaryQty, 
                                        secondaryQty,
                                        price,
                                        conversion.conversionRate,
                                        discountPercent
                                      )
                                      
                                      // Apply the calculations
                                      updatedItem.discountAmount = result.discountAmount.toFixed(2)
                                      
                                      const taxRate = getTaxRateFromType(updatedItem.taxType)
                                      const taxAmount = (result.amountBeforeTax * taxRate) / 100
                                      updatedItem.taxAmount = taxAmount.toFixed(2)
                                      
                                      updatedItem.amount = (result.amountBeforeTax + taxAmount).toFixed(2)
                                      
                                      // Update the item in the form
                                      dispatch(updateItem({ index, item: updatedItem }))
                                      
                                      // Show success message
                                      toast.success(`Applied ${primaryUnit.shortname}/${secondaryUnit.shortname} conversion`)
                                    }
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-full text-xs mb-1">
                                <SelectValue placeholder="Select Conversion" />
                              </SelectTrigger>
                              <SelectContent>
                                {unitConversions &&
                                  unitConversions.map((conversion) => {
                                    // Get readable unit names for display
                                    const primaryUnitName = unitOptions?.find(u => u.id === conversion.primaryUnitId)?.shortname || conversion.primaryUnitId
                                    const secondaryUnitName = unitOptions?.find(u => u.id === conversion.secondaryUnitId)?.shortname || conversion.secondaryUnitId
                                    
                                    return (
                                      <SelectItem
                                        key={conversion.id}
                                        value={conversion.id}
                                      >
                                        {primaryUnitName} ⟷ {secondaryUnitName} ({conversion.conversionRate})
                                      </SelectItem>
                                    )
                                  })
                                }
                                <SelectItem
                                  value="new"
                                  className="text-primary"
                                >
                                  <div className="flex items-center">
                                    <Plus className="h-3 w-3 mr-1" /> Add New
                                    Conversion
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs h-6 flex items-center justify-center"
                              onClick={() => dispatch(openCreateForm())}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Conversion
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-center text-xs bg-blue-50 text-blue-500 py-1 px-2 rounded flex items-center justify-center">
                              <span>{row.unit}</span>
                              <ArrowDownUp className="h-3 w-3 mx-1" />
                              <span>{row.secondaryUnit}</span>
                            </div>
                            {/* Display conversion rate */}
                            <div className="text-xs text-gray-500 text-center">
                              {getConversionRateText(row, selectedItem)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs h-6 flex items-center justify-center text-gray-500"
                              onClick={() => {
                                // Remove the conversion from this item
                                const updatedItem = { ...formData.items[index] }
                                updatedItem.secondaryUnitId = ''
                                updatedItem.secondaryUnit = ''
                                updatedItem.secondaryQuantity = '0'
                                dispatch(
                                  updateItem({ index, item: updatedItem })
                                )
                              }}
                            >
                              Change
                            </Button>
                          </div>
                        )}
                      </td>

                      {/* Secondary Quantity */}
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className={`w-full px-2 py-1 rounded-md text-right text-sm ${
                            focusedRow === index
                              ? 'border-primary ring-1 ring-primary/30'
                              : 'border-gray-200'
                          }`}
                          value={row.secondaryQuantity || '0'}
                          placeholder={hasUnitConversion ? '0' : 'N/A'}
                          min="0"
                          step="0.01"
                          disabled={!hasUnitConversion}
                          onFocus={() => setFocusRow(index)}
                          onBlur={() => setFocusRow(null)}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'secondaryQuantity',
                              e.target.value
                            )
                          }
                        />
                        {/* Display secondary unit with quantity */}
                        {hasUnitConversion && row.secondaryUnit && (
                          <div className="text-xs text-gray-600 mt-1 text-right">
                            {row.secondaryUnit}
                          </div>
                        )}
                      </td>

                      {/* Price/Unit */}
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className={`w-full px-2 py-1 rounded-md text-right text-sm ${
                            focusedRow === index
                              ? 'border-primary ring-1 ring-primary/30'
                              : 'border-gray-200'
                          }`}
                          value={row.pricePerUnit?.toString() || ''}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          onFocus={() => setFocusRow(index)}
                          onBlur={() => setFocusRow(null)}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'pricePerUnit',
                              e.target.value
                            )
                          }
                        />
                        {hasUnitConversion && row.unit && (
                          <div className="text-xs text-gray-600 mt-1 text-right">
                            per {row.unit}
                          </div>
                        )}
                      </td>

                      {/* Discount % */}
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className={`w-full px-2 py-1 rounded-md text-right text-sm ${
                            focusedRow === index
                              ? 'border-primary ring-1 ring-primary/30'
                              : 'border-gray-200'
                          }`}
                          value={row.discountPercent?.toString() || ''}
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                          onFocus={() => setFocusRow(index)}
                          onBlur={() => setFocusRow(null)}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'discountPercent',
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Discount Amount */}
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className="w-full px-2 py-1 rounded-md text-right bg-gray-50 text-sm border-gray-200"
                          value={row.discountAmount?.toString() || ''}
                          placeholder="0.00"
                          readOnly
                        />
                      </td>

                      {/* Tax Type - Now country specific */}
                      <td className="p-2 border-r border-gray-200">
                        <Select
                          value={row.taxType || 'None'}
                          onValueChange={(value) =>
                            handleItemChange(index, 'taxType', value)
                          }
                        >
                          <SelectTrigger
                            className={`h-8 w-full text-sm ${
                              focusedRow === index
                                ? 'border-primary ring-1 ring-primary/30'
                                : 'border-gray-200'
                            }`}
                            onFocus={() => setFocusRow(index)}
                            onBlur={() => setFocusRow(null)}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTaxRates.map((tax) => (
                              <SelectItem key={tax.value} value={tax.value}>
                                {tax.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Tax Amount */}
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className="w-full px-2 py-1 rounded-md text-right bg-gray-50 text-sm border-gray-200"
                          value={row.taxAmount.toString()}
                          placeholder="0.00"
                          readOnly
                        />
                      </td>

                      {/* Amount */}
                      <td className="p-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 rounded-md text-right font-medium bg-primary/5 text-sm border-primary/20"
                          value={row.amount.toString()}
                          placeholder="0.00"
                          readOnly
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-start">
          <Button
            type="button"
            onClick={handleAddItemRow}
            className="flex items-center gap-1 bg-primary text-white hover:bg-primary/90"
            size="sm"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>

          <div className="bg-primary/5 rounded-md border border-primary/20 p-3 space-y-2 w-64">
            <h4 className="text-sm font-medium flex items-center mb-1">
              <Calculator className="h-4 w-4 mr-1 text-primary" />
              Invoice Summary
            </h4>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium">{formData.items.length}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Quantity:</span>
              <span className="font-medium">{totals.totalQty}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Discount:</span>
              <span className="font-medium">₹{totals.totalDiscount}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Tax:</span>
              <span className="font-medium">₹{totals.totalTax}</span>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-primary">
                ₹{totals.totalAmount}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SaleInvoiceTable