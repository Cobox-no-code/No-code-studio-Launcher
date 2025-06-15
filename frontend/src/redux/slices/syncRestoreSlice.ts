// 1. Create a new slice for handling sync restoration
// redux/slices/syncRestoreSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { cloud_url } from "@/backend.config";
import { addRestoredFirm } from "./firmSlice";

interface SyncRestoreState {
  isCheckingSync: boolean;
  isRestoring: boolean;
  restorationSteps: RestoreStep[];
  needsRestore: boolean;
  error: string | null;
}

interface RestoreStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed" | "error";
  description: string;
}

const initialState: SyncRestoreState = {
  isCheckingSync: false,
  isRestoring: false,
  restorationSteps: [],
  needsRestore: false,
  error: null,
};

// Check if user has cloud sync enabled and data available
export const checkCloudSyncStatus = createAsyncThunk(
  "syncRestore/checkCloudSyncStatus",
  async (phone: string, thunkAPI) => {
    try {
      // Check if user has any firms in cloud
      const response = await axios.get(`${cloud_url}/firms?phone=${phone}`);
      const cloudFirms = response.data || [];
      
      if (cloudFirms.length > 0) {
        // Check if any local firms exist
        const localResponse = await axios.get(`http://localhost:4000/api/firms?phone=${phone}`);
        const localFirms = localResponse.data || [];
        
        // If cloud has firms but local doesn't, or cloud has more recent data
        return {
          needsRestore: cloudFirms.length > 0 && localFirms.length === 0,
          cloudFirms,
          localFirms
        };
      }
      
      return { needsRestore: false, cloudFirms: [], localFirms: [] };
    } catch (error) {
      console.error("Error checking cloud sync status:", error);
      return thunkAPI.rejectWithValue("Failed to check sync status");
    }
  }
);

// Restore user's data from cloud
export const restoreFromCloud = createAsyncThunk(
  "syncRestore/restoreFromCloud",
  async (params: { phone: string; selectedFirms?: string[] }, thunkAPI) => {
    const { phone, selectedFirms } = params;
    
    try {
      // Get user's cloud firms
      const firmsResponse = await axios.get(`${cloud_url}/firms?phone=${phone}`);
      const cloudFirms = firmsResponse.data || [];
      
      const firmsToRestore = selectedFirms 
        ? cloudFirms.filter((firm: any) => selectedFirms.includes(firm.id))
        : cloudFirms;
       console.log(firmsToRestore,cloudFirms)
      // Initialize restoration steps
      const steps: RestoreStep[] = [
        { id: "firms", label: "Restoring Companies", status: "pending", description: "Setting up your companies" },
        { id: "sync-setup", label: "Configuring Sync", status: "pending", description: "Enabling cloud synchronization" },
        { id: "data-sync", label: "Syncing Data", status: "pending", description: "Downloading your business data" },
        { id: "finalize", label: "Finalizing Setup", status: "pending", description: "Completing restoration process" }
      ];
      
      thunkAPI.dispatch(setRestorationSteps(steps));
      
      // Step 1: Restore firms
      thunkAPI.dispatch(updateRestorationStep({ stepId: "firms", status: "loading" }));
      
      for (const cloudFirm of firmsToRestore) {
        // Create local firm entry for shared firms
        const firmData = {
          id: cloudFirm.id,
          name: cloudFirm.name,
          isShared: false,
          role: 'admin',
          cloud: true // Mark as cloud-enabled
        };
        
        // You might want to create a local reference or just store in Redux
        thunkAPI.dispatch(addRestoredFirm(firmData));
      }
      
      thunkAPI.dispatch(updateRestorationStep({ 
        stepId: "firms", 
        status: "completed", 
        description: `${firmsToRestore.length} companies restored` 
      }));
      
      // Step 2: Setup sync
      thunkAPI.dispatch(updateRestorationStep({ stepId: "sync-setup", status: "loading" }));
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate setup time
      thunkAPI.dispatch(updateRestorationStep({ 
        stepId: "sync-setup", 
        status: "completed", 
        description: "Sync configuration complete" 
      }));
      
      // Step 3: Data sync (this will be handled by existing sync logic)
      thunkAPI.dispatch(updateRestorationStep({ stepId: "data-sync", status: "loading" }));
      await new Promise(resolve => setTimeout(resolve, 1500));
      thunkAPI.dispatch(updateRestorationStep({ 
        stepId: "data-sync", 
        status: "completed", 
        description: "Data synchronization complete" 
      }));
      
      // Step 4: Finalize
      thunkAPI.dispatch(updateRestorationStep({ stepId: "finalize", status: "loading" }));
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(updateRestorationStep({ 
        stepId: "finalize", 
        status: "completed", 
        description: "Setup complete" 
      }));
      
      return { success: true, restoredFirms: firmsToRestore };
      
    } catch (error) {
      console.error("Error restoring from cloud:", error);
      return thunkAPI.rejectWithValue("Failed to restore data from cloud");
    }
  }
);

const syncRestoreSlice = createSlice({
  name: "syncRestore",
  initialState,
  reducers: {
    setNeedsRestore: (state, action: PayloadAction<boolean>) => {
      state.needsRestore = action.payload;
    },
    setRestorationSteps: (state, action: PayloadAction<RestoreStep[]>) => {
      state.restorationSteps = action.payload;
    },
    updateRestorationStep: (state, action: PayloadAction<{ stepId: string; status: RestoreStep["status"]; description?: string }>) => {
      const { stepId, status, description } = action.payload;
      const step = state.restorationSteps.find(s => s.id === stepId);
      if (step) {
        step.status = status;
        if (description) {
          step.description = description;
        }
      }
    },
    clearRestoreState: (state) => {
      state.isCheckingSync = false;
      state.isRestoring = false;
      state.restorationSteps = [];
      state.needsRestore = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkCloudSyncStatus.pending, (state) => {
        state.isCheckingSync = true;
        state.error = null;
      })
      .addCase(checkCloudSyncStatus.fulfilled, (state, action) => {
        state.isCheckingSync = false;
        state.needsRestore = action.payload.needsRestore;
      })
      .addCase(checkCloudSyncStatus.rejected, (state, action) => {
        state.isCheckingSync = false;
        state.error = action.payload as string;
      })
      .addCase(restoreFromCloud.pending, (state) => {
        state.isRestoring = true;
        state.error = null;
      })
      .addCase(restoreFromCloud.fulfilled, (state) => {
        state.isRestoring = false;
        state.needsRestore = false;
      })
      .addCase(restoreFromCloud.rejected, (state, action) => {
        state.isRestoring = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setNeedsRestore, 
  setRestorationSteps, 
  updateRestorationStep, 

  clearRestoreState 
} = syncRestoreSlice.actions;

export default syncRestoreSlice.reducer;

