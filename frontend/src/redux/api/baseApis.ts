import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from './api.config';
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: createBaseQuery('/items'),
  tagTypes: ['Item', 'Category', 'Unit', 'UnitConversion'],
  endpoints: () => ({}),
});

export const partiesBaseApi = createApi({
  reducerPath: 'partiesApi',
  baseQuery: createBaseQuery('/parties'),
  tagTypes: ['Party', 'Group'],
  endpoints: () => ({}),
});

export const salesBaseApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: createBaseQuery('/sale'),
  tagTypes: ['SaleInvoice'],
  endpoints: () => ({}),
});

export const bankingBaseApi = createApi({
  reducerPath: 'bankingApi',
  baseQuery: createBaseQuery('/banking'),
  tagTypes: ['BankAccount', 'BankTransaction'],
  endpoints: () => ({}),
});

export const barcodeBaseApi = createApi({
  reducerPath: 'barcodeApi',
  baseQuery: createBaseQuery('/barcode'),
  tagTypes: ['Barcode', 'BarcodeTemplate', 'Printer'],
  endpoints: () => ({}),
});

export const purchaseBaseApi = createApi({
  reducerPath: 'purchaseApi',
  baseQuery: createBaseQuery('/purchase'),
  tagTypes: ['PurchaseInvoice'],
  endpoints: () => ({}),
});