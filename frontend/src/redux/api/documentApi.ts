// store/api/documentApi.ts
import { Document } from '@/models/document/document.model';
import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from './api.config';

// Create a base API with shared configuration
export const documentsBaseApi = createApi({
  reducerPath: 'documentsApi',
  baseQuery: createBaseQuery('/documents'),
  tagTypes: [
    'Document', 
    'SaleInvoice', 
    'SaleOrder', 
    'SaleReturn', 
    'SaleQuotation', 
    'DeliveryChallan',
    'PurchaseInvoice',
    'PurchaseOrder',
    'PurchaseReturn'
  ],
  endpoints: (builder) => ({
    // Generic document endpoints
    getDocuments: builder.query<Document[], { 
      documentType?: string;
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
      search?: string;
    }>({
      query: (params) => {
        // Build query string from params
        const queryParams = new URLSearchParams();
        if (params?.documentType) queryParams.append('documentType', params.documentType);
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);
        
        const queryString = queryParams.toString();
        return queryString ? `?${queryString}` : '';
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id, documentType }) => {
                // Map to specific document type tag
                const tagType = mapDocumentTypeToTag(documentType);
                return { type: tagType, id };
              }),
              { type: 'Document', id: 'LIST' }
            ]
          : [{ type: 'Document', id: 'LIST' }]
    }),
    
    // Get single document by ID
    getDocumentById: builder.query<Document, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => 
        result 
          ? [
              { type: 'Document', id },
              { type: mapDocumentTypeToTag(result.documentType), id }
            ]
          : [{ type: 'Document', id }]
    }),
    
    // Create new document
    createDocument: builder.mutation<Document, Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result) => 
        result 
          ? [
              { type: 'Document', id: 'LIST' },
              { type: mapDocumentTypeToTag(result.documentType), id: 'LIST' }
            ]
          : [{ type: 'Document', id: 'LIST' }]
    }),
    
    // Update document
    updateDocument: builder.mutation<Document, Partial<Document> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data
      }),
      
      invalidatesTags: (result, error, { id }) => 
        result 
          ? [
              { type: 'Document', id: 'LIST' },
              { type: mapDocumentTypeToTag(result.documentType), id: 'LIST' }
            ]
          : [{ type: 'Document', id: 'LIST' }]
    }),
    
    // Delete document
    deleteDocument: builder.mutation<void, { id: string, documentType: string }>({
      query: ({ id }) => ({
        url: `/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { id, documentType }) => [
        { type: 'Document', id: 'LIST' },
        { type: mapDocumentTypeToTag(documentType), id: 'LIST' }
      ]
    }),
    
    // Update document status
    updateDocumentStatus: builder.mutation<Document, { id: string, status: string }>({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: 'PUT',
        body: { status }
      }),
      invalidatesTags: (result, error, { id }) => 
        result 
          ? [
              { type: 'Document', id },
              { type: mapDocumentTypeToTag(result.documentType), id }
            ]
          : [{ type: 'Document', id }]
    }),

    // Type-specific convenience endpoints (these use the generic endpoints under the hood)
    
    // Sale Invoice endpoints
    getSaleInvoices: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
      transactionType?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'sale_invoice');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SaleInvoice' as const, id })),
              { type: 'SaleInvoice', id: 'LIST' }
            ]
          : [{ type: 'SaleInvoice', id: 'LIST' }]
    }),
    
    // Sale Order endpoints
    getSaleOrders: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'sale_order');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SaleOrder' as const, id })),
              { type: 'SaleOrder', id: 'LIST' }
            ]
          : [{ type: 'SaleOrder', id: 'LIST' }]
    }),
    
    // Sale Return endpoints
    getSaleReturns: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'sale_return');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SaleReturn' as const, id })),
              { type: 'SaleReturn', id: 'LIST' }
            ]
          : [{ type: 'SaleReturn', id: 'LIST' }]
    }),
    
    // Sale Quotation endpoints
    getSaleQuotations: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'sale_quotation');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SaleQuotation' as const, id })),
              { type: 'SaleQuotation', id: 'LIST' }
            ]
          : [{ type: 'SaleQuotation', id: 'LIST' }]
    }),
    
    // Delivery Challan endpoints
    getDeliveryChallans: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'delivery_challan');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'DeliveryChallan' as const, id })),
              { type: 'DeliveryChallan', id: 'LIST' }
            ]
          : [{ type: 'DeliveryChallan', id: 'LIST' }]
    }),
    
    // Purchase Invoice endpoints
    getPurchaseInvoices: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
      transactionType?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'purchase_invoice');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PurchaseInvoice' as const, id })),
              { type: 'PurchaseInvoice', id: 'LIST' }
            ]
          : [{ type: 'PurchaseInvoice', id: 'LIST' }]
    }),
    
    // Purchase Order endpoints
    getPurchaseOrders: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'purchase_order');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PurchaseOrder' as const, id })),
              { type: 'PurchaseOrder', id: 'LIST' }
            ]
          : [{ type: 'PurchaseOrder', id: 'LIST' }]
    }),
    
    // Purchase Return endpoints
    getPurchaseReturns: builder.query<Document[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      status?: string;
    }>({
      query: (params) => {
        // Add document type to params
        const queryParams = new URLSearchParams();
        queryParams.append('documentType', 'purchase_return');
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.status) queryParams.append('status', params.status);
        
        return `?${queryParams.toString()}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PurchaseReturn' as const, id })),
              { type: 'PurchaseReturn', id: 'LIST' }
            ]
          : [{ type: 'PurchaseReturn', id: 'LIST' }]
    })
  }),
});

// Helper function to map document type to tag type
function mapDocumentTypeToTag(documentType: string) {
  switch (documentType) {
    case 'sale_invoice':
      return 'SaleInvoice' as const;
    case 'sale_order':
      return 'SaleOrder' as const;
    case 'sale_return':
      return 'SaleReturn' as const;
    case 'sale_quotation':
      return 'SaleQuotation' as const;
    case 'delivery_challan':
      return 'DeliveryChallan' as const;
    case 'purchase_invoice':
      return 'PurchaseInvoice' as const;
    case 'purchase_order':
      return 'PurchaseOrder' as const;
    case 'purchase_return':
      return 'PurchaseReturn' as const;
    default:
      return 'Document' as const;
  }
}

// Export hooks
export const {
  // Generic document hooks
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useUpdateDocumentStatusMutation,
  
  // Type-specific convenience hooks
  useGetSaleInvoicesQuery,
  useGetSaleOrdersQuery,
  useGetSaleReturnsQuery,
  useGetSaleQuotationsQuery,
  useGetDeliveryChallansQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseReturnsQuery
} = documentsBaseApi;