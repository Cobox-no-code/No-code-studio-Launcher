// Your existing Login page file
import { useUser } from "@/context/UserContext"; // Import the useUser hook
import { BACKEND_URL } from "@/utils/config";
import axios from "axios"; // Still use axios for the initial verification
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Login() {
  const [showButton, setShowButton] = useState(false);
  const [startVerification, setStartVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { setUser, setToken } = useUser(); // Get setters from the context

  const handleLogin = async () => {
    const tokenId = uuidv4();
    localStorage.setItem("verification-token", tokenId);
    const loginUrl = `https://login.cobox.co/?tokenId=${tokenId}`;

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

  // This useEffect now handles the polling logic and stops upon success
  useEffect(() => {
    if (!startVerification) return;

    let intervalId: NodeJS.Timeout;

    const verifyToken = async () => {
      const tokenId = localStorage.getItem("verification-token");
      if (!tokenId) return;

      try {
        const response = await axios.post(
          `${BACKEND_URL}/users/verify-launcher`,
          { verificationToken: tokenId }
        );

        if (response.data) {
          // On successful verification, stop polling
          clearInterval(intervalId);

          const { user, tokens } = response.data;
          const { accessToken, refreshToken } = tokens;

          // 1. Create the secret file with initial tokens
          await window.electronAPI?.createSecret({
            authToken: accessToken,
            refreshToken: refreshToken,
            user: user,
          });

          // 2. Update localStorage (correctly stringify the user object)
          localStorage.setItem("userData", JSON.stringify(user));
          localStorage.setItem("auth_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);

          // 3. Update the global context state
          setUser(user);
          setToken(accessToken);

          // 4. Navigate to the home page
          setIsLoading(false);
          router.push("/home");
        }
      } catch (error) {
        // Log error but continue polling
        console.error("Polling for token... Error:", error.message);
      }
    };

    // Start polling
    verifyToken(); // Initial check
    intervalId = setInterval(verifyToken, 3000);

    // Cleanup function to stop polling when the component unmounts
    return () => clearInterval(intervalId);
  }, [startVerification, router, setUser, setToken]);

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

  // ... rest of your JSX remains the same
  return (
    <div className=" h-screen w-screen">
      <div className="relative w-full h-full ">
        <video
          ref={videoRef}
          src={"./Final.mov"}
          autoPlay
          muted
          preload="auto"
          className=" w-full h-full object-cover"
        />
      </div>

      {showButton && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className={`
              relative w-[500px] h-[280px]
              transition-all duration-700 ease-out
              ${
                showButton
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-8"
              }
            `}
            style={{
              filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))",
            }}
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
                    className="
            relative w-52 h-14 transform hover:scale-105
            transition-all duration-300 ease-out
            hover:brightness-110 cursor-pointer
          "
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
                      className="font-bold cursor-pointer  hover:underline"
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
