import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../api/api.config";

export interface Firm {
  id: string;
  name: string;
  country?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface FirmState {
  currentFirm: Firm | null;
  firms: Firm[];
  loading: boolean;
  error: string | null;
  role: string | null;
}

const initialState: FirmState = {
  currentFirm: null,
  role: "admin",
  firms: [],
  loading: false,
  error: null,
};

// Async thunk to fetch firms
export const fetchFirms = createAsyncThunk(
  "firm/fetchFirms",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get<Firm[]>(`${API_BASE_URL}/firms`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to fetch firms"
      );
    }
  }
);

// Async thunk to create a firm
export const createFirm = createAsyncThunk(
  "firm/createFirm",
  async (
    {
      name,
      country,
      phone,
      cloudurl,
      address,
      owner,
      ownerName,
    }: {
      name: string;
      country?: string;
      phone?: string;
      cloudurl: string;
      address: string;
      owner: string;
      ownerName: string;
    },
    thunkAPI
  ) => {
    try {
      const response = await axios.post<Firm>(`${API_BASE_URL}/firms`, {
        name,
        country,
        phone,
        cloudurl,
        address,
        owner,
        ownerName,
      });

      // Optionally init firm default data
      await axios.get(`${API_BASE_URL}/initData`, {
        headers: { "x-firm-id": response.data.id },
      });

      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to create firm"
      );
    }
  }
);

const firmSlice = createSlice({
  name: "firm",
  initialState,
  reducers: {
    setCurrentFirm(state, action: PayloadAction<Firm>) {
      state.currentFirm = action.payload;

      console.log(action.payload);
      localStorage.setItem("firmId", action.payload.id);
      localStorage.setItem("firmName", action.payload.name);
      localStorage.setItem("firmCountry", action.payload.country || "");
      localStorage.setItem("firmPhone", action.payload.phone);
    },
    clearFirmError(state) {
      state.error = null;
    },
    updateRole(state, action: PayloadAction<any>) {
      state.role = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFirms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFirms.fulfilled, (state, action: PayloadAction<Firm[]>) => {
        state.firms = action.payload;
        console.log(action.payload);
        state.loading = false;
      })
      .addCase(fetchFirms.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFirm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFirm.fulfilled, (state, action: PayloadAction<Firm>) => {
        state.currentFirm = action.payload;
        state.firms.push(action.payload);
        state.loading = false;
      })
      .addCase(createFirm.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentFirm, clearFirmError, updateRole } = firmSlice.actions;
export default firmSlice.reducer;
