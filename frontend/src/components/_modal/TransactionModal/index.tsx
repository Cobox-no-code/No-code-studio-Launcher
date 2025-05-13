'use client';

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Calendar, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Import Redux actions and API hooks
import {
    closeForm,
    resetForm,
    setSubmitting
} from '@/redux/slices/transactionFormSlice';

import { BankTransactionType } from '@/models/banking/banking.model';
import { useCreateBankTransactionMutation, useGetBankAccountsQuery } from '@/redux/api/bankingApi';

// Transaction types
export type TransactionType = 'BANK_TO_CASH' | 'CASH_TO_BANK' | 'BANK_TO_BANK' | 'ADJUST_BALANCE';

interface TransactionModalProps {
  transactionType: TransactionType;
  isOpen: boolean;
  onClose: () => void;
  selectedBankId?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  transactionType,
  isOpen,
  onClose,
  selectedBankId
}) => {
  const dispatch = useAppDispatch();
  const { formData, isSubmitting } = useAppSelector(state => state.transactionForm);
  
  // Local form state for better control
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [sourceAccount, setSourceAccount] = useState<string>(selectedBankId || '');
  const [targetAccount, setTargetAccount] = useState<string>('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // API hooks
  const { data: bankAccounts = [], isLoading: isLoadingAccounts } = useGetBankAccountsQuery();
  const [createTransaction] = useCreateBankTransactionMutation();

  // Initialize form with selected bank if provided
  useEffect(() => {
    if (selectedBankId) {
      if (transactionType === 'BANK_TO_CASH' || transactionType === 'BANK_TO_BANK') {
        setSourceAccount(selectedBankId);
      } else if (transactionType === 'CASH_TO_BANK' || transactionType === 'ADJUST_BALANCE') {
        setTargetAccount(selectedBankId);
      }
    }
    
    // Set default title based on transaction type
    const defaultDescription = getDefaultDescription();
    setDescription(defaultDescription);
  }, [selectedBankId, transactionType]);

  const getDefaultDescription = () => {
    switch (transactionType) {
      case 'BANK_TO_CASH': return 'Bank to Cash transfer';
      case 'CASH_TO_BANK': return 'Cash to Bank deposit';
      case 'BANK_TO_BANK': return 'Bank to Bank transfer';
      case 'ADJUST_BALANCE': return 'Bank balance adjustment';
      default: return '';
    }
  };

  const getTitle = () => {
    switch (transactionType) {
      case 'BANK_TO_CASH': return 'Bank To Cash Transfer';
      case 'CASH_TO_BANK': return 'Cash To Bank Transfer';
      case 'BANK_TO_BANK': return 'Bank To Bank Transfer';
      case 'ADJUST_BALANCE': return 'Adjust Bank Balance';
      default: return 'Bank Transaction';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }

    if (transactionType === 'BANK_TO_CASH' || transactionType === 'BANK_TO_BANK') {
      if (!sourceAccount) {
        errors.sourceAccount = 'Please select a source account';
      }
    }

    if (transactionType === 'CASH_TO_BANK' || transactionType === 'BANK_TO_BANK' || transactionType === 'ADJUST_BALANCE') {
      if (!targetAccount) {
        errors.targetAccount = 'Please select a target account';
      }
    }

    if (transactionType === 'BANK_TO_BANK' && sourceAccount === targetAccount) {
      errors.targetAccount = 'Source and target accounts must be different';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    dispatch(setSubmitting(true));
    try {
      const transactionData = prepareTransactionData();
      await createTransaction(transactionData).unwrap();
      toast.success('Transaction recorded successfully');
      handleClose();
    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to create transaction');
    } finally {
      dispatch(setSubmitting(false));
    }
  };

  const prepareTransactionData = () => {
    // Create the appropriate transaction based on type
    switch (transactionType) {
      case 'BANK_TO_CASH':
        return {
          bankAccountId: sourceAccount,
          amount: parseFloat(amount),
          transactionType: BankTransactionType.WITHDRAWAL,
          transactionDate: date,
          description: description || 'Bank to Cash transfer',
          referenceNumber: Date.now().toString()
        };
      
      case 'CASH_TO_BANK':
        return {
          bankAccountId: targetAccount,
          amount: parseFloat(amount),
          transactionType: BankTransactionType.DEPOSIT,
          transactionDate: date,
          description: description || 'Cash to Bank deposit',
          referenceNumber: Date.now().toString()
        };
      
      case 'BANK_TO_BANK':
        // For bank transfers, your API might need a different structure
        // This is a simplified version - adjust based on your actual API needs
        return {
            relatedEntityId: formData.targetBankAccountId,
        relatedEntityType: 'BANK_ACCOUNT',
          bankAccountId: sourceAccount, // Primary account for the transaction
          amount: parseFloat(amount),
          transactionType: BankTransactionType.TRANSFER,
          transactionDate: date,
          description: description || 'Bank to Bank transfer',
          referenceNumber: Date.now().toString()
        };
      
      case 'ADJUST_BALANCE':
        return {
          bankAccountId: targetAccount,
          amount: parseFloat(amount),
          // You might want to have a specific type for adjustment or use DEPOSIT/WITHDRAWAL
          transactionType: BankTransactionType.DEPOSIT, // Change this if needed
          transactionDate: date,
          description: description || 'Balance adjustment',
          referenceNumber: 'ADJUSTMENT-' + Date.now()
        };
      
      default:
        return {
          bankAccountId: sourceAccount || targetAccount,
          amount: parseFloat(amount),
          transactionType: BankTransactionType.DEPOSIT,
          transactionDate: date,
          description: description,
          referenceNumber: Date.now().toString()
        };
    }
  };

  const handleClose = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setSourceAccount(selectedBankId || '');
    setTargetAccount('');
    setLocalErrors({});
    dispatch(resetForm());
    dispatch(closeForm());
    onClose();
  };

  // Format account name with balance
  const formatAccountOption = (account: any) => {
    if (!account) return '';
    const balance = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(account.currentBalance || 0);
    return `${account.displayName} (${balance})`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getTitle()}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From Account - For BANK_TO_CASH and BANK_TO_BANK */}
          {(transactionType === 'BANK_TO_CASH' || transactionType === 'BANK_TO_BANK') && (
            <div className="space-y-2">
              <Label htmlFor="fromAccount">From</Label>
              <Select 
                value={sourceAccount} 
                onValueChange={setSourceAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {formatAccountOption(account)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localErrors.sourceAccount && (
                <p className="text-red-500 text-xs">{localErrors.sourceAccount}</p>
              )}
            </div>
          )}
          
          {/* To Account - For CASH_TO_BANK, BANK_TO_BANK, and ADJUST_BALANCE */}
          {(transactionType === 'CASH_TO_BANK' || transactionType === 'BANK_TO_BANK' || transactionType === 'ADJUST_BALANCE') && (
            <div className="space-y-2">
              <Label htmlFor="toAccount">To</Label>
              <Select 
                value={targetAccount} 
                onValueChange={setTargetAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts
                    .filter((account: any) => transactionType !== 'BANK_TO_BANK' || account.id !== sourceAccount)
                    .map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {formatAccountOption(account)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {localErrors.targetAccount && (
                <p className="text-red-500 text-xs">{localErrors.targetAccount}</p>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
              />
            </div>
            {localErrors.amount && (
              <p className="text-red-500 text-xs">{localErrors.amount}</p>
            )}
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Adjustment Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Add Description</Label>
            <Input
              id="description"
              placeholder="Enter transaction description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Save className="animate-spin h-4 w-4 mr-2"/> 
                Processing...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;