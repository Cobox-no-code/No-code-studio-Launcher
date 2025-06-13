
// api/baseQuery.ts
import { cloud_url } from '@/backend.config';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/redux/store';
// ✅ Dynamic base query that uses Redux state
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const getFirmHeaders = () => {
  if (typeof window !== 'undefined') {
    const firmId = localStorage.getItem('firmId');
    return firmId ? { 'x-firm-id': firmId } : {};
  }
  return {};
};


export const createBaseQuery = (subPath: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const baseQuery = fetchBaseQuery({
    baseUrl: '', // Will be set dynamically
    prepareHeaders: (headers) => {
      const firmHeaders = getFirmHeaders();
      Object.entries(firmHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = state.sync.isEnabled ? cloud_url : 'http://localhost:4000/api';
    const rawArgs = typeof args === 'string' ? { url: args } : args;
    return baseQuery(
      { ...rawArgs, url: `${baseUrl}${subPath}${rawArgs.url ?? ''}` },
      api,
      extraOptions
    );
  };
};