import { BankAccount, BankTransaction, CreateBankAccountDTO, CreateBankTransactionDTO, UpdateBankAccountDTO } from '@/models/banking/banking.model';
import { bankingBaseApi } from './baseApis';

export const bankingApi = bankingBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Bank Accounts
    getBankAccounts: builder.query<BankAccount[], void>({
      query: () => '/accounts',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'BankAccount' as const, id })), { type: 'BankAccount', id: 'LIST' }]
          : [{ type: 'BankAccount', id: 'LIST' }],
    }),

    getBankAccountById: builder.query<BankAccount, string>({
      query: (id) => `/accounts/${id}`,
      providesTags: (result, error, id) => [{ type: 'BankAccount', id }],
    }),

    createBankAccount: builder.mutation<BankAccount, CreateBankAccountDTO>({
      query: (data) => ({
        url: '/accounts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'BankAccount', id: 'LIST' }],
    }),

    updateBankAccount: builder.mutation<BankAccount, { id: string } & UpdateBankAccountDTO>({
      query: ({ id, ...data }) => ({
        url: `/accounts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'BankAccount', id }, { type: 'BankAccount', id: 'LIST' }],
    }),

    deleteBankAccount: builder.mutation<void, string>({
      query: (id) => ({
        url: `/accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'BankAccount', id: 'LIST' }],
    }),

    // Bank Transactions
    getBankTransactions: builder.query<BankTransaction[], { bankAccountId?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.bankAccountId) queryParams.append('bankAccountId', params.bankAccountId);
        const queryString = queryParams.toString();
        return `/transactions${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'BankTransaction' as const, id })), { type: 'BankTransaction', id: 'LIST' }]
          : [{ type: 'BankTransaction', id: 'LIST' }],
    }),

    getBankTransactionById: builder.query<BankTransaction, string>({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: 'BankTransaction', id }],
    }),

    createBankTransaction: builder.mutation<BankTransaction, CreateBankTransactionDTO>({
      query: (data) => ({
        url: '/transactions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'BankTransaction', id: 'LIST' }],
    }),

    deleteBankTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'BankTransaction', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBankAccountsQuery,
  useGetBankAccountByIdQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
  useGetBankTransactionsQuery,
  useGetBankTransactionByIdQuery,
  useCreateBankTransactionMutation,
  useDeleteBankTransactionMutation,
} = bankingApi;
