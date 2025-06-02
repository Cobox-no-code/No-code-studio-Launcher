"use client";

import {
  Calendar,
  CalendarDays,
  Clock,
  CurrencyIcon,
  FileText,
  Hash,
  LoaderCircle,
  MapPin,
  Phone,
  Plus,
  Search,
  Truck,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDocument } from "./Context";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// UI Components
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// API Hooks
import {
  useCreatePartyMutation,
  useGetPartiesQuery,
} from "@/redux/api/partiesApi";
import { openCreateForm as openPartyCreateForm } from "@/redux/slices/partySlice";
import { useDispatch } from "react-redux";
import { DocumentType } from "@/models/document/document.model";
import { useGetDocumentsQuery } from "@/redux/api/documentApi";

const DocumentHeader: React.FC = () => {
  const { state, dispatch: docDispatch } = useDocument();
  const { document, validationErrors, mode } = state;
  const reduxDispatch = useDispatch();
  const [createParty, { isLoading: isCreatingParty }] =
    useCreatePartyMutation();

  // Local state
  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  // Determine if this is a sales or purchase document
  const isSalesDocument =
    document.documentType.toString().startsWith("sale") ||
    document.documentType === DocumentType.DELIVERY_CHALLAN;

  // Party label (Customer or Supplier)
  const partyLabel = isSalesDocument ? "Customer" : "Supplier";

  // Use RTK Query to fetch parties
  const {
    data: parties,
    isLoading: partiesLoading,
    error: partiesError,
  } = useGetPartiesQuery({ search: partySearchTerm });

  // Fetch documents of the same type for sequential numbering
  const { data: documents, refetch } = useGetDocumentsQuery({
    documentType: document.documentType,
  });

  // Filter parties based on search term and party type
  const filteredParties =
    parties?.filter((party) => {
      const matchesSearch =
        party.name.toLowerCase().includes(partySearchTerm.toLowerCase()) ||
        (party.phone && party.phone.includes(partySearchTerm));

      return matchesSearch;
    }) || [];

  // Function to handle creating and selecting a new party
  const handleCreateAndSelectParty = async () => {
    // Check if party already exists in filtered results
    const partyExists = filteredParties.some(
      (party) => party.name.toLowerCase() === partySearchTerm.toLowerCase()
    );

    if (!partyExists && partySearchTerm.trim()) {
      try {
        // Create basic party with the entered name
        const newPartyData = {
          name: partySearchTerm.trim(),
          gstType: "Unregistered",
        };

        // Create party using mutation
        const result = await createParty(newPartyData).unwrap();

        if (result) {
          // Party created successfully, now select it
          handlePartySelect(result);
          setShowPartyDropdown(false);

          // Show success message
          toast.success(
            `New ${partyLabel.toLowerCase()} "${
              result.name
            }" created and selected`
          );
        }
      } catch (error) {
        console.error("Failed to create party:", error);
        toast.error(
          `Failed to create ${partyLabel.toLowerCase()}: ${
            error.message || "Unknown error"
          }`
        );
      }
    } else if (filteredParties.length > 0) {
      // If party exists in filtered results, select the first one
      handlePartySelect(filteredParties[0]);
    }
  };

  useEffect(() => {
    // Immediately refetch data when component mounts
    refetch();

    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetch();
    }, 5000); // Adjust this time as needed

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch]);

  // Enhanced document number generation with sequential numbering per document type
  const generateDocumentNumber = async () => {
    // Don't generate if in edit mode or if document number already exists
    if (mode === "edit" || document.documentNumber) {
      return;
    }

    try {
      // Filter documents by the same document type
      const sameTypeDocuments =
        documents?.filter(
          (doc) => doc.documentType === document.documentType
        ) || [];

      if (sameTypeDocuments.length === 0) {
        // First document of this type, start with 1
        docDispatch({
          type: "UPDATE_FIELD",
          payload: { field: "documentNumber", value: "1" },
        });
        return;
      }

      // Find the highest document number for this document type
      const documentNumbers = sameTypeDocuments
        .map((doc) => {
          // Extract numeric part from document number
          const numericPart = doc.documentNumber.replace(/\D/g, "");
          return numericPart ? parseInt(numericPart, 10) : 0;
        })
        .filter((num) => !isNaN(num));

      // Get the maximum number and add 1
      const maxNumber =
        documentNumbers.length > 0 ? Math.max(...documentNumbers) : 0;
      const nextNumber = (maxNumber + 1).toString();

      docDispatch({
        type: "UPDATE_FIELD",
        payload: { field: "documentNumber", value: nextNumber },
      });

      console.log(
        `Generated document number: ${nextNumber} for type: ${document.documentType}`
      );
    } catch (error) {
      console.error("Error generating document number:", error);
      // Fallback to simple increment
      docDispatch({
        type: "UPDATE_FIELD",
        payload: { field: "documentNumber", value: "1" },
      });
    }
  };

  // Generate document number when documents data changes (only for create mode)
  useEffect(() => {
    if (mode === "create" && documents && !document.documentNumber) {
      generateDocumentNumber();
    }
  }, [documents, document.documentType, mode, document.documentNumber]);

  // Set default document time
  useEffect(() => {
    if (!document.documentTime) {
      const now = new Date();
      const formattedTime = now.toTimeString().slice(0, 5); // "HH:MM"
      docDispatch({
        type: "UPDATE_FIELD",
        payload: { field: "documentTime", value: formattedTime },
      });
    }
  }, [document.documentTime, docDispatch]);

  // Party selection handler
  const handlePartySelect = (party: any) => {
    docDispatch({
      type: "UPDATE_FIELD",
      payload: { field: "partyId", value: party.id },
    });

    docDispatch({
      type: "UPDATE_FIELD",
      payload: { field: "partyName", value: party.name },
    });

    docDispatch({
      type: "UPDATE_FIELD",
      payload: { field: "phone", value: party.phone || "" },
    });

    docDispatch({
      type: "UPDATE_FIELD",
      payload: { field: "billingAddress", value: party.billingAddress || "" },
    });

    setShowPartyDropdown(false);
    setPartySearchTerm("");
  };

  // Handle adding a new party
  const handleAddNewParty = () => {
    reduxDispatch(openPartyCreateForm());
    setShowPartyDropdown(false);
  };

  // Get document type prefix for display
  const getDocumentPrefix = (docType: string): string => {
    switch (docType) {
      case DocumentType.SALE_INVOICE:
        return "SI";
      case DocumentType.SALE_ORDER:
        return "SO";
      case DocumentType.SALE_RETURN:
        return "SR";
      case DocumentType.SALE_QUOTATION:
        return "SQ";
      case DocumentType.DELIVERY_CHALLAN:
        return "DC";
      case DocumentType.PURCHASE_INVOICE:
        return "PI";
      case DocumentType.PURCHASE_ORDER:
        return "PO";
      case DocumentType.PURCHASE_RETURN:
        return "PR";
      default:
        return "DOC";
    }
  };
  // Get states for dropdown
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];
  const formatCurrency = (amount: string | number | bigint) => {
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(numericAmount);
  };
  return (
    <Card className="border shadow-sm mb-4">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          {getDocumentTypeTitle(document.documentType.toString())} Details
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - Party Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
                <User className="h-4 w-4 mr-1 text-primary" />
                {partyLabel} Information
              </h3>

              <div className="space-y-4">
                {/* Party Search Field */}
                <div className="relative">
                  <Label className="mb-1 text-xs font-medium flex items-center">
                    {partyLabel} <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={partySearchTerm}
                        onChange={(e) => {
                          setPartySearchTerm(e.target.value);
                          setShowPartyDropdown(true);
                        }}
                        onFocus={() => setShowPartyDropdown(true)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            partySearchTerm.trim() !== ""
                          ) {
                            handleCreateAndSelectParty();
                            e.preventDefault();
                          }
                        }}
                        className="pl-8 pr-3"
                        placeholder={`Search by name or phone`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={handleAddNewParty}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {validationErrors.partyName && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.partyName}
                    </p>
                  )}

                  {showPartyDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-gray-200 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {partiesLoading || isCreatingParty ? (
                        <div className="px-4 py-2 flex items-center justify-center">
                          <LoaderCircle className="h-4 w-4 mr-2 animate-spin text-primary" />
                          <span className="text-gray-500">
                            {isCreatingParty
                              ? "Creating party..."
                              : `Loading ${partyLabel.toLowerCase()}s...`}
                          </span>
                        </div>
                      ) : partiesError ? (
                        <div className="px-4 py-2">
                          <Alert variant="destructive" className="py-2">
                            <AlertDescription className="text-xs">
                              Error loading {partyLabel.toLowerCase()}s
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : filteredParties.length > 0 ? (
                        filteredParties.map((party) => (
                          <div
                            key={party.id}
                            className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                            onClick={() => handlePartySelect(party)}
                          >
                            <div className="font-medium flex items-center">
                              <User className="h-3 w-3 mr-1 text-primary" />
                              {party.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              {party.phone && (
                                <span className="flex items-center mr-2">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {party.phone}
                                </span>
                              )}
                              {party.currentBalance ? (
                                <span
                                  className={
                                    party.currentBalanceType === "to_pay"
                                      ? "text-red-600 flex items-center mr-2"
                                      : "text-green-600 flex items-center mr-2"
                                  }
                                >
                                  {formatCurrency(party.currentBalance)}
                                </span>
                              ) : (
                                "₹0.00"
                              )}
                              {party.gstNumber && (
                                <span className="flex items-center">
                                  <Hash className="h-3 w-3 mr-1" />
                                  GSTIN: {party.gstNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">
                          <div className="text-center text-sm mb-1">
                            No {partyLabel.toLowerCase()}s found
                          </div>
                          <div className="text-xs text-center text-primary">
                            Press Enter to create &quot;{partySearchTerm}&quot;
                          </div>
                        </div>
                      )}
                      <div className="border-t border-gray-200 mt-1 pt-1 px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-primary text-xs flex items-center justify-center"
                          onClick={handleAddNewParty}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add New {partyLabel}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Party Display */}
                {document.partyName && (
                  <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        Selected {partyLabel}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          docDispatch({
                            type: "UPDATE_FIELD",
                            payload: { field: "partyName", value: "" },
                          });
                          docDispatch({
                            type: "UPDATE_FIELD",
                            payload: { field: "partyId", value: "" },
                          });
                          docDispatch({
                            type: "UPDATE_FIELD",
                            payload: { field: "phone", value: "" },
                          });
                          docDispatch({
                            type: "UPDATE_FIELD",
                            payload: { field: "billingAddress", value: "" },
                          });
                        }}
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-primary mr-2" />
                      <span className="font-medium">{document.partyName}</span>
                    </div>
                    {document.phone && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {document.phone}
                      </div>
                    )}
                  </div>
                )}

                {/* Billing Name Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Billing Name (Optional)
                  </Label>
                  <Input
                    value={document.billingName || ""}
                    onChange={(e) =>
                      docDispatch({
                        type: "UPDATE_FIELD",
                        payload: {
                          field: "billingName",
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter billing name"
                  />
                </div>

                {/* Billing Address Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Billing Address
                  </Label>
                  <Input
                    value={document.billingAddress || ""}
                    onChange={(e) =>
                      docDispatch({
                        type: "UPDATE_FIELD",
                        payload: {
                          field: "billingAddress",
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter billing address"
                    className="min-h-20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Additional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
              <Truck className="h-4 w-4 mr-1 text-primary" />
              Shipping & Supply Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* E-way Bill Field */}
              <div>
                <Label className="text-xs font-medium mb-1 block">
                  E-way Bill Number
                </Label>
                <Input
                  value={document.ewaybill || ""}
                  onChange={(e) =>
                    docDispatch({
                      type: "UPDATE_FIELD",
                      payload: { field: "ewaybill", value: e.target.value },
                    })
                  }
                  placeholder="Enter e-way bill #"
                />
              </div>

              <div>
                <Label htmlFor="state" className="text-sm font-medium">
                  State of Supply
                </Label>
                <Select
                  value={document.stateOfSupply || ""}
                  onValueChange={(value) =>
                    docDispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        field: "stateOfSupply",
                        value: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* PO Number Field */}
              <div>
                <Label className="text-xs font-medium mb-1 block">
                  PO Number
                </Label>
                <Input
                  value={document.poNumber || ""}
                  onChange={(e) =>
                    docDispatch({
                      type: "UPDATE_FIELD",
                      payload: { field: "poNumber", value: e.target.value },
                    })
                  }
                  placeholder="Enter PO #"
                />
              </div>

              {/* PO Date Field */}
              <div>
                <Label className="text-xs font-medium mb-1 block flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  PO Date
                </Label>
                <Input
                  type="date"
                  value={document.poDate || ""}
                  onChange={(e) =>
                    docDispatch({
                      type: "UPDATE_FIELD",
                      payload: { field: "poDate", value: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Right Column - Document Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
              <FileText className="h-4 w-4 mr-1 text-primary" />
              Document Details
            </h3>

            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 space-y-4">
                {/* Document Number Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    Document Number <span className="text-red-500 ml-1">*</span>
                    {mode === "edit" && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Cannot be changed)
                      </span>
                    )}
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-gray-50 px-1 rounded">
                      {getDocumentPrefix(document.documentType.toString())}-
                    </span>
                    <Input
                      value={document.documentNumber || ""}
                      onChange={(e) =>
                        docDispatch({
                          type: "UPDATE_FIELD",
                          payload: {
                            field: "documentNumber",
                            value: e.target.value,
                          },
                        })
                      }
                      placeholder="Auto-generated"
                      className={`font-medium border-primary/20 pl-12 ${
                        mode === "edit"
                          ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={mode === "edit"}
                      readOnly={mode === "edit"}
                    />
                  </div>
                  {validationErrors.documentNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.documentNumber}
                    </p>
                  )}
                  {mode === "create" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sequential numbering for{" "}
                      {getDocumentTypeTitle(document.documentType.toString())}
                    </p>
                  )}
                </div>

                {/* Document Date Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Document Date <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={
                      document.documentDate?.toString().split("T")[0] || ""
                    }
                    onChange={(e) =>
                      docDispatch({
                        type: "UPDATE_FIELD",
                        payload: {
                          field: "documentDate",
                          value: e.target.value,
                        },
                      })
                    }
                    className="border-primary/20"
                  />
                  {validationErrors.documentDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.documentDate}
                    </p>
                  )}
                </div>

                {/* Document Time Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Document Time
                  </Label>
                  <Input
                    type="time"
                    value={document.documentTime || ""}
                    onChange={(e) =>
                      docDispatch({
                        type: "UPDATE_FIELD",
                        payload: {
                          field: "documentTime",
                          value: e.target.value,
                        },
                      })
                    }
                    className="border-primary/20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get document type title
function getDocumentTypeTitle(docType: string): string {
  switch (docType) {
    case DocumentType.SALE_INVOICE:
      return "Sale Invoice";
    case DocumentType.SALE_ORDER:
      return "Sale Order";
    case DocumentType.SALE_RETURN:
      return "Sale Return";
    case DocumentType.SALE_QUOTATION:
      return "Quotation";
    case DocumentType.DELIVERY_CHALLAN:
      return "Delivery Challan";
    case DocumentType.PURCHASE_INVOICE:
      return "Purchase Invoice";
    case DocumentType.PURCHASE_ORDER:
      return "Purchase Order";
    case DocumentType.PURCHASE_RETURN:
      return "Purchase Return";
    default:
      return "Document";
  }
}

export default DocumentHeader;
