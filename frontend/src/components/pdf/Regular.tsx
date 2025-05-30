import React, { useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";

interface DocumentPrinterProps {
  document: any; // Using any to accommodate different document types
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  businessName?: string;
  bankDetails?: any; // Bank details for payment information
  countryCode?: string; // Country code to determine tax type display (e.g., 'IN', 'GB')
  contentRef?: any;
  firmData?: any;
}

interface TaxGroup {
  taxableValue: number;
  taxType: string;
  taxRate: number;
  vat: number; // VAT amount
  cgst: number; // CGST amount (for India)
  sgst: number; // SGST amount (for India)
  igst: number; // IGST amount (for India)
  totalTax: number; // Total tax amount
}

// Helper to check if value exists and is not empty
const hasValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (typeof value === "string" && value.toLowerCase() === "n/a") return false;
  if (typeof value === "number" && value === 0) return false;
  return true;
};

// Helper to check if numeric value exists and is greater than 0
const hasNumericValue = (value: any): boolean => {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return !isNaN(num) && num > 0;
};

// Helper to format currency
const formatCurrency = (
  amount: string | number | bigint,
  currencyCode: string = "INR"
) => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

// Helper to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper to determine tax type based on country and tax type string
const getTaxType = (taxType: string, countryCode: string = "IN") => {
  // Default to VAT for most countries
  if (countryCode !== "IN") {
    if (taxType && taxType.includes("VAT@")) {
      return "VAT";
    }
    return "VAT";
  }

  // For India, use GST or IGST
  if (taxType && taxType.includes("GST@")) {
    return "GST"; // Intra-state GST
  } else if (taxType && taxType.includes("IGST@")) {
    return "IGST"; // Inter-state GST
  }

  return "NONE"; // No tax or unknown
};

