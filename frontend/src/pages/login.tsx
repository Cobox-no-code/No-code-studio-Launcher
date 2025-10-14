import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Login() {
  const [showButton, setShowButton] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [startVerification, setStartVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const router = useRouter();

  const handleLogin = async () => {
    const tokenId = uuidv4();
    localStorage.setItem("tokenId", tokenId);

    if (typeof window !== "undefined" && window.electronAPI?.openExternal) {
      try {
        await window.electronAPI.openExternal(
          `https://login.cobox.co/?tokenId=${tokenId}`
        );
      } catch (error) {
        console.error("Error with electronAPI.openExternal:", error);
        // Fallback to window.open
        window.open(`https://login.cobox.co/?tokenId=${tokenId}`, "_blank");
      }
    } else {
      // fallback if not in electron
      window.open(`https://login.cobox.co/?tokenId=${tokenId}`, "_blank");
    }

    // Start verification after a delay
    setTimeout(() => {
      setStartVerification(true);
      setIsLoading(true);
    }, 2000);
  };

  const verifyToken = async () => {
    const tokenId = localStorage.getItem("tokenId");
    if (tokenId) {
      try {
        const response = await axios.post(
          "https://us-central1-nocodestudio-6a434.cloudfunctions.net/verifyToken",
          {
            token: tokenId,
          }
        );
        console.log("Token verification response:", response.data);

        if (response.data) {
          localStorage.setItem("userData", response.data.userData);
          localStorage.setItem("token", response.data.customToken);

          setIsLoading(false);
          setTimeout(() => {
            router.push("/home");
          }, 3000);
        } else {
          console.error("Token verification failed:", response.data.message);
        }
      } catch (error) {
        console.error("Error during token verification:", error);
      }
    } else {
      console.error("Token ID not found in local storage.");
    }
  };

  useEffect(() => {
    let intervalId;

    if (startVerification) {
      // Call immediately
      verifyToken();

      // Then call every 3 seconds
      intervalId = setInterval(() => {
        verifyToken();
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [startVerification, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeout(() => {
        setImageLoaded(true);
        setTimeout(() => {
          setShowButton(true);
        }, 800);
      }, 3000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className=" h-screen w-screen">
      <div className="relative w-full h-full ">
        <video
          ref={videoRef}
          src={"/final.mov"}
          autoPlay
          muted
          preload="auto"
          className=" w-full h-full object-cover"
          onLoadedData={() => {
            // Ensure video stays loaded and doesn't reload
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
            }
          }}
        />
      </div>

      {/* Custom SVG Shape Card with Sign In Button */}
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
            {/* Custom SVG Shape */}
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

            {/* Content inside the custom shape */}
            <div className="absolute inset-0 flex flex-col justify-between items-center p-6">
              {/* Spacer to push center content */}
              <div className="flex-1 flex items-center justify-center">
                {!isLoading ? (
                  /* Custom SVG Sign In Button */
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
                    {/* Button SVG Shape */}
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

                    {/* Button Text */}
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl z-10">
                      Sign In
                    </span>
                  </button>
                ) : (
                  /* Loading State */
                  <div className="flex flex-col items-center justify-center">
                    {/* Loading Spinner */}
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-white rounded-full animate-spin mb-3"></div>
                    {/* Loading Text */}
                    <div className="text-white font-medium text-lg">
                      Please wait...
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Sign Up Text - Hidden when loading */}
              {!isLoading && (
                <div className="text-center text-sm mt-8">
                  <div className="flex gap-1 text-white">
                    <button className="font-bold cursor-pointer  hover:underline">
                      Sign Up
                    </button>
                    <span className="text-gray-400 font-medium">
                      {" "}
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
