import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { set } from "date-fns";
import { backend_url, cloud_url } from "@/backend.config";
import { ROLE_PERMISSIONS_MAPPING } from "@/lib/role-permissions-mapping";

interface Company {
  id: string;
  name: string;
  country?: string | null;
  phone?: string | null;
  isShared?: boolean;
  role?: string;
}
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
  firms: any[];
  loading: boolean;
  error: string | null;
  role: keyof typeof ROLE_PERMISSIONS_MAPPING ;
}

const initialState: FirmState = {
  currentFirm: null,
  role: "admin",
  firms: [],
  loading: false,
  error: null,
};

export const fetchFirms = createAsyncThunk(
  "firm/fetchFirms",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as {
        userinfo: { phone: string };
        firm: FirmState;
      };

      const { phone } = state.userinfo;
      const { currentFirm, role: currentRole } = state.firm;

      const [ownedResult, sharedResult,cloudResults] = await Promise.allSettled([
        axios.get<Company[]>(`http://localhost:4000/api/firms?phone=${phone}`),
        axios.get(`${cloud_url}/user/${phone}/firms`),
        axios.get(`${cloud_url}/firms?phone=${phone}`),
      ]);

      let ownedCompanies =
        ownedResult.status === "fulfilled" ? ownedResult.value.data : [];

      const sharedFirmsRaw =
        sharedResult.status === "fulfilled"
          ? sharedResult.value.data || []
          : [];
      const cloudCompanies = cloudResults.status==="fulfilled" ? cloudResults.value.data ||[]:[]
if(ownedCompanies.length ===0 && cloudCompanies.length >0){
 ownedCompanies = cloudCompanies
}
      const formattedSharedFirms = sharedFirmsRaw.map((firm: any) => ({
        id: firm.firm_id,
        name: firm.firm_name,
        isShared: true,
        role: firm.role,
      }));

      const allCompanies = [...ownedCompanies, ...formattedSharedFirms];

      // 🟡 Check if the role of the current firm has changed
      if (currentFirm) {
        const currentFirmData = allCompanies.find(
          (f) => f.id === currentFirm.id
        );

        if (currentFirmData && currentFirmData.role && currentFirmData.role !== currentRole) {
          thunkAPI.dispatch(updateRole(currentFirmData.role));
          window.location.href = "/"; // Redirect to firms page to refresh state
        }
      }

      return allCompanies;
    } catch (err) {
      console.error("Unexpected error in fetchCompanies:", err);
      return thunkAPI.rejectWithValue("Failed to fetch firms");
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
      apiUrl,
      address,
      owner,
      ownerName,
    }: {
      name: string;
      country?: string;
      phone?: string;
      apiUrl: string;
      address: string;
      owner: string;
      ownerName: string;
    },
    thunkAPI
  ) => {
    try {
      const response = await axios.post<Firm>(`${apiUrl}/firms`, {
        name,
        country,
        phone,
       
        address,
        owner,
        ownerName,
      });

      // Optionally init firm default data
      await axios.get(`${apiUrl}/initData`, {
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
    addRestoredFirm(state, action: PayloadAction<any>) {
  const restoredFirm = action.payload;

    state.firms.push(restoredFirm);
    console.log(action.payload)
  
},

setCloudEnabled(state, action: PayloadAction<{ firmId: string; enabled: boolean }>) {
  const { firmId, enabled } = action.payload;
  const firm = state.firms.find(f => f.id === firmId);
  if (firm) {
    (firm as any).cloud = enabled;
  }
},
    setCurrentFirm(state, action: PayloadAction<Firm>) {
      state.currentFirm = action.payload;
      localStorage.setItem("firmId", action.payload.id);
      localStorage.setItem("firmName", action.payload.name);
      localStorage.setItem("firmCountry", action.payload.country || "");
      localStorage.setItem("firmPhone", action.payload.phone);
    },
    setFirms(state, action: PayloadAction<Firm[]>) {
      state.firms = action.payload;
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

export const { setCurrentFirm, clearFirmError, updateRole ,addRestoredFirm,setCloudEnabled} = firmSlice.actions;
export default firmSlice.reducer;
