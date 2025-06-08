"use client";

import React from "react";
import { format } from "date-fns";
import { useGetPaymentsQuery } from "@/redux/api/paymentApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HandCoinsIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from "lucide-react";
import { PaymentDirection } from "@/models/payment/payment.model";
import {
  useGetPurchaseInvoicesQuery,
  useGetSaleInvoicesQuery,
} from "@/redux/api/documentApi";
import { DocumentType, PaymentType } from "@/models/document/document.model";

const CashInHandPage = () => {
  // Fetch all payments (we'll filter for cash payments only)
  const {
    data: payments,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useGetPaymentsQuery({});
  const {
    data: saleInvoices,
    isLoading: isLoadingSales,
    isError: isSalesError,
    refetch: refetchSales,
  } = useGetSaleInvoicesQuery({});

  // Fetch purchase invoices
  const {
    data: purchaseInvoices,
    isLoading: isLoadingPurchases,
    isError: isPurchasesError,
    refetch: refetchPurchases,
  } = useGetPurchaseInvoicesQuery({});
  // Filter cash payments only
  const cashPayments =
    payments?.filter(
      (payment) => payment.paymentType.toLowerCase() === "cash"
    ) || [];

  // Calculate total cash in hand
  const calculateCashTotal = () => {
    let totalCash = 0;

    // Add/Subtract payment amounts
    cashPayments.forEach((payment) => {
      if (payment.direction === PaymentDirection.IN) {
        totalCash += payment.amount;
      } else {
        totalCash -= payment.amount;
      }
    });

    // Add paidAmount from sale invoices (cash coming in)
    (saleInvoices || []).forEach((invoice) => {
      if ((invoice.paymentType || "").toLowerCase() === "cash") {
        totalCash += invoice.paidAmount || 0;
      }
    });

    // Subtract paidAmount from purchase invoices (cash going out)
    (purchaseInvoices || []).forEach((invoice) => {
      if ((invoice.paymentType || "").toLowerCase() === "cash") {
        totalCash -= invoice.paidAmount || 0;
      }
    });

    return totalCash;
  };

  const totalCashInHand = calculateCashTotal();

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "₹ ");
  };

  // Combine and sort transactions for "All" tab
  const allTransactions = [
    // Cash-only Sales invoices
    ...(saleInvoices || [])
      .filter((invoice) => invoice.paymentType === PaymentType.CASH) // Only cash payments
      .map((invoice) => ({
        ...invoice,
        transactionType: "Sale",
        counterparty: invoice.partyName,
        amountReceived: invoice.paidAmount || 0,
        amountPaid: 0,
        date: invoice.documentDate,
        sourceType: "invoice",
      })),

    // Purchase invoices (unchanged)
    ...(purchaseInvoices || [])
      .filter((invoice) => invoice.paymentType === PaymentType.CASH)
      .map((invoice) => ({
        ...invoice,
        transactionType: "Purchase",
        counterparty: invoice.partyName,
        amountReceived: 0,
        amountPaid: invoice.paidAmount || 0,
        date: invoice.documentDate,
        sourceType: "invoice",
      })),

    // Payment transactions (unchanged unless you also want only cash payments here)
    ...(payments || []).map((payment) => ({
      ...payment,
      transactionType:
        payment.direction === PaymentDirection.IN
          ? "Payment In"
          : "Payment Out",
      documentNumber:
        payment.receiptNumber || `PMT-${payment.id.substring(0, 8)}`,
      counterparty: payment.partyName,
      total: payment.amount,
      amountReceived:
        payment.direction === PaymentDirection.IN ? payment.amount : 0,
      amountPaid:
        payment.direction === PaymentDirection.OUT ? payment.amount : 0,
      date: payment.paymentDate,
      sourceType: "payment",
    })),
  ].sort((a, b) => {
    // Sort by date descending (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Filter payments for the "Payments" tab
  const totalIn = allTransactions.reduce(
    (sum, txn) => sum + (txn.amountReceived || 0),
    0
  );
  const totalOut = allTransactions.reduce(
    (sum, txn) => sum + (txn.amountPaid || 0),
    0
  );
  const netBalance = totalIn - totalOut;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Cash in Hand</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Total Cash Summary Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <HandCoinsIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Cash in Hand
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalCashInHand)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <span>{allTransactions.length} Cash Transactions</span>
              </div>
              <div className="flex items-center">
                {netBalance > 0 ? (
                  <>
                    <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">
                      Positive Balance
                    </span>
                  </>
                ) : netBalance < 0 ? (
                  <>
                    <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-600">
                      Negative Balance
                    </span>
                  </>
                ) : (
                  <>
                    <MinusIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm font-medium text-gray-500">
                      Zero Balance
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cash Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <HandCoinsIcon className="h-5 w-5 mr-2 text-gray-400" />
              Cash Transactions
            </h2>
          </div>

          <div className="overflow-hidden">
            {isLoadingPayments ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : isPaymentsError ? (
              <div className="p-6">
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load cash transactions. Please try again.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allTransactions.length > 0 ? (
                      allTransactions.map((txn, index) => (
                        <tr
                          key={txn.id || `${txn.sourceType}-${index}`}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(txn.date), "dd/MM/yyyy")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {txn.documentNumber || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {txn.transactionType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {txn.counterparty.length>20 ? (
                              <span title={txn.counterparty}>
                                {txn.counterparty.slice(0, 20)}...  
                              </span>
                            ) : (
                              txn.counterparty
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {txn.amountReceived > 0 ? (
                              <span className="font-medium text-green-600">
                                +{formatCurrency(txn.amountReceived)}
                              </span>
                            ) : txn.amountPaid > 0 ? (
                              <span className="font-medium text-red-600">
                                -{formatCurrency(txn.amountPaid)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {txn.description || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12">
                          <div className="text-center">
                            <HandCoinsIcon className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              No transactions yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Transactions will appear here when recorded.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashInHandPage;
