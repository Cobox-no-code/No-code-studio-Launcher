
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, FileText, Edit, Copy, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { v4 as uuidv4 } from "uuid";
// Import your existing DocumentPage components
import { DocumentProvider, useDocument } from './Context';
import DocumentFooter from './DocumentFoooter';
import DocumentHeader from './DocumentHeader';
import DocumentItemsTable from './DocumentItemsTable';
import { DocumentType } from '@/models/document/document.model';
import { useCreateItemMutation, useGetCategoriesQuery, useGetItemsQuery, useGetUnitConversionsQuery, useGetUnitsQuery, useUpdateItemMutation } from '@/redux/api';
import { useCreateDocumentMutation, useDeleteDocumentMutation, useGetDocumentByIdQuery, useUpdateDocumentMutation } from '@/redux/api/documentApi';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ItemType } from '@/models/item/item.model';

// Types
interface DocumentTab {
  id: string;
  title: string;
  documentType: string;
  mode: 'create' | 'edit' | 'convert';
  documentId?: string;
  convertFrom?: string;
  hasUnsavedChanges: boolean;
  isLoading?: boolean;
  persistedState: any; // Store the entire document context state
  lastModified: Date;
}
const TabStorageManager = {
  // Save tab data to localStorage
  saveTabData: (tabId: string, data: any) => {
    try {
      const key = `tab_${tabId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save tab data:', error);
    }
  },

  // Load tab data from localStorage
  loadTabData: (tabId: string) => {
    try {
      const key = `tab_${tabId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load tab data:', error);
      return null;
    }
  },

  // Remove tab data from localStorage
  removeTabData: (tabId: string) => {
    try {
      const key = `tab_${tabId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove tab data:', error);
    }
  },

  // Save all tabs metadata
  saveTabsMetadata: (tabs: DocumentTab[]) => {
    try {
      const tabsMetadata = tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        documentType: tab.documentType,
        mode: tab.mode,
        documentId: tab.documentId,
        convertFrom: tab.convertFrom,
        hasUnsavedChanges: tab.hasUnsavedChanges,
        lastModified: tab.lastModified
      }));
      localStorage.setItem('tabs_metadata', JSON.stringify(tabsMetadata));
      localStorage.setItem('active_tab_id', tabs.find(t => t.id)?.id || '');
    } catch (error) {
      console.error('Failed to save tabs metadata:', error);
    }
  },

  // Load all tabs metadata
  loadTabsMetadata: () => {
    try {
      const metadata = localStorage.getItem('tabs_metadata');
      const activeTabId = localStorage.getItem('active_tab_id');
      return {
        tabsMetadata: metadata ? JSON.parse(metadata) : [],
        activeTabId: activeTabId || null
      };
    } catch (error) {
      console.error('Failed to load tabs metadata:', error);
      return { tabsMetadata: [], activeTabId: null };
    }
  },

  // Clear all tab data
  clearAllTabData: () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('tab_'));
      keys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('tabs_metadata');
      localStorage.removeItem('active_tab_id');
    } catch (error) {
      console.error('Failed to clear tab data:', error);
    }
  }
};
// Document types configuration
const DOCUMENT_TYPES = [
  { key: 'sale_invoice', title: 'Sale Invoice', icon: '📄' },
  { key: 'purchase_invoice', title: 'Purchase Invoice', icon: '📋' },
  { key: 'sale_order', title: 'Sale Order', icon: '📝' },
  { key: 'purchase_order', title: 'Purchase Order', icon: '📊' },
  { key: 'sale_quotation', title: 'Quotation', icon: '💰' },
  { key: 'delivery_challan', title: 'Delivery Challan', icon: '🚛' },
  { key: 'sale_return', title: 'Sale Return', icon: '↩️' },
  { key: 'purchase_return', title: 'Purchase Return', icon: '↪️' },
];

// Get document type information
const getDocumentInfo = (type: string) => {
  switch (type) {
    case "sale_invoice":
      return {
        type: DocumentType.SALE_INVOICE,
        title: "Sale Invoice",
        transactionType: "sale",
        partyType: "customer",
      };
    case "sale_order":
      return {
        type: DocumentType.SALE_ORDER,
        title: "Sale Order",
        transactionType: "sale",
        partyType: "customer",
      };
    case "sale_return":
      return {
        type: DocumentType.SALE_RETURN,
        title: "Sale Return",
        transactionType: "sale",
        partyType: "customer",
      };
    case "sale_quotation":
      return {
        type: DocumentType.SALE_QUOTATION,
        title: "Quotation",
        transactionType: "sale",
        partyType: "customer",
      };
    case "delivery_challan":
      return {
        type: DocumentType.DELIVERY_CHALLAN,
        title: "Delivery Challan",
        transactionType: "sale",
        partyType: "customer",
      };
    case "purchase_invoice":
      return {
        type: DocumentType.PURCHASE_INVOICE,
        title: "Purchase Invoice",
        transactionType: "purchase",
        partyType: "supplier",
      };
    case "purchase_order":
      return {
        type: DocumentType.PURCHASE_ORDER,
        title: "Purchase Order",
        transactionType: "purchase",
        partyType: "supplier",
      };
    case "purchase_return":
      return {
        type: DocumentType.PURCHASE_RETURN,
        title: "Purchase Return",
        transactionType: "purchase",
        partyType: "supplier",
      };
    default:
      return {
        type: DocumentType.SALE_INVOICE,
        title: "Document",
        transactionType: "sale",
        partyType: "customer",
      };
  }
};

// Tab-aware DocumentPage wrapper
const TabDocumentPage: React.FC<{
  tab: DocumentTab;
  onStateChange: (tabId: string, state: any, hasChanges: boolean) => void;
  onLoadingChange: (tabId: string, isLoading: boolean) => void;
}> = ({ tab, onStateChange, onLoadingChange }) => {
    const router = useRouter();
  const { type } = router.query;
  const documentTypeSlug = type as string;
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const convertFrom = searchParams.get("convertFrom");

  // Determine the mode based on URL parameters
  // If convertFrom is present, we're converting an existing document to a new type
  let mode: "create" | "edit" | "convert" = "create";
  if (id && !convertFrom) {
    mode = "edit";
  } else if (id && convertFrom) {
    mode = "convert";}
  const documentInfo = getDocumentInfo(tab.documentType);



  return (
    <DocumentProvider
    
      documentType={documentInfo.type}
      mode={tab.mode === "convert" ? "create" : tab.mode}
      initialState={tab.persistedState} // Pass persisted state
    >
      <TabDocumentContent
        title={documentInfo.title}
        id={id}
        documentInfo={documentInfo}
        mode={mode}
        convertFrom={convertFrom}
        tab={tab}
     
        onStateChange={onStateChange}
        onLoadingChange={onLoadingChange}
      />
    </DocumentProvider>
  );
};

// Content component that uses document context
const TabDocumentContent: React.FC<{
  title: string;
  id: string | null;

  mode: "create" | "edit" | "convert";
  convertFrom: string | null;
  tab: DocumentTab;
  documentInfo: ReturnType<typeof getDocumentInfo>;
  onStateChange: (tabId: string, state: any, hasChanges: boolean) => void;
  onLoadingChange: (tabId: string, isLoading: boolean) => void;
}> = ({ tab, documentInfo, onStateChange, onLoadingChange ,title,id,mode,convertFrom}) => {
  const { state, dispatch, calculateTotals, validateAll } = useDocument();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
const [conversionTitle, setConversionTitle] = useState<string>("");
  const [isCreatingItems, setIsCreatingItems] = useState(false);

  // FIX 1: Add state for back warning modal
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Item creation mutations
  const [createItem] = useCreateItemMutation();
  const [updateItem] = useUpdateItemMutation();

  // Data fetching hooks
  const { data: existingItems } = useGetItemsQuery({});
  const { data: categories } = useGetCategoriesQuery();
  const { data: units } = useGetUnitsQuery();
  const { data: unitConversions } = useGetUnitConversionsQuery();

  // RTK Query hooks
  const { data: existingDocument, isLoading: isLoadingDocument } =
    useGetDocumentByIdQuery(id || "", { skip: !id });

  const [createDocument, { isLoading: isCreating }] =
    useCreateDocumentMutation();
  const [updateDocument, { isLoading: isUpdating }] =
    useUpdateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();



   // Function to create missing items before saving document
  const createMissingItems = async () => {
    if (!state.document.items || state.document.items.length === 0) {
      return [];
    }

    setIsCreatingItems(true);
    const createdItems = [];
    let itemsCreatedCount = 0;

    try {
      for (const documentItem of state.document.items) {
        // Skip if item already has an ID (already exists)
        if (documentItem.itemId) {
          continue;
        }

        // Skip if item name is empty
        if (!documentItem.itemName || documentItem.itemName.trim() === "") {
          continue;
        }

        // Check if item already exists by name
        const existingItem = existingItems?.find(
          (item) =>
            item.name.toLowerCase() === documentItem.itemName.toLowerCase()
        );

        if (existingItem) {
          // Item exists, update the document item with the existing item's ID
          documentItem.itemId = existingItem.id;
          continue;
        }

        // Create new item data
        const newItemData: any = {
          name: documentItem.itemName.trim(),
          type: ItemType.PRODUCT,
          hsnCode: documentItem.hsnCode || "",
          description: `Auto-created from ${title}`,
          unit_conversionId: documentItem.unit_conversionId,
          salePrice: Number(documentItem.pricePerUnit) || 0,
          salePriceTaxInclusive: documentItem.salePriceTaxInclusive,
          purchasePrice: Number(documentItem.pricePerUnit) || 0,
          purchasePriceTaxInclusive: documentItem.purchasePriceTaxInclusive,
          primaryOpeningQuantity: 0,
          secondaryOpeningQuantity: 0,
          pricePerUnit: Number(documentItem.pricePerUnit) || 0,
          wholesalePrice: Number(documentItem.wholesalePrice) || 0,
          wholesaleQuantity: Number(documentItem.wholesaleQuantity) || 0,
          taxRate: documentItem.taxType || "0",
        };

        try {
          // Create the item
          const createdItem = await createItem(newItemData).unwrap();

          // Update the document item with the new item's ID
          documentItem.itemId = createdItem.id;

          createdItems.push(createdItem);
          itemsCreatedCount++;

          // Show progress
          toast.success(`Created item: ${createdItem.name}`);
        } catch (error: any) {
          console.error("Failed to create item:", documentItem.itemName, error);
          toast.error(`Failed to create item: ${documentItem.itemName}`);
        }
      }

      if (itemsCreatedCount > 0) {
        toast.success(`Successfully created ${itemsCreatedCount} new items!`);
      }

      return createdItems;
    } catch (error: any) {
      console.error("Error creating missing items:", error);
      toast.error("Failed to create some items");
      return [];
    } finally {
      setIsCreatingItems(false);
    }
  };

  // Submit handler with item creation
  const handleSave = async () => {
    // Validate all fields first
    const errors = validateAll();

    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_VALIDATION_ERRORS", payload: errors });

      // Show toast with first error
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    // Start submission
    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      // Step 1: Create missing items before saving the document
      await createMissingItems();

      // Step 2: Update document with final totals
      const totals = calculateTotals();
      const documentToSubmit = {
        ...state.document,
      };

      let result;

      if (mode === "edit") {
        const { id, ...documentFields } = documentToSubmit;
        console.log("Updating document with ID:", id, documentFields);
        result = await updateDocument({
          id,
          ...documentFields,
        }).unwrap();
        toast.success(`${title} updated successfully!`);
      } else {
        // Create new document (for both 'create' and 'convert' modes)
        result = await createDocument({
          ...documentToSubmit,
          status: state.document.documentType,
        }).unwrap();

        if (mode === "convert") {
          // Handle the conversion status of the original document
          if (existingDocument && id) {
            // Determine what to do based on the source and target document types
            const sourceType = convertFrom || "";
            const targetType = documentInfo.type.toString();

            // For other document types, update the status to indicate conversion
            const conversionStatus = `converted_from_${sourceType}_to_${targetType}`;
            try {
              await updateDocument({
                id,
                status: conversionStatus,
              }).unwrap();
            } catch (error: any) {
              toast.error(
                `Could not update original document status: ${error.message}`
              );
            }
          }

          toast.success(
            `${conversionTitle} converted to ${title} successfully!`
          );
        } else {
          toast.success(`${title} created successfully!`);
        }
      }

      // Clear unsaved changes flag after successful save
      setHasUnsavedChanges(false);
      onStateChange(tab.id, state, false);
      // Navigate to the viewer page for the new/updated document
      router.push(`/viewer?Id=${result.id}`);
    } catch (error: any) {
      if (error.status === 409) {
        toast.error("Document number already exists!");
        setSubmitError("Document number already exists!");
      }
      setSubmitError(error.error || `Failed to save ${title.toLowerCase()}`);
      toast.error(`Failed to save: ${error.error || "Unknown error"}`);
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };
  // FIX 4: Handle back button with warning
  const handleBackClick = () => {
   
      setShowBackWarning(true);
    
  };

  const handleConfirmBack = () => {
    setShowBackWarning(false);
    router.push("/");
  };




  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = TabStorageManager.loadTabData(tab.id);
    if (savedData && !isInitialized) {
      // Restore the saved state
      dispatch({ type: "RESTORE_STATE", payload: savedData });
      setIsInitialized(true);
    }
  }, [tab.id, dispatch, isInitialized]);
  useEffect(() => {

      const timeoutId = setTimeout(() => {
        TabStorageManager.saveTabData(tab.id, state);
        
        const hasContent =
          state.document.partyName ||
          state.document.documentNumber ||
          (state.document.items?.length > 0 &&
            state.document.items.some(item => item.itemName || item.primaryQuantity|| item.conversionRate)) ||
          state.document.description;

        if (tab && tab.id) {
          onStateChange(tab.id, state, !!hasContent);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    
  }, [state, tab.id, onStateChange,]);
  // Handle save


  // FIX 2: Set default transaction type to credit and track changes
  useEffect(() => {
    // Set default transaction type to credit for new documents
    if (mode === "create" && !id) {
      dispatch({
        type: "UPDATE_FIELD",
        payload: {
          field: "transactionType",
          value: "credit", // Default to credit instead of cash
        },
      });
    }
  }, [mode, id, dispatch]);

  // FIX 3: Track unsaved changes
  useEffect(() => {
    // Check if there are unsaved changes
    const checkUnsavedChanges = () => {
    };

    checkUnsavedChanges();
  }, [state.document]);

  // Initialize form with existing document if in edit or convert mode
  useEffect(() => {
    if (id && existingDocument) {
      if (mode === "edit") {
        // Simply load the existing document for editing
        dispatch({ type: "SET_DOCUMENT", payload: existingDocument });
      } else if (mode === "convert") {
        // We're converting from another document type
        const sourceType = convertFrom
          ? getDocumentInfo(convertFrom).title
          : "";
        setConversionTitle(sourceType);

        // Create a new document based on the existing one, but with a new ID and type
        const convertedDocument = {
          ...existingDocument,
          id: uuidv4(), // Generate a new ID for the converted document
          documentType: documentInfo.type, // Set the new document type
          documentNumber: "", // Clear document number to generate a new one
          status: "draft", // Reset status
          createdAt: new Date().toISOString(), // Update timestamps
          updatedAt: new Date().toISOString(),
          // Reference to original document
          convertedFrom: existingDocument.id,
          originalDocumentType: existingDocument.documentType,
          originalDocumentNumber: existingDocument.documentNumber,
        };

        // Load the converted document into the form
        dispatch({ type: "SET_DOCUMENT", payload: convertedDocument });
      }
    }
  }, [id, existingDocument, dispatch, mode, convertFrom, documentInfo.type]);


    // Determine page title based on mode
  let pageTitle = `New ${title}`;
  if (mode === "edit") {
    pageTitle = `Edit ${title}`;
  } else if (mode === "convert") {
    pageTitle = `Convert to ${title}`;
  }
    // Show loading state
  if ((mode === "edit" || mode === "convert") && isLoadingDocument) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-gray-600">Loading document...</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-18 bg-white flex items-center justify-between px-6 border-b py-5 border-gray-200 shadow-sm">
        <h1 className="text-base font-semibold">
          {tab.mode === "edit" ? "Edit" : tab.mode === "convert" ? "Convert to" : "New"} {documentInfo.title}
          {tab.mode === "convert" && tab.convertFrom && (
            <span className="text-sm text-gray-500 ml-2">
              (from {getDocumentInfo(tab.convertFrom).title})
            </span>
          )}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${
                state.document.transactionType === "cash"
                  ? "text-primary font-medium"
                  : "text-gray-500"
              }`}
            >
              Cash {documentInfo.transactionType === "sale" ? "Sale" : "Purchase"}
            </span>
            <button
              onClick={() => {
                dispatch({
                  type: "UPDATE_FIELD",
                  payload: {
                    field: "transactionType",
                    value: state.document.transactionType === "credit" ? "cash" : "credit",
                  },
                });
              }}
              className="w-10 h-6 bg-gray-200 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  state.document.transactionType === "credit" ? "translate-x-4" : ""
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                state.document.transactionType === "credit"
                  ? "text-primary font-medium"
                  : "text-gray-500"
              }`}
            >
              Credit {documentInfo.transactionType === "sale" ? "Sale" : "Purchase"}
            </span>
          </div>
        </div>
      </div>

      {/* Display any error message */}
      {submitError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{submitError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-grow overflow-auto bg-[#f3f3f3] p-6">
        <div className="space-y-6 w-full px-10 mx-auto">
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
        <div>
          <Button
            variant="outline"
            className="gap-2 px-4"
            onClick={handleBackClick}
          >
            <X className="h-4 w-4" />
            Back
          </Button>
          {showBackWarning && (
            <AlertDialog open={showBackWarning} onOpenChange={()=>setShowBackWarning(!showBackWarning)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have unsaved changes. Are you sure you want to go back?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowBackWarning(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmBack}>
                    Go Back
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={state.isSubmitting}
            className="gap-2 px-4"
          >
            {state.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
           
            {state.isSubmitting ? "Saving..." : `Save ${documentInfo.title}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main DocumentClient component
const DocumentClient: React.FC = () => {
  const [tabs, setTabs] = useState<DocumentTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState<string | null>(null);
  const [tabCounter, setTabCounter] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
   const type = router.query.type as string || 'sale_invoice'; // Default to 'sale_invoice' if type is not provided
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
// Empty dependency array for cleanup on unmount
  // Generate unique tab ID
  const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create new tab
  const createNewTab = useCallback((
    documentType: string,
    mode: 'create' | 'edit' | 'convert' = 'create',
    documentId?: string,
    convertFrom?: string
  ) => {
    const docTypeInfo = DOCUMENT_TYPES.find(dt => dt.key === documentType);
    const title = docTypeInfo?.title || 'Document';
    
    const newTab: DocumentTab = {
      id: generateTabId(),
      title: `${title} ${tabCounter}`,
      documentType,
      mode,
      documentId,
      convertFrom,
      hasUnsavedChanges: false,
      isLoading: false,
      persistedState: {
        document: {
          transactionType: 'credit',
          items: [],
        },
        validationErrors: {},
        isSubmitting: false
      },
      lastModified: new Date()
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setTabCounter(prev => prev + 1);
  }, [tabCounter]);

  // Update tab state
  const handleTabStateChange = useCallback((tabId: string, state: any, hasChanges: boolean) => {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === tabId
          ? {
              ...tab,
              persistedState: state,
              hasUnsavedChanges: hasChanges,
              lastModified: new Date(),
            }
          : tab
      )
    );
  }, []);

  // Update tab loading state
  const handleTabLoadingChange = useCallback((tabId: string, isLoading: boolean) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? { ...tab, isLoading }
        : tab
    ));
  }, []);

  // Close tab - also remove from localStorage
  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    
    if (tab?.hasUnsavedChanges) {
      setShowCloseConfirm(tabId);
      return;
    }

    // Remove from localStorage
    TabStorageManager.removeTabData(tabId);

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        const currentIndex = prev.findIndex(t => t.id === tabId);
        const nextTab = newTabs[Math.max(0, currentIndex - 1)];
        setActiveTabId(nextTab.id);
      }
      return newTabs;
    });
  }, [tabs, activeTabId]);

  // Confirm close tab
  const confirmCloseTab = useCallback((tabId: string) => {
    // Remove from localStorage
    TabStorageManager.removeTabData(tabId);
    
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        const currentIndex = prev.findIndex(t => t.id === tabId);
        const nextTab = newTabs[Math.max(0, currentIndex - 1)];
        setActiveTabId(nextTab.id);
      }
      return newTabs;
    });
    setShowCloseConfirm(null);
  }, [activeTabId]);
