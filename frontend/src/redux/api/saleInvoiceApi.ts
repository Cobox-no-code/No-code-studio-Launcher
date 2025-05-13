// store/api/saleInvoiceApi.ts
import { SaleInvoice } from '@/models/sale/saleInvoice';
import { salesBaseApi } from './baseApis';

export const saleInvoiceApi = salesBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all sale invoices with optional filters
    getSaleInvoices: builder.query<SaleInvoice[], { 
      customerId?: string; 
      startDate?: string; 
      endDate?: string;
      saleType?: string;
    }>({
      query: (params) => {
        // Build query string from params
        const queryParams = new URLSearchParams();
        if (params?.customerId) queryParams.append('customerId', params.customerId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.saleType) queryParams.append('saleType', params.saleType);
        
        const queryString = queryParams.toString();
        return `/sale-invoice${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SaleInvoice' as const, id })),
              { type: 'SaleInvoice', id: 'LIST' }
            ]
          : [{ type: 'SaleInvoice', id: 'LIST' }]
    }),
    
    // Get single sale invoice by ID
    getSaleInvoiceById: builder.query<SaleInvoice, string>({
      query: (id) => `/sale-invoice/${id}`,
      providesTags: (result, error, id) => [{ type: 'SaleInvoice', id }]
    }),
    
    // Create new sale invoice
    createSaleInvoice: builder.mutation<SaleInvoice, Omit<SaleInvoice, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/sale-invoice',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'SaleInvoice', id: 'LIST' }]
    }),
    
    // Update sale invoice
    updateSaleInvoice: builder.mutation<SaleInvoice, Partial<SaleInvoice> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/sale-invoice/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SaleInvoice', id },
        { type: 'SaleInvoice', id: 'LIST' }
      ]
    }),
    
    // Delete sale invoice
    deleteSaleInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sale-invoice/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'SaleInvoice', id: 'LIST' }]
    })
  }),
  overrideExisting: false
});

export const {
  useGetSaleInvoicesQuery,
  useGetSaleInvoiceByIdQuery,
  useCreateSaleInvoiceMutation,
  useUpdateSaleInvoiceMutation,
  useDeleteSaleInvoiceMutation
} = saleInvoiceApi;