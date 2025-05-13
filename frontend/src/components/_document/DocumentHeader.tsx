'use client';

import {
    Calendar,
    CalendarDays,
    Clock,
    FileText,
    Hash,
    LoaderCircle,
    MapPin,
    Phone,
    Plus,
    Search,
    Truck,
    User,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDocument } from './Context';

// UI Components
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// API Hooks
import { useGetPartiesQuery } from '@/redux/api/partiesApi';
import { openCreateForm as openPartyCreateForm } from '@/redux/slices/partySlice';
import { useDispatch } from 'react-redux';
import { DocumentType } from '@/models/document/document.model';

const DocumentHeader: React.FC = () => {
  const { state, dispatch: docDispatch } = useDocument();
  const { document, validationErrors } = state;
  const reduxDispatch = useDispatch();
  
  // Local state
  const [partySearchTerm, setPartySearchTerm] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  
  // Determine if this is a sales or purchase document
  const isSalesDocument = document.documentType.toString().startsWith('sale') || 
                         document.documentType === DocumentType.DELIVERY_CHALLAN;
  
  // Party label (Customer or Supplier)
  const partyLabel = isSalesDocument ? 'Customer' : 'Supplier';
  
  // Use RTK Query to fetch parties
  const { 
    data: parties, 
    isLoading: partiesLoading, 
    error: partiesError 
  } = useGetPartiesQuery({ search: partySearchTerm });
  
  // Filter parties based on search term and party type
  const filteredParties = parties?.filter(party => {
    const matchesSearch = party.name.toLowerCase().includes(partySearchTerm.toLowerCase()) ||
      (party.phone && party.phone.includes(partySearchTerm));
    
    // Filter by group type (customers for sales, suppliers for purchases)
    const isCorrectType = isSalesDocument 
      ? party.groupId?.includes('customer') || !party.groupId // Include if no group
      : party.groupId?.includes('supplier') || !party.groupId; // Include if no group
    
    return matchesSearch && isCorrectType;
  }) || [];

  // Generate document number automatically if not set
  useEffect(() => {
    if (!document.documentNumber) {
      generateDocumentNumber();
    }
  }, [document.documentType]);

  // Simple document number generator
  const generateDocumentNumber = async () => {
    const prefix = getDocumentPrefix(document.documentType.toString());
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const documentNumber = `${prefix}/${year}${month}/${random}`;
    
    docDispatch({
      type: 'UPDATE_FIELD',
      payload: { field: 'documentNumber', value: documentNumber }
    });
  };

  // Get prefix for document number based on document type
  const getDocumentPrefix = (docType: string): string => {
    switch (docType) {
      case DocumentType.SALE_INVOICE:
        return 'INV';
      case DocumentType.SALE_ORDER:
        return 'SO';
      case DocumentType.SALE_RETURN:
        return 'SR';
      case DocumentType.SALE_QUOTATION:
        return 'QUO';
      case DocumentType.DELIVERY_CHALLAN:
        return 'DC';
      case DocumentType.PURCHASE_INVOICE:
        return 'PI';
      case DocumentType.PURCHASE_ORDER:
        return 'PO';
      case DocumentType.PURCHASE_RETURN:
        return 'PR';
      default:
        return 'DOC';
    }
  };

  // Party selection handler
  const handlePartySelect = (party: any) => {
    docDispatch({
      type: 'UPDATE_FIELD',
      payload: { field: 'partyId', value: party.id }
    });
    
    docDispatch({
      type: 'UPDATE_FIELD',
      payload: { field: 'partyName', value: party.name }
    });
    
    docDispatch({
      type: 'UPDATE_FIELD',
      payload: { field: 'phone', value: party.phone || '' }
    });
    
    docDispatch({
      type: 'UPDATE_FIELD',
      payload: { field: 'billingAddress', value: party.billingAddress || '' }
    });
    
    setShowPartyDropdown(false);
    setPartySearchTerm('');
  };

  // Handle adding a new party
  const handleAddNewParty = () => {
    reduxDispatch(openPartyCreateForm());
    setShowPartyDropdown(false);
  };

  return (
    <Card className="border shadow-sm mb-4">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          {getDocumentTypeTitle(document.documentType.toString())} Details
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - Party Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
                <User className="h-4 w-4 mr-1 text-primary" />
                {partyLabel} Information
              </h3>
              
              <div className="space-y-4">
                {/* Party Search Field */}
                <div className="relative">
                  <Label className="mb-1 text-xs font-medium flex items-center">
                    {partyLabel} <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={partySearchTerm}
                        onChange={(e) => {
                          setPartySearchTerm(e.target.value);
                          setShowPartyDropdown(true);
                        }}
                        onFocus={() => setShowPartyDropdown(true)}
                        className="pl-8 pr-3"
                        placeholder={`Search by name or phone`}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="ml-2" 
                      onClick={handleAddNewParty}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {validationErrors.partyName && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.partyName}</p>
                  )}
                  
                  {showPartyDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-gray-200 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {partiesLoading ? (
                        <div className="px-4 py-2 flex items-center justify-center">
                          <LoaderCircle className="h-4 w-4 mr-2 animate-spin text-primary" />
                          <span className="text-gray-500">Loading {partyLabel.toLowerCase()}s...</span>
                        </div>
                      ) : partiesError ? (
                        <div className="px-4 py-2">
                          <Alert variant="destructive" className="py-2">
                            <AlertDescription className="text-xs">
                              Error loading {partyLabel.toLowerCase()}s
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : filteredParties.length > 0 ? (
                        filteredParties.map((party) => (
                          <div
                            key={party.id}
                            className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                            onClick={() => handlePartySelect(party)}
                          >
                            <div className="font-medium flex items-center">
                              <User className="h-3 w-3 mr-1 text-primary" />
                              {party.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              {party.phone && (
                                <span className="flex items-center mr-2">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {party.phone}
                                </span>
                              )}
                              {party.gstNumber && (
                                <span className="flex items-center">
                                  <Hash className="h-3 w-3 mr-1" />
                                  GSTIN: {party.gstNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-center text-sm">
                          No {partyLabel.toLowerCase()}s found
                        </div>
                      )}
                      <div className="border-t border-gray-200 mt-1 pt-1 px-4 py-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-primary text-xs flex items-center justify-center"
                          onClick={handleAddNewParty}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add New {partyLabel}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Selected Party Display */}
                {document.partyName && (
                  <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Selected {partyLabel}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => {
                          docDispatch({
                            type: 'UPDATE_FIELD',
                            payload: { field: 'partyName', value: '' }
                          });
                          docDispatch({
                            type: 'UPDATE_FIELD',
                            payload: { field: 'partyId', value: '' }
                          });
                          docDispatch({
                            type: 'UPDATE_FIELD',
                            payload: { field: 'phone', value: '' }
                          });
                          docDispatch({
                            type: 'UPDATE_FIELD',
                            payload: { field: 'billingAddress', value: '' }
                          });
                        }}
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-primary mr-2" />
                      <span className="font-medium">{document.partyName}</span>
                    </div>
                    {document.phone && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {document.phone}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Billing Name Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Billing Name (Optional)
                  </Label>
                  <Input
                    value={document.billingName || ''}
                    onChange={(e) => 
                      docDispatch({
                        type: 'UPDATE_FIELD',
                        payload: { field: 'billingName', value: e.target.value }
                      })
                    }
                    placeholder="Enter billing name"
                  />
                </div>
                
                {/* Billing Address Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Billing Address
                  </Label>
                  <Input
                    value={document.billingAddress || ''}
                    onChange={(e) => 
                      docDispatch({
                        type: 'UPDATE_FIELD',
                        payload: { field: 'billingAddress', value: e.target.value }
                      })
                    }
                    placeholder="Enter billing address"
                    className="min-h-20"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle Column - Additional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
              <Truck className="h-4 w-4 mr-1 text-primary" />
              Shipping & Supply Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* E-way Bill Field */}
              <div>
                <Label className="text-xs font-medium mb-1 block">
                  E-way Bill Number
                </Label>
                <Input
                  value={document.ewaybill || ''}
                  onChange={(e) => 
                    docDispatch({
                      type: 'UPDATE_FIELD',
                      payload: { field: 'ewaybill', value: e.target.value }
                    })
                  }
                  placeholder="Enter e-way bill #"
                />
              </div>
              
              {/* State of Supply Field */}
              <div>
                <Label className="text-xs font-medium mb-1 block">
                  State of Supply
                </Label>
                <Input
                  value={document.stateOfSupply || ''}
                  onChange={(e) => 
                    docDispatch({
                      type: 'UPDATE_FIELD',
                      payload: { field: 'stateOfSupply', value: e.target.value }
                    })
                  }
                  placeholder="Enter state"
                />
              </div>
              
              {/* PO Number Field */}
              <div>
                <Label className="text-xs font-medium mb-1 block">
                  PO Number
                </Label>
                <Input
                  value={document.poNumber || ''}
                  onChange={(e) => 
                    docDispatch({
                      type: 'UPDATE_FIELD',
                      payload: { field: 'poNumber', value: e.target.value }
                    })
                  }
                  placeholder="Enter PO #"
                />
              </div>
              
              {/* PO Date Field */}
              <div>
                <Label className="text-xs font-medium mb-1 block flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  PO Date
                </Label>
                <Input
                  type="date"
                  value={document.poDate || ''}
                  onChange={(e) => 
                    docDispatch({
                      type: 'UPDATE_FIELD',
                      payload: { field: 'poDate', value: e.target.value }
                    })
                  }
                />
              </div>
            </div>
          </div>
          
          {/* Right Column - Document Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center mb-2 text-gray-700">
              <FileText className="h-4 w-4 mr-1 text-primary" />
              Document Details
            </h3>
            
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 space-y-4">
                {/* Document Number Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    Document Number <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    value={document.documentNumber || ''}
                    onChange={(e) => 
                      docDispatch({
                        type: 'UPDATE_FIELD',
                        payload: { field: 'documentNumber', value: e.target.value }
                      })
                    }
                    placeholder="Enter document number"
                    className="font-medium border-primary/20"
                  />
                  {validationErrors.documentNumber && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.documentNumber}</p>
                  )}
                </div>
                
                {/* Document Date Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Document Date <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={document.documentDate?.toString().split('T')[0] || ''}
                    onChange={(e) => 
                      docDispatch({
                        type: 'UPDATE_FIELD',
                        payload: { field: 'documentDate', value: e.target.value }
                      })
                    }
                    className="border-primary/20"
                  />
                  {validationErrors.documentDate && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.documentDate}</p>
                  )}
                </div>
                
                {/* Document Time Field */}
                <div>
                  <Label className="text-xs font-medium mb-1 block flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Document Time
                  </Label>
                  <Input
                    type="time"
                    value={document.documentTime || ''}
                    onChange={(e) => 
                      docDispatch({
                        type: 'UPDATE_FIELD',
                        payload: { field: 'documentTime', value: e.target.value }
                      })
                    }
                    className="border-primary/20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get document type title
function getDocumentTypeTitle(docType: string): string {
  switch (docType) {
    case DocumentType.SALE_INVOICE:
      return 'Sale Invoice';
    case DocumentType.SALE_ORDER:
      return 'Sale Order';
    case DocumentType.SALE_RETURN:
      return 'Sale Return';
    case DocumentType.SALE_QUOTATION:
      return 'Quotation';
    case DocumentType.DELIVERY_CHALLAN:
      return 'Delivery Challan';
    case DocumentType.PURCHASE_INVOICE:
      return 'Purchase Invoice';
    case DocumentType.PURCHASE_ORDER:
      return 'Purchase Order';
    case DocumentType.PURCHASE_RETURN:
      return 'Purchase Return';
    default:
      return 'Document';
  }
}

export default DocumentHeader;