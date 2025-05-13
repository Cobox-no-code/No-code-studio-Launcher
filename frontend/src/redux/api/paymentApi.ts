// redux/api/paymentApi.ts
import {
    CreatePaymentDTO,
    Payment,
    PaymentDirection,
    PaymentIn,
    PaymentOut,
    UpdatePaymentDTO
} from '@/models/payment/payment.model';
import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from './api.config';



// Payment API slice
export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: createBaseQuery('/payment'),
  tagTypes: ['Payment', 'PaymentIn', 'PaymentOut'],
  endpoints: (builder) => ({
    // Get all payments with optional filters
    getPayments: builder.query<Payment[], { 
      direction?: PaymentDirection;
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      paymentType?: string;
    }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.direction) queryParams.append('direction', params.direction);
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.paymentType) queryParams.append('paymentType', params.paymentType);
        
        const queryString = queryParams.toString();
        return `/${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Payment' as const, id })),
              { type: 'Payment', id: 'LIST' }
            ]
          : [{ type: 'Payment', id: 'LIST' }]
    }),
    
    // Get payment ins (convenience method)
    getPaymentIns: builder.query<PaymentIn[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      paymentType?: string;
    }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append('direction', PaymentDirection.IN);
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.paymentType) queryParams.append('paymentType', params.paymentType);
        
        const queryString = queryParams.toString();
        return `/?${queryString}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PaymentIn' as const, id })),
              { type: 'PaymentIn', id: 'LIST' }
            ]
          : [{ type: 'PaymentIn', id: 'LIST' }]
    }),
    
    // Get payment outs (convenience method)
    getPaymentOuts: builder.query<PaymentOut[], { 
      partyId?: string; 
      startDate?: string; 
      endDate?: string;
      paymentType?: string;
    }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append('direction', PaymentDirection.OUT);
        if (params?.partyId) queryParams.append('partyId', params.partyId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.paymentType) queryParams.append('paymentType', params.paymentType);
        
        const queryString = queryParams.toString();
        return `/?${queryString}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PaymentOut' as const, id })),
              { type: 'PaymentOut', id: 'LIST' }
            ]
          : [{ type: 'PaymentOut', id: 'LIST' }]
    }),
    
    // Get single payment by ID
    getPaymentById: builder.query<Payment, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Payment', id }]
    }),
    
    // Create new payment
    createPayment: builder.mutation<Payment, CreatePaymentDTO>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result) => {
        if (!result) return [{ type: 'Payment', id: 'LIST' }];
        
        const tags = [{ type: 'Payment', id: 'LIST' }];
        
        if (result.direction === PaymentDirection.IN) {
          tags.push({ type: 'PaymentIn', id: 'LIST' });
        } else {
          tags.push({ type: 'PaymentOut', id: 'LIST' });
        }
        
        return tags;
      }
    }),
    
    // Update payment
    updatePayment: builder.mutation<Payment, { id: string } & UpdatePaymentDTO>({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => {
        if (!result) return [{ type: 'Payment', id }];
        
        const tags = [
          { type: 'Payment', id },
          { type: 'Payment', id: 'LIST' }
        ];
        
        if (result.direction === PaymentDirection.IN) {
          tags.push({ type: 'PaymentIn', id });
          tags.push({ type: 'PaymentIn', id: 'LIST' });
        } else {
          tags.push({ type: 'PaymentOut', id });
          tags.push({ type: 'PaymentOut', id: 'LIST' });
        }
        
        return tags;
      }
    }),
    
    // Delete payment
    deletePayment: builder.mutation<void, { id: string, direction: PaymentDirection }>({
      query: ({ id }) => ({
        url: `/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { id, direction }) => {
        const tags = [
          { type: 'Payment', id },
          { type: 'Payment', id: 'LIST' }
        ];
        
        if (direction === PaymentDirection.IN) {
          tags.push({ type: 'PaymentIn', id: 'LIST' });
        } else {
          tags.push({ type: 'PaymentOut', id: 'LIST' });
        }
        
        return tags;
      }
    })
  })
});

export const {
  useGetPaymentsQuery,
  useGetPaymentInsQuery,
  useGetPaymentOutsQuery,
  useGetPaymentByIdQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation
} = paymentApi;