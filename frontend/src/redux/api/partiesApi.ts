// store/api/partiesApi.ts
import { Group, Party } from '@/models/party/party.model';
import { partiesBaseApi } from './baseApis';

export const partiesApi = partiesBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all parties with optional filters
    getParties: builder.query<Party[], { groupId?: string; gstType?: string; search?: string }>({
      query: (params) => {
        // Build query string from params
        const queryParams = new URLSearchParams();
        if (params?.groupId) queryParams.append('groupId', params.groupId);
        if (params?.gstType) queryParams.append('gstType', params.gstType);
        if (params?.search) queryParams.append('search', params.search);
        
        const queryString = queryParams.toString();
        return `/${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Party' as const, id })),
              { type: 'Party', id: 'LIST' }
            ]
          : [{ type: 'Party', id: 'LIST' }]
    }),
    
    // Get single party by ID
    getPartyById: builder.query<Party, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Party', id }]
    }),
    
    // Create new party
    createParty: builder.mutation<Party, Omit<Party, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Party', id: 'LIST' }]
    }),
    
    // Update existing party
    updateParty: builder.mutation<Party, Partial<Party> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Party', id },
        { type: 'Party', id: 'LIST' }
      ]
    }),
    
    // Delete party
    deleteParty: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Party', id: 'LIST' }]
    }),
    
    // Groups endpoints
    
    // Get all groups
    getGroups: builder.query<Group[], void>({
      query: () => '/groups',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Group' as const, id })),
              { type: 'Group', id: 'LIST' }
            ]
          : [{ type: 'Group', id: 'LIST' }]
    }),
    
    // Get single group
    getGroupById: builder.query<Group, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (result, error, id) => [{ type: 'Group', id }]
    }),
    
    // Create new group
    createGroup: builder.mutation<Group, Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/groups',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }]
    }),
    
    // Update group
    updateGroup: builder.mutation<Group, Partial<Group> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/groups/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Group', id },
        { type: 'Group', id: 'LIST' }
      ]
    }),
    
    // Delete group
    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }]
    }),
  }),
  overrideExisting: false
});

export const {
  useGetPartiesQuery,
  useGetPartyByIdQuery,
  useCreatePartyMutation,
  useUpdatePartyMutation,
  useDeletePartyMutation,
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation
} = partiesApi;