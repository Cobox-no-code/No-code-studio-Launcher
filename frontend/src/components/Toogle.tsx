"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { setSyncEnabled, setSyncLoading } from "@/redux/slices/sync";
import { useState } from "react";
import { useApiUrl } from "@/hooks/useApiUrl";
import axios from "axios";
import { cloud_url } from "@/backend.config";

export default function SyncToggle() {
  const dispatch = useAppDispatch();
  const sync = useAppSelector((state) => state.sync);
  const rol = useAppSelector((state) => state.firm.role);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show to admin users
  if (rol !== "admin") {
    return null;
  }

  const handleToggle = async (checked: boolean) => {
    const firmId = localStorage.getItem("firmId");
    if (!firmId) {
      return;
    }
    
    dispatch(setSyncLoading(true))
    // ✅ OPTIMISTIC UPDATE - Update UI immediately
    dispatch(setSyncEnabled(checked));
    setIsToggling(true);
    setError(null);

    try {

      // Step 1: Sync data to target
      if (!sync.isEnabled) {
        // Enabling sync: sync from local to cloud
        await axios.post(`http://localhost:4000/api/sync-cloud/all`, {
          firmId,
        });
      } else {
        // Disabling sync: sync from cloud to local
        await axios.post(`http://localhost:4000/api/sync-local/all`, {
          firmId,
        });
      }

      // Step 2: Update sync status on server
      await axios.put(`${cloud_url}/firms/${firmId}`, {
        sync_enabled: checked ? 1 : 0
      });

      console.log(`Sync ${checked ? 'enabled' : 'disabled'} successfully`);
      
    } catch (error) {
      console.error("Error toggling sync:", error);
      setError("Failed to toggle sync. Please try again.");
      
      // ✅ ROLLBACK - Revert the optimistic update on error
      dispatch(setSyncEnabled(!checked));
    } finally {
    dispatch(setSyncLoading(false))
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 p-4 border rounded-lg">
        <Switch
          id="sync-toggle"
          checked={sync.isEnabled}
          onCheckedChange={handleToggle}
          disabled={isToggling}
        />
        <Label htmlFor="sync-toggle" className="cursor-pointer">
          Cloud Sync {sync.isEnabled ? "Enabled" : "Disabled"}
        </Label>
        
      </div>
      
      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {/* Status indicator */}
      <div className="text-xs text-gray-500">
        Current mode: {sync.isEnabled ? "Cloud" : "Local"}
        {isToggling && " (switching...)"}
      </div>
    </div>
  );
}