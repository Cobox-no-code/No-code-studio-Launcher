import { CreditNote } from '@/models/sale/creditNote.model'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

// 🔹 Slice State

interface CreditNoteState {
  notes: CreditNote[]
  loading: boolean
  error: string | null
}

const initialState: CreditNoteState = {
  notes: [],
  loading: false,
  error: null,
}

// 🔹 Async Thunks

export const fetchAllCreditNotes = createAsyncThunk(
  'creditNote/fetchAll',
  async () => {
    const res = await axios.get<CreditNote[]>('/api/sale/credit-note')
    return res.data
  }
)

export const createCreditNote = createAsyncThunk(
  'creditNote/create',
  async (data: Partial<CreditNote>) => {
    const res = await axios.post<CreditNote>('/api/sale/credit-note', data)
    return res.data
  }
)

export const updateCreditNote = createAsyncThunk(
  'creditNote/update',
  async ({ id, data }: { id: string; data: Partial<CreditNote> }) => {
    await axios.put(`/api/sale/credit-note/${id}`, data)
    return { id, data }
  }
)

export const deleteCreditNote = createAsyncThunk(
  'creditNote/delete',
  async (id: string) => {
    await axios.delete(`/api/sale/credit-note/${id}`)
    return id
  }
)

// 🔹 Slice

const creditNoteSlice = createSlice({
  name: 'creditNote',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCreditNotes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchAllCreditNotes.fulfilled,
        (state, action: PayloadAction<CreditNote[]>) => {
          state.loading = false
          state.notes = action.payload
        }
      )
      .addCase(fetchAllCreditNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch credit notes'
      })
      .addCase(
        createCreditNote.fulfilled,
        (state, action: PayloadAction<CreditNote>) => {
          state.notes.push(action.payload)
        }
      )
      .addCase(updateCreditNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((n) => n.id === action.payload.id)
        if (index !== -1) {
          state.notes[index] = {
            ...state.notes[index],
            ...action.payload.data,
          }
        }
      })
      .addCase(
        deleteCreditNote.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.notes = state.notes.filter((n) => n.id !== action.payload)
        }
      )
  },
})

export default creditNoteSlice.reducer
