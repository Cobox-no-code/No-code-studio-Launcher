import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, Printer, Receipt, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetDocumentByIdQuery } from "@/redux/api/documentApi";
import InvoicePrinter from "./Regular";
import ThermalInvoicePrinter from "./Thermal";
import { useGetBankAccountByIdQuery } from "@/redux/api/bankingApi";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import { API_BASE_URL } from "@/redux/api/api.config";
import toast from "react-hot-toast";

const DocumentViewerPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("Id");
  const [invoiceTheme, setInvoiceTheme] = useState<"regular" | "thermal">(
    "regular"
  );
  const [firm, setFirm] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: contentRef });

  // Company defaults - would come from your settings in a real app
  const businessName = localStorage.getItem("firmName") || "Your Business Name";
  const phoneNumber = localStorage.getItem("firmNumber") || "9752133459";
  const countryCode = localStorage.getItem("firmCountry") || "IN";
  const firmId = localStorage.getItem("firmId") || "";
  // Fetch document data with proper skip logic
  const {
    data: document,
    isLoading,
    error,
  } = useGetDocumentByIdQuery(documentId || "", { skip: !documentId });

  const { data: bankDetails, isLoading: isBankLoading } =
    useGetBankAccountByIdQuery(document?.bankId || "");
  // Go back to documents list
  const handleBack = () => {
    router.push("/");
  };

  // Share document function
  const handleShareDocument = () => {
    if (!document) return;

    // Copy document link to clipboard
    const documentUrl = window.location.href;
    navigator.clipboard
      .writeText(documentUrl)
      .then(() => {
        alert("Document link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
      });
  };

  useEffect(() => {
    if (firmId) {
      axios
        .get(`${API_BASE_URL}/firms/${firmId}`)
        .then((res) => {
          setFirm(res.data);
        })
        .catch(() => toast.error("Failed to load firm data"));
    }
  }, [firmId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading document...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-lg text-red-500 mb-4">
          Failed to load document. Please try again.
        </div>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {document.documentType === "sale_invoice" ? "Invoice" : "Document"}{" "}
            #{document.documentNumber}
          </h1>
          <p className="text-gray-500">
            {document.billingName ? document.billingName : businessName} •{" "}
            {new Date(document.documentDate).toLocaleDateString()}•{" "}
            {document.documentTime}
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {/* Theme Selector */}
          <div className="flex items-center mr-4">
            <span className="text-sm mr-2">Document Format:</span>
            <Select
              value={invoiceTheme}
              onValueChange={(value: "regular" | "thermal") =>
                setInvoiceTheme(value)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Regular A4
                  </div>
                </SelectItem>
                <SelectItem value="thermal">
                  <div className="flex items-center">
                    <Receipt className="h-4 w-4 mr-2" />
                    Thermal Receipt
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          {invoiceTheme === "regular" ? (
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() => handlePrint()}
              className={"mr-2"}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Document
            </Button>
          ) : (
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() => handlePrint()}
              className={"mr-2"}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Document
            </Button>
          )}

          <Button variant="outline" onClick={handleShareDocument}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {invoiceTheme === "regular" ? (
        <InvoicePrinter
          document={document}
          bankDetails={document.bankId ? bankDetails : null}
          businessName={
            document.billingName ? document.billingName : businessName
          }
          contentRef={contentRef}
          countryCode={countryCode}
          firmData={firm}
        />
      ) : (
        <ThermalInvoicePrinter
          document={document}
          businessName={businessName}
          phoneNumber={phoneNumber}
          contentRef={contentRef}
          firmData={firm}
        />
      )}

      {/* Document Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Document Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Document Number:</span>
                <span>{document.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Document Date:</span>
                <span>
                  {new Date(document.documentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Party Name:</span>
                <span>{document.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction Type:</span>
                <span className="capitalize">{document.transactionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Type:</span>
                <span className="capitalize">{document.paymentType}</span>
              </div>
              {document.ewaybill && (
                <div className="flex justify-between">
                  <span className="text-gray-500">E-way Bill:</span>
                  <span>{document.ewaybill}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(
                    Number(document.total) - (Number(document.taxAmount) || 0)
                  )}
                </span>
              </div>
              {document.taxAmount && Number(document.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(Number(document.taxAmount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total:</span>
                <span>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(Number(document.total))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Received:</span>
                <span>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(Number(document.paidAmount))}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Balance:</span>
                <span
                  className={
                    Number(document.balanceAmount) > 0
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(Number(document.balanceAmount))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentViewerPage;
