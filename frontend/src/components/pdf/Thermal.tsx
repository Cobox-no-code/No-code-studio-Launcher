import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';

interface ThermalPrinterProps {
  document: any; // Using any to accommodate different document types
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  businessName?: string;
  phoneNumber?: string;
}

// Helper to format currency
const formatCurrency = (amount: string | number | bigint) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

// Helper to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Helper to determine tax type
const getTaxType = (taxType: string) => {
  if (taxType && taxType.includes('GST@')) {
    return 'GST';
  } else if (taxType && taxType.includes('IGST@')) {
    return 'IGST';
  }
  return 'NONE';
};

// Helper to extract tax rate from tax type string
const getTaxRate = (taxType: string) => {
  if (!taxType) return 0;
  const match = taxType.match(/(\d+(\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
};

// Helper function to get document title
const getDocumentTitle = (documentType: string) => {
  switch (documentType) {
    case 'sale_invoice':
      return 'Tax Invoice';
    case 'sale_quotation':
      return 'Quotation';
    case 'sale_order':
      return 'Sales Order';
    case 'purchase_invoice':
      return 'Purchase Invoice';
    case 'purchase_order':
      return 'Purchase Order';
    case 'delivery_challan':
      return 'Delivery Challan';
    default:
      return 'Document';
  }
};

const ThermalPrinter: React.FC<ThermalPrinterProps> = ({
  document,
  variant = 'outline',
  size = 'sm',
  className = '',
  businessName = 'Your Business Name',
  phoneNumber = '9752133459'
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef
  });

  // Render the print button
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={()=>handlePrint()}
        className={className}
      >
        <Printer className="h-4 w-4 mr-2" />
        Print Thermal Receipt
      </Button>

      {/* Hidden content that will be printed */}
      <div style={{ display: 'none' }}>
        <div 
          ref={contentRef} 
          style={{ 
            width: '80mm', 
            fontSize: '10px',
            fontFamily: 'monospace',
            margin: '0 auto',
            padding: '8px',
            backgroundColor: 'white'
          }}
        >
          {/* Business Info */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold' }}>{businessName}</div>
            <div>Ph.No.: {phoneNumber}</div>
          </div>
          
          {/* Divider */}
          <div style={{ 
            borderTop: '1px dotted #aaa', 
            margin: '4px 0' 
          }}></div>
          
          {/* Document Title */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div>{getDocumentTitle(document.documentType)}</div>
          </div>
          
          {/* Customer and Document Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'left' }}>
              {document.partyName || 'Customer'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Date: {formatDate(document.documentDate)}</div>
              <div>Doc No.: {document.documentNumber}</div>
            </div>
          </div>
          
          {/* Divider */}
          <div style={{ 
            borderTop: '1px dotted #aaa', 
            margin: '4px 0' 
          }}></div>
          
          {/* Items Section */}
          <div style={{ marginBottom: '4px' }}>
            {document.items && document.items.map((item: any, index: number) => {
              // Get quantities
              const primaryQty = typeof item.primaryQuantity !== 'undefined' 
                ? item.primaryQuantity 
                : (item.qty || '0');
              const secondaryQty = item.secondaryQuantity || '0';
              
              return (
                <div key={index} style={{ marginBottom: '4px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {index + 1}. {item.itemName || item.item}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '9px'
                  }}>
                    <div>
                      {primaryQty} {item.primaryUnitName || item.unit} 
                      {secondaryQty !== '0' && secondaryQty !== 0 ? 
                        ` + ${secondaryQty} ${item.secondaryUnitName || ''}` : 
                        ''}
                      {" x "}
                      {typeof item.pricePerUnit === 'string' 
                        ? parseFloat(item.pricePerUnit).toFixed(2) 
                        : Number(item.pricePerUnit || 0).toFixed(2)}
                    </div>
                    <div>
                      {typeof item.amount === 'string' 
                        ? parseFloat(item.amount).toFixed(2) 
                        : Number(item.amount || 0).toFixed(2)}
                    </div>
                  </div>
                  {/* Show tax info if applicable */}
                  {(item.taxType && item.taxType !== 'None') || item.taxRate ? (
                    <div style={{ 
                      fontSize: '8px', 
                      fontStyle: 'italic',
                      textAlign: 'right' 
                    }}>
                      {getTaxType(item.taxType || '')}: {Number(item.taxRate || getTaxRate(item.taxType || ''))}%
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          
          {/* Divider */}
          <div style={{ 
            borderTop: '1px dotted #aaa', 
            margin: '4px 0' 
          }}></div>
          
          {/* Totals */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <div>Total</div>
              <div>{formatCurrency(document.total || 0)}</div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <div>Received</div>
              <div>{formatCurrency(document.paidAmount || 0)}</div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontWeight: 'bold'
            }}>
              <div>Balance</div>
              <div>{formatCurrency(document.balanceAmount || 0)}</div>
            </div>
          </div>
          
          {/* Tax Summary - Optional, can be removed for thermal receipts */}
          {document.taxAmount && Number(document.taxAmount) > 0 && (
            <>
              <div style={{ 
                borderTop: '1px dotted #aaa', 
                margin: '4px 0' 
              }}></div>
              <div style={{ fontSize: '8px', marginBottom: '4px' }}>
                <div style={{ fontWeight: 'bold' }}>Tax Summary:</div>
                {(() => {
                  // Calculate total CGST, SGST, and IGST if document has items
                  if (document.items && document.items.length > 0) {
                    const { totalCGST, totalSGST, totalIGST } = document.items.reduce(
                      (totals: any, item: any) => {
                        const taxAmount = typeof item.taxAmount === 'string'
                          ? parseFloat(item.taxAmount)
                          : Number(item.taxAmount || 0);
                        
                        if (getTaxType(item.taxType || '') === 'GST') {
                          totals.totalCGST += taxAmount / 2;
                          totals.totalSGST += taxAmount / 2;
                        } else if (getTaxType(item.taxType || '') === 'IGST') {
                          totals.totalIGST += taxAmount;
                        }
                        
                        return totals;
                      },
                      { totalCGST: 0, totalSGST: 0, totalIGST: 0 }
                    );
                    
                    return (
                      <div>
                        {totalCGST > 0 && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between'
                          }}>
                            <div>CGST:</div>
                            <div>{formatCurrency(totalCGST)}</div>
                          </div>
                        )}
                        {totalSGST > 0 && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between'
                          }}>
                            <div>SGST:</div>
                            <div>{formatCurrency(totalSGST)}</div>
                          </div>
                        )}
                        {totalIGST > 0 && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between'
                          }}>
                            <div>IGST:</div>
                            <div>{formatCurrency(totalIGST)}</div>
                          </div>
                        )}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          fontWeight: 'bold'
                        }}>
                          <div>Total Tax:</div>
                          <div>{formatCurrency(document.taxAmount || 0)}</div>
                        </div>
                      </div>
                    );
                  } else {
                    // If no items available, just show the total tax
                    return (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontWeight: 'bold'
                      }}>
                        <div>Total Tax:</div>
                        <div>{formatCurrency(document.taxAmount || 0)}</div>
                      </div>
                    );
                  }
                })()}
              </div>
            </>
          )}
          
          {/* Terms & Conditions */}
          <div style={{ 
            borderTop: '1px dotted #aaa', 
            margin: '4px 0',
            paddingTop: '4px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '9px' }}>Terms & Conditions</div>
            <div style={{ fontSize: '8px' }}>Thanks for doing business with us!</div>
          </div>
          
          {/* Add some blank space at the bottom to ensure proper printing */}
          <div style={{ height: '15mm' }}></div>
        </div>
      </div>
    </>
  );
};

export default ThermalPrinter;