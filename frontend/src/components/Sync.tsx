"use client";
import { backend_url } from "@/backend.config";
import { syncAllToCloud, syncAllToLocal } from "@/lib/sync-cloud";
import { useAppSelector } from "@/redux/hooks";
import React, { useEffect } from "react";

export default function Sync() {
  const { sync_enabled, phone } = useAppSelector((state) => state.userinfo);

  const syncTocloud = async () => {
    const owner = phone;
    const firmId = localStorage.getItem("firmId");
    if (!firmId) return;
    try {
      const result = await syncAllToCloud(backend_url, firmId, owner);
      console.log("Synced to cloud", result);
    } catch (e) {
      console.error("Sync to cloud failed", e);
    }
  };

  const syncToLocal = async () => {
    const owner = phone;
    const firmId = localStorage.getItem("firmId");
    if (!firmId) return;
    try {
      const result = await syncAllToLocal(backend_url, firmId, owner);
      console.log("Synced to local", result);
    } catch (e) {
      console.error("Sync to local failed", e);
    }
  };

  useEffect(() => {
    console.log("sync_enabled =", sync_enabled);
    if (sync_enabled) {
      syncToLocal();
      syncTocloud();
    }
  }, [sync_enabled]);

  return null;
}
