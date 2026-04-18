// Login.tsx
import { useUser } from "@/context/UserContext";
import { BACKEND_URL } from "@/utils/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Login() {
  const [showButton, setShowButton] = useState(false);
  const [startVerification, setStartVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ─── EMERGENCY UPDATE STATE (fallback if user somehow reaches login) ────
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "downloading" | "downloaded" | "error"
  >("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  // ─────────────────────────────────────────────────────────────────────────

  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { setUser, setToken } = useUser();

  // ─── UPDATE LISTENER (catches users who skipped on splash) ──────────────
  useEffect(() => {
    if (!window.electronAPI?.onUpdateEvent) return;

    window.electronAPI.onUpdateEvent((channel: string, data: any) => {
      switch (channel) {
        case "update-available":
          setUpdateAvailable(true);
          setUpdateVersion(data?.version || "latest");
          break;
        case "download-progress":
          setUpdateStatus("downloading");
          setDownloadProgress(data?.percent || 0);
          break;
        case "update-downloaded":
          setUpdateStatus("downloaded");
          setDownloadProgress(100);
          break;
        case "update-error":
          setUpdateStatus("error");
          break;
      }
    });
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    const tokenId = uuidv4();
    localStorage.setItem("verification-token", tokenId);
    const loginUrl = `https://www.cobox.games/login?tokenId=${tokenId}`;

    if (window.electronAPI?.openExternal) {
      await window.electronAPI.openExternal(loginUrl);
    } else {
      window.open(loginUrl, "_blank");
    }

    setTimeout(() => {
      setStartVerification(true);
      setIsLoading(true);
    }, 2000);
  };

  // Polling for token verification
  useEffect(() => {
    if (!startVerification) return;

    let intervalId: NodeJS.Timeout;

    const verifyToken = async () => {
      const tokenId = localStorage.getItem("verification-token");
      if (!tokenId) return;

      try {
        const response = await axios.post(
          `${BACKEND_URL}/auth/verify-launcher`, // ← uses current BACKEND_URL from config
          { verificationToken: tokenId },
        );

        if (response.data) {
          clearInterval(intervalId);

          const { user, tokens } = response.data;
          const { accessToken, refreshToken } = tokens;

          await window.electronAPI?.createSecret({
            authToken: accessToken,
            refreshToken: refreshToken,
            user: user,
          });

          localStorage.setItem("userData", JSON.stringify(user));
          localStorage.setItem("auth_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);

          setUser(user);
          setToken(accessToken);

          setIsLoading(false);
          router.push("/home");
        }
      } catch (error) {
        console.error("Polling for token... Error:", error.message);
      }
    };

    verifyToken();
    intervalId = setInterval(verifyToken, 3000);
    return () => clearInterval(intervalId);
  }, [startVerification, router, setUser, setToken]);

  // Show button after splash delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeout(() => {
        setTimeout(() => {
          setShowButton(true);
        }, 800);
      }, 3000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadUpdate = async () => {
    try {
      setUpdateStatus("downloading");
      await window.electronAPI?.downloadUpdate?.();
    } catch {
      setUpdateStatus("error");
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await window.electronAPI?.installUpdate?.();
    } catch {
      setUpdateStatus("error");
    }
  };

  return (
    <div className="h-screen w-screen">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={"./Final.mov"}
          autoPlay
          muted
          preload="auto"
          className="w-full h-full object-cover"
        />
      </div>

      {/* ─── EMERGENCY UPDATE BANNER ──────────────────────────────────────── */}
      {/* Shows at top of login screen if an update is available              */}
      {updateAvailable && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-[#5B1BEE] text-white px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            {updateStatus === "idle" &&
              `⚡ New version ${updateVersion} available — update to fix login issues`}
            {updateStatus === "downloading" &&
              `Downloading... ${Math.round(downloadProgress)}%`}
            {updateStatus === "downloaded" &&
              "✅ Update ready — click to install and restart"}
            {updateStatus === "error" &&
              "Update failed. Please download manually from cobox.games"}
          </span>

          {updateStatus === "idle" && (
            <button
              onClick={handleDownloadUpdate}
              className="ml-4 bg-white text-[#5B1BEE] text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
              Update Now
            </button>
          )}
          {updateStatus === "downloading" && (
            <div className="ml-4 w-32 bg-white/30 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
          {updateStatus === "downloaded" && (
            <button
              onClick={handleInstallUpdate}
              className="ml-4 bg-white text-[#5B1BEE] text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
              Install & Restart
            </button>
          )}
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {showButton && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className={`
              relative w-[500px] h-[280px]
              transition-all duration-700 ease-out
              ${showButton ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"}
            `}
            style={{ filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))" }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 847 445"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M101 0H808.5L846.5 35.5L738 444.5H25.5L0 404L101 0Z"
                fill="#161616"
                fillOpacity="0.95"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-between items-center p-6">
              <div className="flex-1 flex items-center justify-center">
                {!isLoading ? (
                  <button
                    onClick={handleLogin}
                    className="relative w-52 h-14 transform hover:scale-105 transition-all duration-300 ease-out hover:brightness-110 cursor-pointer"
                    style={{
                      filter: "drop-shadow(0 6px 12px rgba(91, 27, 238, 0.4))",
                    }}
                  >
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 202 50"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.3691 6.8L13.0043 0H198.439C200.3 0 201.711 1.67568 201.396 3.50904L194.631 42.8L189.646 49.2L3.5703 49.9849C1.70674 49.9928 0.286994 48.3176 0.600358 46.4805L7.3691 6.8Z"
                        fill="#5B1BEE"
                        className="transition-all duration-300 hover:brightness-110"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl z-10">
                      Sign In
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-white rounded-full animate-spin mb-3"></div>
                    <div className="text-white font-medium text-lg">
                      Please wait...
                    </div>
                  </div>
                )}
              </div>
              {!isLoading && (
                <div className="text-center text-sm mt-8">
                  <div className="flex gap-1 text-white">
                    <button
                      onClick={handleLogin}
                      className="font-bold cursor-pointer hover:underline"
                    >
                      Sign Up
                    </button>
                    <span className="text-gray-400 font-medium">
                      ,if you want to be amazed
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
