"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Save,
  CreditCard,
  Building,
  User,
  QrCode,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";

import {
  updateFormField,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  closeForm,
  resetForm,
  populateFromAccount,
} from "@/redux/slices/bankAccountFormSlice";

import {
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useGetBankAccountByIdQuery,
} from "@/redux/api/bankingApi";

const AddBankAccountModal = () => {
  const dispatch = useAppDispatch();
  const {
    isOpen,
    mode,
    currentAccountId,
    formData,
    isSubmitting,
    validationErrors,
  } = useAppSelector((state) => state.bankAccountForm);

  const [createBankAccount] = useCreateBankAccountMutation();
  const [updateBankAccount] = useUpdateBankAccountMutation();

  // Fetch existing bank account data for edit mode
  const { data: editAccount, isLoading: editAccountLoading } =
    useGetBankAccountByIdQuery(currentAccountId ?? "", {
      skip: !currentAccountId,
    });

  // Create local state to handle input values and avoid redux state issues
  const [localFormState, setLocalFormState] = React.useState({
    displayName: formData.displayName || "",
    openingBalance: formData.openingBalance || "",
    asOfDate: formData.asOfDate || new Date().toISOString().split("T")[0],
    printBankDetailsOnInvoices: formData.printBankDetailsOnInvoices || false,
    printUpiQrOnInvoices: formData.printUpiQrOnInvoices || false,
    bankName: formData.bankName || "",
    accountNumber: formData.accountNumber || "",
    ifscCode: formData.ifscCode || "",
    accountHolderName: formData.accountHolderName || "",
    upiId: formData.upiId || "",
    isActive: formData.isActive !== undefined ? formData.isActive : true,
    notes: formData.notes || "",
  });

  // Initialize form when component mounts
  React.useEffect(() => {
    if (mode === "create") {
      dispatch(resetForm());
      // Set some defaults for create mode
      setLocalFormState({
        displayName: "",
        openingBalance: "",
        asOfDate: new Date().toISOString().split("T")[0],
        printBankDetailsOnInvoices: false,
        printUpiQrOnInvoices: false,
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        upiId: "",
        isActive: true,
        notes: "",
      });
    }
  }, [dispatch, mode]);

  // Populate form data when editing and account data is loaded
  React.useEffect(() => {
    if (mode === "edit" && editAccount) {
      dispatch(populateFromAccount(editAccount));
    }
  }, [mode, editAccount, dispatch]);

  // Sync local state with redux state when form opens or data changes
  React.useEffect(() => {
    if (isOpen) {
      setLocalFormState({
        displayName: formData.displayName || "",
        openingBalance: formData.openingBalance || "",
        asOfDate: formData.asOfDate || new Date().toISOString().split("T")[0],
        printBankDetailsOnInvoices:
          formData.printBankDetailsOnInvoices || false,
        printUpiQrOnInvoices: formData.printUpiQrOnInvoices || false,
        bankName: formData.bankName || "",
        accountNumber: formData.accountNumber || "",
        ifscCode: formData.ifscCode || "",
        accountHolderName: formData.accountHolderName || "",
        upiId: formData.upiId || "",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        notes: formData.notes || "",
      });
    }
  }, [isOpen, formData]);

  // Only update Redux when form is submitted
  const handleLocalChange = (field: any, value: any) => {
    setLocalFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // First, update Redux with all local state values
    for (const [field, value] of Object.entries(localFormState) as [
      any,
      string | number | boolean
    ][]) {
      dispatch(updateFormField({ field, value }));
    }

    // Only validate required fields
    const requiredFieldsErrors: Record<string, string> = {};

    // Check only basic required fields
    if (!localFormState.displayName?.trim()) {
      requiredFieldsErrors.displayName = "Account display name is required";
    }

    // Only validate bank details if they are enabled
    if (localFormState.printBankDetailsOnInvoices) {
      if (!localFormState.bankName?.trim()) {
        requiredFieldsErrors.bankName =
          "Bank name is required when bank details are enabled";
      }
      if (!localFormState.accountNumber?.trim()) {
        requiredFieldsErrors.accountNumber =
          "Account number is required when bank details are enabled";
      }
      if (!localFormState.ifscCode?.trim()) {
        requiredFieldsErrors.ifscCode =
          "IFSC code is required when bank details are enabled";
      }
      if (!localFormState.accountHolderName?.trim()) {
        requiredFieldsErrors.accountHolderName =
          "Account holder name is required when bank details are enabled";
      }

      // Validate IFSC format
      if (
        localFormState.ifscCode?.trim() &&
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(localFormState.ifscCode)
      ) {
        requiredFieldsErrors.ifscCode = "Invalid IFSC code format";
      }
    }

    // Only validate UPI ID if UPI QR is enabled
    if (localFormState.printUpiQrOnInvoices && !localFormState.upiId?.trim()) {
      requiredFieldsErrors.upiId =
        "UPI ID is required when UPI QR code is enabled";
    }

    // Validate opening balance
    const openingBalance =
      typeof localFormState.openingBalance === "string"
        ? parseFloat(localFormState.openingBalance)
        : localFormState.openingBalance;
    if (openingBalance < 0) {
      requiredFieldsErrors.openingBalance =
        "Opening balance cannot be negative";
    }

    if (Object.keys(requiredFieldsErrors).length > 0) {
      dispatch(setValidationErrors(requiredFieldsErrors));
      // Show toast for the first error
      const firstError = Object.values(requiredFieldsErrors)[0];
      toast.error(firstError);
      return;
    }

    // Prepare final form data for submission
    const finalFormData = {
      ...formData,
      ...localFormState,
      openingBalance:
        typeof localFormState.openingBalance === "string" &&
        localFormState.openingBalance !== ""
          ? parseFloat(localFormState.openingBalance)
          : localFormState.openingBalance || 0,
      currentBalance:
        mode === "create"
          ? typeof localFormState.openingBalance === "string" &&
            localFormState.openingBalance !== ""
            ? parseFloat(localFormState.openingBalance)
            : localFormState.openingBalance || 0
          : formData.currentBalance,
    };

    dispatch(setSubmitting(true));
    try {
      if (mode === "create") {
        await createBankAccount(finalFormData).unwrap();
        toast.success("Bank Account created successfully!");
      } else {
        if (!currentAccountId) {
          throw new Error("Account ID is missing");
        }
        await updateBankAccount({
          id: currentAccountId,
          ...finalFormData,
        }).unwrap();
        toast.success("Bank Account updated successfully!");
      }

      dispatch(closeForm());
      dispatch(resetForm());
    } catch (error: any) {
      dispatch(setSubmitError(error.data?.message || "An error occurred."));
      toast.error(
        error.data?.message ||
          `Failed to ${mode === "create" ? "create" : "update"} Bank Account`
      );
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  const FormField = ({
    label,
    name,
    placeholder,
    icon,
    type = "text",
    value,
    onChange,
    required = false,
    disabled = false,
  }: {
    label: string;
    name: string;
    placeholder: string;
    icon?: React.ReactNode;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium flex items-center">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={icon ? "pl-10" : ""}
        />
      </div>
      {validationErrors[name] && (
        <p className="text-destructive text-xs mt-1">
          {validationErrors[name]}
        </p>
      )}
    </div>
  );

  // Show loading state for edit mode
  if (mode === "edit" && editAccountLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => dispatch(closeForm())}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-gray-600">Loading account details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => dispatch(closeForm())}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <div className="sticky top-0 z-10 ">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {mode === "create" ? "Add Bank Account" : "Edit Bank Account"}
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Fields marked with <span className="text-red-500">*</span> are
              required
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
          {/* Basic Details Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="displayName"
                  className="text-sm font-medium flex items-center"
                >
                  Account Display Name{" "}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Building
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  />
                  <Input
                    id="displayName"
                    placeholder="Enter display name"
                    value={localFormState.displayName}
                    onChange={(e) =>
                      handleLocalChange("displayName", e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
                {validationErrors.displayName && (
                  <p className="text-destructive text-xs mt-1">
                    {validationErrors.displayName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="openingBalance"
                    className="text-sm font-medium"
                  >
                    Opening Balance
                  </Label>
                  <div className="relative">
                    <CreditCard
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    />
                    <Input
                      id="openingBalance"
                      type="number"
                      placeholder="0.00"
                      value={localFormState.openingBalance}
                      onChange={(e) =>
                        handleLocalChange("openingBalance", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                  {validationErrors.openingBalance && (
                    <p className="text-destructive text-xs mt-1">
                      {validationErrors.openingBalance}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asOfDate" className="text-sm font-medium">
                    As Of Date
                  </Label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    />
                    <Input
                      id="asOfDate"
                      type="date"
                      value={localFormState.asOfDate}
                      onChange={(e) =>
                        handleLocalChange("asOfDate", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Account Status for Edit Mode */}
              {mode === "edit" && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium text-sm">Account Status</h3>
                    <p className="text-muted-foreground text-xs">
                      Enable or disable this account
                    </p>
                  </div>
                  <Switch
                    checked={localFormState.isActive}
                    onCheckedChange={(value) =>
                      handleLocalChange("isActive", value)
                    }
                  />
                </div>
              )}

              {/* Notes field */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <Input
                  id="notes"
                  placeholder="Add any notes about this account"
                  value={localFormState.notes}
                  onChange={(e) => handleLocalChange("notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Print Options */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Bank Details Toggle */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      Print Bank Details on Invoices
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Optional: Show account information on your invoices
                    </p>
                  </div>
                  <Switch
                    checked={localFormState.printBankDetailsOnInvoices}
                    onCheckedChange={(value) =>
                      handleLocalChange("printBankDetailsOnInvoices", value)
                    }
                  />
                </div>

                {localFormState.printBankDetailsOnInvoices && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="bankName"
                        className="text-sm font-medium flex items-center"
                      >
                        Bank Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Building
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        />
                        <Input
                          id="bankName"
                          placeholder="Bank name"
                          value={localFormState.bankName}
                          onChange={(e) =>
                            handleLocalChange("bankName", e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.bankName && (
                        <p className="text-destructive text-xs mt-1">
                          {validationErrors.bankName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="accountNumber"
                        className="text-sm font-medium flex items-center"
                      >
                        Account Number{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <CreditCard
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        />
                        <Input
                          id="accountNumber"
                          placeholder="Enter account number"
                          value={localFormState.accountNumber}
                          onChange={(e) =>
                            handleLocalChange("accountNumber", e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.accountNumber && (
                        <p className="text-destructive text-xs mt-1">
                          {validationErrors.accountNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="ifscCode"
                        className="text-sm font-medium flex items-center"
                      >
                        IFSC Code <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="ifscCode"
                          placeholder="Enter IFSC (e.g., SBIN0001234)"
                          value={localFormState.ifscCode}
                          onChange={(e) =>
                            handleLocalChange(
                              "ifscCode",
                              e.target.value.toUpperCase()
                            )
                          }
                        />
                      </div>
                      {validationErrors.ifscCode && (
                        <p className="text-destructive text-xs mt-1">
                          {validationErrors.ifscCode}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="accountHolderName"
                        className="text-sm font-medium flex items-center"
                      >
                        Account Holder Name{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        />
                        <Input
                          id="accountHolderName"
                          placeholder="Holder's Name"
                          value={localFormState.accountHolderName}
                          onChange={(e) =>
                            handleLocalChange(
                              "accountHolderName",
                              e.target.value
                            )
                          }
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.accountHolderName && (
                        <p className="text-destructive text-xs mt-1">
                          {validationErrors.accountHolderName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* UPI QR Toggle */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      Print UPI QR Code on Invoices
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Optional: Display QR code for easy payments
                    </p>
                  </div>
                  <Switch
                    checked={localFormState.printUpiQrOnInvoices}
                    onCheckedChange={(value) =>
                      handleLocalChange("printUpiQrOnInvoices", value)
                    }
                  />
                </div>

                {localFormState.printUpiQrOnInvoices && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="upiId"
                        className="text-sm font-medium flex items-center"
                      >
                        UPI ID for QR Code{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <QrCode
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        />
                        <Input
                          id="upiId"
                          placeholder="Enter UPI ID (e.g., name@paytm)"
                          value={localFormState.upiId}
                          onChange={(e) =>
                            handleLocalChange("upiId", e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.upiId && (
                        <p className="text-destructive text-xs mt-1">
                          {validationErrors.upiId}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => dispatch(closeForm())}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !localFormState.displayName?.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === "create" ? "Creating..." : "Updating..."}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>
                  {mode === "create" ? "Create Account" : "Update Account"}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBankAccountModal;