useEffect(() => {
  // Cleanup function
  return () => {
    tabs.forEach(tab => {
      TabStorageManager.removeTabData(tab.id);
    });
    TabStorageManager.clearAllTabData();
  };
}, []);
// Add this useEffect after your other useEffects in DocumentClient component
useEffect(() => {
  if (tabs.length > 1) {
    const seen = new Set();
    const duplicateTabs = tabs.filter(tab => {
      const normalizedTitle = tab.title.toLowerCase();
      const isDuplicate = seen.has(normalizedTitle);
      seen.add(normalizedTitle);
      return isDuplicate;
    });

    if (duplicateTabs.length > 0) {
      // Remove duplicate tabs
      setTabs(prevTabs => {
        const uniqueTabs = prevTabs.filter(tab => {
          const normalizedTitle = tab.title.toLowerCase();
          const firstTabWithTitle = prevTabs.find(
            t => t.title.toLowerCase() === normalizedTitle
          );
          // Keep the tab if it's the first occurrence of this title
          return tab.id === firstTabWithTitle?.id;
        });
        return uniqueTabs;
      });

      // Update active tab if needed
      if (duplicateTabs.some(tab => tab.id === activeTabId)) {
        const remainingTab = tabs.find(
          tab => 
            tab.title.toLowerCase() === 
            tabs.find(t => t.id === activeTabId)?.title.toLowerCase() &&
            tab.id !== activeTabId
        );
        if (remainingTab) {
          setActiveTabId(remainingTab.id);
        }
      }

      // Clean up localStorage for removed tabs
      duplicateTabs.forEach(tab => {
        TabStorageManager.removeTabData(tab.id);
      });
    }
  }
}, [tabs, activeTabId]);

  // Load tabs from localStorage on component mount
  useEffect(() => {
    const { tabsMetadata, activeTabId: savedActiveTabId } = TabStorageManager.loadTabsMetadata();
    
    if (tabsMetadata.length > 0) {
      const restoredTabs = tabsMetadata.map(metadata => ({
        ...metadata,
        persistedState: null, // Will be loaded individually
        lastModified: new Date(metadata.lastModified)
      }));
      
      setTabs(restoredTabs);
      setActiveTabId(savedActiveTabId);
      setTabCounter(restoredTabs.length + 1);
    } else {
      if(tabs.length ===0) {
      // Create initial tab if no saved tabs
      createNewTab(type);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Save tabs metadata whenever tabs change
  useEffect(() => {
    if (isInitialized && tabs.length > 0) {
      TabStorageManager.saveTabsMetadata(tabs);
      if (activeTabId) {
        localStorage.setItem('active_tab_id', activeTabId);
      }
    }
  }, [tabs, activeTabId, isInitialized]);
  useEffect(() => {
  // Cleanup function
  return () => {
    tabs.forEach(tab => {
      TabStorageManager.removeTabData(tab.id);
    });
    TabStorageManager.clearAllTabData();
  };
}, []); 
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 flex items-center">
        <ScrollArea className="flex-1">
          <div className="flex items-center">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`
                  group flex items-center gap-2 px-4 py-3 border-r border-gray-200 cursor-pointer
                  min-w-[200px] max-w-[300px] relative
                  ${activeTabId === tab.id 
                    ? 'bg-blue-50 border-b-2 border-b-blue-500' 
                    : 'hover:bg-gray-50'
                  }
                `}
                onClick={() => setActiveTabId(tab.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {tab.title}
                    </span>
                    {tab.hasUnsavedChanges && (
                      <div className="h-2 w-2 bg-orange-400 rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

       {!id &&  <div className="flex-shrink-0 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {DOCUMENT_TYPES.map((docType) => (
                <DropdownMenuItem
                  key={docType.key}
                  onClick={() => createNewTab(docType.key)}
                >
                  <span className="mr-2">{docType.icon}</span>
                  {docType.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <TabDocumentPage
            key={activeTab.id}
            tab={activeTab }
            onStateChange={handleTabStateChange}
            onLoadingChange={handleTabLoadingChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No document open</p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!showCloseConfirm} onOpenChange={() => setShowCloseConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              This tab has unsaved changes that will be lost if you close it. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCloseConfirm(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showCloseConfirm && confirmCloseTab(showCloseConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Close Tab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentClient;