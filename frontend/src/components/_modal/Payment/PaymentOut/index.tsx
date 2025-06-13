// components/PaymentOutForm.tsx
import { Calendar, LoaderCircle, Save, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

// UI Components
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Redux
import { useGetBankAccountsQuery } from "@/redux/api/bankingApi";
import { useGetPartiesQuery } from "@/redux/api/partiesApi";
import {
  useCreatePaymentMutation,
  useGetPaymentByIdQuery,
  useUpdatePaymentMutation,
} from "@/redux/api/paymentApi";
import {
  closeForm,
  resetForm,
  setSubmitError,
  setSubmitting,
  setValidationErrors,
  updateFormField,
  validatePaymentForm,
} from "@/redux/slices/paymentSlice";
import { RootState } from "@/redux/store";

// Models
import { PaymentType } from "@/models/document/document.model";
import { PaymentDirection } from "@/models/payment/payment.model";

const PaymentOutForm: React.FC = () => {
  const dispatch = useDispatch();
  const {
    isOpen,
    mode,
    currentPaymentId,
    formData,
    isSubmitting,
    submitError,
    validationErrors,
    activeTab,
  } = useSelector((state: RootState) => state.paymentForm);

  // Local state for party search
  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  // RTK Query hooks
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentMutation();
  const { data: paymentData, isLoading: isLoadingPayment } =
    useGetPaymentByIdQuery(currentPaymentId || "", {
      skip: !currentPaymentId || mode !== "edit",
    });

  const { data: parties, isLoading: isLoadingParties ,refetch} = useGetPartiesQuery({
    search: partySearchTerm,
  });

  const { data: bankAccounts, isLoading: isLoadingBanks } =
    useGetBankAccountsQuery();

  // Filter parties based on search
  const filteredParties =
    parties?.filter(
      (party) =>
        party.name.toLowerCase().includes(partySearchTerm.toLowerCase()) ||
        (party.phone && party.phone.includes(partySearchTerm))
    ) || [];
    useEffect(() => {
      // Immediately refetch data when component mounts
      refetch();
  
      // Set up interval for periodic refetching (every 5 seconds)
      const intervalId = setInterval(() => {
        refetch();
      }, 2000); // Adjust this time as needed
  
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }, [refetch]);
  // Load payment data when editing
  useEffect(() => {
    if (mode === "edit" && paymentData) {
      // Populate form data
      dispatch(updateFormField({ field: "amount", value: paymentData.amount }));
      dispatch(
        updateFormField({
          field: "paymentType",
          value: paymentData.paymentType,
        })
      );
      dispatch(
        updateFormField({
          field: "paymentDate",
          value: paymentData.paymentDate,
        })
      );
      dispatch(
        updateFormField({
          field: "referenceNumber",
          value: paymentData.referenceNumber || "",
        })
      );
      dispatch(
        updateFormField({ field: "partyId", value: paymentData.partyId || "" })
      );
      dispatch(
        updateFormField({
          field: "partyName",
          value: paymentData.partyName || "",
        })
      );
      dispatch(
        updateFormField({
          field: "description",
          value: paymentData.description || "",
        })
      );
      dispatch(
        updateFormField({
          field: "receiptNumber",
          value: paymentData.receiptNumber || "",
        })
      );
      dispatch(
        updateFormField({
          field: "bankAccountId",
          value: paymentData.bankAccountId || "",
        })
      );
      dispatch(
        updateFormField({
          field: "chequeNumber",
          value: paymentData.chequeNumber || "",
        })
      );
      dispatch(
        updateFormField({
          field: "chequeDate",
          value: paymentData.chequeDate || "",
        })
      );
    }
  }, [mode, paymentData, dispatch]);

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form data
    const errors = validatePaymentForm(formData);

    if (Object.keys(errors).length > 0) {
      dispatch(setValidationErrors(errors));

      // Show toast with first error
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    try {
      dispatch(setSubmitting(true));

      if (mode === "edit" && currentPaymentId) {
        // Update existing payment
        await updatePayment({
          id: currentPaymentId,
          ...formData,
        }).unwrap();
        toast.success("Payment updated successfully!");
      } else {
        // Create new payment
        await createPayment(formData).unwrap();
        toast.success("Payment sent successfully!");
      }
      window.dispatchEvent(new Event("partyDataChanged"));
      // Close form and reset
      dispatch(closeForm());
      dispatch(resetForm());
    } catch (error: any) {
      dispatch(setSubmitError(error.message || "Failed to save payment"));
      toast.error(
        `Failed to save payment: ${error.message || "Unknown error"}`
      );
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  // Handle party selection
  const handlePartySelect = (party: any) => {
    dispatch(updateFormField({ field: "partyId", value: party.id }));
    dispatch(updateFormField({ field: "partyName", value: party.name }));
    setShowPartyDropdown(false);
    setPartySearchTerm("");
  };

  // Only show if it's a payment-out form
  if (!isOpen || formData.direction !== PaymentDirection.OUT) return null;

  // Loading state
  if (isLoadingPayment) {
    return (
      <Dialog open={isOpen} onOpenChange={() => dispatch(closeForm())}>
        <DialogContent className="sm:max-w-[550px]">
          <div className="flex justify-center items-center py-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading payment data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => dispatch(closeForm())}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Payment Out" : "New Payment Out"}
          </DialogTitle>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={`tab-${activeTab}`}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="tab-0">Basic Info</TabsTrigger>
          </TabsList>

          <TabsContent value="tab-0" className="space-y-4">
            {/* Basic payment information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    dispatch(
                      updateFormField({
                        field: "amount",
                        value: parseFloat(e.target.value) || 0,
                      })
                    )
                  }
                  placeholder="0.00"
                  className={`${
                    validationErrors.amount ? "border-red-500" : ""
                  }`}
                />
                {validationErrors.amount && (
                  <p className="text-xs text-red-500">
                    {validationErrors.amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: "paymentDate",
                          value: e.target.value,
                        })
                      )
                    }
                    className={`${
                      validationErrors.paymentDate ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {validationErrors.paymentDate && (
                  <p className="text-xs text-red-500">
                    {validationErrors.paymentDate}
                  </p>
                )}
              </div>
            </div>

            {/* Party selection */}
            <div className="space-y-2">
              <Label htmlFor="partySearch">Party/Supplier</Label>
              <div className="relative">
                <div className="flex">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="partySearch"
                      value={partySearchTerm}
                      onChange={(e) => {
                        setPartySearchTerm(e.target.value);
                        setShowPartyDropdown(true);
                      }}
                      onFocus={() => setShowPartyDropdown(true)}
                      className="pl-8"
                      placeholder="Search supplier by name or phone"
                    />
                  </div>
                </div>

                {showPartyDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                    {isLoadingParties ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Loading parties...
                      </div>
                    ) : filteredParties.length > 0 ? (
                      <div>
                        {filteredParties.map((party) => (
                          <div
                            key={party.id}
                            className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                            onClick={() => handlePartySelect(party)}
                          >
                            <div className="font-medium">{party.name}</div>
                            {party.phone && (
                              <div className="text-xs text-gray-500">
                                {party.phone}
                              </div>
                            )}
                            {party.currentBalance && (
                              <div
                                className={`text-xs ${
                                  party.currentBalanceType === "to_receive"
                                    ? "text-green-500"
                                    : "text-red-500"
                                } `}
                              >
                                ₹{party.currentBalance}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No parties found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.partyName && (
                <div className="p-2 bg-gray-50 rounded-md text-sm">
                  Selected:{" "}
                  <span className="font-medium">{formData.partyName}</span>
                </div>
              )}
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label htmlFor="paymentType">
                Payment Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) =>
                  dispatch(
                    updateFormField({
                      field: "paymentType",
                      value,
                    })
                  )
                }
              >
                <SelectTrigger
                  className={`${
                    validationErrors.paymentType ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentType.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentType.BANK}>
                    Bank Transfer
                  </SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.paymentType && (
                <p className="text-xs text-red-500">
                  {validationErrors.paymentType}
                </p>
              )}
            </div>

            {/* Bank account selection - only for bank transfers */}
            {formData.paymentType === PaymentType.BANK && (
              <div className="space-y-2">
                <Label htmlFor="bankAccountId">
                  Bank Account <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.bankAccountId}
                  onValueChange={(value) =>
                    dispatch(
                      updateFormField({
                        field: "bankAccountId",
                        value,
                      })
                    )
                  }
                >
                  <SelectTrigger
                    className={`${
                      validationErrors.bankAccountId ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBanks ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Loading accounts...
                      </div>
                    ) : bankAccounts && bankAccounts.length > 0 ? (
                      bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.displayName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No bank accounts found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.bankAccountId && (
                  <p className="text-xs text-red-500">
                    {validationErrors.bankAccountId}
                  </p>
                )}
              </div>
            )}

            {/* Cheque details - only for cheque payments */}
            {formData.paymentType === PaymentType.CHEQUE && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">
                    Cheque Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: "chequeNumber",
                          value: e.target.value,
                        })
                      )
                    }
                    placeholder="Enter cheque number"
                    className={`${
                      validationErrors.chequeNumber ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.chequeNumber && (
                    <p className="text-xs text-red-500">
                      {validationErrors.chequeNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chequeDate">
                    Cheque Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="chequeDate"
                    type="date"
                    value={formData.chequeDate}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: "chequeDate",
                          value: e.target.value,
                        })
                      )
                    }
                    className={`${
                      validationErrors.chequeDate ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.chequeDate && (
                    <p className="text-xs text-red-500">
                      {validationErrors.chequeDate}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reference Number - for all payment types */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference No.</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={(e) =>
                  dispatch(
                    updateFormField({
                      field: "referenceNumber",
                      value: e.target.value,
                    })
                  )
                }
                placeholder="Transaction reference"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Notes/Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  dispatch(
                    updateFormField({
                      field: "description",
                      value: e.target.value,
                    })
                  )
                }
                placeholder="Add notes or description"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => dispatch(closeForm())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "edit" ? "Update Payment" : "Save Payment"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentOutForm;
