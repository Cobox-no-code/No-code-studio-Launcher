// ✅ Redux Slice for Quotations

import { Quotation } from '@/models/sale/quotation.model'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

interface QuotationState {
  quotations: Quotation[]
  loading: boolean
  error: string | null
}

const initialState: QuotationState = {
  quotations: [],
  loading: false,
  error: null,
}

export const fetchAllQuotations = createAsyncThunk(
  'quotation/fetchAll',
  async () => {
    const res = await axios.get<Quotation[]>('/api/sale/quotation')
    return res.data
  }
)

export const createNewQuotation = createAsyncThunk(
  'quotation/create',
  async (data: Partial<Quotation>) => {
    const res = await axios.post<Quotation>('/api/sale/quotation', data)
    return res.data
  }
)

export const updateQuotationById = createAsyncThunk(
  'quotation/update',
  async ({ id, data }: { id: string; data: Partial<Quotation> }) => {
    await axios.put(`/api/sale/quotation/${id}`, data)
    return { id, data }
  }
)

export const deleteQuotationById = createAsyncThunk(
  'quotation/delete',
  async (id: string) => {
    await axios.delete(`/api/sale/quotation/${id}`)
    return id
  }
)

const quotationSlice = createSlice({
  name: 'quotation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllQuotations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchAllQuotations.fulfilled,
        (state, action: PayloadAction<Quotation[]>) => {
          state.loading = false
          state.quotations = action.payload
        }
      )
      .addCase(fetchAllQuotations.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch quotations'
      })
      .addCase(
        createNewQuotation.fulfilled,
        (state, action: PayloadAction<Quotation>) => {
          state.quotations.push(action.payload)
        }
      )
      .addCase(updateQuotationById.fulfilled, (state, action) => {
        const index = state.quotations.findIndex(
          (q) => q.id === action.payload.id
        )
        if (index !== -1) {
          state.quotations[index] = {
            ...state.quotations[index],
            ...action.payload.data,
          }
        }
      })
      .addCase(
        deleteQuotationById.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.quotations = state.quotations.filter(
            (q) => q.id !== action.payload
          )
        }
      )
  },
})

export default quotationSlice.reducer
