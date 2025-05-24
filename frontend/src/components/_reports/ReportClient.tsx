"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BarChart } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";
import AllPartiesReport from "./AllParties";
import AllTransactionsReport from "./AllTransactionsReport";
import DayBookReport from "./DayBook";
import GSTR1Report from "./GSTR-1";
import GSTR2Report from "./GSTR-2";
import GSTRateReport from "./GSTRateReport";
import GSTReport from "./GSTReport";
import ItemSalesAnalysisPage from "./ItemAnalysis";
import LowStockAlertPage from "./LowStockReport";
import PartyStatementReport from "./PartyStatmentReport";
import PurchasesReport from "./PurchaseReport";
import SalesReport from "./SaleReport";
import StockDetailsPage from "./StockDetails";
import StockSummaryReport from "./StockSummary";
import { useAppSelector } from "@/redux/hooks";
import TaxReport from "./TaxesReport";
import TaxRateReport from "./TaxesRateReport";

export default function ReportPage() {
  const pathname = usePathname();

  const path = pathname.replace("/report", "").split("/").filter(Boolean);

  // Get the report type from the URL
  const reportType = path[0] || "dashboard";

  // Render the appropriate report component based on the URL
  const renderReportContent = () => {
    switch (reportType) {
      case "sales":
        return <SalesReport />;
      case "purchases":
        return <PurchasesReport />;
      case "day-book":
        return <DayBookReport />;
      case "all-transactions":
        return <AllTransactionsReport />;
      case "party-statement":
        return <PartyStatementReport />;
      case "all-parties":
        return <AllPartiesReport />;
      case "gstr-1":
        return <GSTR1Report />;
      case "gstr-2":
        return <GSTR2Report />;
      case "gst-analysis":
        return <GSTReport />;
      case "gst-rate":
        return <GSTRateReport />;
      case "tax-analysis":
        return <TaxReport />;
      case "tax-rate":
        return <TaxRateReport />;
      case "stock-summary":
        return <StockSummaryReport />;
      case "stock-details":
        return <StockDetailsPage />;
      case "item-sales":
        return <ItemSalesAnalysisPage />;
      case "low-stock":
        return <LowStockAlertPage />;
      default:
        return <ReportNotFound />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] w-full">
      <main className="flex-1 p-6 overflow-auto bg-gray-50 w-full">
        {renderReportContent()}
      </main>
    </div>
  );
}

interface ReportCardProps {
  title: string;
  icon: ReactNode;
  description: string;
  link: string;
}

const ReportNotFound = () => (
  <div className="h-full flex items-center justify-center">
    <Alert variant="destructive" className="max-w-md">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="mt-2">
        The requested report does not exist. Please select a valid report from
        the sidebar.
      </AlertDescription>
    </Alert>
  </div>
);
