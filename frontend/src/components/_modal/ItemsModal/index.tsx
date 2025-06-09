import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ItemType } from "@/models/item/item.model";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeModal } from "@/redux/slices/modal";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Loader2,
  Plus,
  Save,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

// Import from our new slices
import {
  closeForm,
  openCreateForm,
  populateFromItem,
  resetForm,
  setFormData,
  setItemType,
  setSubmitError,
  setSubmitting,
  transformFormToModel,
  updateFormField,
  validateFormData,
} from "@/redux/slices/itemsSlice";

// Import from our API slices
import { countryTaxMap } from "@/lib/data";
import {
  useCreateCategoryMutation,
  useCreateItemMutation,
  useCreateUnitConversionMutation,
  useCreateUnitMutation,
  useGetCategoriesQuery,
  useGetItemByIdQuery,
  useGetUnitConversionsQuery,
  useGetUnitsQuery,
  useUpdateItemMutation,
} from "@/redux/api";
import { min } from "date-fns";

const AddItems = () => {
  // Redux state from our new slice
  const dispatch = useAppDispatch();
  const {
    isSubmitting,
    submitError,
    validationErrors,
    formData,
    mode,
    currentItemId,
  } = useAppSelector((state) => state.items);

  const { data: editItem } = useGetItemByIdQuery(currentItemId ?? "", {
    skip: !currentItemId,
  });

  // RTK Query hooks
  const [createItem, { isLoading: isCreatingItem }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdatingItem }] = useUpdateItemMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [createUnit] = useCreateUnitMutation();
  const [createUnitConversion] = useCreateUnitConversionMutation();

  // Fetch reference data
  const { data: categories, isLoading: isLoadingCategories } =
    useGetCategoriesQuery();
  const { data: units, isLoading: isLoadingUnits } = useGetUnitsQuery();
  const { data: unitConversions, isLoading: isLoadingUnitConversions } =
    useGetUnitConversionsQuery();

  // Local UI state
  const [tab, setTab] = useState(0);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [addUnitDialogOpen, setAddUnitDialogOpen] = useState(false);

  // Unit dialog state
  const [primaryUnitId, setPrimaryUnitId] = useState("");
  const [secondaryUnitId, setSecondaryUnitId] = useState("");
  const [conversionRate, setConversionRate] = useState("1");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitShortName, setNewUnitShortName] = useState("");
  const [isAddingPrimaryUnit, setIsAddingPrimaryUnit] = useState(true);
  const [selectedUnitConversionId, setSelectedUnitConversionId] = useState("");

  // Category dialog state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [taxOptions, setTaxOptions] = useState([...countryTaxMap.default]);

  // Reset form when component mounts
  useEffect(() => {
    dispatch(resetForm());
    dispatch(
      setFormData({
        type: ItemType.PRODUCT,
        salePrice: 0,
        salePriceTaxInclusive: false,
        isActive: true,
        name: "",
        categoryId: "",
        pricePerUnit: 0,
      })
    );
    return () => {
      dispatch(resetForm());
    };
  }, [dispatch]);

  // Get current form data using useCallback to prevent stale closures
  const getCurrentFormData = useCallback(() => {
    return formData;
  }, [formData]);

  const handleSaveUnit = async () => {

    if (!primaryUnitId) {
      toast.error("Please select a primary unit");
      return;
    }

    try {
      // Case 1: Only primary unit selected
      if (
        !secondaryUnitId ||
        !parseFloat(conversionRate) ||
        parseFloat(conversionRate) <= 0
      ) {
        console.log("Only primary unit selected, clearing conversion");

        // Get fresh form data and clear conversion
        const currentFormData = getCurrentFormData();
        console.log("Form data before clearing conversion:", currentFormData);

        // Clear the unit conversion ID
        dispatch(updateFormField({ field: "unit_conversionId", value: "" }));

        setSelectedUnitConversionId("");
        handleUnitDialogClose();
        toast.success("Unit settings saved");
        return;
      }

      // Case 2: Create unit conversion
      console.log("Creating unit conversion...");
      const currentFormData = getCurrentFormData();
      console.log("Form data before creating conversion:", currentFormData);

      const conversionData = {
        primaryUnitId,
        secondaryUnitId,
        conversionRate: parseFloat(conversionRate),
      };

      const conversionResponse = await createUnitConversion(
        conversionData
      ).unwrap();
      console.log("Unit conversion created:", conversionResponse);

      // Update the form data with the new unit conversion ID
      console.log(
        "Updating form with unit conversion ID:",
        conversionResponse.id
      );
      dispatch(
        updateFormField({
          field: "unit_conversionId",
          value: conversionResponse.id,
        })
      );

      setSelectedUnitConversionId(conversionResponse.id);
      handleUnitDialogClose();
      toast.success("Unit conversion saved successfully");
    } catch (error: any) {
      console.error("Error saving unit conversion:", error);
      toast.error(
        `Failed to save unit settings: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleSave = async () => {
    // Get fresh form data to avoid stale closure issues
    const currentFormData = getCurrentFormData();

    // Use the fresh form data for validation and submission
    const errors = validateFormData(currentFormData);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        toast.error(message);
      });
      return;
    }

    try {
      dispatch(setSubmitting(true));

      // Transform the FRESH form data
      let itemData = await transformFormToModel(currentFormData);
      if( mode != "edit") {
      itemData = {
        ...itemData,
        primaryQuantity: currentFormData.primaryOpeningQuantity || 0,
        secondaryQuantity: currentFormData.secondaryOpeningQuantity || 0,
      };
    }
      console.log("Final item data being sent:", itemData);
      console.log("Unit conversion ID in payload:", itemData.unit_conversionId);

      if (mode === "edit" && currentItemId) {
        const finalPayload: any = {
          id: currentItemId,
          ...itemData,
          minStockLevel: formData.minStockLevel || 0,
          unit_conversionId: selectedUnitConversionId,
          primaryOpeningQuantity:currentFormData.primaryOpeningQuantity || 0,
          secondaryOpeningQuantity:currentFormData.secondaryOpeningQuantity || 0,
        };
        await updateItem({
          ...finalPayload,
        }).unwrap();
        toast.success("Item updated successfully!");
      } else {
        await createItem(itemData).unwrap();
        toast.success("Item created successfully!");
      }

      dispatch(closeForm());
    } catch (error: any) {
      console.error("Submission error:", error);
      dispatch(setSubmitError(error.data.error || "Failed to save item"));
      toast.error(
        `Failed to save item: ${error.data.error || "Unknown error"}`
      );
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  // Separate effect to populate edit data when available
  useEffect(() => {
    if (mode === "edit" && editItem && unitConversions) {
      dispatch(populateFromItem(editItem));

      if (editItem.type === ItemType.PRODUCT && editItem.unit_conversionId) {
        setSelectedUnitConversionId(editItem.unit_conversionId);

        const conversion = unitConversions.find(
          (uc) => uc.id === editItem.unit_conversionId
        );

        if (conversion) {
          setPrimaryUnitId(conversion.primaryUnitId);
          setSecondaryUnitId(conversion.secondaryUnitId || "");
          setConversionRate(conversion.conversionRate?.toString() || "1");
        }
      }
    }
  }, [editItem, unitConversions, mode, dispatch]);

  // Tab switching
  const handleTabChange = (newValue: React.SetStateAction<number>) => {
    setTab(newValue);
  };

  // Handle field changes
  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    let processedValue = value;

    // Format numeric fields
    if (["salePrice", "wholesalePrice", "purchasePrice"].includes(field)) {
      // Allow only numbers and a single decimal point
      processedValue =
        typeof value === "string" ? value.replace(/[^0-9.]/g, "") : "";

      // Prevent multiple decimal points
      const dotCount = (processedValue.match(/\./g) || []).length;
      if (dotCount > 1) {
        processedValue = processedValue.slice(
          0,
          processedValue.lastIndexOf(".")
        );
      }

      // Convert to number if not empty
      if (processedValue !== "") {
        processedValue = parseFloat(processedValue).toString();
      }
    } else if (["openingQuantity", "minStockLevel"].includes(field)) {
      // Allow only whole numbers (no decimals)
      processedValue =
        typeof value === "string" ? value.replace(/\D/g, "") : "";
      if (processedValue !== "") {
        processedValue = parseInt(processedValue, 10).toString();
      }
    }
    console.log(field, value);
    // Dispatch the field change to Redux
    dispatch(updateFormField({ field, value: processedValue }));
  };

  // Generate a unique code
  const generateUniqueCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    return `ITEM-${timestamp}${randomNum}`;
  };

  // Assign a code to the item
  const handleAssignCode = () => {
    dispatch(
      updateFormField({ field: "itemCode", value: generateUniqueCode() })
    );
  };

  // Save and add another item
  const handleSaveAndNew = async () => {
    // First save the current item
    await handleSave();

    // Reset the form but keep some settings
    dispatch(resetForm());

    dispatch(openCreateForm());
  };

  // Product/Service toggle
  const handleItemTypeToggle = (isProduct: boolean) => {
    dispatch(setItemType(isProduct ? ItemType.PRODUCT : ItemType.SERVICE));
  };

  // UNIT HANDLERS
  const handleUnitDialogOpen = () => setUnitDialogOpen(true);
  const handleUnitDialogClose = () => setUnitDialogOpen(false);

  const handleAddUnitOpen = (isPrimary = true) => {
    setIsAddingPrimaryUnit(isPrimary);
    setAddUnitDialogOpen(true);
  };

  const handleAddUnitClose = () => {
    setAddUnitDialogOpen(false);
    setNewUnitName("");
    setNewUnitShortName("");
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      toast.error("Please enter a valid unit name");
      return;
    }

    if (!newUnitShortName.trim()) {
      toast.error("Please enter a valid unit short name");
      return;
    }

    try {
      // Create the unit using RTK Query
      const result = await createUnit({
        fullname: newUnitName.trim().toUpperCase(),
        shortname: newUnitShortName.trim(),
      }).unwrap();

      // Set as selected unit
      if (isAddingPrimaryUnit) {
        setPrimaryUnitId(result.id);
      } else {
        setSecondaryUnitId(result.id);
      }

      toast.success(`Unit "${newUnitName}" added successfully`);
      handleAddUnitClose();
    } catch (error: any) {
      toast.error(`Failed to add unit: ${error.message || "Unknown error"}`);
    }
  };

  // CATEGORY HANDLERS
  const handleAddCategoryOpen = () => setAddCategoryDialogOpen(true);
  const handleAddCategoryClose = () => {
    setAddCategoryDialogOpen(false);
    setNewCategoryName("");
    setNewCategoryDescription("");
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a valid category name");
      return;
    }

    try {
      const result = await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
      }).unwrap();

      dispatch(updateFormField({ field: "categoryId", value: result.id }));
      toast.success(`Category "${newCategoryName}" added successfully`);
      handleAddCategoryClose();
    } catch (error: any) {
      toast.error(
        `Failed to add category: ${error.message || "Unknown error"}`
      );
    }
  };

  // Find unit and category names from IDs
  const getUnitName = (id: string) => {
    if (!units) return "";
    const unit = units.find((u) => u.id === id);
    return unit ? unit.fullname : "";
  };

  const getCategoryName = (id: string) => {
    if (!categories) return "";
    const category = categories.find((c) => c.id === id);
    return category ? category.name : "";
  };

  // Get display text for the current unit configuration
  const getUnitDisplayText = () => {
    if (selectedUnitConversionId && unitConversions) {
      const conversion = unitConversions.find(
        (uc) => uc.id === selectedUnitConversionId
      );
      if (conversion && units) {
        const primaryUnit = units.find(
          (u) => u.id === conversion.primaryUnitId
        );
        return primaryUnit ? primaryUnit.fullname : "Selected Unit";
      }
    }

    return "Select Unit";
  };

  useEffect(() => {
    // Get country from localStorage
    const storedCountry = localStorage.getItem("firmCountry");
    console.log("Stored country:", storedCountry);
    if (storedCountry && countryTaxMap[storedCountry]) {
      setTaxOptions(countryTaxMap[storedCountry]);
    }
  }, []);

  return (
    <Dialog open={true} onOpenChange={() => dispatch(closeModal())}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-white border-b">
          <DialogHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DialogTitle className="text-xl font-semibold">
                  {mode === "edit" ? "Edit Item" : "Add Item"}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      formData.type === ItemType.PRODUCT
                        ? "text-primary"
                        : "text-gray-500"
                    }`}
                  >
                    Product
                  </span>
                  <Switch
                    checked={formData.type === ItemType.SERVICE}
                    onCheckedChange={() =>
                      handleItemTypeToggle(formData.type !== ItemType.PRODUCT)
                    }
                  />
                  <span
                    className={`text-sm ${
                      formData.type === ItemType.SERVICE
                        ? "text-primary"
                        : "text-gray-500"
                    }`}
                  >
                    Service
                  </span>
                </div>
              </div>
              <DialogClose
                onClick={() => dispatch(closeForm())}
                className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </DialogHeader>
        </div>

        {/* Display any error message from Redux */}
        {submitError && (
          <Alert variant="destructive" className="mx-6 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="px-6 py-4 flex flex-col gap-4">
          {/* FIRST ROW INPUT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-1"
                placeholder="Enter item name"
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="hsn" className="text-sm font-medium">
                HSN Code
              </Label>
              <Input
                id="hsn"
                value={formData.hsnCode || ""}
                onChange={(e) => handleInputChange("hsnCode", e.target.value)}
                className="mt-1"
                placeholder="Enter HSN code"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Unit</Label>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={handleUnitDialogOpen}
              >
                {getUnitDisplayText()}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
              {selectedUnitConversionId && unitConversions && (
                <p className="text-xs mt-1 font-medium text-primary">
                  {(() => {
                    const conversion = unitConversions.find(
                      (uc) => uc.id === selectedUnitConversionId
                    );
                    if (conversion) {
                      return `1 ${getUnitName(conversion.primaryUnitId)} = ${
                        conversion.conversionRate
                      } ${getUnitName(conversion.secondaryUnitId)}`;
                    }
                    return "";
                  })()}
                </p>
              )}
            </div>
          </div>

          {/* SECOND ROW INPUT */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-primary text-xs px-2 py-1"
                  onClick={handleAddCategoryOpen}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {isLoadingCategories ? (
                <Skeleton className="h-10 w-full mt-1" />
              ) : (
                <Select
                  value={formData.categoryId || ""}
                  onValueChange={(value) =>
                    handleInputChange("categoryId", value)
                  }
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">No Category</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="relative w-full md:w-64">
              <Label htmlFor="itemCode" className="text-sm font-medium">
                Item Code
              </Label>
              <div className="flex mt-1">
                <Input
                  id="itemCode"
                  value={formData.itemCode || ""}
                  onChange={(e) =>
                    handleInputChange("itemCode", e.target.value)
                  }
                  placeholder="Item code"
                />
                {!formData.itemCode && (
                  <Button size="sm" className="ml-2" onClick={handleAssignCode}>
                    Assign Code
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* TAB SWITCHING SECTION */}
          <Tabs defaultValue="pricing" className="mt-2">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              {formData.type === ItemType.PRODUCT && (
                <TabsTrigger value="stock">Stock</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="pricing" className="pt-4">
              <div className="flex flex-col gap-4">
                {/* SALE PRICE SECTION */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sale Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex space-x-2">
                        <div className="flex-grow">
                          <Label htmlFor="salePrice">Sale Price</Label>
                          <Input
                            id="salePrice"
                            type="number"
                            value={formData.salePrice || ""}
                            onChange={(e) =>
                              handleInputChange("salePrice", e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="w-32 md:w-40">
                          <Label htmlFor="saleTaxIncl">Tax</Label>
                          <Select
                            value={
                              formData?.salePriceTaxInclusive
                                ? "With Tax"
                                : "Without Tax"
                            }
                            onValueChange={(value) =>
                              handleInputChange(
                                "salePriceTaxInclusive",
                                value === "With Tax"
                              )
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Without Tax">
                                Without Tax
                              </SelectItem>
                              <SelectItem value="With Tax">With Tax</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                        <Input
                          id="wholesalePrice"
                          type="number"
                          value={formData.wholesalePrice || ""}
                          onChange={(e) =>
                            handleInputChange("wholesalePrice", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="wholesaleQuantity">
                          Wholesale Quantity
                        </Label>
                        <Input
                          id="wholesaleQuantity"
                         type="number"
                          value={formData.wholesaleQuantity || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "wholesaleQuantity",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.type === ItemType.PRODUCT && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Purchase Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex space-x-2">
                          <div className="flex-grow">
                            <Label htmlFor="purchasePrice">
                              Purchase Price
                            </Label>
                            <Input
                              id="purchasePrice"
                              type="number"
                              value={formData.purchasePrice || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "purchasePrice",
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                          </div>
                          <div className="w-32 md:w-40">
                            <Label htmlFor="purchaseTaxIncl">Tax</Label>
                            <Select
                              value={
                                formData?.purchasePriceTaxInclusive
                                  ? "With Tax"
                                  : "Without Tax"
                              }
                              onValueChange={(value) =>
                                handleInputChange(
                                  "purchasePriceTaxInclusive",
                                  value === "With Tax"
                                )
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Without Tax">
                                  Without Tax
                                </SelectItem>
                                <SelectItem value="With Tax">
                                  With Tax
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Taxes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={formData.taxRate || "None"}
                        onValueChange={(selectedValue) => {
                          console.log("Selected tax rate:", selectedValue);

                          // Pass the value directly to the handler without modification
                          handleInputChange(
                            "taxRate",
                            selectedValue === "None" ? "" : selectedValue
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select tax rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Always ensure None is available */}
                          <SelectItem value="None">None</SelectItem>

                          {/* Map the tax options, ensuring each has a unique value */}
                          {taxOptions
                            .filter((tax) => tax.value !== "None") // Filter out None which we already added
                            .map((tax) => (
                              <SelectItem
                                key={String(tax.value)}
                                value={String(tax.value)}
                              >
                                {tax.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {formData.type === ItemType.PRODUCT && (
              <TabsContent value="stock" className="pt-4">
                <div className="flex flex-col gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Opening Stock
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primaryOpeningQty">
                            Primary Opening Quantity{" "}
                            {primaryUnitId && `(${getUnitName(primaryUnitId)})`}
                          </Label>
                          <Input
                            id="primaryOpeningQty"
                             type="number"
                            value={formData.primaryOpeningQuantity || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "primaryOpeningQuantity",
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="secondaryOpeningQty">
                            Secondary Opening Quantity{" "}
                            {secondaryUnitId &&
                              `(${getUnitName(secondaryUnitId)})`}
                          </Label>
                          <Input
                            id="secondaryOpeningQty"
                            type="number"
                            value={formData.secondaryOpeningQuantity || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "secondaryOpeningQuantity",
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pricepperunit">
                            Price per Unit{" "}
                            {primaryUnitId && `(${getUnitName(primaryUnitId)})`}
                          </Label>
                          <Input
                            id="pricepperunit"
                            type="number"
                            value={formData.pricePerUnit || ""}
                            onChange={(e) =>
                              handleInputChange("pricePerUnit", e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="asOfDate">As of Date</Label>
                          <div className="relative mt-1">
                            <Input
                              id="asOfDate"
                              type="date"
                              value={
                                (formData.openingStockDate instanceof Date
                                  ? formData.openingStockDate
                                      .toISOString()
                                      .split("T")[0]
                                  : formData.openingStockDate) ||
                                new Date().toISOString().split("T")[0]
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  "openingStockDate",
                                  e.target.value
                                )
                              }
                            />
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Stock Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="minStock">
                            Minimum Stock Level{" "}
                            {primaryUnitId && `(${getUnitName(primaryUnitId)})`}
                          </Label>
                          <Input
                            id="minStock"
                            type="text"
                            value={formData.minStockLevel || ""}
                            onChange={(e) =>
                              handleInputChange("minStockLevel", e.target.value)
                            }
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            You&apos;ll be notified when stock falls below this
                            level
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="location">Storage Location</Label>
                          <Input
                            id="location"
                            type="text"
                            value={formData.location || ""}
                            onChange={(e) =>
                              handleInputChange("location", e.target.value)
                            }
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Where this item is stored (warehouse, shelf, etc.)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* BOTTOM BUTTONS - STICKY */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2">
          {mode !== "edit" && (
            <Button
              variant="outline"
              onClick={handleSaveAndNew}
              disabled={isSubmitting}
            >
              Save & Add New
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !formData.name}
            className="gap-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </DialogContent>

      {/* Unit Selection Dialog */}
      {unitDialogOpen && (
        <Dialog open={unitDialogOpen} onOpenChange={handleUnitDialogClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Units</DialogTitle>
              <DialogDescription>
                Choose primary and optional secondary units for this item.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="primaryUnit" className="text-sm font-medium">
                  Primary Unit <span className="text-red-500">*</span>
                </Label>
                {isLoadingUnits ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <>
                    <Select
                      value={primaryUnitId}
                      onValueChange={(value) => setPrimaryUnitId(value)}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">Select Unit</SelectItem>
                        {units?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.fullname} ({unit.shortname})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1 text-xs"
                      onClick={() => handleAddUnitOpen(true)}
                    >
                      + Add New Primary Unit
                    </Button>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="secondaryUnit" className="text-sm font-medium">
                  Secondary Unit (Optional)
                </Label>
                {isLoadingUnits ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <>
                    <Select
                      value={secondaryUnitId}
                      onValueChange={(value) => setSecondaryUnitId(value)}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">Select Unit</SelectItem>
                        {units?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.fullname} ({unit.shortname})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1 text-xs"
                      onClick={() => handleAddUnitOpen(false)}
                    >
                      + Add New Secondary Unit
                    </Button>
                  </>
                )}
              </div>
            </div>

            {secondaryUnitId && (
              <Card>
                <CardContent className="pt-4">
                  <Label className="text-sm font-medium">Conversion Rate</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">
                      1{" "}
                      {units?.find((u) => u.id === primaryUnitId)?.fullname ||
                        ""}{" "}
                      ={" "}
                    </span>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-20"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(e.target.value)}
                    />
                    <span className="text-sm">
                      {units?.find((u) => u.id === secondaryUnitId)?.fullname ||
                        ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Example: 1 BOX = 12 PIECES
                  </p>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleUnitDialogClose}>
                Cancel
              </Button>
              <Button onClick={handleSaveUnit} disabled={!primaryUnitId}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Unit Dialog */}
      {addUnitDialogOpen && (
        <Dialog open={addUnitDialogOpen} onOpenChange={handleAddUnitClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Add New {isAddingPrimaryUnit ? "Primary" : "Secondary"} Unit
              </DialogTitle>
              <DialogDescription>
                Create a new unit for your inventory items.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="unitName" className="text-sm font-medium">
                  Unit Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unitName"
                  placeholder="e.g. KILOGRAMS"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="unitShortName" className="text-sm font-medium">
                  Unit Short Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unitShortName"
                  placeholder="e.g. KG"
                  value={newUnitShortName}
                  onChange={(e) => setNewUnitShortName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This unit will be available for all future items.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={handleAddUnitClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUnit}
                disabled={!newUnitName.trim() || !newUnitShortName.trim()}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Category Dialog */}
      {addCategoryDialogOpen && (
        <Dialog
          open={addCategoryDialogOpen}
          onOpenChange={handleAddCategoryClose}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="categoryName" className="text-sm font-medium">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="categoryName"
                  placeholder="e.g. Electronics"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="categoryDesc" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="categoryDesc"
                  placeholder="Brief description of this category"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Categories help you organize and filter your inventory.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={handleAddCategoryClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default AddItems;
