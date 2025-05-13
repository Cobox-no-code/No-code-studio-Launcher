'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { openCreateForm } from '@/redux/slices/transactionFormSlice';
import { TransactionType } from '@/redux/slices/transactionFormSlice';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Calculator
} from 'lucide-react';

interface TransactionDropdownProps {
  selectedBankId?: string | null;
  label?: string;
}

const TransactionDropdown: React.FC<TransactionDropdownProps> = ({
  selectedBankId,
  label = "Deposit / Withdraw"
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleTransactionSelect = (type: TransactionType) => {
    // Only dispatch if we have a selected bank
    if (selectedBankId) {
      dispatch(openCreateForm(type));
      
      // Update the selectedBankId in the form data based on transaction type
      if (type === 'BANK_TO_CASH' || type === 'BANK_TO_BANK') {
        // For withdrawals and transfers, set bankAccountId (source account)
        dispatch({
          type: 'transactionForm/updateFormField',
          payload: { field: 'bankAccountId', value: selectedBankId }
        });
      } else if (type === 'CASH_TO_BANK') {
        // For deposits, set bankAccountId (target account)
        dispatch({
          type: 'transactionForm/updateFormField',
          payload: { field: 'bankAccountId', value: selectedBankId }
        });
      } else if (type === 'ADJUST_BALANCE') {
        // For balance adjustments, set bankAccountId
        dispatch({
          type: 'transactionForm/updateFormField',
          payload: { field: 'bankAccountId', value: selectedBankId }
        });
      }
    } else {
      // If no bank is selected, just show the transaction dialog
      // You might want to show an error or just open the form
      dispatch(openCreateForm(type));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2">
          {label} <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleTransactionSelect('BANK_TO_CASH')}>
          <ArrowUpRight className="mr-2 h-4 w-4 text-orange-500" />
          <span>Bank to Cash Transfer</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleTransactionSelect('CASH_TO_BANK')}>
          <ArrowDownLeft className="mr-2 h-4 w-4 text-green-500" />
          <span>Cash to Bank Transfer</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleTransactionSelect('BANK_TO_BANK')}>
          <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
          <span>Bank to Bank Transfer</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleTransactionSelect('ADJUST_BALANCE')}>
          <Calculator className="mr-2 h-4 w-4 text-purple-500" />
          <span>Adjust Bank Balance</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TransactionDropdown;