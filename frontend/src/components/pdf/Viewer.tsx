import React, { useState } from 'react';
import { 
  ArrowLeft,
  FileText, 
  Receipt, 
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetDocumentByIdQuery } from '@/redux/api/documentApi';
import InvoicePrinter from './Regular';
import ThermalInvoicePrinter from './Thermal';
import { useGetBankAccountByIdQuery } from '@/redux/api/bankingApi';

const DocumentViewerPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('Id');
  const [invoiceTheme, setInvoiceTheme] = useState<'regular' | 'thermal'>('regular');
  
  // Company defaults - would come from your settings in a real app
  const businessName = localStorage.getItem('firmName')||'Your Business Name';
  const phoneNumber = localStorage.getItem('firmNumber')||'9752133459';
  const countryCode = localStorage.getItem('firmCountry')||'IN';
  // Fetch document data with proper skip logic
  const { data: document, isLoading, error } = useGetDocumentByIdQuery(
    documentId || '', 
    { skip: !documentId }
  );

  const { data: bankDetails, isLoading: isBankLoading } = useGetBankAccountByIdQuery(
    document?.bankId  || '', 
    
  );
  // Go back to documents list
  const handleBack = () => {
    router.push('/');
  };
  
  // Share document function
  const handleShareDocument = () => {
    if (!document) return;
    
    // Copy document link to clipboard
    const documentUrl = window.location.href;
    navigator.clipboard.writeText(documentUrl)
      .then(() => {
        alert('Document link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
      });
  };

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
            {document.documentType === 'sale_invoice' ? 'Invoice' : 'Document'} #{document.documentNumber}
          </h1>
          <p className="text-gray-500">
            {document.partyName} • {new Date(document.documentDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {/* Theme Selector */}
          <div className="flex items-center mr-4">
            <span className="text-sm mr-2">Document Format:</span>
            <Select
              value={invoiceTheme}
              onValueChange={(value: 'regular' | 'thermal') => setInvoiceTheme(value)}
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
          {invoiceTheme === 'regular' ? (
            <InvoicePrinter 
              document={document} 
              businessName={businessName}
              variant="outline"
              className="mr-2"
              bankDetails={bankDetails}
              countryCode={countryCode}
            />
          ) : (
            <ThermalInvoicePrinter
              document={document}
              businessName={businessName}
              phoneNumber={phoneNumber}
              variant="outline"
              className="mr-2"
            />
          )}
          
          <Button 
            variant="outline" 
            onClick={handleShareDocument}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Document Preview */}
      <Card className="mb-6">
        <CardContent className="p-6 overflow-auto bg-gray-50 flex justify-center">
          {invoiceTheme === 'regular' ? (
            // Preview area for regular document
            <div className="border bg-white shadow-sm" style={{ width: '210mm', minHeight: '297mm' }}>
              <div className="p-8">
                <div className="text-center font-bold text-xl mb-4">
                  {document.documentType === 'sale_invoice' ? 'Tax Invoice' : 
                   document.documentType === 'sale_quotation' ? 'Quotation' :
                   document.documentType === 'sale_order' ? 'Sales Order' :
                   document.documentType === 'purchase_invoice' ? 'Purchase Invoice' : 'Document'}
                </div>
                
                {/* Document Header */}
                <div className="border border-gray-300 p-2 mb-4">
                  <div className="text-lg font-bold">{businessName}</div>
                  <div className="text-sm">Document #: {document.documentNumber}</div>
                  <div className="text-right text-sm">Date: {new Date(document.documentDate).toLocaleDateString()}</div>
                </div>
                
                {/* Party Info */}
                <div className="flex mb-4">
                  <div className="w-1/2 border border-gray-300 p-2">
                    <div className="font-bold">{document.partyName}</div>
                    <div className="text-sm">Address: {document.billingAddress || ' '}</div>
                    <div className="text-sm">Contact No: {document.phone || ' '}</div>
                  </div>
                  <div className="w-1/2 border border-gray-300 p-2">
                    <div className="text-sm">Document No: {document.documentNumber}</div>
                    <div className="text-sm">Date: {new Date(document.documentDate).toLocaleDateString()}</div>
                  </div>
                </div>
                
                {/* Items Summary */}
                <div className="border border-gray-300 p-2 mb-4">
                  <div className="font-bold">Items: {document.items?.length || 0}</div>
                  <div className="text-sm">Total Amount: {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(Number(document.total))}</div>
                </div>
                
                {/* The rest of document is abridged in this preview */}
                <div className="text-center text-sm mt-8 text-gray-500">
                  ⟨ Preview Only - Click Print to see full document ⟩
                </div>
              </div>
            </div>
          ) : (
            // Preview area for thermal receipt
            <div className="border bg-white shadow-sm" style={{ width: '80mm', minHeight: '150mm' }}>
              <div className="p-4 text-center" style={{ fontFamily: 'monospace', fontSize: '10px' }}>
              
                <div className="border-t border-b border-dotted border-gray-300 my-3 py-1">
                  {document.documentType === 'sale_invoice' ? 'Tax Invoice' : 
                   document.documentType === 'sale_quotation' ? 'Quotation' :
                   document.documentType === 'sale_order' ? 'Sales Order' :
                   document.documentType === 'purchase_invoice' ? 'Purchase Invoice' : 'Document'}
                </div>
                
                <div className="flex justify-between text-left mb-3">
                  <div>{document.partyName}</div>
                  <div className="text-right">
                    <div>No: {document.documentNumber}</div>
                    <div>Date: {new Date(document.documentDate).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="border-t border-dotted border-gray-300 my-2"></div>
                
                <div className="text-left">
                  {document.items?.slice(0, 3).map((item, i) => (
                    <div key={i} className="mb-2">
                      <div className="font-bold">{i+1}. {item.itemName}</div>
                      <div className="flex justify-between">
                        <div>{Number(item.primaryQuantity)} {item.primaryUnitName} x {Number(item.pricePerUnit).toFixed(2)}</div>
                        <div>{Number(item.amount).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  {document.items && document.items.length > 3 && (
                    <div className="text-center text-xs mt-1">
                      +{document.items.length - 3} more items
                    </div>
                  )}
                </div>
                
                <div className="border-t border-dotted border-gray-300 my-2"></div>
                
                <div className="flex justify-between font-bold">
                  <div>Total:</div>
                  <div>{new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(Number(document.total))}</div>
                </div>
                
                <div className="text-center text-xs mt-8 text-gray-500">
                  ⟨ Preview Only - Click Print for full receipt ⟩
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
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
                <span>{new Date(document.documentDate).toLocaleDateString()}</span>
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
                <span>{new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR'
                }).format(Number(document.total) - (Number(document.taxAmount) || 0))}</span>
              </div>
              {document.taxAmount && Number(document.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span>{new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(Number(document.taxAmount))}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total:</span>
                <span>{new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR'
                }).format(Number(document.total))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Received:</span>
                <span>{new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR'
                }).format(Number(document.paidAmount))}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Balance:</span>
                <span className={Number(document.balanceAmount) > 0 ? "text-red-500" : "text-green-500"}>
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
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