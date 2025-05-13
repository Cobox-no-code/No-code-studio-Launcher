import { Unit } from '@/models/item/item.model';
import { baseApi } from './baseApis';

export const unitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all units
    getUnits: builder.query<Unit[], void>({
      query: () => '/units',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Unit' as const, id })),
              { type: 'Unit', id: 'LIST' }
            ]
          : [{ type: 'Unit', id: 'LIST' }]
    }),
    
    // Get single unit
    getUnitById: builder.query<Unit, string>({
      query: (id) => `/units/${id}`,
      providesTags: (result, error, id) => [{ type: 'Unit', id }]
    }),
    
    // Create new unit
    createUnit: builder.mutation<Unit, Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/units',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Unit', id: 'LIST' }]
    }),
    
    // Update unit
    updateUnit: builder.mutation<Unit, Partial<Unit> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/units/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Unit', id },
        { type: 'Unit', id: 'LIST' }
      ]
    }),
    
    // Delete unit
    deleteUnit: builder.mutation<void, string>({
      query: (id) => ({
        url: `/units/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Unit', id: 'LIST' }]
    })
  }),
  overrideExisting: false
});

export const {
  useGetUnitsQuery,
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation
} = unitsApi;
