import { Item } from '@/models/item/item.model';
import { baseApi } from './baseApis';
export const itemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all items with optional filters
    getItems: builder.query<Item[], { type?: string; categoryId?: string }>({
      query: (params) => {
        // Build query string from params
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
        
        const queryString = queryParams.toString();
        return queryString ? `?${queryString}` : '';
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Item' as const, id })),
              { type: 'Item', id: 'LIST' }
            ]
          : [{ type: 'Item', id: 'LIST' }]
    }),
    
    // Get single item by ID
    getItemById: builder.query<Item, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Item', id }]
    }),
    
    // Create new item
    createItem: builder.mutation<Item, Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }]
    }),
    
    // Update existing item
    updateItem: builder.mutation<Item, Partial<Item> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Item', id },
        { type: 'Item', id: 'LIST' }
      ]
    }),
    
    // Delete item
    deleteItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }]
    })
  }),
  overrideExisting: false
});

export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation
} = itemsApi;
