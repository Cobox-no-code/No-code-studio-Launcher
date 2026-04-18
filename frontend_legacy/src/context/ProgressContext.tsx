import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface DownloadContextType {
  isDownloading: boolean;
  downloadProgress: number;
  startDownload: () => void;
  finishDownload: () => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined
);

export const DownloadProvider = ({ children }: { children: ReactNode }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (window.electronAPI) {
      // ✅ FIX: Remove the logic that checks for 100% and resets.
      // Just update the number. Let Home.tsx call finishDownload().
      window.electronAPI.onDownloadProgress((progress) => {
        setDownloadProgress(progress);

        // Safety: ensure UI is visible if backend sends progress
        // using functional update to avoid stale closure issues
        setIsDownloading((prev) => (prev ? prev : true));
      });
    }
  }, []);

  const startDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
  };

  const finishDownload = () => {
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const value = {
    isDownloading,
    downloadProgress,
    startDownload,
    finishDownload,
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
};
