import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  ArrowDownUp,
  Calculator,
  Hash,
  Info,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  Trash2,
  Package,
  DollarSign,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

// Document Context
import { useDocument } from "./Context";

// API Hooks
import { countryTaxMap } from "@/lib/data";
import { useGetUnitsQuery } from "@/redux/api";
import { useCreateItemMutation, useGetItemsQuery } from "@/redux/api/itemsApi";
import { useGetUnitConversionsQuery } from "@/redux/api/unitConversionsApi";

// Document item model
import { useAppDispatch } from "@/redux/hooks";
import { openCreateForm as openCreateItem } from "@/redux/slices/itemsSlice";
import { openCreateForm } from "@/redux/slices/unitConversionSlice";
import { DocumentItem } from "@/models/document/document.model";
import {
  isProduct,
  Item,
  ItemType,
  Product,
  UnitConversion,
} from "@/models/item/item.model";

interface TaxRate {
  value: string;
  label: string;
}

const DocumentItemsTable: React.FC = () => {
  // Get document state and dispatch from context
  const { state, dispatch, calculateTotals } = useDocument();
  const dispatchOther = useAppDispatch();
  const [createItem, { isLoading: isCreatingItem }] = useCreateItemMutation();
  // Local state
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [selectedTaxRates, setSelectedTaxRates] = useState<TaxRate[]>([]);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [showItemDropdown, setShowItemDropdown] = useState<number | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState<string>("");
  const [showDeleteWarning, setShowDeleteWarning] = useState<number | null>(
    null
  );
  const [showRowNumbers, setShowRowNumbers] = useState<boolean>(true);
  const [countryCode, setCountryCode] = useState<string>("IN");

  // Refs for dropdown handling
  const itemInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef<boolean>(true);

  // Fetch items, units, and unit conversions using RTK Query
  const {
    data: items,
    isLoading: isLoadingItems,
    error: itemsError,
    refetch: refetchItems,
  } = useGetItemsQuery({});

  const { data: unitOptions } = useGetUnitsQuery();
  const { data: unitConversions } = useGetUnitConversionsQuery();

  // Get country code from localStorage on component mount and set tax rates
  useEffect(() => {
    if (typeof window !== "undefined") {
      const firmCountry = localStorage.getItem("firmCountry");
      if (firmCountry) {
        setCountryCode(firmCountry);
      }

      // Set available tax rates based on country
      const taxRates =
        countryTaxMap[firmCountry || "IN"] || countryTaxMap["default"];
      setSelectedTaxRates(taxRates);
    }
  }, []);

  // Get items from document state
  const getItems = (): DocumentItem[] => {
    return state.document?.items || [];
  };

  // Filtered items based on search term
  const filteredItems = items
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
          (item.itemCode &&
            item.itemCode.toLowerCase().includes(itemSearchTerm.toLowerCase()))
      )
    : [];

  // Create empty item row based on DocumentItem model
  const createEmptyItemRow = (): DocumentItem => ({
    id: uuidv4(),
    firmId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemId: "",
    itemName: "",
    primaryQuantity: 1,
    secondaryQuantity: 0,
    primaryUnitId: "",
    primaryUnitName: "pcs",
    secondaryUnitId: "",
    secondaryUnitName: "",
    pricePerUnit: 0,
    wholesaleQuantity: 0,
    wholesalePrice: 0,
    taxType: "",
    taxRate: 0,
    taxAmount: 0,
    amount: 0,
    discountPercent: 0,
    discountAmount: 0,
    hsnCode: "",
    salePriceTaxInclusive: false,
  });

  // Add new item row
  const handleAddItemRow = (): void => {
    dispatch({
      type: "ADD_ITEM",
      payload: createEmptyItemRow(),
    });
    toast.success("New item row added");
  };

  // Helper function to find conversion rates from any source
  const findConversionRate = (
    primaryUnitId: string,
    secondaryUnitId: string
  ): { rate: number; isReversed: boolean } => {
    let rate = 1;
    let isReversed = false;

    if (
      !primaryUnitId ||
      !secondaryUnitId ||
      primaryUnitId === secondaryUnitId
    ) {
      return { rate, isReversed };
    }

    if (unitConversions) {
      const directMatch = unitConversions.find(
        (uc) =>
          uc.primaryUnitId === primaryUnitId &&
          uc.secondaryUnitId === secondaryUnitId
      );

      if (directMatch) {
        return { rate: directMatch.conversionRate, isReversed: false };
      }

      const reversedMatch = unitConversions.find(
        (uc) =>
          uc.primaryUnitId === secondaryUnitId &&
          uc.secondaryUnitId === primaryUnitId
      );

      if (reversedMatch) {
        return { rate: reversedMatch.conversionRate, isReversed: true };
      }
    }

    return { rate, isReversed };
  };

  // Get tax rate percentage from tax type
  const getTaxRateFromType = (taxType: string): number => {
    if (!taxType || taxType === "None") return 0;

    const taxOption = selectedTaxRates.find((tax) => tax.value === taxType);
    if (!taxOption) return 0;

    const match = taxOption.label.match(/(\d+(\.\d+)?)%/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Find unit conversion for an item
  const getUnitConversion = (itemId: string): UnitConversion | null => {
    if (!unitConversions || !items) return null;

    const item = items.find((item) => item.id === itemId);
    if (!item || !isProduct(item)) return null;

    const product = item as Product;
    if (!product.unit_conversionId) return null;

    return (
      unitConversions.find(
        (conversion) => conversion.id === product.unit_conversionId
      ) || null
    );
  };

  // Get unit name by ID
  const getUnitName = (unitId: string): string => {
    if (!unitOptions) return "";
    const unit = unitOptions.find((u) => u.id === unitId);
    return unit ? unit.shortname : "";
  };

  // Helper function to get the conversion rate text consistently
  const getConversionRateText = (row: DocumentItem, item?: Item): string => {
    if (
      !row.primaryUnitId ||
      !row.secondaryUnitId ||
      !row.primaryUnitName ||
      !row.secondaryUnitName
    ) {
      return "";
    }

    if (item && isProduct(item)) {
      const conversion = getUnitConversion(item.id);
      if (conversion) {
        return `1 ${row.primaryUnitName} = ${conversion.conversionRate} ${row.secondaryUnitName}`;
      }
    }

    if (unitConversions) {
      const directMatch = unitConversions.find(
        (uc) =>
          uc.primaryUnitId === row.primaryUnitId &&
          uc.secondaryUnitId === row.secondaryUnitId
      );

      if (directMatch) {
        return `1 ${row.primaryUnitName} = ${directMatch.conversionRate} ${row.secondaryUnitName}`;
      }

      const reversedMatch = unitConversions.find(
        (uc) =>
          uc.primaryUnitId === row.secondaryUnitId &&
          uc.secondaryUnitId === row.primaryUnitId
      );

      if (reversedMatch) {
        return `1 ${row.primaryUnitName} = ${(
          1 / reversedMatch.conversionRate
        ).toFixed(4)} ${row.secondaryUnitName}`;
      }
    }

    return "";
  };

  // Update item row with calculations
  // 1. Calculate final amount based on pricing logic
  const calculateItemAmount = (
    primaryQty: number,
    secondaryQty: number,
    pricePerPrimaryUnit: number,
    conversionRate: number,
    discountPercent: number,
    taxRate: number,
    isTaxInclusive: boolean = false
  ) => {
    // Guard against invalid conversion rate
    if (!conversionRate || conversionRate <= 0) {
      conversionRate = 1;
    }

    // Calculate total quantity in base units
    const totalBaseUnits = primaryQty * conversionRate + secondaryQty;
    const pricePerBaseUnit = pricePerPrimaryUnit / conversionRate;

    // Calculate gross amount
    const grossAmount = totalBaseUnits * pricePerBaseUnit;

    // Calculate discount on gross amount
    const discountAmount = (grossAmount * discountPercent) / 100;
    const amountAfterDiscount = grossAmount - discountAmount;

    let taxAmount: number;
    let netAmount: number;

    if (isTaxInclusive) {
      // Simple calculation: Tax = Price × Tax Rate, Total stays same
      taxAmount = (amountAfterDiscount * taxRate) / 100; // 100 × 5% = 5
      netAmount = amountAfterDiscount; // Total amount stays the same (100)
    } else {
      // Tax is added on top of the price
      taxAmount = (amountAfterDiscount * taxRate) / 100;
      netAmount = amountAfterDiscount + taxAmount;
    }

    return {
      totalBaseUnits,
      discountAmount,
      taxAmount,
      netAmount,
      grossAmount,
      pricePerBaseUnit,
      conversionRate,
    };
  };

  // 2. Update item row with calculations
  const handleItemChange = (
    index: number,
    field: keyof DocumentItem,
    value: string | boolean
  ): void => {
    const items = getItems();
    if (!items[index]) return;

    const updatedItem = { ...items[index] };

    // Handle boolean fields separately
    if (field === "salePriceTaxInclusive") {
      updatedItem[field] = value === "With Tax" || value === true;
    } else {
      (updatedItem as any)[field] = value;
    }

    const selectedItem = items?.find((i) => i.id === updatedItem.itemId);

    if (
      [
        "primaryQuantity",
        "secondaryQuantity",
        "pricePerUnit",
        "discountPercent",
        "taxType",
        "amount",
        "salePriceTaxInclusive",
      ].includes(field)
    ) {
      // Convert to numbers safely
      const primaryQty = parseFloat(String(updatedItem.primaryQuantity)) || 0;
      const secondaryQty =
        parseFloat(String(updatedItem.secondaryQuantity)) || 0;
      let price = parseFloat(String(updatedItem.pricePerUnit)) || 0;
      const discountPercent =
        parseFloat(String(updatedItem.discountPercent)) || 0;

      // ADD THIS WHOLESALE PRICING LOGIC
      if (field === "primaryQuantity" && selectedItem) {
        const wholesaleQty = updatedItem.wholesaleQuantity || 0;
        const wholesalePrice = updatedItem.wholesalePrice || 0;
        const retailPrice = selectedItem.pricePerUnit || 0;

        // Check if quantity qualifies for wholesale pricing
        if (
          wholesaleQty > 0 &&
          wholesalePrice > 0 &&
          primaryQty >= wholesaleQty
        ) {
          updatedItem.pricePerUnit = wholesalePrice;
          price = wholesalePrice;
          toast.success(
            `Wholesale price applied: ₹${wholesalePrice} (Min qty: ${wholesaleQty})`
          );
        } else {
          updatedItem.pricePerUnit = retailPrice;
          price = retailPrice;
        }
      }
      // Update unit name if changed
      if (field === "primaryUnitId" && typeof value === "string") {
        updatedItem.primaryUnitName = getUnitName(value);
      }

      let conversionRate = 1;
      const totalAmount = parseFloat(String(updatedItem.amount)) || 0;

      // First, check if the item has a unit conversion
      let hasConversion = false;
      if (field === "amount" && primaryQty > 0) {
        // Calculate price per unit from total amount
        const taxRate = getTaxRateFromType(updatedItem.taxType as string);
        const isTaxInclusive = updatedItem.salePriceTaxInclusive || false;

        let calculatedPricePerUnit: number;

        if (isTaxInclusive) {
          // If tax inclusive, the amount already includes tax
          calculatedPricePerUnit = totalAmount / primaryQty;
        } else {
          // If tax exclusive, need to remove tax to get base price per unit
          const amountWithoutTax = totalAmount / (1 + taxRate / 100);
          calculatedPricePerUnit = amountWithoutTax / primaryQty;
        }

        // Update price per unit
        updatedItem.pricePerUnit = Number(calculatedPricePerUnit.toFixed(2));

        // Recalculate tax amount based on new price per unit
        const newPrice = calculatedPricePerUnit;
        const grossAmount = primaryQty * newPrice;
        const discountAmount = (grossAmount * discountPercent) / 100;
        const amountAfterDiscount = grossAmount - discountAmount;

        let taxAmount: number;

        if (isTaxInclusive) {
          taxAmount = (amountAfterDiscount * taxRate) / 100;
        } else {
          taxAmount = (amountAfterDiscount * taxRate) / 100;
        }

        updatedItem.discountAmount = Number(
          ((grossAmount * discountPercent) / 100).toFixed(2)
        );
        updatedItem.taxAmount = Number(taxAmount.toFixed(2));

        // Skip the normal calculation flow and dispatch directly
        dispatch({
          type: "UPDATE_ITEM",
          payload: { index, item: updatedItem },
        });
        calculateTotals();
        return; // Exit early to avoid double calculation
      }
      if (selectedItem && isProduct(selectedItem)) {
        const conversion = getUnitConversion(selectedItem.id);
        if (conversion) {
          conversionRate = conversion.conversionRate;
          hasConversion = true;
        }
      }

      // If no conversion from item, try direct conversion
      if (
        !hasConversion &&
        updatedItem.primaryUnitId &&
        updatedItem.secondaryUnitId
      ) {
        const { rate, isReversed } = findConversionRate(
          updatedItem.primaryUnitId,
          updatedItem.secondaryUnitId
        );
        conversionRate = isReversed ? 1 / rate : rate;
        hasConversion = true;
      }

      // Get tax rate
      const taxRate = getTaxRateFromType(updatedItem.taxType as string);
      updatedItem.taxRate = taxRate;

      // Calculate amounts based on whether tax is inclusive or not
      const isTaxInclusive = updatedItem.salePriceTaxInclusive || false;

      if (hasConversion) {
        // Calculate based on base units with conversion
        const result = calculateItemAmount(
          primaryQty,
          secondaryQty,
          price,
          conversionRate,
          discountPercent,
          taxRate,
          isTaxInclusive
        );

        updatedItem.discountAmount = Number(result.discountAmount.toFixed(2));
        updatedItem.taxAmount = Number(result.taxAmount.toFixed(2));
        updatedItem.amount = Number(result.netAmount.toFixed(2));
      } else {
        // Simple calculation without conversion
        let grossAmount = primaryQty * price;
        let discountAmount = (grossAmount * discountPercent) / 100;
        let amountAfterDiscount = grossAmount - discountAmount;
        let taxAmount: number;
        let netAmount: number;

        if (isTaxInclusive) {
          // Simple: Tax = Amount × Tax%, Total stays same
          taxAmount = (amountAfterDiscount * taxRate) / 100; // 100 × 5% = 5
          netAmount = amountAfterDiscount; // Amount stays the same (100)
        } else {
          // Add tax on top
          taxAmount = (amountAfterDiscount * taxRate) / 100;
          netAmount = amountAfterDiscount + taxAmount;
        }

        updatedItem.discountAmount = Number(discountAmount.toFixed(2));
        updatedItem.taxAmount = Number(taxAmount.toFixed(2));
        updatedItem.amount = Number(netAmount.toFixed(2));
      }
    }

    dispatch({
      type: "UPDATE_ITEM",
      payload: { index, item: updatedItem },
    });

    calculateTotals();
  };
  // Add this new function
  const handleItemInputKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Enter") {
      e.preventDefault();

      const searchTerm = itemSearchTerm.trim();
      if (searchTerm && filteredItems.length === 0) {
        // Create new item with the search term
        const newItemData: any = {
          name: searchTerm,
          itemCode: "",
          salePrice: 0,
          taxRate: "",
          hsnCode: "",
          description: "",
          type: ItemType.PRODUCT,
          // Add other required fields based on your item model
        };

        // Call your create item mutation
        createItem(newItemData)
          .unwrap()
          .then((newItem) => {
            // Select the newly created item
            handleItemSelection(index, newItem);
            toast.success(`Item "${searchTerm}" created and selected`);
            // Refetch items to update the list
            refetchItems();
          })
          .catch((error) => {
            toast.error("Failed to create item");
            console.error("Error creating item:", error);
          });
      } else if (filteredItems.length > 0) {
        // Select the first filtered item
        handleItemSelection(index, filteredItems[0]);
      }
    }
  };
  // Handle item selection from dropdown
  const handleItemSelection = (index: number, item: Item): void => {
    if (items && index >= items?.length) return;

    let primaryUnitId = "";
    let primaryUnitName = "";
    let secondaryUnitId = "";
    let secondaryUnitName = "";
    let conversionRate = 0;

    // Set correct unit information
    if (isProduct(item)) {
      if (item.unit_conversionId && unitConversions) {
        const conversion = unitConversions.find(
          (uc) => uc.id === item.unit_conversionId
        );
        if (conversion) {
          conversionRate = conversion.conversionRate;
          primaryUnitId = conversion.primaryUnitId;
          primaryUnitName = getUnitName(primaryUnitId);
          secondaryUnitId = conversion.secondaryUnitId;
          secondaryUnitName = getUnitName(secondaryUnitId);
        }
      }
    }

    const updatedItem: any = {
      ...(items?.[index] ?? {}),
      itemId: item.id,
      itemName: item.name || "",
      primaryUnitId: primaryUnitId || "",
      primaryUnitName: primaryUnitName || "pcs",
      secondaryUnitId: secondaryUnitId || "",
      secondaryUnitName: secondaryUnitName || "",
      primaryQuantity: 1,
      secondaryQuantity: 0,
      wholesalePrice: item.wholesalePrice || 0,
      wholesaleQuantity: isProduct(item)
        ? (item as Product).wholesaleQuantity || 0
        : 0,
      pricePerUnit: item.salePrice,
      taxType: item.taxRate,
      taxRate: Number(item.taxRate),
      hsnCode: item.hsnCode || "",
      salePriceTaxInclusive: isProduct(item)
        ? (item as Product).salePriceTaxInclusive || false
        : false,
    };

    // Calculate amounts based on unit conversion and tax settings
    const primaryQty = 1;
    const secondaryQty = 0;
    const price = item.salePrice || 0;
    const discountPercent = 0;
    const taxRate = getTaxRateFromType(item.taxRate || "");
    const isTaxInclusive = updatedItem.salePriceTaxInclusive;

    if (conversionRate > 0) {
      const result = calculateItemAmount(
        primaryQty,
        secondaryQty,
        price,
        conversionRate,
        discountPercent,
        taxRate,
        isTaxInclusive
      );

      updatedItem.discountAmount = Number(result.discountAmount.toFixed(2));
      updatedItem.taxAmount = Number(result.taxAmount.toFixed(2));
      updatedItem.amount = Number(result.netAmount.toFixed(2));
    } else {
      // Simple calculation
      let grossAmount = primaryQty * price;
      let discountAmount = 0;
      let taxAmount: number;
      let netAmount: number;

      if (isTaxInclusive) {
        // Simple: Tax = Amount × Tax%, Total stays same
        taxAmount = (grossAmount * taxRate) / 100; // 100 × 5% = 5
        netAmount = grossAmount; // Amount stays the same (100)
      } else {
        // Add tax on top
        taxAmount = (grossAmount * taxRate) / 100;
        netAmount = grossAmount + taxAmount;
      }

      updatedItem.discountAmount = Number(discountAmount.toFixed(2));
      updatedItem.taxAmount = Number(taxAmount.toFixed(2));
      updatedItem.amount = Number(netAmount.toFixed(2));
    }

    updatedItem.conversionRate = conversionRate;

    dispatch({
      type: "UPDATE_ITEM",
      payload: { index, item: updatedItem },
    });

    setShowItemDropdown(null);
    setItemSearchTerm("");
    calculateTotals();
  };

  // Handle swapping between primary and secondary units
  const handleSwapUnits = (index: number): void => {
    const items = getItems();
    if (index >= items.length) return;

    const item = items[index];
    if (!item.primaryUnitId || !item.secondaryUnitId) return;

    let conversionRate = 1;
    let isReversedConversion = false;

    const selectedItem = items?.find((i) => i.id === item.itemId);
    if (selectedItem && isProduct(selectedItem)) {
      const itemConversion = getUnitConversion(selectedItem.id);
      if (itemConversion) {
        conversionRate = itemConversion.conversionRate;
        isReversedConversion =
          item.primaryUnitId !== itemConversion.primaryUnitId;
      }
    }

    if (conversionRate === 1 && unitConversions) {
      const { rate, isReversed } = findConversionRate(
        item.primaryUnitId,
        item.secondaryUnitId
      );
      conversionRate = rate;
      isReversedConversion = isReversed;
    }

    const updatedItem = { ...item };

    // Swap units
    const tempUnitId = updatedItem.primaryUnitId;
    const tempUnitName = updatedItem.primaryUnitName;

    updatedItem.primaryUnitId = updatedItem.secondaryUnitId as string;
    updatedItem.primaryUnitName = updatedItem.secondaryUnitName as string;
    updatedItem.secondaryUnitId = tempUnitId;
    updatedItem.secondaryUnitName = tempUnitName;

    // Swap quantities
    const tempQty = updatedItem.primaryQuantity;
    updatedItem.primaryQuantity = Number(updatedItem.secondaryQuantity);
    updatedItem.secondaryQuantity = tempQty;

    // Calculate the new price per unit based on the conversion rate
    const price = parseFloat(String(updatedItem.pricePerUnit)) || 0;
    const newPricePerUnit = isReversedConversion
      ? price / conversionRate
      : price * conversionRate;

    updatedItem.pricePerUnit = Number(newPricePerUnit.toFixed(2));

    // Recalculate amounts
    const primaryQty = parseFloat(String(updatedItem.primaryQuantity)) || 0;
    const secondaryQty = parseFloat(String(updatedItem.secondaryQuantity)) || 0;
    const discountPercent =
      parseFloat(String(updatedItem.discountPercent)) || 0;
    const taxRate = getTaxRateFromType(updatedItem.taxType as string);
    const isTaxInclusive = updatedItem.salePriceTaxInclusive || false;

    const effectiveConversionRate = isReversedConversion
      ? conversionRate
      : 1 / conversionRate;

    const result = calculateItemAmount(
      primaryQty,
      secondaryQty,
      newPricePerUnit,
      effectiveConversionRate,
      discountPercent,
      taxRate,
      isTaxInclusive
    );

    updatedItem.discountAmount = Number(result.discountAmount.toFixed(2));
    updatedItem.taxAmount = Number(result.taxAmount.toFixed(2));
    updatedItem.amount = Number(result.netAmount.toFixed(2));

    dispatch({
      type: "UPDATE_ITEM",
      payload: { index, item: updatedItem },
    });

    toast.success(`Switched primary unit to ${updatedItem.primaryUnitName}`);
    calculateTotals();
  };

  // Item search and selection
  const handleItemInputFocus = (index: number): void => {
    setFocusedRow(index);
    setShowItemDropdown(index);
    const items = getItems();
    if (items[index]) {
      setItemSearchTerm(items[index].itemName || "");
    }
    setTimeout(() => {
      const input = itemInputRef.current;
      if (input) {
        const rect = input.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    }, 0);
  };

  const handleItemInputChange = (index: number, value: string): void => {
    setItemSearchTerm(value);
    handleItemChange(index, "itemName", value);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        itemInputRef.current &&
        !itemInputRef.current.contains(event.target as Node)
      ) {
        setShowItemDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle delete item row
  const handleDeleteItemRow = (index: number): void => {
    const items = getItems();
    if (items.length === 1) {
      dispatch({
        type: "UPDATE_ITEM",
        payload: { index, item: createEmptyItemRow() },
      });
    } else {
      dispatch({
        type: "REMOVE_ITEM",
        payload: index,
      });
    }
    setShowDeleteWarning(null);
    toast.success("Item removed");
    calculateTotals();
  };

  // Update document totals whenever items change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    calculateTotals();
  }, [getItems()]);

  // Get the totals for display
  const totals = calculateTotals
    ? calculateTotals()
    : {
        total: 0,
        taxAmount: 0,
        discountAmount: 0,
        itemsTotal: 0,
      };

  return (
    <Card className="border shadow-sm mb-4">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center">
          <PackageOpen className="mr-2 h-5 w-5 text-primary" />
          Document Items
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
                    showRowNumbers ? "bg-primary/10" : ""
                  }`}
                  onClick={() => setShowRowNumbers(!showRowNumbers)}
                  title="Click to toggle row numbers"
                  style={{ width: "40px" }}
                >
                  #
                </th>
                <th
                  className="p-2 text-left font-medium border-b border-r border-gray-200"
                  style={{ width: "25%" }}
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
                <th className="p-2 text-left font-medium border-b border-r border-gray-200">
                  TAX TYPE
                </th>
                <th
                  className="p-2 text-left font-medium border-b border-gray-200"
                  style={{ width: "10%" }}
                >
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {getItems().length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-6 text-gray-500">
                    No items added. Click the Add Item button below to add your
                    first item.
                  </td>
                </tr>
              ) : (
                getItems().map((row, index) => {
                  const selectedItem = items?.find(
                    (item) => item.id === row.itemId
                  );
                  const hasUnitConversion =
                    selectedItem &&
                    isProduct(selectedItem) &&
                    row.secondaryUnitId &&
                    row.secondaryUnitName;

                  return (
                    <tr
                      key={index}
                      className={`group hover:bg-gray-50 ${
                        index % 2 === 1 ? "bg-gray-50" : ""
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
                                the document?
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
                              index === showItemDropdown ? itemInputRef : null
                            }
                            type="text"
                            className={`w-full pl-7 pr-2 py-1 text-sm rounded-md ${
                              focusedRow === index
                                ? "border-primary ring-1 ring-primary/30"
                                : "border-gray-200"
                            }`}
                            value={row.itemName || ""}
                            placeholder="Search or enter item"
                            onFocus={() => handleItemInputFocus(index)}
                            onChange={(e) =>
                              handleItemInputChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleItemInputKeyDown(index, e)}
                          />
                        </div>
                      </td>

                      {/* HSN Code */}
                      <td className="p-2 border-r border-gray-200">
                        <div className="flex items-center">
                          <Hash className="h-3 w-3 text-gray-400 mr-1" />
                          <input
                            type="text"
                            className={`w-full px-2 py-1 text-sm rounded-md ${
                              focusedRow === index
                                ? "border-primary ring-1 ring-primary/30"
                                : "border-gray-200"
                            }`}
                            value={row.hsnCode || ""}
                            placeholder="HSN"
                            onFocus={() => setFocusedRow(index)}
                            onBlur={() => setFocusedRow(null)}
                            onChange={(e) =>
                              handleItemChange(index, "hsnCode", e.target.value)
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
                                ? "border-primary ring-1 ring-primary/30"
                                : "border-gray-200"
                            } ${hasUnitConversion ? "pr-9" : ""}`}
                            value={row.primaryQuantity || ""}
                            placeholder="1"
                            onFocus={() => setFocusedRow(index)}
                            onBlur={() => setFocusedRow(null)}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "primaryQuantity",
                                e.target.value
                              )
                            }
                          />

                          {/* Display unit with quantity */}
                          {row.primaryUnitName && (
                            <div className="text-xs text-gray-600 mt-1 text-right">
                              {row.primaryUnitName}
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
                                if (conversionId === "new") {
                                  dispatchOther(openCreateForm());
                                } else {
                                  const conversion = unitConversions?.find(
                                    (c) => c.id === conversionId
                                  );
                                  if (conversion && unitOptions) {
                                    const primaryUnit = unitOptions.find(
                                      (u) => u.id === conversion.primaryUnitId
                                    );
                                    const secondaryUnit = unitOptions.find(
                                      (u) => u.id === conversion.secondaryUnitId
                                    );

                                    if (primaryUnit && secondaryUnit) {
                                      const updatedItem = {
                                        ...getItems()[index],
                                        primaryUnitId: conversion.primaryUnitId,
                                        primaryUnitName: primaryUnit.shortname,
                                        secondaryUnitId:
                                          conversion.secondaryUnitId,
                                        secondaryUnitName:
                                          secondaryUnit.shortname,
                                        primaryQuantity: "1",
                                        secondaryQuantity: "0",
                                      };

                                      const primaryQty =
                                        parseFloat(
                                          updatedItem.primaryQuantity
                                        ) || 0;
                                      const secondaryQty =
                                        parseFloat(
                                          updatedItem.secondaryQuantity
                                        ) || 0;
                                      const price =
                                        parseFloat(
                                          String(updatedItem.pricePerUnit)
                                        ) || 0;
                                      const discountPercent =
                                        parseFloat(
                                          String(updatedItem.discountPercent)
                                        ) || 0;
                                      const taxRate = getTaxRateFromType(
                                        String(updatedItem.taxType)
                                      );
                                      const isTaxInclusive =
                                        updatedItem.salePriceTaxInclusive ||
                                        false;

                                      const result = calculateItemAmount(
                                        primaryQty,
                                        secondaryQty,
                                        price,
                                        conversion.conversionRate,
                                        discountPercent,
                                        taxRate,
                                        isTaxInclusive
                                      );

                                      updatedItem.discountAmount = Number(
                                        result.discountAmount.toFixed(2)
                                      );
                                      updatedItem.taxAmount = Number(
                                        result.taxAmount.toFixed(2)
                                      );
                                      updatedItem.amount = Number(
                                        result.netAmount.toFixed(2)
                                      );

                                      dispatch({
                                        type: "UPDATE_ITEM",
                                        payload: { index, item: updatedItem },
                                      });

                                      toast.success(
                                        `Applied ${primaryUnit.shortname}/${secondaryUnit.shortname} conversion`
                                      );
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
                                    const primaryUnitName =
                                      unitOptions?.find(
                                        (u) => u.id === conversion.primaryUnitId
                                      )?.shortname || conversion.primaryUnitId;
                                    const secondaryUnitName =
                                      unitOptions?.find(
                                        (u) =>
                                          u.id === conversion.secondaryUnitId
                                      )?.shortname ||
                                      conversion.secondaryUnitId;

                                    return (
                                      <SelectItem
                                        key={conversion.id}
                                        value={conversion.id}
                                      >
                                        {primaryUnitName} ⟷ {secondaryUnitName}{" "}
                                        ({conversion.conversionRate})
                                      </SelectItem>
                                    );
                                  })}
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
                              onClick={() => dispatchOther(openCreateForm())}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Conversion
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-center text-xs bg-blue-50 text-blue-500 py-1 px-2 rounded flex items-center justify-center">
                              <span>{row.primaryUnitName}</span>
                              <ArrowDownUp className="h-3 w-3 mx-1" />
                              <span>{row.secondaryUnitName}</span>
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                              {getConversionRateText(row, selectedItem)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs h-6 flex items-center justify-center text-gray-500"
                              onClick={() => {
                                const updatedItem = { ...getItems()[index] };
                                updatedItem.secondaryUnitId = "";
                                updatedItem.secondaryUnitName = "";
                                updatedItem.secondaryQuantity = 0;
                                dispatch({
                                  type: "UPDATE_ITEM",
                                  payload: { index, item: updatedItem },
                                });
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
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-gray-200"
                          }`}
                          value={row.secondaryQuantity || "0"}
                          placeholder={hasUnitConversion ? "0" : "N/A"}
                          disabled={!hasUnitConversion}
                          onFocus={() => setFocusedRow(index)}
                          onBlur={() => setFocusedRow(null)}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "secondaryQuantity",
                              e.target.value
                            )
                          }
                        />
                        {hasUnitConversion && row.secondaryUnitName && (
                          <div className="text-xs text-gray-600 mt-1 text-right">
                            {row.secondaryUnitName}
                          </div>
                        )}
                      </td>

                      {/* Price/Unit */}
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className={`w-full px-2 py-1 rounded-md text-right text-sm ${
                            focusedRow === index
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-gray-200"
                          }`}
                          value={row.pricePerUnit || ""}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          onFocus={() => setFocusedRow(index)}
                          onBlur={() => setFocusedRow(null)}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "pricePerUnit",
                              e.target.value
                            )
                          }
                        />
                        {row.wholesaleQuantity &&
                          row.wholesalePrice &&
                          Number(row.primaryQuantity) >=
                            Number(row.wholesaleQuantity) && (
                            <div className="text-xs text-yellow-600 text-center bg-yellow-50 px-1 py-0.5 rounded">
                              Wholesale Applied
                            </div>
                          )}
                        {hasUnitConversion && row.primaryUnitName && (
                          <div className="text-xs text-gray-600 mt-1 text-right">
                            per {row.primaryUnitName}
                          </div>
                        )}
                      </td>

                      {/* Discount % */}
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className={`w-full px-2 py-1 rounded-md text-right text-sm ${
                            focusedRow === index
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-gray-200"
                          }`}
                          value={row.discountPercent || ""}
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                          onFocus={() => setFocusedRow(index)}
                          onBlur={() => setFocusedRow(null)}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "discountPercent",
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
                          value={row.discountAmount || ""}
                          placeholder="0.00"
                          readOnly
                        />
                      </td>

                      {/* Tax Type */}
                      <td className="p-2 border-r border-gray-200">
                        <Select
                          value={row.taxType}
                          onValueChange={(value) =>
                            handleItemChange(index, "taxType", value)
                          }
                        >
                          <SelectTrigger
                            className={`h-8 w-full text-sm ${
                              focusedRow === index
                                ? "border-primary ring-1 ring-primary/30"
                                : "border-gray-200"
                            }`}
                            onFocus={() => setFocusedRow(index)}
                            onBlur={() => setFocusedRow(null)}
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
                          value={row.taxAmount || ""}
                          placeholder="0.00"
                          readOnly
                        />
                      </td>

                      {/* Tax Type (Inclusive/Exclusive) */}
                      <td className="p-2 border-r border-gray-200">
                        <Select
                          value={
                            row?.salePriceTaxInclusive
                              ? "With Tax"
                              : "Without Tax"
                          }
                          onValueChange={(value) =>
                            handleItemChange(
                              index,
                              "salePriceTaxInclusive",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Without Tax">
                              Without Tax
                            </SelectItem>
                            <SelectItem value="With Tax">With Tax</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Amount */}
                      {/* Amount */}
                      <td className="p-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 rounded-md text-right font-medium bg-primary/5 text-sm border-primary/20"
                          value={row.amount || ""}
                          placeholder="0.00"
                          // Remove readOnly to make it editable
                          onFocus={() => setFocusedRow(index)}
                          onBlur={() => setFocusedRow(null)}
                          onChange={
                            (e) =>
                              handleItemChange(index, "amount", e.target.value) // Add this onChange handler
                          }
                        />
                      </td>
                    </tr>
                  );
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
              Document Summary
            </h4>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium">{getItems().length}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Quantity:</span>
              <span className="font-medium">
                {totals.itemsTotal?.toFixed(2) || "0.00"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Discount:</span>
              <span className="font-medium">
                ₹{totals.discountAmount?.toFixed(2) || "0.00"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Tax:</span>
              <span className="font-medium">
                ₹{totals.taxAmount?.toFixed(2) || "0.00"}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-primary">
                ₹{totals.total?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Item Dropdown */}
        {showItemDropdown !== null && dropdownPosition && (
          <div
            ref={dropdownRef}
            className="absolute z-[10000] bg-white shadow-lg w-[400px] max-h-64 rounded-md py-1 text-sm ring-1 ring-gray-200 overflow-auto"
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
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
                  className="cursor-pointer hover:bg-gray-100 px-4 py-3 border-b border-gray-100"
                  onClick={() => handleItemSelection(showItemDropdown, item)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="flex items-center gap-2">
                      {isProduct(item) ? (
                        <Badge
                          variant="outline"
                          className="h-5 px-2 bg-blue-50 text-blue-600 border-blue-200"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Product
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="h-5 px-2 bg-purple-50 text-purple-600 border-purple-200"
                        >
                          Service
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {item.itemCode && (
                        <span className="flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          {item.itemCode}
                        </span>
                      )}
                      {item.hsnCode && <span>HSN: {item.hsnCode}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="h-6 px-2 bg-green-50 text-green-700 border-green-200">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Sale: ₹{item.salePrice}
                      </Badge>

                      {isProduct(item) && (
                        <>
                          <Badge
                            variant="outline"
                            className="h-6 px-2 bg-orange-50 text-orange-700 border-orange-200"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Cost: ₹{(item as Product).purchasePrice || 0}
                          </Badge>

                          <Badge
                            variant="outline"
                            className="h-6 px-2 bg-gray-50 text-gray-700"
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Stock: {(item as Product).primaryQuantity || 0}
                          </Badge>
                        </>
                      )}
                      {isProduct(item) &&
                        item.wholesalePrice &&
                        item.wholesaleQuantity && (
                          <Badge
                            variant="outline"
                            className="h-5 px-2 bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Wholesale: ₹{item.wholesalePrice} (Min:{" "}
                            {(item as Product).wholesaleQuantity})
                          </Badge>
                        )}
                    </div>
                  </div>

                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {item.description}
                    </div>
                  )}
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
                    onClick={() => dispatchOther(openCreateItem())}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add New Item
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentItemsTable;
