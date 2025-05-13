import { Category } from '@/models/item/item.model';
import { baseApi } from './baseApis';

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST' }
            ]
          : [{ type: 'Category', id: 'LIST' }]
    }),
    
    // Get single category
    getCategoryById: builder.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }]
    }),
    
    // Create new category
    createCategory: builder.mutation<Category, Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/categories',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }]
    }),
    
    // Update category
    updateCategory: builder.mutation<Category, Partial<Category> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' }
      ]
    }),
    
    // Delete category
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }]
    })
  }),
  overrideExisting: false
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} = categoriesApi;