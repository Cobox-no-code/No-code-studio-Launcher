// redux/api/barcodeApi.ts

import {
    Barcode,
    BarcodeGenerationRequest,
    BarcodeGenerationResponse,
    BarcodeTemplate,
    Printer
} from '@/models/utility/barcode.model';
import { barcodeBaseApi } from './baseApis';

export const barcodeApi = barcodeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get barcode history
    getBarcodes: builder.query<Barcode[], void>({
      query: () => '/barcodes',
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Barcode' as const, id })),
              { type: 'Barcode', id: 'LIST' }
            ]
          : [{ type: 'Barcode', id: 'LIST' }]
    }),
    
    // Get available barcode templates
    getBarcodeTemplates: builder.query<BarcodeTemplate[], void>({
      query: () => '/barcode-templates',
      providesTags: [{ type: 'BarcodeTemplate', id: 'LIST' }]
    }),
    
    // Get available printers
    getPrinters: builder.query<Printer[], void>({
      query: () => '/printers',
      providesTags: [{ type: 'Printer', id: 'LIST' }]
    }),
    
    // Generate barcode
    generateBarcode: builder.mutation<BarcodeGenerationResponse, BarcodeGenerationRequest>({
      query: (data) => ({
        url: '/barcodes/generate',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Barcode', id: 'LIST' }]
    }),
    
    // Print barcode
    printBarcode: builder.mutation<{ success: boolean; message: string }, { id: string; printerId: string }>({
      query: (data) => ({
        url: '/barcodes/print',
        method: 'POST',
        body: data
      })
    }),
    
    // Delete barcode
    deleteBarcode: builder.mutation<void, string>({
      query: (id) => ({
        url: `/barcodes/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Barcode', id }]
    })
  }),
  overrideExisting: false,
});

export const {
  useGetBarcodesQuery,
  useGetBarcodeTemplatesQuery,
  useGetPrintersQuery,
  useGenerateBarcodeMutation,
  usePrintBarcodeMutation,
  useDeleteBarcodeMutation
} = barcodeApi;