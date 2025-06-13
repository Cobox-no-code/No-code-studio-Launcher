// redux/slices/syncSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  isEnabled: boolean;
  isLoading: boolean;
}

const initialState: SyncState = {
  isEnabled: false,
  isLoading: true,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
      state.isLoading = false;
      // Also update localStorage to keep them in sync
      localStorage.setItem('sync_enabled', action.payload.toString());
    },
    setSyncLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    initializeSync: (state) => {
      // Initialize from localStorage on app start
      const stored = localStorage.getItem('sync_enabled');
      state.isEnabled = stored === 'true';
      state.isLoading = false;
    },
  },
});

export const { setSyncEnabled, setSyncLoading, initializeSync } = syncSlice.actions;
export default syncSlice.reducer;