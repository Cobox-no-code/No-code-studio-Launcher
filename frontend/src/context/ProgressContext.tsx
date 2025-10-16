import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

// Define the shape of the context data
interface DownloadContextType {
  isDownloading: boolean;
  downloadProgress: number;
  startDownload: () => void;
  finishDownload: () => void;
  // We no longer need setDownloadProgress here, it will be handled internally
}

// Create the context with a default value
const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined
);

// Create the Provider component
export const DownloadProvider = ({ children }: { children: ReactNode }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // This useEffect will run only once when the app loads
  // It sets up the global listener for download progress
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onDownloadProgress((progress) => {
        // When progress is reported, update our global state
        if (!isDownloading) setIsDownloading(true); // Ensure downloading state is active
        setDownloadProgress(progress);

        if (progress >= 100) {
          // Optional: Auto-reset after a delay when download completes
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 2000); // Reset after 2 seconds
        }
      });
    }
  }, []); // Empty dependency array means this runs once on mount

  const startDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0); // Reset progress on new download
  };

  const finishDownload = () => {
    setIsDownloading(false);
    setDownloadProgress(0); // Reset progress
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

// Create a custom hook for easy access to the context
export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
};
