'use client';

import { openCreateForm as openBankForm } from '@/redux/slices/bankAccountFormSlice';
import { AppDispatch } from '@/redux/store';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// API Hooks
import {
  useGetBankAccountsQuery,
  useGetBankTransactionsQuery
} from '@/redux/api/bankingApi';

// Icons
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import TransactionDropdown from '@/components/Dropdown/TransactionDropdown';
import { BankTransactionType } from '@/models/banking/banking.model';

// Utility function to format currency
const formatCurrency = (amount: number | null) => {
  if (amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Utility function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const BankAccountPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // State for search and selected bank
  const [searchInput, setSearchInput] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [transactionSearch, setTransactionSearch] = useState('');
  
  // Fetch bank accounts
  const { 
    data: bankAccounts = [], 
    isLoading: isLoadingAccounts,
    isError: isAccountsError
  } = useGetBankAccountsQuery();
  
  // Only fetch transactions when a bank is selected
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useGetBankTransactionsQuery(
    { bankAccountId: selectedBankId || '' },
    { skip: !selectedBankId }
  );
  
  // Select the first bank initially
  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBankId) {
      setSelectedBankId(bankAccounts[0].id);
    }
  }, [bankAccounts, selectedBankId]);
  
  // Get the currently selected bank
  const selectedBank = bankAccounts.find(bank => bank.id === selectedBankId) || null;
  
  // Filter bank accounts based on search input
  const filteredBankAccounts = bankAccounts.filter(account => 
    account.displayName?.toLowerCase().includes(searchInput.toLowerCase())
  );
  
  // Filter transactions based on search input
  const filteredTransactions = transactions.filter(transaction => 
    transaction.transactionType?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(transactionSearch.toLowerCase())
  );
  
  // Handle adding a new bank account
  const handleAddBankAccount = () => {
    dispatch(openBankForm());
  };
  
  // Handle bank selection
  const handleSelectBank = (bankId: string) => {
    setSelectedBankId(bankId);
  };
 
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-semibold">Bank Accounts</h1>
      </header>
      
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left panel - Bank accounts list */}
        <Card className="w-1/3 max-w-md">
          <CardHeader className="px-4 py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Banks</CardTitle>
              <Button size="sm" onClick={handleAddBankAccount}>
                <Plus className="w-4 h-4 mr-1" /> Add Bank
              </Button>
            </div>
            
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search banks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
              {searchInput && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1.5 h-7 w-7"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-230px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Account</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAccounts ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                        Loading accounts...
                      </TableCell>
                    </TableRow>
                  ) : filteredBankAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                        {searchInput ? 'No matching accounts' : 'No bank accounts found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBankAccounts.map((account) => (
                      <TableRow 
                        key={account.id}
                        className={`cursor-pointer ${account.id === selectedBankId ? 'bg-slate-50' : ''}`}
                        onClick={() => handleSelectBank(account.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CreditCard className={`h-5 w-5 ${account.id === selectedBankId ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span>{account.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(account.currentBalance || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Right panel - Selected bank details and transactions */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Bank details card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">
                    {selectedBank?.displayName || 'Select a bank account'}
                  </CardTitle>
                  <CardDescription>
                    {selectedBank ? formatCurrency(selectedBank.currentBalance || 0) : 'No account selected'}
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <TransactionDropdown selectedBankId={selectedBankId} label="Add Transaction" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {selectedBank && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Account Holder</h3>
                    <p className="text-sm mt-1">{selectedBank.accountHolderName || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Account Number</h3>
                    <p className="text-sm mt-1">{selectedBank.accountNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">IFSC Code</h3>
                    <p className="text-sm mt-1">{selectedBank.ifscCode || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">UPI ID</h3>
                    <p className="text-sm mt-1">{selectedBank.upiId || 'Not specified'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Transactions card */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Transactions</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    className="pl-9"
                  />
                  {transactionSearch && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1.5 h-7 w-7"
                      onClick={() => setTransactionSearch('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[15%]">Date</TableHead>
                      <TableHead className="w-[20%]">Type</TableHead>
                      <TableHead className="w-[45%]">Description</TableHead>
                      <TableHead className="text-right w-[20%]">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedBankId ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Select a bank account to view transactions
                        </TableCell>
                      </TableRow>
                    ) : isLoadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Loading transactions...
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {transactionSearch ? 'No matching transactions' : 'No transactions found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}> 
                          <TableCell>
                            {formatDate(transaction.transactionDate)}
                          </TableCell>
                        
                          <TableCell>
                            <Badge
                              variant={
                                transaction.transactionType === BankTransactionType.DEPOSIT
                                  ? 'default'
                                  : transaction.transactionType === BankTransactionType.WITHDRAWAL
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className={`text-xs ${
                                transaction.transactionType === BankTransactionType.DEPOSIT
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : ''
                              }`}
                            >
                              {transaction.transactionType === BankTransactionType.DEPOSIT ? (
                                <ArrowDownLeft className="mr-1 h-3 w-3" />
                              ) : transaction.transactionType === BankTransactionType.WITHDRAWAL ? (
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                              ) : (
                                <RefreshCw className="mr-1 h-3 w-3" />
                              )}
                              {transaction.transactionType}
                            </Badge>
                          </TableCell>
                        
                          <TableCell>
                            {transaction.description}
                          </TableCell>
                        
                          <TableCell
                            className={`text-right ${
                              transaction.transactionType === BankTransactionType.DEPOSIT
                                ? 'text-green-600'
                                : transaction.transactionType === BankTransactionType.WITHDRAWAL
                                ? 'text-red-600'
                                : ''
                            }`}
                          >
                            {transaction.transactionType === BankTransactionType.DEPOSIT
                              ? '+ '
                              : transaction.transactionType === BankTransactionType.WITHDRAWAL
                              ? '- '
                              : ''}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BankAccountPage;