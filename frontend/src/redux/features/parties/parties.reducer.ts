import { Party } from '@/models/party/party.model'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
interface PartyState {
  parties: Party[]
  loading: boolean
  error: string | null
}

const initialState: PartyState = {
  parties: [],
  loading: false,
  error: null,
}

// GET all parties
export const fetchAllParties = createAsyncThunk(
  'parties/fetchAll',
  async () => {
    const res = await axios.get<Party[]>('/api/parties')
    return res.data
  }
)

// POST new party
export const createNewParty = createAsyncThunk(
  'parties/create',
  async (partyData: Partial<Party>) => {
    const res = await axios.post<Party>('/api/parties', partyData)
    return res.data
  }
)

// PUT update party
export const updatePartyById = createAsyncThunk(
  'parties/update',
  async ({ id, data }: { id: string; data: Partial<Party> }) => {
    await axios.put(`/api/parties/${id}`, data)
    return { id, data }
  }
)

// DELETE party
export const deletePartyById = createAsyncThunk(
  'parties/delete',
  async (id: string) => {
    await axios.delete(`/api/parties/${id}`)
    return id
  }
)
export const partySlice = createSlice({
  name: 'parties',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // Fetch
      .addCase(fetchAllParties.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchAllParties.fulfilled,
        (state, action: PayloadAction<Party[]>) => {
          state.loading = false
          state.parties = action.payload
        }
      )
      .addCase(fetchAllParties.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch parties'
      })

      // Create
      .addCase(
        createNewParty.fulfilled,
        (state, action: PayloadAction<Party>) => {
          state.parties.push(action.payload)
        }
      )

      // Update
      .addCase(updatePartyById.fulfilled, (state, action) => {
        const index = state.parties.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.parties[index] = {
            ...state.parties[index],
            ...action.payload.data,
          }
        }
      })

      // Delete
      .addCase(
        deletePartyById.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.parties = state.parties.filter((p) => p.id !== action.payload)
        }
      )
  },
})

export default partySlice.reducer
