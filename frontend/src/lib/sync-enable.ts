// lib/sync-enable.ts
import { cloud_url } from "@/backend.config";
import axios from "axios";
import { store } from "@/redux/store"; // Import your store
import { setSyncEnabled, setSyncLoading } from "@/redux/slices/sync";

export const fetchFirm = async () => {
  try {
    store.dispatch(setSyncLoading(true));
    
    const firmId = localStorage.getItem("firmId");

    if (!firmId) {
      console.warn("firmId is not set in localStorage.");
      store.dispatch(setSyncEnabled(false));
      return false;
    }

    const res = await axios.get(`${cloud_url}/firms/${firmId}`);
    const data = res.data;

    const syncEnabled = data?.sync_enabled === 1;
    store.dispatch(setSyncEnabled(syncEnabled));
    
    return syncEnabled;
  } catch (error) {
    console.error("Error fetching firm:", error);
    store.dispatch(setSyncEnabled(false));
    return false;
  }
};

// Helper function to toggle sync (for admin users)
export const toggleSync = async (enable: boolean) => {
  try {
    const firmId = localStorage.getItem("firmId");
    if (!firmId) return false;

    // Make API call to update sync status
    await axios.put(`${cloud_url}/firms/${firmId}`, {
      sync_enabled: enable ? 1 : 0
    });

    // Update Redux store
    store.dispatch(setSyncEnabled(enable));
    
    return true;
  } catch (error) {
    console.error("Error toggling sync:", error);
    return false;
  }
};