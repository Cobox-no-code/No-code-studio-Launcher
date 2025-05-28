import { backend_url } from "@/backend.config";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface LatestVersionResponse {
  version: string;
  file_url: string;
}

interface UpdaterProps {
  onUpdateComplete?: () => void;
  currentVersion?: string;
  forceShow?: boolean;
}

// Declare global electronAPI
declare global {
  interface Window {
    electronAPI?: {
      installUpdate: (
        fileName: string
      ) => Promise<{ success: boolean; message: string }>;
      installUpdateSilent: (
        fileName: string
      ) => Promise<{ success: boolean; message: string }>;
      quitApp: () => Promise<void>;
      restartApp: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      deviceAPI: any;
      checkFileExists: (
        fileName: string
      ) => Promise<{ exists: boolean; path: string | null }>;
      platform: string;
    };
  }
}

export default function Updater({
  onUpdateComplete,
  currentVersion = "1.0",
  forceShow = false,
}: UpdaterProps) {
  const [showModal, setShowModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "downloaded"
    | "installing"
    | "error"
    | "upToDate"
  >("idle");
  const [latestVersion, setLatestVersion] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [downloadedFileName, setDownloadedFileName] = useState<string>("");
  const [installMethod, setInstallMethod] = useState<"normal" | "silent">(
    "normal"
  );

  const isNewerVersion = (latest: string, current: string): boolean => {
    const parseVersion = (version: string) => {
      return version.split(".").map((num) => parseInt(num, 10) || 0);
    };

    const latestParts = parseVersion(latest);
    const currentParts = parseVersion(current);
    const maxLength = Math.max(latestParts.length, currentParts.length);

    for (let i = 0; i < maxLength; i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    return false;
  };

  const fetchLatest = async () => {
    try {
      setUpdateStatus("checking");
      setError("");

      const res = await axios.get<LatestVersionResponse>(
        `${backend_url}/subscription/latest-version/`
      );

      const { version, file_url } = res.data;
      setLatestVersion(version);
      setDownloadUrl(file_url);

      if (isNewerVersion(version, currentVersion) || forceShow) {
        setUpdateStatus("available");
        setShowModal(true);
      } else {
        setUpdateStatus("upToDate");
      }
    } catch (error: any) {
      setError("Failed to check for updates");
      setUpdateStatus("error");
      setShowModal(false);
    }
  };

  const downloadUpdate = async () => {
    try {
      setUpdateStatus("downloading");
      setDownloadProgress(0);

      const fileName = `app-update-v${latestVersion}.exe`;
      setDownloadedFileName(fileName);

      console.log("Starting download from:", downloadUrl);

      // Use axios with proper blob handling and progress tracking
      const response = await axios({
        method: "GET",
        url: downloadUrl,
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDownloadProgress(progress);
            console.log(`Download progress: ${progress}%`);
          }
        },
      });

      console.log("Download completed, creating blob...");

      // Create blob and download link
      const blob = new Blob([response.data], {
        type: "application/octet-stream",
      });

      // Create object URL
      const url = window.URL.createObjectURL(blob);

      // Create and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";

      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      console.log("Download triggered successfully");

      // Set status to downloaded
      setUpdateStatus("downloaded");
      toast.success(
        "Update downloaded successfully! Check your Downloads folder."
      );

      // Optional: Verify file was downloaded after a short delay
      setTimeout(async () => {
        if (window.electronAPI) {
          try {
            const fileCheck = await window.electronAPI.checkFileExists(
              fileName
            );
            if (!fileCheck.exists) {
              console.warn("File not found in Downloads folder");
              toast.error(
                "Please ensure the file was downloaded to your Downloads folder"
              );
            } else {
              console.log("File verified in Downloads folder:", fileCheck.path);
            }
          } catch (error) {
            console.error("Error checking file:", error);
          }
        }
      }, 2000);
    } catch (error: any) {
      console.error("Download error:", error);
      setError(
        `Failed to download update: ${error.message || "Unknown error"}`
      );
      setUpdateStatus("error");
      toast.error("Download failed. Please try again.");
    }
  };

  const installUpdate = async () => {
    try {
      setUpdateStatus("installing");

      // Check if we're in Electron environment
      if (!window.electronAPI) {
        toast.error("Installation requires Electron environment");
        setError("Installation not available in web version");
        setUpdateStatus("error");
        return;
      }

      toast.loading("Installing update...", { duration: 0 });

      // Check if file exists first
      const fileCheck = await window.electronAPI.checkFileExists(
        downloadedFileName
      );

      if (!fileCheck.exists) {
        throw new Error("Downloaded file not found. Please download again.");
      }

      let result;

      if (installMethod === "silent") {
        // Try silent installation first
        try {
          result = await window.electronAPI.installUpdateSilent(
            downloadedFileName
          );
        } catch (silentError) {
          console.warn(
            "Silent installation failed, falling back to normal:",
            silentError
          );
          // Fallback to normal installation
          result = await window.electronAPI.installUpdate(downloadedFileName);
        }
      } else {
        // Normal installation with admin prompt
        result = await window.electronAPI.installUpdate(downloadedFileName);
      }

      if (result.success) {
        toast.success(
          "Installation started! Application will restart automatically."
        );

        // Wait a moment then quit the app
        setTimeout(async () => {
          if (onUpdateComplete) {
            onUpdateComplete();
          }

          // The app should quit automatically after installation
          // but we can trigger it manually as backup
          await window.electronAPI?.quitApp();
        }, 2000);
      } else {
        throw new Error(result.message || "Installation failed");
      }
    } catch (error: any) {
      console.error("Installation error:", error);
      setError(`Installation failed: ${error.message}`);
      setUpdateStatus("error");
      toast.error(`Installation failed: ${error.message}`);
    }
  };

  // Get current app version from Electron if available
  useEffect(() => {
    const getCurrentVersion = async () => {
      if (window.electronAPI) {
        try {
          const version = await window.electronAPI.getAppVersion();
          console.log("Current app version:", version);
        } catch (error) {
          console.error("Failed to get app version:", error);
        }
      }
    };

    getCurrentVersion();
  }, []);

  useEffect(() => {
    fetchLatest();
  }, []);

  const renderContent = () => {
    switch (updateStatus) {
      case "checking":
        return (
          <div className="text-center py-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Checking for Updates</h3>
            <p className="text-gray-600">Please wait...</p>
          </div>
        );

      case "available":
        return (
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2 text-red-600">
              Update Required
            </h3>
            <p className="text-gray-600 text-center mb-4">
              A new version is available and must be installed.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Version:</span>
                <span className="text-sm text-gray-600">{currentVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Latest Version:</span>
                <span className="text-sm text-green-600 font-semibold">
                  {latestVersion}
                </span>
              </div>
            </div>

            <Alert className="mb-4">
              <Download className="h-4 w-4" />
              <AlertDescription>
                The update file will be downloaded to your Downloads folder.
              </AlertDescription>
            </Alert>

            <Button onClick={downloadUpdate} className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download Update
            </Button>
          </div>
        );

      case "downloading":
        return (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-4">
              Downloading Update
            </h3>
            <div className="space-y-3">
              <Progress value={downloadProgress} className="w-full h-3" />
              <p className="text-center text-lg font-semibold text-blue-600">
                {downloadProgress}% completed
              </p>
              <p className="text-center text-sm text-gray-500">
                Please don&apos;t close this window while downloading...
              </p>
            </div>
          </div>
        );

      case "downloaded":
        return (
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">
              Download Complete
            </h3>
            <p className="text-gray-600 text-center mb-4">
              The update file has been saved to your Downloads folder. Choose
              installation method below.
            </p>

            {/* Installation Method Selection */}
            {window.electronAPI && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium mb-2 block">
                  Installation Method:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="installMethod"
                      value="normal"
                      checked={installMethod === "normal"}
                      onChange={(e) =>
                        setInstallMethod(e.target.value as "normal" | "silent")
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Normal (with admin prompt)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="installMethod"
                      value="silent"
                      checked={installMethod === "silent"}
                      onChange={(e) =>
                        setInstallMethod(e.target.value as "normal" | "silent")
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Silent (automatic)</span>
                  </label>
                </div>
              </div>
            )}

            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The application will restart automatically after installation.
                Please save any unsaved work before proceeding.
              </AlertDescription>
            </Alert>

            <Button
              onClick={installUpdate}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Install Now ({installMethod})
            </Button>
          </div>
        );

      case "installing":
        return (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-4">
              Installing Update
            </h3>
            <p className="text-center text-gray-600 mb-2">
              Please wait while the update is being installed...
            </p>
            <p className="text-center text-sm text-gray-500">
              {installMethod === "normal"
                ? "You may see an admin prompt - please click 'Yes' to continue"
                : "Installing silently in the background..."}
            </p>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center font-medium">
                ⚠️ Do not close this application during installation
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2 text-red-600">
              Update Error
            </h3>
            <p className="text-gray-600 text-center mb-4 whitespace-pre-wrap">
              {error}
            </p>
            <Button onClick={fetchLatest} className="w-full" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">🔄 App Updater</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
