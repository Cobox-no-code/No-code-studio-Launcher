"use client";

import React from "react";
import { format } from "date-fns";
import { useGetPaymentsQuery } from "@/redux/api/paymentApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HandCoinsIcon, AlertCircleIcon, TrendingUpIcon } from "lucide-react";
import { PaymentDirection } from "@/models/payment/payment.model";

const CashInHandPage = () => {
  // Fetch all payments (we'll filter for cash payments only)
  const {
    data: payments,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useGetPaymentsQuery({});

  // Filter cash payments only
  const cashPayments =
    payments?.filter(
      (payment) => payment.paymentType.toLowerCase() === "cash"
    ) || [];

  // Calculate total cash in hand
  const calculateCashTotal = () => {
    let totalCash = 0;

    cashPayments.forEach((payment) => {
      if (payment.direction === PaymentDirection.IN) {
        totalCash += payment.amount;
      } else {
        totalCash -= payment.amount;
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

  // Sort cash payments by date (newest first)
  const sortedCashPayments = [...cashPayments].sort((a, b) => {
    return (
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  });

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
                <span>{cashPayments.length} Cash Transactions</span>
              </div>
              <div className="flex items-center">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-600">
                  Positive Balance
                </span>
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
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedCashPayments.length > 0 ? (
                      sortedCashPayments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(
                              new Date(payment.paymentDate),
                              "dd/MM/yyyy"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.receiptNumber ||
                              `PMT-${payment.id.substring(0, 8)}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.direction === PaymentDirection.IN ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Payment In
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Payment Out
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.partyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span
                              className={`font-medium ${
                                payment.direction === PaymentDirection.IN
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {payment.direction === PaymentDirection.IN
                                ? "+"
                                : "-"}
                              {formatCurrency(payment.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.referenceNumber || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.description || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12">
                          <div className="text-center">
                            <HandCoinsIcon className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              No cash transactions
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Cash payments will appear here when recorded.
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
