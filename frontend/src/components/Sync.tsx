"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchFirm } from "@/lib/sync-enable";
import { initializeSync } from "@/redux/slices/sync";
import { RefreshCw, Building2 } from "lucide-react";

export default function Sync() {
  const path = usePathname()
  const user = useAppSelector((state) => state.userinfo);
  const sync = useAppSelector((state) => state.sync); // Get sync state from Redux
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const rol = useAppSelector((state) => state.firm.role);
  const [isOnline, setIsOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Track online/offline status
  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Initialize sync state from localStorage on component mount
  useEffect(() => {
    dispatch(initializeSync());
  }, [dispatch]);

  // Fetch sync status from server
  useEffect(() => {
    // Fetch immediately on mount
    fetchFirm();

    // Set interval to run every 3 seconds
    const intervalId = setInterval(() => {
      fetchFirm();
    }, 3000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Handle restriction modal
  useEffect(() => {
    const showRestrictionModal = !sync.isEnabled && rol !== "admin";
    setShowRestrictionModal(showRestrictionModal);
  }, [sync.isEnabled, rol]);

  // Offline Modal if sync is enabled but offline
  const showOfflineModal = sync.isEnabled && !isOnline;

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
    const res = await fetchFirm();
 
    setShowRestrictionModal(!res&& rol !== "admin");
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error("Error refreshing:", error);
      setIsRefreshing(false);
    }
  };

  // Handle change firm
  const handleChangeFirm = () => {
    router.push("/firm");
  };

  return (
    <>
      {/* OFFLINE WARNING */}
      <Dialog open={showOfflineModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              OFFLINE MODE
            </DialogTitle>
            <div className="text-center mt-4 space-y-4">
              <p className="text-gray-600">
                Sync is enabled. Please connect to the internet to continue using the app
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRefreshing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {isRefreshing ? "Refreshing..." : "Refresh Connection"}
                </Button>
                
                <Button
                  onClick={handleChangeFirm}
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Change Firm
                </Button>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* RESTRICTION MODAL */}
   { !path.includes('firm')  && <Dialog open={showRestrictionModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-yellow-600 flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              SYNC DISABLED
            </DialogTitle>
            <div className="text-center mt-4 space-y-4">
              <p className="text-gray-600">
                Sync is currently disabled. Please contact your administrator to enable sync.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRefreshing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {isRefreshing ? "Refreshing..." : "Refresh Status"}
                </Button>
                
                <Button
                  onClick={handleChangeFirm}
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Change Firm
                </Button>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>}
    </>
  );
}