'use client';

import {
  AlertCircle,
  Loader2,
  Printer,
  Save
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// UI Components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// Document Context
import { DocumentProvider, useDocument } from './Context';

// Document Components
import DocumentFooter from './DocumentFoooter';
import DocumentHeader from './DocumentHeader';
import DocumentItemsTable from './DocumentItemsTable';

// API Hooks
import {
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentByIdQuery,
  useUpdateDocumentMutation
} from '@/redux/api/documentApi';

// Document Types & Models
import { DocumentType } from '@/models/document/document.model';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

// Get document type information
const getDocumentInfo = (type: string) => {
  switch (type) {
    case 'sale_invoice':
      return { 
        type: DocumentType.SALE_INVOICE, 
        title: 'Sale Invoice',
        transactionType: 'sale',
        partyType: 'customer'
      };
    case 'sale_order':
      return { 
        type: DocumentType.SALE_ORDER, 
        title: 'Sale Order',
        transactionType: 'sale',
        partyType: 'customer'
      };
    case 'sale_return':
      return { 
        type: DocumentType.SALE_RETURN, 
        title: 'Sale Return',
        transactionType: 'sale',
        partyType: 'customer'
      };
    case 'sale_quotation':
      return { 
        type: DocumentType.SALE_QUOTATION, 
        title: 'Quotation',
        transactionType: 'sale',
        partyType: 'customer'
      };
    case 'delivery_challan':
      return { 
        type: DocumentType.DELIVERY_CHALLAN, 
        title: 'Delivery Challan',
        transactionType: 'sale',
        partyType: 'customer'
      };
    case 'purchase_invoice':
      return { 
        type: DocumentType.PURCHASE_INVOICE, 
        title: 'Purchase Invoice',
        transactionType: 'purchase',
        partyType: 'supplier'
      };
    case 'purchase_order':
      return { 
        type: DocumentType.PURCHASE_ORDER, 
        title: 'Purchase Order',
        transactionType: 'purchase',
        partyType: 'supplier'
      };
    case 'purchase_return':
      return { 
        type: DocumentType.PURCHASE_RETURN, 
        title: 'Purchase Return',
        transactionType: 'purchase',
        partyType: 'supplier'
      };
    default:
      return { 
        type: DocumentType.SALE_INVOICE, 
        title: 'Document',
        transactionType: 'sale',
        partyType: 'customer'
      };
  }
};

// Page Wrapper (handles context and document type)
const DocumentPage: React.FC = () => {
const router = useRouter();
const { type } = router.query;
const documentTypeSlug = type as string;
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const convertFrom = searchParams.get('convertFrom');
  
  // Determine the mode based on URL parameters
  // If convertFrom is present, we're converting an existing document to a new type
  let mode: 'create' | 'edit' | 'convert' = 'create';
  if (id && !convertFrom) {
    mode = 'edit';
  } else if (id && convertFrom) {
    mode = 'convert';
  }
  
  // Get document type information
  const documentInfo = getDocumentInfo(documentTypeSlug);
  
  return (
    <DocumentProvider 
      documentType={documentInfo.type} 
      mode={mode === 'convert' ? 'create' : mode} // Provider only accepts 'create' or 'edit'
    >
      <DocumentPageContent 
        title={documentInfo.title} 
        id={id} 
        documentInfo={documentInfo}
        mode={mode}
        convertFrom={convertFrom}
      />
    </DocumentProvider>
  );
};

// Content Component (uses document context)
const DocumentPageContent: React.FC<{
  title: string;
  id: string | null;
  documentInfo: ReturnType<typeof getDocumentInfo>;
  mode: 'create' | 'edit' | 'convert';
  convertFrom: string | null;
}> = ({ title, id, documentInfo, mode, convertFrom }) => {
  const router = useRouter();
  const { state, dispatch, calculateTotals, validateAll } = useDocument();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conversionTitle, setConversionTitle] = useState<string>('');
  
  // RTK Query hooks
  const { data: existingDocument, isLoading: isLoadingDocument } = useGetDocumentByIdQuery(
    id || '', 
    { skip: !id }
  );
  
  const [createDocument, { isLoading: isCreating }] = useCreateDocumentMutation();
  const [updateDocument, { isLoading: isUpdating }] = useUpdateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  // Initialize form with existing document if in edit or convert mode
  useEffect(() => {
    if (id && existingDocument) {
      if (mode === 'edit') {
        // Simply load the existing document for editing
        dispatch({ type: 'SET_DOCUMENT', payload: existingDocument });
      } else if (mode === 'convert') {
        // We're converting from another document type
        const sourceType = convertFrom ? getDocumentInfo(convertFrom).title : '';
        setConversionTitle(sourceType);
        
        // Create a new document based on the existing one, but with a new ID and type
        const convertedDocument = {
          ...existingDocument,
          id: uuidv4(), // Generate a new ID for the converted document
          documentType: documentInfo.type, // Set the new document type
          documentNumber: '', // Clear document number to generate a new one
          status: 'draft', // Reset status
          createdAt: new Date().toISOString(), // Update timestamps
          updatedAt: new Date().toISOString(),
          // Reference to original document
          convertedFrom: existingDocument.id,
          originalDocumentType: existingDocument.documentType,
          originalDocumentNumber: existingDocument.documentNumber
        };
        
        // Load the converted document into the form
        dispatch({ type: 'SET_DOCUMENT', payload: convertedDocument });
      }
    }
  }, [id, existingDocument, dispatch, mode, convertFrom, documentInfo.type]);
  
  // Submit handler
  const handleSubmit = async () => {
    // Validate all fields
    const errors = validateAll();
    
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
      
      // Show toast with first error
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }
    
    // Start submission
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    
    try {
      // Update document with final totals
      const totals = calculateTotals();
      const documentToSubmit = {
        ...state.document,

      };
      
      let result;
      
      if (mode === 'edit') {
        const { id, ...documentFields } = documentToSubmit;
        console.log('Updating document with ID:', id,documentFields);
        result = await updateDocument({
          id,
          ...documentFields
        }).unwrap();
        toast.success(`${title} updated successfully!`);
      } else {
        // Create new document (for both 'create' and 'convert' modes)
        result = await createDocument({...documentToSubmit,
          status: state.document.documentType
        }).unwrap();
        
        if (mode === 'convert') {
          // Handle the conversion status of the original document
          if (existingDocument && id) {
            // Determine what to do based on the source and target document types
            const sourceType = convertFrom || '';
            const targetType = documentInfo.type.toString();
            
      
              // For other document types, update the status to indicate conversion
              const conversionStatus = `converted_from_${sourceType}_to_${targetType}`;
              try {
                await updateDocument({
                  id,
                  status: conversionStatus
                }).unwrap();
              } catch (error:any) {
                toast.error(`Could not update original document status: ${error.message}`);
              }
            
          }
          
          toast.success(`${conversionTitle} converted to ${title} successfully!`);
        } else {
          toast.success(`${title} created successfully!`);
        }
      }
      
      // Navigate to the viewer page for the new/updated document
      router.push(`/viewer?Id=${result.id}`);
    } catch (error:any) {
      if(error.status === 409) {
        toast.error('Document number already exists!');
        setSubmitError('Document number already exists!');
      }
      setSubmitError(error.error || `Failed to save ${title.toLowerCase()}`);
      toast.error(`Failed to save: ${error.error || 'Unknown error'}`);
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };
  
  // Print handler
  const handlePrint = () => {
    // Implement print functionality
    toast.success('Printing functionality will be implemented');
  };
  
  // Toggle transaction type (cash vs credit)
  const toggleTransactionType = (isCredit: boolean) => {
    dispatch({
      type: 'UPDATE_FIELD',
      payload: { 
        field: 'transactionType', 
        value: isCredit ? 'credit' : 'cash' 
      }
    });
  };
  
  // Show loading state
  if ((mode === 'edit' || mode === 'convert') && isLoadingDocument) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-gray-600">Loading document...</p>
      </div>
    );
  }
  
  // Determine page title based on mode
  let pageTitle = `New ${title}`;
  if (mode === 'edit') {
    pageTitle = `Edit ${title}`;
  } else if (mode === 'convert') {
    pageTitle = `Convert to ${title}`;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-18 bg-white flex items-center justify-between px-6 border-b py-5 border-gray-200 shadow-sm">
        <h1 className="text-base font-semibold">
          {pageTitle}
          {mode === 'convert' && conversionTitle && (
            <span className="text-sm text-gray-500 ml-2">
              (from {conversionTitle} #{existingDocument?.documentNumber})
            </span>
          )}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <span className={`text-sm ${state.document.transactionType === 'cash' ? 'text-primary font-medium' : 'text-gray-500'}`}>
              Cash {documentInfo.transactionType === 'sale' ? 'Sale' : 'Purchase'}
            </span>
            <Switch
              checked={state.document.transactionType === 'credit'}
              onCheckedChange={(checked) => toggleTransactionType(checked)}
            />
            <span className={`text-sm ${state.document.transactionType === 'credit' ? 'text-primary font-medium' : 'text-gray-500'}`}>
              Credit {documentInfo.transactionType === 'sale' ? 'Sale' : 'Purchase'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Display any error message */}
      {submitError && (
        <Alert variant="destructive" className="mx-6 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex-grow overflow-auto bg-[#f3f3f3] p-6">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header Input Fields */}
          <DocumentHeader />
          
          {/* Items Table */}
          <DocumentItemsTable />
          
          {/* Footer Input Fields */}
          <DocumentFooter />
        </div>
      </div>
      
      {/* Bottom Buttons - Sticky */}
      <div className="sticky bottom-0 bg-white border-t p-4 px-6 flex justify-between gap-3 shadow-md">
     <Link href={'/'}><Button className=' cursor-pointer'>Back</Button></Link>   
       <div className=' flex gap-3 justify-end'>
        <Button 
          variant="outline" 
          onClick={handlePrint}
          className="gap-2 px-4"
        >
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={state.isSubmitting}
          className="gap-2 px-4"
        >
          {state.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === 'convert' ? 'Convert Document' : `Save ${title}`}
        </Button>
        </div> 
      </div>
    </div>
  );
};

export default DocumentPage;