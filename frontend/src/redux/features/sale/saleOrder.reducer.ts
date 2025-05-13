import { SaleOrder } from '@/models/sale/saleOrder.model'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
// 🔹 Slice State
interface SaleOrderState {
  orders: SaleOrder[]
  loading: boolean
  error: string | null
}

const initialState: SaleOrderState = {
  orders: [],
  loading: false,
  error: null,
}

// 🔹 Async Thunks

export const fetchAllSaleOrders = createAsyncThunk(
  'saleOrder/fetchAll',
  async () => {
    const res = await axios.get<SaleOrder[]>('/api/sale/order')
    return res.data
  }
)

export const createSaleOrder = createAsyncThunk(
  'saleOrder/create',
  async (data: Partial<SaleOrder>) => {
    const res = await axios.post<SaleOrder>('/api/sale/order', data)
    return res.data
  }
)

export const updateSaleOrder = createAsyncThunk(
  'saleOrder/update',
  async ({ id, data }: { id: string; data: Partial<SaleOrder> }) => {
    await axios.put(`/api/sale/order/${id}`, data)
    return { id, data }
  }
)

export const deleteSaleOrder = createAsyncThunk(
  'saleOrder/delete',
  async (id: string) => {
    await axios.delete(`/api/sale/order/${id}`)
    return id
  }
)

// 🔹 Slice
const saleOrderSlice = createSlice({
  name: 'saleOrder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSaleOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchAllSaleOrders.fulfilled,
        (state, action: PayloadAction<SaleOrder[]>) => {
          state.loading = false
          state.orders = action.payload
        }
      )
      .addCase(fetchAllSaleOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch sale orders'
      })
      .addCase(
        createSaleOrder.fulfilled,
        (state, action: PayloadAction<SaleOrder>) => {
          state.orders.push(action.payload)
        }
      )
      .addCase(updateSaleOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((o) => o.id === action.payload.id)
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload.data,
          }
        }
      })
      .addCase(
        deleteSaleOrder.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.orders = state.orders.filter((o) => o.id !== action.payload)
        }
      )
  },
})

export default saleOrderSlice.reducer
