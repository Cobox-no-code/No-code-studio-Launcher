// store/api/purchaseInvoiceApi.ts
import { PurchaseInvoice } from '@/models/purchase/purchasebill.model';
import { purchaseBaseApi } from './baseApis';

export const purchaseInvoiceApi = purchaseBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all purchase invoices with optional filters
    getPurchaseInvoices: builder.query<PurchaseInvoice[], { 
      supplierId?: string; 
      startDate?: string; 
      endDate?: string;
      purchaseType?: string;
    }>({
      query: (params) => {
        // Build query string from params
        const queryParams = new URLSearchParams();
        if (params?.supplierId) queryParams.append('supplierId', params.supplierId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.purchaseType) queryParams.append('purchaseType', params.purchaseType);
        
        const queryString = queryParams.toString();
        return `/purchase-invoice${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PurchaseInvoice' as const, id })),
              { type: 'PurchaseInvoice', id: 'LIST' }
            ]
          : [{ type: 'PurchaseInvoice', id: 'LIST' }]
    }),
    
    // Get single purchase invoice by ID
    getPurchaseInvoiceById: builder.query<PurchaseInvoice, string>({
      query: (id) => `/purchase-invoice/${id}`,
      providesTags: (result, error, id) => [{ type: 'PurchaseInvoice', id }]
    }),
    
    // Create new purchase invoice
    createPurchaseInvoice: builder.mutation<PurchaseInvoice, Omit<PurchaseInvoice, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/purchase-invoice',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'PurchaseInvoice', id: 'LIST' }]
    }),
    
    // Update purchase invoice
    updatePurchaseInvoice: builder.mutation<PurchaseInvoice, Partial<PurchaseInvoice> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/purchase-invoice/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseInvoice', id },
        { type: 'PurchaseInvoice', id: 'LIST' }
      ]
    }),
    
    // Delete purchase invoice
    deletePurchaseInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchase-invoice/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'PurchaseInvoice', id: 'LIST' }]
    })
  }),
  overrideExisting: false
});

export const {
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceByIdQuery,
  useCreatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation
} = purchaseInvoiceApi;