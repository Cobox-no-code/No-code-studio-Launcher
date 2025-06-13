'use client';
import React, { useEffect } from 'react';
import ReportSidebar from '@/components/_reports/ReportSidebar';
import { useGetDocumentsQuery, useGetPurchaseInvoicesQuery, useGetSaleInvoicesQuery } from '@/redux/api/documentApi';
import { useGetPaymentsQuery } from '@/redux/api/paymentApi';
import { useGetPartiesQuery } from '@/redux/api/partiesApi';
import { useGetItemsQuery } from '@/redux/api';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  // Fetch sale invoices
  const {
    data: saleInvoices,
    isLoading: isLoadingSales,
    isError: isSalesError,
    refetch: refetchSales,
  } = useGetSaleInvoicesQuery({
 
  });
   const {
    data: documents,
 
    refetch: refetchDocuments,
  } = useGetDocumentsQuery({
 
  });
  
   const {
    data: parties,
 
    refetch: refetchPartis,
  } = useGetPartiesQuery({
 
  });
  
   const {
    data: items,
 
    refetch: refetchItems,
  } = useGetItemsQuery({
 
  });

  // Fetch purchase invoices
  const {
    data: purchaseInvoices,
    isLoading: isLoadingPurchases,
    isError: isPurchasesError,
    refetch: refetchPurchases,
  } = useGetPurchaseInvoicesQuery({
  
  });

  // Fetch payments
  const {
    data: payments,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = useGetPaymentsQuery({
  
  });
    useEffect(() => {
      // Immediately refetch data when component mounts
      refetchSales();
      refetchPurchases();
      refetchPayments();
      refetchDocuments()
      refetchItems()
      refetchPartis()
  
      // Set up interval for periodic refetching (every 5 seconds)
      const intervalId = setInterval(() => {
             refetchSales();
      refetchPurchases();
      refetchPayments();
      refetchDocuments()
      refetchItems()
      refetchPartis()
      }, 2000); // Adjust this time as needed
  
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }, [refetchSales, refetchPurchases, refetchPayments,refetchDocuments,refetchItems,refetchPartis]);
  return (
    <div className="w-full flex bg-primary text-black">
      <ReportSidebar />
      <div className="flex-grow ">
        {children}
      </div>
    </div>
  );
}
