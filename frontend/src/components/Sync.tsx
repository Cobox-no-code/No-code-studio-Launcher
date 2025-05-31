"use client";

import { backend_url } from "@/backend.config";
import { syncAllToLocal } from "@/lib/sync-cloud";
import { useAppSelector } from "@/redux/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";

export default function Sync() {
  const { sync_enabled, phone } = useAppSelector((state) => state.userinfo);
  const [isOnline, setIsOnline] = useState(true);

  // Track online/offline status
  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Init status
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
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
    let interval;
    if (sync_enabled && isOnline) {
      interval = setInterval(syncToLocal, 8000);
    }

    return () => clearInterval(interval);
  }, [sync_enabled, isOnline, phone]);
  // Show modal only if sync_enabled AND offline
  const showModal = sync_enabled && !isOnline;

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-red-600">
            OFFLINE MODE
          </DialogTitle>
          <p className="text-center mt-2">
            Sync is enabled. Please connect to the internet to continue using
            the app.
          </p>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
