// hooks/useSafeSelector.ts
import { useAppSelector } from "@/redux/hooks";
import { useState, useEffect } from "react";
// hooks/useApiUrl.ts
import { cloud_url } from "@/backend.config";

export const useSafeSelector = <T>(
  selector: (state: any) => T, 
  defaultValue: T
): T => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Always call the hook, but handle the error gracefully
  try {
    const result = useAppSelector(selector);
    return mounted ? result : defaultValue;
  } catch (error) {
    // If Redux context is not available (SSR), return default
    return defaultValue;
  }
};



export const useApiUrl = () => {
  const [url, setUrl] = useState("http://localhost:4000/api");
  
  const syncEnabled = useSafeSelector(
    (state) => state.sync?.isEnabled,
    undefined
  );

  useEffect(() => {
    if (syncEnabled !== undefined) {
      setUrl(syncEnabled ? cloud_url : "http://localhost:4000/api");
    } else if (typeof window !== "undefined") {
      const local = localStorage.getItem("sync_enabled") === "true";
      setUrl(local ? cloud_url : "http://localhost:4000/api");
    }
  }, [syncEnabled]);

  return url;
};