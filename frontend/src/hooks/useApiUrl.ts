// hooks/useApiUrl.ts
import { useAppSelector } from "@/redux/hooks";
import { cloud_url } from "@/backend.config";
import { useEffect, useState } from "react";

// ✅ Hook that safely uses Redux with error handling
export const useApiUrl = () => {
  const [fallbackUrl, setFallbackUrl] = useState('http://localhost:4000/api');
  
  // Try to use Redux, fallback to localStorage
  let syncEnabled = false;
  try {
    syncEnabled = useAppSelector((state) => state.sync.isEnabled);
  } catch (error) {
    // Redux not available, use localStorage fallback
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sync_enabled') === 'true';
        setFallbackUrl(stored ? cloud_url : 'http://localhost:4000/api');
      }
    }, []);
    return fallbackUrl;
  }

  return syncEnabled ? cloud_url : 'http://localhost:4000/api';
};
