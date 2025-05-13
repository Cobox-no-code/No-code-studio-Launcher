import { UnitConversion } from '@/models/item/item.model';
import { baseApi } from './baseApis';

export const unitConversionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all unit conversions
    getUnitConversions: builder.query<UnitConversion[], void>({
      query: () => '/unit-conversions',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'UnitConversion' as const, id })),
              { type: 'UnitConversion', id: 'LIST' }
            ]
          : [{ type: 'UnitConversion', id: 'LIST' }]
    }),
    
    // Get a single unit conversion by ID
    getUnitConversionById: builder.query<UnitConversion, string>({
      query: (id) => `/unit-conversions/${id}`,
      providesTags: (result, error, id) => [{ type: 'UnitConversion', id }]
    }),
    
    // Get unit conversions for a specific unit
    getUnitConversionsByUnit: builder.query<UnitConversion[], string>({
      query: (unitId) => `/unit-conversions?unitId=${unitId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'UnitConversion' as const, id })),
              { type: 'UnitConversion', id: 'LIST' }
            ]
          : [{ type: 'UnitConversion', id: 'LIST' }]
    }),
    
    // Create new unit conversion
    createUnitConversion: builder.mutation<UnitConversion, Omit<UnitConversion, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/unit-conversions',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'UnitConversion', id: 'LIST' }]
    }),
    
    // Update unit conversion
    updateUnitConversion: builder.mutation<UnitConversion, Partial<UnitConversion> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/unit-conversions/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UnitConversion', id },
        { type: 'UnitConversion', id: 'LIST' }
      ]
    }),
    
    // Delete unit conversion
    deleteUnitConversion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/unit-conversions/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'UnitConversion', id: 'LIST' }]
    })
  }),
  overrideExisting: false
});

export const {
  useGetUnitConversionsQuery,
  useGetUnitConversionByIdQuery,
  useGetUnitConversionsByUnitQuery,
  useCreateUnitConversionMutation,
  useUpdateUnitConversionMutation,
  useDeleteUnitConversionMutation
} = unitConversionsApi;