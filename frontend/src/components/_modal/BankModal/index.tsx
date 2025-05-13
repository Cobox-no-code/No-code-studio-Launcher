'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
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
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { 
  openCreateForm,
  updateFormField,
  setSubmitting,
  setSubmitError,
  setValidationErrors,
  closeForm,
  resetForm,
  validateBankAccountForm
} from '@/redux/slices/bankAccountFormSlice';

import { useCreateBankAccountMutation } from '@/redux/api/bankingApi';

const AddBankAccountModal = () => {
  const dispatch = useAppDispatch();
  const {
    isOpen,
    formData,
    isSubmitting,
    validationErrors
  } = useAppSelector(state => state.bankAccountForm);

  const [createBankAccount] = useCreateBankAccountMutation();

  // Create local state to handle input values and avoid redux state issues
  const [localFormState, setLocalFormState] = React.useState({
    displayName: formData.displayName || '',
    openingBalance: formData.openingBalance || '',
    asOfDate: formData.asOfDate || new Date().toISOString().split('T')[0],
    printBankDetailsOnInvoices: formData.printBankDetailsOnInvoices || false,
    printUpiQrOnInvoices: formData.printUpiQrOnInvoices || false,
    bankName: formData.bankName || '',
    accountNumber: formData.accountNumber || '',
    ifscCode: formData.ifscCode || '',
    accountHolderName: formData.accountHolderName || '',
    upiId: formData.upiId || '',
  });

  // Sync local state with redux state when form opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalFormState({
        displayName: formData.displayName || '',
        openingBalance: formData.openingBalance || '',
        asOfDate: formData.asOfDate || new Date().toISOString().split('T')[0],
        printBankDetailsOnInvoices: formData.printBankDetailsOnInvoices || false,
        printUpiQrOnInvoices: formData.printUpiQrOnInvoices || false,
        bankName: formData.bankName || '',
        accountNumber: formData.accountNumber || '',
        ifscCode: formData.ifscCode || '',
        accountHolderName: formData.accountHolderName || '',
        upiId: formData.upiId || '',
      });
    }
  }, [isOpen, formData]);

  // Only update Redux when form is submitted
  const handleLocalChange = (field: any, value: any) => {
    setLocalFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // First, update Redux with all local state values
    for (const [field, value] of Object.entries(localFormState) as [any, string | number | boolean][]) {
      dispatch(updateFormField({ field, value }));
    }
    
    // Only validate required fields
    const requiredFieldsErrors: Record<string, string> = {};
    
    // Check only basic required fields
    if (!localFormState.displayName?.trim()) {
      requiredFieldsErrors.displayName = 'Account display name is required';
    }
    
    // Only validate bank details if they are enabled
    if (localFormState.printBankDetailsOnInvoices) {
      if (!localFormState.bankName?.trim()) {
        requiredFieldsErrors.bankName = 'Bank name is required when bank details are enabled';
      }
      if (!localFormState.accountNumber?.trim()) {
        requiredFieldsErrors.accountNumber = 'Account number is required when bank details are enabled';
      }
      if (!localFormState.ifscCode?.trim()) {
        requiredFieldsErrors.ifscCode = 'IFSC code is required when bank details are enabled';
      }
      if (!localFormState.accountHolderName?.trim()) {
        requiredFieldsErrors.accountHolderName = 'Account holder name is required when bank details are enabled';
      }
    }
    
    // Only validate UPI ID if UPI QR is enabled
    if (localFormState.printUpiQrOnInvoices && !localFormState.upiId?.trim()) {
      requiredFieldsErrors.upiId = 'UPI ID is required when UPI QR code is enabled';
    }

    if (Object.keys(requiredFieldsErrors).length > 0) {
      dispatch(setValidationErrors(requiredFieldsErrors));
      return;
    }

    // Prepare final form data for submission, handling possible type conversions
    const finalFormData = {
      ...formData,
      ...localFormState,
      openingBalance: typeof localFormState.openingBalance === 'string' && localFormState.openingBalance !== '' 
        ? parseFloat(localFormState.openingBalance) 
        : (localFormState.openingBalance || 0)
    };

    dispatch(setSubmitting(true));
    try {
      await createBankAccount(finalFormData).unwrap();
      toast.success('Bank Account added successfully!');
      dispatch(closeForm());
      dispatch(resetForm());
    } catch (error: any) {
      dispatch(setSubmitError(error.data?.message || 'An error occurred.'));
      toast.error(error.data?.message || 'Failed to create Bank Account');
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
    required = false
  }: { 
    label: string; 
    name: string; 
    placeholder: string; 
    icon?: React.ReactNode;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
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
          className={icon ? "pl-10" : ""}
        />
      </div>
      {validationErrors[name] && (
        <p className="text-destructive text-xs mt-1">{validationErrors[name]}</p>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => dispatch(closeForm())}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Bank Account</DialogTitle>
          <p className="text-sm text-muted-foreground">Fields marked with <span className="text-red-500">*</span> are required</p>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
          {/* Basic Details Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium flex items-center">
                  Account Display Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    id="displayName"
                    placeholder="Enter display name"
                    value={localFormState.displayName}
                    onChange={(e) => handleLocalChange('displayName', e.target.value)}
                    className="pl-10"
                  />
                </div>
                {validationErrors.displayName && (
                  <p className="text-destructive text-xs mt-1">{validationErrors.displayName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingBalance" className="text-sm font-medium">
                    Opening Balance
                  </Label>
                  <div className="relative">
                    <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <Input
                      id="openingBalance"
                      type="number"
                      placeholder="0.00"
                      value={localFormState.openingBalance}
                      onChange={(e) => handleLocalChange('openingBalance', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asOfDate" className="text-sm font-medium">
                    As Of Date
                  </Label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <Input
                      id="asOfDate"
                      type="date"
                      value={localFormState.asOfDate}
                      onChange={(e) => handleLocalChange('asOfDate', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
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
                    <h3 className="font-medium">Print Bank Details on Invoices</h3>
                    <p className="text-muted-foreground text-sm">Optional: Show account information on your invoices</p>
                  </div>
                  <Switch
                    checked={localFormState.printBankDetailsOnInvoices}
                    onCheckedChange={(value) => handleLocalChange('printBankDetailsOnInvoices', value)}
                  />
                </div>
                
                {localFormState.printBankDetailsOnInvoices && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="text-sm font-medium flex items-center">
                        Bank Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Building size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          id="bankName"
                          placeholder="Bank name"
                          value={localFormState.bankName}
                          onChange={(e) => handleLocalChange('bankName', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.bankName && (
                        <p className="text-destructive text-xs mt-1">{validationErrors.bankName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="text-sm font-medium flex items-center">
                        Account Number <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          id="accountNumber"
                          placeholder="Enter account number"
                          value={localFormState.accountNumber}
                          onChange={(e) => handleLocalChange('accountNumber', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.accountNumber && (
                        <p className="text-destructive text-xs mt-1">{validationErrors.accountNumber}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ifscCode" className="text-sm font-medium flex items-center">
                        IFSC Code <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="ifscCode"
                          placeholder="Enter IFSC"
                          value={localFormState.ifscCode}
                          onChange={(e) => handleLocalChange('ifscCode', e.target.value)}
                        />
                      </div>
                      {validationErrors.ifscCode && (
                        <p className="text-destructive text-xs mt-1">{validationErrors.ifscCode}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accountHolderName" className="text-sm font-medium flex items-center">
                        Account Holder Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          id="accountHolderName"
                          placeholder="Holder's Name"
                          value={localFormState.accountHolderName}
                          onChange={(e) => handleLocalChange('accountHolderName', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.accountHolderName && (
                        <p className="text-destructive text-xs mt-1">{validationErrors.accountHolderName}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* UPI QR Toggle */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Print UPI QR Code on Invoices</h3>
                    <p className="text-muted-foreground text-sm">Optional: Display QR code for easy payments</p>
                  </div>
                  <Switch
                    checked={localFormState.printUpiQrOnInvoices}
                    onCheckedChange={(value) => handleLocalChange('printUpiQrOnInvoices', value)}
                  />
                </div>
                
                {localFormState.printUpiQrOnInvoices && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="upiId" className="text-sm font-medium flex items-center">
                        UPI ID for QR Code <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <QrCode size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          id="upiId"
                          placeholder="Enter UPI ID"
                          value={localFormState.upiId}
                          onChange={(e) => handleLocalChange('upiId', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {validationErrors.upiId && (
                        <p className="text-destructive text-xs mt-1">{validationErrors.upiId}</p>
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
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                     <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} /> 
                <span>Save</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBankAccountModal;