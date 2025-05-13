// src/redux/api/apiConfig.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Function to get firm headers from localStorage
const getFirmHeaders = () => {
  if (typeof window !== 'undefined') {
    const firmId = localStorage.getItem('firmId');
    return firmId ? { 'x-firm-id': firmId } : {};
  }
  return {};
};

// Factory function to create fetchBaseQuery with dynamic baseUrl
export const createBaseQuery = (subPath: string) =>
  fetchBaseQuery({
    baseUrl: `${API_BASE_URL}${subPath}`,
    prepareHeaders: (headers) => {
      const firmHeaders = getFirmHeaders();
      Object.entries(firmHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return headers;
    }
  });
