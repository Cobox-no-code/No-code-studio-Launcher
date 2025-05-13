import { DeliveryChallan } from '@/models/sale/deliveryChallan.model'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

// 🔹 Slice State

interface DeliveryChallanState {
  challans: DeliveryChallan[]
  loading: boolean
  error: string | null
}

const initialState: DeliveryChallanState = {
  challans: [],
  loading: false,
  error: null,
}

// 🔹 Thunks

export const fetchAllDeliveryChallans = createAsyncThunk(
  'deliveryChallan/fetchAll',
  async () => {
    const res = await axios.get<DeliveryChallan[]>('/api/sale/delivery-challan')
    return res.data
  }
)

export const createDeliveryChallan = createAsyncThunk(
  'deliveryChallan/create',
  async (data: Partial<DeliveryChallan>) => {
    const res = await axios.post<DeliveryChallan>(
      '/api/sale/delivery-challan',
      data
    )
    return res.data
  }
)

export const updateDeliveryChallan = createAsyncThunk(
  'deliveryChallan/update',
  async ({ id, data }: { id: string; data: Partial<DeliveryChallan> }) => {
    await axios.put(`/api/sale/delivery-challan/${id}`, data)
    return { id, data }
  }
)

export const deleteDeliveryChallan = createAsyncThunk(
  'deliveryChallan/delete',
  async (id: string) => {
    await axios.delete(`/api/sale/delivery-challan/${id}`)
    return id
  }
)

// 🔹 Slice

const deliveryChallanSlice = createSlice({
  name: 'deliveryChallan',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDeliveryChallans.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchAllDeliveryChallans.fulfilled,
        (state, action: PayloadAction<DeliveryChallan[]>) => {
          state.loading = false
          state.challans = action.payload
        }
      )
      .addCase(fetchAllDeliveryChallans.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || 'Failed to fetch delivery challans'
      })
      .addCase(
        createDeliveryChallan.fulfilled,
        (state, action: PayloadAction<DeliveryChallan>) => {
          state.challans.push(action.payload)
        }
      )
      .addCase(updateDeliveryChallan.fulfilled, (state, action) => {
        const index = state.challans.findIndex(
          (c) => c.id === action.payload.id
        )
        if (index !== -1) {
          state.challans[index] = {
            ...state.challans[index],
            ...action.payload.data,
          }
        }
      })
      .addCase(
        deleteDeliveryChallan.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.challans = state.challans.filter((c) => c.id !== action.payload)
        }
      )
  },
})

export default deliveryChallanSlice.reducer
