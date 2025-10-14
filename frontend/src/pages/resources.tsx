"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}
export default function SavedScreen() {
  const router = useRouter();
  const divref = useRef<HTMLDivElement | null>(null);
  const pushedRef = useRef(false); // prevent double pushes

  const handleOutside = useCallback(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    router.push("/home");
  }, [router]);

  useOnClickOutside(divref, handleOutside);
  const { isDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState("Saved");

  // Base styles for reuse
  const backdropClass = isDarkMode ? "bg-[#0E052A]/80" : "bg-[#F5F5F5]/68";
  const modalBgClass = isDarkMode ? "bg-[#0E052A]" : "bg-white";

  // Create a dummy array for grid items
  const savedItems = Array.from({ length: 12 });

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 z-[100] flex justify-center items-center backdrop-blur-sm transition-colors duration-300 ${backdropClass}`}
    >
      <div
        ref={divref}
        className={`rounded-3xl shadow-2xl min-w-6xl w-[60vw] max-w-6xl h-[75vh] py-4 px-4 transition-colors duration-300 ${modalBgClass}`}
      >
        <div className="flex flex-col mx-auto w-full h-full space-y-2">
          {/* Left Navigation */}
          <div className="flex flex-col  pt-4">
            {/* The image shows only one tab, but this can be expanded */}
            <button
              onClick={() => setActiveTab("Saved")}
              className={`text-md rounded-xl font-normal cursor-pointer   shrink w-32 text-center  px-5 py-2.5 mb-2 transition-all duration-200 ${
                isDarkMode
                  ? activeTab === "Saved"
                    ? "bg-[#2A1B5A] text-white"
                    : "text-[#2A1B5A] hover:bg-[#1C1041]"
                  : activeTab === "Saved"
                  ? "bg-[#E0E0E0] text-[#2A1B5A]"
                  : "text-[#9F9F9F] hover:bg-[#EEEEEE]"
              }`}
            >
              Resources
            </button>
            {/* Add other tabs here if needed */}
          </div>

          {/* Right Content Grid */}
          <div className="w-full h-full overflow-y-auto pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Component for a single Saved Item card ---
const SavedItem = ({ isDarkMode }) => {
  const cardBgClass = isDarkMode ? "bg-[#1C1041]" : "bg-[#EAEAEA]";

  return (
    <div
      className={`aspect-video rounded-xl transition-colors duration-300 ${cardBgClass}`}
    >
      {/* Content of the saved item can go here */}
      {/* For example: an image, title, etc. */}
    </div>
  );
};
