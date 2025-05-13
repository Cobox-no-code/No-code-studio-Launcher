import { PaymentIn } from '@/models/sale/paymentIn.model'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

// 🔹 Slice State
interface PaymentInState {
  payments: PaymentIn[]
  loading: boolean
  error: string | null
}

const initialState: PaymentInState = {
  payments: [],
  loading: false,
  error: null,
}

// 🔹 Async Thunks

export const fetchAllPaymentsIn = createAsyncThunk(
  'paymentIn/fetchAll',
  async () => {
    const res = await axios.get<PaymentIn[]>('/api/sale/payment-in')
    return res.data
  }
)

export const createPaymentIn = createAsyncThunk(
  'paymentIn/create',
  async (data: Partial<PaymentIn>) => {
    const res = await axios.post<PaymentIn>('/api/sale/payment-in', data)
    return res.data
  }
)

export const updatePaymentIn = createAsyncThunk(
  'paymentIn/update',
  async ({ id, data }: { id: string; data: Partial<PaymentIn> }) => {
    await axios.put(`/api/sale/payment-in/${id}`, data)
    return { id, data }
  }
)

export const deletePaymentIn = createAsyncThunk(
  'paymentIn/delete',
  async (id: string) => {
    await axios.delete(`/api/sale/payment-in/${id}`)
    return id
  }
)

// 🔹 Slice
const paymentInSlice = createSlice({
  name: 'paymentIn',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPaymentsIn.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchAllPaymentsIn.fulfilled,
        (state, action: PayloadAction<PaymentIn[]>) => {
          state.loading = false
          state.payments = action.payload
        }
      )
      .addCase(fetchAllPaymentsIn.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch payments'
      })
      .addCase(
        createPaymentIn.fulfilled,
        (state, action: PayloadAction<PaymentIn>) => {
          state.payments.push(action.payload)
        }
      )
      .addCase(updatePaymentIn.fulfilled, (state, action) => {
        const index = state.payments.findIndex(
          (p) => p.id === action.payload.id
        )
        if (index !== -1) {
          state.payments[index] = {
            ...state.payments[index],
            ...action.payload.data,
          }
        }
      })
      .addCase(
        deletePaymentIn.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.payments = state.payments.filter((p) => p.id !== action.payload)
        }
      )
  },
})

export default paymentInSlice.reducer
