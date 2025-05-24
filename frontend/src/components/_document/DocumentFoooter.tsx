import {
  AlignLeft,
  CalendarDays,
  Car,
  CreditCard,
  DollarSign,
  FileText,
  MapPin,
  Truck,
} from "lucide-react";
import React, { useEffect } from "react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Document Context
import { useGetBankAccountsQuery } from "@/redux/api/bankingApi";
import { PaymentType } from "@/models/document/document.model";
import { useDocument } from "./Context";

const DocumentFooter: React.FC = () => {
  // Use document context
  const { state, dispatch, calculateTotals } = useDocument();

  // Get bank accounts for bank payment option
  const { data: bankAccounts } = useGetBankAccountsQuery();

  // Payment types
  const paymentTypes = [
    { value: PaymentType.CASH, label: "Cash" },
    { value: PaymentType.UPI, label: "UPI" },
    { value: PaymentType.BANK, label: "Bank Transfer" },
    { value: PaymentType.CHEQUE, label: "Cheque" },
  ];

  // Calculate totals for display
  const totals = calculateTotals();

  // Auto-handle cash transactions - when transaction type is cash, set paid amount to total
  useEffect(() => {
    if (state.document.transactionType === "cash") {
      const currentTotal = totals.total;

      // Only update if the paid amount is different from total
      if (state.document.paidAmount !== currentTotal) {
        dispatch({
          type: "UPDATE_FIELD",
          payload: {
            field: "paidAmount",
            value: currentTotal,
          },
        });

        // Balance should be 0 for cash transactions
        dispatch({
          type: "UPDATE_FIELD",
          payload: {
            field: "balanceAmount",
            value: 0,
          },
        });
      }
    }
  }, [
    state.document.transactionType,
    totals.total,
    state.document.paidAmount,
    dispatch,
  ]);

  // Handle round off changes
  const handleRoundOffChange = (checked: boolean) => {
    if (checked) {
      // Calculate round off amount (to nearest whole number)
      const currentTotal = totals.subtotal;
      const roundedTotal = Math.round(currentTotal);
      const roundOffAmount = roundedTotal - currentTotal;

      dispatch({
        type: "UPDATE_FIELD",
        payload: {
          field: "roundOff",
          value: roundOffAmount,
        },
      });
    } else {
      dispatch({
        type: "UPDATE_FIELD",
        payload: {
          field: "roundOff",
          value: 0,
        },
      });
    }
  };

  // Update paid amount and calculate balance
  const handlePaidAmountChange = (value: string) => {
    const paidAmount = parseFloat(value) || 0;
    const balanceAmount = totals.total - paidAmount;

    dispatch({
      type: "UPDATE_FIELD",
      payload: {
        field: "paidAmount",
        value: paidAmount,
      },
    });

    dispatch({
      type: "UPDATE_FIELD",
      payload: {
        field: "balanceAmount",
        value: balanceAmount,
      },
    });
  };

  // Update shipping, packaging or adjustment fields
  const handleAdditionalAmountChange = (
    field: "shipping" | "packaging" | "adjustment",
    value: string
  ) => {
    dispatch({
      type: "UPDATE_FIELD",
      payload: {
        field,
        value: parseFloat(value) || 0,
      },
    });
  };

  // Get field values (safely)
  const getFieldValue = (
    field: "shipping" | "packaging" | "adjustment"
  ): string => {
    const value = state.document[field];
    return value !== undefined ? String(value) : "";
  };

  // Check if we're creating/editing a purchase or sale document
  const isPurchaseDocument = state.document.partyType === "supplier";
  const documentTypeLabel = isPurchaseDocument ? "Purchase" : "Sale";

  // Check if transaction is cash
  const isCashTransaction = state.document.transactionType === "cash";

  return (
    <Card className="border shadow-sm mb-4">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          {documentTypeLabel} Document Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - Delivery Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
              <Truck className="h-4 w-4 mr-1 text-primary" />
              Delivery Information
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1 block flex items-center">
                  <Truck className="h-3 w-3 mr-1" />
                  Transport Name
                </Label>
                <Input
                  value={state.document.transportName || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        field: "transportName",
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter transport name"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1 block flex items-center">
                  <Car className="h-3 w-3 mr-1" />
                  Vehicle Number
                </Label>
                <Input
                  value={state.document.vehicleNumber || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        field: "vehicleNumber",
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter vehicle number"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1 block flex items-center">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  Delivery Date
                </Label>
                <Input
                  type="date"
                  value={state.document.deliveryDate || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        field: "deliveryDate",
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Select delivery date"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1 block flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Delivery Location
                </Label>
                <Input
                  value={state.document.deliveryLocation || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        field: "deliveryLocation",
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter delivery location"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1 block flex items-center">
                  <AlignLeft className="h-3 w-3 mr-1" />
                  Description/Notes
                </Label>
                <Input
                  value={state.document.description || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        field: "description",
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Add any additional notes"
                  className="min-h-16"
                />
              </div>
            </div>
          </div>

          {/* Middle Column - Payment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
              <CreditCard className="h-4 w-4 mr-1 text-primary" />
              Payment Information
            </h3>

            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Payment Type
                  </Label>
                  <Select
                    value={state.document.paymentType || "cash"}
                    onValueChange={(value) =>
                      dispatch({
                        type: "UPDATE_FIELD",
                        payload: {
                          field: "paymentType",
                          value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-10 border-primary/20">
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank account selection for bank payments */}
                {state.document.paymentType === PaymentType.BANK && (
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Bank Account
                    </Label>
                    <Select
                      value={state.document.bankId || ""}
                      onValueChange={(value) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          payload: {
                            field: "bankId",
                            value,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-10 border-primary/20">
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Cheque details for cheque payments */}
                {state.document.paymentType === PaymentType.CHEQUE && (
                  <>
                    <div>
                      <Label className="text-xs font-medium mb-1 block">
                        Cheque Number
                      </Label>
                      <Input
                        value={state.document.chequeNumber || ""}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_FIELD",
                            payload: {
                              field: "chequeNumber",
                              value: e.target.value,
                            },
                          })
                        }
                        placeholder="Enter cheque number"
                        className="border-primary/20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1 block">
                        Cheque Date
                      </Label>
                      <Input
                        type="date"
                        value={state.document.chequeDate || ""}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_FIELD",
                            payload: {
                              field: "chequeDate",
                              value: e.target.value,
                            },
                          })
                        }
                        className="border-primary/20"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {isPurchaseDocument ? "Paid Amount" : "Received Amount"}
                  </Label>
                  <Input
                    type="number"
                    value={state.document.paidAmount?.toString() || "0"}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="border-primary/20"
                    disabled={isCashTransaction} // Disable for cash transactions
                    readOnly={isCashTransaction} // Make readonly for cash transactions
                  />
                  {isCashTransaction && (
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-filled for cash transactions
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Balance Amount
                  </Label>
                  <Input
                    type="number"
                    value={state.document.balanceAmount?.toString() || "0"}
                    readOnly
                    className={`border-primary/20 font-medium ${
                      isCashTransaction ? "bg-green-50 text-green-700" : ""
                    }`}
                  />
                  {isCashTransaction && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Fully paid (Cash transaction)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Additional Charges & Total */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
              <DollarSign className="h-4 w-4 mr-1 text-primary" />
              Additional Charges & Total
            </h3>

            <Card className="border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Shipping</Label>
                  <div className="flex w-32">
                    <Input
                      type="number"
                      value={getFieldValue("shipping")}
                      onChange={(e) =>
                        handleAdditionalAmountChange("shipping", e.target.value)
                      }
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Packaging</Label>
                  <div className="flex w-32">
                    <Input
                      type="number"
                      value={getFieldValue("packaging")}
                      onChange={(e) =>
                        handleAdditionalAmountChange(
                          "packaging",
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Adjustment</Label>
                  <div className="flex w-32">
                    <Input
                      type="number"
                      value={getFieldValue("adjustment")}
                      onChange={(e) =>
                        handleAdditionalAmountChange(
                          "adjustment",
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center mt-2">
                  <Checkbox
                    id="roundOff"
                    checked={state.document.roundOff !== 0}
                    onCheckedChange={handleRoundOffChange}
                  />
                  <Label
                    htmlFor="roundOff"
                    className="text-xs font-medium ml-2"
                  >
                    Round Off
                  </Label>
                  <div className="flex-grow"></div>
                  <div className="w-32">
                    <Input
                      type="number"
                      value={state.document.roundOff?.toString() || "0"}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          payload: {
                            field: "roundOff",
                            value: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Subtotal</Label>
                    <div className="text-right font-medium">
                      {totals.subtotal.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-md mt-2 ${
                    isCashTransaction
                      ? "bg-green-50 border border-green-200"
                      : "bg-primary/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Label
                      className={`font-medium text-base ${
                        isCashTransaction ? "text-green-700" : "text-primary"
                      }`}
                    >
                      Total {isCashTransaction && "(Paid)"}
                    </Label>
                    <div
                      className={`text-right font-bold text-lg ${
                        isCashTransaction ? "text-green-700" : ""
                      }`}
                    >
                      {totals.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentFooter;
