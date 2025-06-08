import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import html2canvas from "html2canvas";
import { API_BASE_URL } from "@/redux/api/api.config";
import { useGetBankAccountByIdQuery } from "@/redux/api/bankingApi";
import { useGetDocumentByIdQuery } from "@/redux/api/documentApi";
import axios from "axios";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Printer,
  Receipt,
  Send,
  Share2,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import InvoicePrinter from "./Regular";
import ThermalInvoicePrinter from "./Thermal";
import { Dialog, DialogContent } from "../ui/dialog";
import { on } from "events";

// QR Code Modal Component
const QRLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [qrCode, setQrCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const fetchQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/qr`);
      const data = await response.json();
      if (data?.qr) {
        setQrCode(data.qr);
        // Start checking login status
        checkLoginStatus();
      } else {
        toast.error("Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      toast.error("Failed to load QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const checkLoginStatus = async () => {
    setIsCheckingStatus(true);
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes with 2-second intervals

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`${API_BASE_URL}/qr`);
        const data = await response.json();

        if (!data?.qr) {
          // No QR code means logged in
          clearInterval(interval);
          setIsCheckingStatus(false);
          toast.success("WhatsApp logged in successfully!");
          onLoginSuccess();
          onClose();
        } else if (attempts >= maxAttempts) {
          // Timeout - stop checking
          clearInterval(interval);
          setIsCheckingStatus(false);
          toast.error("Login timeout. Please try again.");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsCheckingStatus(false);
        }
      }
    }, 2000); // Check every 2 seconds
  };

  useEffect(() => {
    if (isOpen) {
      fetchQRCode();
    } else {
      // Clear states when modal closes
      setQrCode(null);
      setIsCheckingStatus(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">WhatsApp Login</h2>
       
        </div>

        <div className="text-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Generating QR code...</p>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <div className="text-sm text-gray-600 space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">
                    📱 How to scan:
                  </p>
                  <ol className="text-left space-y-1 text-blue-700">
                    <li>1. Open WhatsApp on your phone</li>
                    <li>2. Tap the three dots (⋮) in the top right</li>
                    <li>3. Select "Linked devices"</li>
                    <li>4. Tap "Link a device"</li>
                    <li>5. Point your camera at this QR code</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="font-medium text-yellow-800 mb-1">
                    ⚠️ Troubleshooting:
                  </p>
                  <ul className="text-left space-y-1 text-yellow-700 text-xs">
                    <li>• Make sure you have a stable internet connection</li>
                    <li>• Ensure WhatsApp is updated to the latest version</li>
                    <li>• If it fails, close this dialog and try again</li>
                    <li>• QR code refreshes automatically every 30 seconds</li>
                  </ul>
                </div>
              </div>
              {isCheckingStatus && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">
                    Waiting for login...
                  </span>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={fetchQRCode}
                  className="flex-1"
                >
                  Refresh QR Code
                </Button>
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <p className="text-red-500 mb-4">Failed to load QR code</p>
              <Button onClick={fetchQRCode}>Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Phone Number Input Modal Component
const PhoneInputModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const validatePhoneNumber = (phone) => {
    // Basic validation for Indian phone numbers
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    if (!cleanPhone) {
      setError("Phone number is required");
      return;
    }

    if (!validatePhoneNumber(cleanPhone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setError("");
    onSubmit(cleanPhone);
  };

  const handleClose = () => {
    setPhoneNumber("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Enter Phone Number</h2>
       
        </div>

        <div onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex mt-1">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="rounded-l-none"
                maxLength={10}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DocumentViewerPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("Id");
  const [invoiceTheme, setInvoiceTheme] = useState<"regular" | "thermal">(
    "regular"
  );
  const [firm, setFirm] = useState<any>(null);
  const [isWhatsAppLoggedIn, setIsWhatsAppLoggedIn] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isSendingPDF, setIsSendingPDF] = useState(false);
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
    refetch,
  } = useGetDocumentByIdQuery(documentId || "", { skip: !documentId });

  const {
    data: bankDetails,
    isLoading: isBankLoading,
    refetch: refetchBank,
  } = useGetBankAccountByIdQuery(document?.bankId || "");

  // Go back to documents list
  const handleBack = () => {
    router.push("/");
  };

  // Check WhatsApp login status
  const checkWhatsAppLoginStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/qr`);
      const data = await response.json();
      setIsWhatsAppLoggedIn(!data?.qr);
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      setIsWhatsAppLoggedIn(false);
    }
  };

  // Handle WhatsApp login
  const handleLogin = async () => {
    if (!document) {
      toast.error("Document not loaded");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/qr`);
      const data = await response.json();

      if (data?.qr) {
        // Not logged in yet, show QR modal
        setShowQRModal(true);
      } else {
        // Already logged in
        setIsWhatsAppLoggedIn(true);
        toast.success("WhatsApp is already logged in!");
      }
    } catch (error: any) {
      console.error("❌ Error checking login status:", error);
      toast.error("Failed to check WhatsApp login status");
    }
  };

  const generateAndSendPDF = async (phoneNum: string) => {
    if (!document || !contentRef.current) {
      toast.error("Document not ready for sharing");
      return;
    }

    setIsSendingPDF(true);

    try {
      const element = contentRef.current;

      const formData = {
        number: phoneNum,
        invoice: document,
        html: element.outerHTML,
      };

      const response = await axios.post(`${API_BASE_URL}/send-pdf`, formData);

      if (response.status && response.status === 200) {
        const data = response.data;
        if (data.error) {
          throw new Error(data.error);
        }

        toast.success(`PDF sent successfully to +91${phoneNum}`);
        setShowPhoneModal(false);
      } else {
        throw new Error(response.data.message || "Failed to send PDF");
      }
    } catch (error: any) {
      console.error("❌ Error sending PDF:", error);
      toast.error("Failed to send PDF: " + (error.message || "Unknown error"));
    } finally {
      setIsSendingPDF(false);
    }
  };

  // Handle share document
  const handleShareDocument = async () => {
    if (!document) {
      toast.error("Document not loaded");
      return;
    }

    // Check if WhatsApp is logged in
    if (!isWhatsAppLoggedIn) {
      await handleLogin();
      return;
    }

    // Check if document has phone number
    if (document.phone) {
      // Use document phone number
      await generateAndSendPDF(document.phone);
    } else {
      // Show phone input modal
      setShowPhoneModal(true);
    }
  };

  // Handle phone number submission
  const handlePhoneSubmit = async (phoneNum: string) => {
    await generateAndSendPDF(phoneNum);
  };

  // Handle QR login success
  const handleLoginSuccess = () => {
    setIsWhatsAppLoggedIn(true);
    setShowQRModal(false);
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

  useEffect(() => {
    // Check WhatsApp login status on component mount
    checkWhatsAppLoginStatus();

    // Immediately refetch data when component mounts
    refetch();
    refetchBank();

    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetch();
    }, 5000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch, refetchBank]);

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
            {businessName} •{" "}
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
          <Button
            variant={"outline"}
            size={"sm"}
            onClick={() => handlePrint()}
            className={"mr-2"}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Document
          </Button>

          <Button
            variant="outline"
            onClick={handleShareDocument}
            disabled={isSendingPDF}
          >
            {isSendingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                WhatsApp Share
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Document Display */}
      {invoiceTheme === "regular" ? (
        <InvoicePrinter
          document={document}
          bankDetails={document.bankId ? bankDetails : null}
          businessName={businessName}
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

      {/* Modals */}
      <QRLoginModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <PhoneInputModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handlePhoneSubmit}
        isLoading={isSendingPDF}
      />
    </div>
  );
};

export default DocumentViewerPage;