// Helper to extract tax rate from tax type string
const getTaxRate = (taxType: string) => {
  if (!taxType) return 0;
  const match = taxType.match(/(\d+(\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
};

// Helper function to get document title
const getDocumentTitle = (documentType: string) => {
  switch (documentType) {
    case "sale_invoice":
      return "Tax Invoice";
    case "sale_quotation":
      return "Quotation";
    case "sale_order":
      return "Sales Order";
    case "purchase_invoice":
      return "Purchase Invoice";
    case "purchase_order":
      return "Purchase Order";
    case "delivery_challan":
      return "Delivery Challan";
    default:
      return "Document";
  }
};

// Helper to get currency code based on country code
const getCurrencyCode = (countryCode: string = "IN") => {
  const currencyMap: Record<string, string> = {
    IN: "INR", // India - Indian Rupee
    US: "USD", // United States - US Dollar
    GB: "GBP", // United Kingdom - British Pound
    EU: "EUR", // European Union - Euro
    CA: "CAD", // Canada - Canadian Dollar
    AU: "AUD", // Australia - Australian Dollar
    SG: "SGD", // Singapore - Singapore Dollar
    AE: "AED", // United Arab Emirates - UAE Dirham
    JP: "JPY", // Japan - Japanese Yen
  };

  return currencyMap[countryCode] || "USD";
};

// Get tax prefix based on country code
const getTaxPrefix = (countryCode: string = "IN") => {
  if (countryCode === "IN") {
    return {
      main: "GST",
      split1: "CGST",
      split2: "SGST",
      inter: "IGST",
    };
  } else {
    return {
      main: "VAT",
      split1: "VAT",
      split2: "",
      inter: "",
    };
  }
};

const DocumentPrinter: React.FC<DocumentPrinterProps> = ({
  document,
  businessName = "Your Business Name",
  bankDetails = null,
  countryCode = "IN",
  contentRef,
  firmData,
}) => {
  console.log(firmData);

  // Get currency code based on country
  const currencyCode = getCurrencyCode(countryCode);

  // Get tax labels based on country
  const taxPrefix = getTaxPrefix(countryCode);

  // Calculate subtotal (item sum before tax)
  const calculateSubtotal = () => {
    if (!document.items) return 0;

    return document.items.reduce((sum: number, item: any) => {
      // For subtotal calculation, we use the amount without tax
      const amount =
        typeof item.amount === "string"
          ? parseFloat(item.amount)
          : Number(item.amount || 0);
      const taxAmount =
        typeof item.taxAmount === "string"
          ? parseFloat(item.taxAmount)
          : Number(item.taxAmount || 0);

      // Return the amount without tax
      return sum + amount - taxAmount;
    }, 0);
  };

  // Calculated taxable value (total before tax)
  const taxableValue = calculateSubtotal();

  // Determine if we should use split tax display (like CGST/SGST in India)
  const usesSplitTax = countryCode === "IN";

  // Check if transportation details exist
  const hasTransportationDetails =
    hasValue(document.transportName) ||
    hasValue(document.vehicleNumber) ||
    hasValue(document.deliveryDate);

  // Check if any items have secondary units
  const hasSecondaryUnits = document.items?.some(
    (item: any) =>
      hasValue(item.secondaryQuantity) || hasValue(item.secondaryUnitName)
  );

  // Check if any items have HSN codes
  const hasHsnCodes = document.items?.some((item: any) =>
    hasValue(item.hsnCode)
  );

  // Check if any items have discounts
  const hasDiscounts = document.items?.some((item: any) =>
    hasNumericValue(item.discountPercent)
  );

  // Check if tax summary should be shown
  const shouldShowTaxSummary = document.items?.some(
    (item: any) =>
      hasNumericValue(item.taxAmount) || hasNumericValue(item.taxRate)
  );

  // Check if bank details should be shown
  const shouldShowBankDetails =
    (document.bankId || document.bankAccountId || bankDetails) &&
    bankDetails &&
    (hasValue(bankDetails.bankName) ||
      hasValue(bankDetails.accountNumber) ||
      hasValue(bankDetails.accountHolderName) ||
      hasValue(bankDetails.ifscCode) ||
      hasValue(bankDetails.swiftCode) ||
      hasValue(bankDetails.upiId) ||
      hasValue(bankDetails.iban));
  const getCountryName = (countryCode) => {
    const countries = {
      US: "United States",
      GB: "United Kingdom",
      CA: "Canada",
      AU: "Australia",
      IN: "India",
      DE: "Germany",
      FR: "France",
      JP: "Japan",
      CN: "China",
      BR: "Brazil",
      ZA: "South Africa",
      SG: "Singapore",
      AE: "United Arab Emirates",
      NZ: "New Zealand",
      RU: "Russia",
      MX: "Mexico",
    };
    return countries[countryCode] || countryCode;
  };
  // Render the print button
  return (
    <>
      {/* Hidden content that will be printed */}
      <div>
        <div ref={contentRef} className="p-8 bg-white">
          <div className="text-center font-bold text-xl mb-4">
            {getDocumentTitle(document.documentType)}
          </div>

          <div className="border border-gray-300 p-2 mb-4 flex gap-3">
            <div className="flex-shrink-0">
              {hasValue(firmData?.businessLogo) ? (
                <img
                  src={firmData.businessLogo}
                  alt="Business Logo"
                  className="h-20 w-20 object-contain"
                />
              ) : (
                <div className="h-20 w-20 bg-gray-100 border border-gray-300 flex items-center justify-center text-sm text-gray-400"></div>
              )}
            </div>

            <div className="grid grid-cols-3  w-full">
              {hasValue(businessName) && (
                <div className="text-xl font-bold text-gray-900">
                  {businessName}
                </div>
              )}

              {hasValue(firmData?.name) && firmData.name !== businessName && (
                <div className="text-lg font-semibold text-gray-800">
                  {firmData.name}
                </div>
              )}

              {hasValue(firmData?.ownerName) && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Owner:</span>{" "}
                  {firmData.ownerName}
                </div>
              )}

              {hasValue(firmData?.address) && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Address:</span>{" "}
                  {firmData.address}
                </div>
              )}

              {hasValue(firmData?.phone) && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Phone:</span> {firmData.phone}
                </div>
              )}

              {hasValue(firmData?.gstNumber) && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">GST No:</span>{" "}
                  {firmData.gstNumber}
                </div>
              )}

              {hasValue(firmData?.country) && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Country:</span>{" "}
                  {getCountryName(firmData.country)}
                </div>
              )}

              {firmData?.customFields &&
                Object.keys(firmData.customFields).length > 0 &&
                Object.entries(firmData.customFields).map(([key, value]) =>
                  hasValue(value) ? (
                    <div key={key} className="text-sm text-gray-700">
                      <span className="font-medium capitalize">{key}:</span>{" "}
                      {String(value)}
                    </div>
                  ) : null
                )}
            </div>
          </div>

          {/* Party and Document Details */}
          <div className="flex mb-4">
            {/* Party Details */}
            <div className="w-1/2 border border-gray-300 p-2">
              <div className="font-bold">
                {document.billingName || document.partyName}
              </div>
              {hasValue(document.billingAddress) && (
                <div className="text-sm">
                  Address: {document.billingAddress}
                </div>
              )}
              {hasValue(document.phone) && (
                <div className="text-sm">Contact No: {document.phone}</div>
              )}
              {hasValue(document.stateOfSupply) && (
                <div className="text-sm">State: {document.stateOfSupply}</div>
              )}
            </div>

            {/* Document Details */}
            <div className="w-1/2 border border-gray-300 p-2">
              <div className="text-sm">No: {document.documentNumber}</div>
              <div className="text-sm">
                Date: {formatDate(document.documentDate)}
              </div>
              {hasValue(document.poNumber) && (
                <div className="text-sm">PO No: {document.poNumber}</div>
              )}
              {hasValue(document.ewaybill) && (
                <div className="text-sm">
                  E-way Bill Number: {document.ewaybill}
                </div>
              )}
              {hasValue(document.stateOfSupply) && (
                <div className="text-sm">
                  Place Of Supply: {document.stateOfSupply}
                </div>
              )}
            </div>
          </div>

          {/* Transportation Details - Only show if any transportation details exist */}
          {hasTransportationDetails && (
            <div className="border border-gray-300 p-2 mb-4">
              <div className="font-bold">Transportation Details:</div>
              <div className="text-sm">
                {hasValue(document.transportName) && (
                  <>Transport Name: {document.transportName}</>
                )}
                {hasValue(document.transportName) &&
                  hasValue(document.vehicleNumber) &&
                  " | "}
                {hasValue(document.vehicleNumber) && (
                  <>Vehicle Number: {document.vehicleNumber}</>
                )}
                {(hasValue(document.transportName) ||
                  hasValue(document.vehicleNumber)) &&
                  hasValue(document.deliveryDate) &&
                  " | "}
                {hasValue(document.deliveryDate) && (
                  <>Delivery Date: {formatDate(document.deliveryDate)}</>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1 text-xs">Sr</th>
                <th className="border border-gray-300 p-1 text-xs">
                  Item Name
                </th>
                {hasHsnCodes && (
                  <th className="border border-gray-300 p-1 text-xs">
                    HSN/SAC
                  </th>
                )}
                <th className="border border-gray-300 p-1 text-xs">
                  Primary Qty
                </th>
                <th className="border border-gray-300 p-1 text-xs">Unit</th>
                {hasSecondaryUnits && (
                  <>
                    <th className="border border-gray-300 p-1 text-xs">
                      Secondary Qty
                    </th>
                    <th className="border border-gray-300 p-1 text-xs">Unit</th>
                  </>
                )}
                <th className="border border-gray-300 p-1 text-xs">
                  Price/Unit
                </th>
                {hasDiscounts && (
                  <th className="border border-gray-300 p-1 text-xs">
                    Discount(%)
                  </th>
                )}
                <th className="border border-gray-300 p-1 text-xs">Tax(%)</th>
                <th className="border border-gray-300 p-1 text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {document.items &&
                document.items.map((item: any, index: number) => {
                  // Get tax rate from the tax type or taxRate field
                  const taxRate = item.taxRate || getTaxRate(item.taxType);

                  return (
                    <tr key={index}>
                      <td className="border border-gray-300 p-1 text-xs text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 p-1 text-xs">
                        {item.itemName || item.item}
                      </td>
                      {hasHsnCodes && (
                        <td className="border border-gray-300 p-1 text-xs">
                          {item.hsnCode || ""}
                        </td>
                      )}
                      <td className="border border-gray-300 p-1 text-xs text-right">
                        {item.primaryQuantity}
                      </td>
                      <td className="border border-gray-300 p-1 text-xs">
                        {item.primaryUnitName || item.unit}
                      </td>
                      {hasSecondaryUnits && (
                        <>
                          <td className="border border-gray-300 p-1 text-xs text-right">
                            {item.secondaryQuantity || "0"}
                          </td>
                          <td className="border border-gray-300 p-1 text-xs">
                            {item.secondaryUnitName || "-"}
                          </td>
                        </>
                      )}
                      <td className="border border-gray-300 p-1 text-xs text-right">
                        {formatCurrency(item.pricePerUnit || 0, currencyCode)}
                      </td>
                      {hasDiscounts && (
                        <td className="border border-gray-300 p-1 text-xs text-right">
                          {item.discountPercent || "0.00"}
                        </td>
                      )}
                      <td className="border border-gray-300 p-1 text-xs text-right">
                        {taxRate || "0.00"}
                      </td>
                      <td className="border border-gray-300 p-1 text-xs text-right">
                        {formatCurrency(item.amount || 0, currencyCode)}
                      </td>
                    </tr>
                  );
                })}
              <tr className="font-bold">
                <td
                  className="border border-gray-300 p-1 text-xs"
                  colSpan={
                    (hasHsnCodes ? 1 : 0) +
                    (hasSecondaryUnits ? 2 : 0) +
                    (hasDiscounts ? 1 : 0) +
                    6
                  }
                  align="right"
                >
                  Total:
                </td>
                <td className="border border-gray-300 p-1 text-xs text-right">
                  {formatCurrency(document.total || 0, currencyCode)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tax Summary - Only show if there are taxes */}
          {shouldShowTaxSummary &&
            document.items &&
            document.items.length > 0 && (
              <div className="mb-4">
                <div className="font-bold text-xs mb-2">Tax Summary:</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1 text-xs">
                        HSN/SAC
                      </th>
                      <th className="border border-gray-300 p-1 text-xs">
                        Taxable Value
                      </th>
                      {usesSplitTax ? (
                        // For countries with split tax (like India's CGST/SGST)
                        <>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.split1} (%)
                          </th>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.split1}
                          </th>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.split2} (%)
                          </th>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.split2}
                          </th>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.inter} (%)
                          </th>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.inter}
                          </th>
                        </>
                      ) : (
                        // For countries with just VAT or simple tax
                        <>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.main} (%)
                          </th>
                          <th className="border border-gray-300 p-1 text-xs">
                            {taxPrefix.main}
                          </th>
                        </>
                      )}
                      <th className="border border-gray-300 p-1 text-xs">
                        Total Tax
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      document.items.reduce(
                        (acc: Record<any, any>, item: any) => {
                          const hsnCode = item.hsnCode || "UNKNOWN";
                          if (!acc[hsnCode]) {
                            acc[hsnCode] = {
                              taxableValue: 0,
                              taxType: getTaxType(item.taxType, countryCode),
                              taxRate:
                                getTaxRate(item.taxType) ||
                                Number(item.taxRate) ||
                                0,
                              vat: 0,
                              cgst: 0,
                              sgst: 0,
                              igst: 0,
                              totalTax: 0,
                            };
                          }

                          const amount =
                            typeof item.amount === "string"
                              ? parseFloat(item.amount)
                              : Number(item.amount || 0);
                          const taxAmount =
                            typeof item.taxAmount === "string"
                              ? parseFloat(item.taxAmount)
                              : Number(item.taxAmount || 0);

                          const taxableValue = amount - taxAmount;
                          acc[hsnCode].taxableValue += taxableValue;

                          if (countryCode === "IN") {
                            // India's tax system
                            if (acc[hsnCode].taxType === "GST") {
                              // Split rate and amount into CGST + SGST
                              acc[hsnCode].cgst += taxAmount / 2;
                              acc[hsnCode].sgst += taxAmount / 2;
                            } else if (acc[hsnCode].taxType === "IGST") {
                              acc[hsnCode].igst += taxAmount;
                            }
                          } else {
                            // Other countries - typically just VAT
                            acc[hsnCode].vat += taxAmount;
                          }

                          acc[hsnCode].totalTax += taxAmount;

                          return acc;
                        },
                        {}
                      )
                    ).map(([hsnCode, group]) => {
                      const groupData = group as TaxGroup;

                      return (
                        <tr key={hsnCode}>
                          <td className="border border-gray-300 p-1 text-xs">
                            {hsnCode}
                          </td>
                          <td className="border border-gray-300 p-1 text-xs text-right">
                            {formatCurrency(
                              groupData.taxableValue,
                              currencyCode
                            )}
                          </td>

                          {usesSplitTax ? (
                            // For countries with split tax (like India's CGST/SGST)
                            <>
                              {/* CGST % */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {groupData.taxType === "GST"
                                  ? (groupData.taxRate / 2).toFixed(2)
                                  : "-"}
                              </td>
                              {/* CGST amount */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {groupData.taxType === "GST"
                                  ? formatCurrency(groupData.cgst, currencyCode)
                                  : "-"}
                              </td>

                              {/* SGST % */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {groupData.taxType === "GST"
                                  ? (groupData.taxRate / 2).toFixed(2)
                                  : "-"}
                              </td>
                              {/* SGST amount */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {groupData.taxType === "GST"
                                  ? formatCurrency(groupData.sgst, currencyCode)
                                  : "-"}
                              </td>

                              {/* IGST % */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {groupData.taxType === "IGST"
                                  ? groupData.taxRate.toFixed(2)
                                  : "-"}
                              </td>
                              {/* IGST amount */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {groupData.taxType === "IGST"
                                  ? formatCurrency(groupData.igst, currencyCode)
                                  : "-"}
                              </td>
                            </>
                          ) : (
                            // For countries with just VAT
                            <>
                              {/* VAT % */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {groupData.taxRate.toFixed(2)}
                              </td>
                              {/* VAT amount */}
                              <td className="border border-gray-300 p-1 text-xs text-right">
                                {formatCurrency(groupData.vat, currencyCode)}
                              </td>
                            </>
                          )}

                          {/* Total Tax */}
                          <td className="border border-gray-300 p-1 text-xs text-right">
                            {formatCurrency(groupData.totalTax, currencyCode)}
                          </td>
                        </tr>
                      );
                    })}

                    {document.taxAmount && Number(document.taxAmount) > 0 && (
                      <tr className="font-bold">
                        <td className="border border-gray-300 p-1 text-xs">
                          TOTAL
                        </td>
                        <td className="border border-gray-300 p-1 text-xs text-right">
                          {formatCurrency(taxableValue, currencyCode)}
                        </td>

                        {usesSplitTax ? (
                          <>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              -
                            </td>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              {formatCurrency(
                                document.items.reduce(
                                  (total: number, item: any) => {
                                    if (
                                      getTaxType(item.taxType, countryCode) ===
                                      "GST"
                                    ) {
                                      const taxAmount =
                                        typeof item.taxAmount === "string"
                                          ? parseFloat(item.taxAmount)
                                          : Number(item.taxAmount || 0);
                                      return total + taxAmount / 2;
                                    }
                                    return total;
                                  },
                                  0
                                ),
                                currencyCode
                              )}
                            </td>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              -
                            </td>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              {formatCurrency(
                                document.items.reduce(
                                  (total: number, item: any) => {
                                    if (
                                      getTaxType(item.taxType, countryCode) ===
                                      "GST"
                                    ) {
                                      const taxAmount =
                                        typeof item.taxAmount === "string"
                                          ? parseFloat(item.taxAmount)
                                          : Number(item.taxAmount || 0);
                                      return total + taxAmount / 2;
                                    }
                                    return total;
                                  },
                                  0
                                ),
                                currencyCode
                              )}
                            </td>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              -
                            </td>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              {formatCurrency(
                                document.items.reduce(
                                  (total: number, item: any) => {
                                    if (
                                      getTaxType(item.taxType, countryCode) ===
                                      "IGST"
                                    ) {
                                      const taxAmount =
                                        typeof item.taxAmount === "string"
                                          ? parseFloat(item.taxAmount)
                                          : Number(item.taxAmount || 0);
                                      return total + taxAmount;
                                    }
                                    return total;
                                  },
                                  0
                                ),
                                currencyCode
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              -
                            </td>
                            <td className="border border-gray-300 p-1 text-xs text-right">
                              {formatCurrency(document.taxAmount, currencyCode)}
                            </td>
                          </>
                        )}

                        <td className="border border-gray-300 p-1 text-xs text-right">
                          {formatCurrency(document.taxAmount, currencyCode)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* Amount Calculations */}
          <div className="flex justify-end mb-4">
            <div className="w-64">
              <div className="flex justify-between text-xs mb-1">
                <span>Sub Total:</span>
                <span>{formatCurrency(taxableValue, currencyCode)}</span>
              </div>

              {hasNumericValue(document.discountAmount) && (
                <div className="flex justify-between text-xs mb-1">
                  <span>Discount ({document.discountPercentage || 0}%):</span>
                  <span>
                    - {formatCurrency(document.discountAmount, currencyCode)}
                  </span>
                </div>
              )}

              {hasNumericValue(document.taxAmount) && (
                <div className="flex justify-between text-xs mb-1">
                  <span>{countryCode === "IN" ? "GST" : "VAT"}:</span>
                  <span>
                    + {formatCurrency(document.taxAmount, currencyCode)}
                  </span>
                </div>
              )}

              {hasNumericValue(document.shipping) && (
                <div className="flex justify-between text-xs mb-1">
                  <span>Shipping:</span>
                  <span>
                    + {formatCurrency(document.shipping, currencyCode)}
                  </span>
                </div>
              )}

              {hasNumericValue(document.packaging) && (
                <div className="flex justify-between text-xs mb-1">
                  <span>Packaging:</span>
                  <span>
                    + {formatCurrency(document.packaging, currencyCode)}
                  </span>
                </div>
              )}

              {hasNumericValue(document.adjustment) && (
                <div className="flex justify-between text-xs mb-1">
                  <span>Adjustment:</span>
                  <span>
                    + {formatCurrency(document.adjustment, currencyCode)}
                  </span>
                </div>
              )}

              {document.roundOff !== 0 &&
                hasNumericValue(Math.abs(document.roundOff)) && (
                  <div className="flex justify-between text-xs mb-1">
                    <span>Round Off:</span>
                    <span>
                      {Number(document.roundOff) > 0 ? "+" : ""}
                      {formatCurrency(document.roundOff, currencyCode)}
                    </span>
                  </div>
                )}

              <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-xs">
                <span>Total:</span>
                <span>{formatCurrency(document.total, currencyCode)}</span>
              </div>

              {hasNumericValue(document.balanceAmount) && (
                <div className="flex justify-between text-xs mt-2">
                  <span>Balance Amount Due:</span>
                  <span>
                    {formatCurrency(document.balanceAmount, currencyCode)}
                  </span>
                </div>
              )}

              {hasNumericValue(document.paidAmount) && (
                <div className="flex justify-between text-xs mt-2">
                  <span>Received Amount:</span>
                  <span>
                    {formatCurrency(document.paidAmount, currencyCode)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="border-t border-gray-300 pt-2 mb-4">
            <div className="font-bold text-xs">Terms & Conditions:</div>
            <div className="text-xs">Thank you for your business with us!</div>
          </div>

          {/* Bank Details Section - Only show if bank details exist */}
          {shouldShowBankDetails && (
            <div className="border-t border-gray-300 pt-2 mb-4">
              <div className="font-bold text-xs mb-1">
                Bank Account Details:
              </div>
              <div className="text-xs grid grid-cols-1 gap-2">
                {hasValue(bankDetails?.bankName) && (
                  <div>
                    <span className="font-medium">Bank Name:</span>{" "}
                    {bankDetails.bankName}
                  </div>
                )}
                {hasValue(bankDetails?.accountNumber) && (
                  <div>
                    <span className="font-medium">Account Number:</span>{" "}
                    {bankDetails.accountNumber}
                  </div>
                )}
                {hasValue(bankDetails?.accountHolderName) && (
                  <div>
                    <span className="font-medium">Account Holder Name:</span>{" "}
                    {bankDetails.accountHolderName}
                  </div>
                )}
                {(hasValue(bankDetails?.ifscCode) ||
                  hasValue(bankDetails?.swiftCode)) && (
                  <div>
                    <span className="font-medium">
                      {countryCode === "IN" ? "IFSC Code" : "SWIFT/BIC"}:
                    </span>{" "}
                    {bankDetails?.ifscCode || bankDetails?.swiftCode}
                  </div>
                )}
                {hasValue(bankDetails?.upiId) && countryCode === "IN" && (
                  <div>
                    <span className="font-medium">UPI ID:</span>{" "}
                    {bankDetails.upiId}
                  </div>
                )}
                {hasValue(bankDetails?.iban) && countryCode !== "IN" && (
                  <div>
                    <span className="font-medium">IBAN:</span>{" "}
                    {bankDetails.iban}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="text-right text-xs">
            <div>For {businessName}:</div>
            <div className="mt-8">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentPrinter;
