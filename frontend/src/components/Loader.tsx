"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ImageFrameAnimationLoader() {
  const [currentVideo, setCurrentVideo] = useState<1 | 2 | null>(1); // null = gap between videos
  const router = useRouter();

  const handleVideoEnd = () => {
    const auth = localStorage.getItem("auth_token");
    if (currentVideo === 1) {
      // Pause 2 seconds before showing second video
      setCurrentVideo(null); // Hide video for gap
      setTimeout(() => {
        setCurrentVideo(2); // Show second video
      }, 1000); // 2 seconds gap
    } else if (auth) {
      router.push("/home");
    } else {
      router.push("/login"); // After second video ends
    }
  };

  // Fallback timeout in case videos don't load or end
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/login");
    }, 8000); // 10 seconds max wait
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
        {currentVideo === 1 && (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            onEnded={handleVideoEnd}
          >
            <source src="./unreal engine intro.mp4" type="video/mp4" />
          </video>
        )}

        {currentVideo === 2 && (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            onEnded={handleVideoEnd}
          >
            <source src="./cobox.mp4" type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}
