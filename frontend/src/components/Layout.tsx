"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import { useUser } from "@/context/UserContext";
import { items } from "@/utils/navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const path = usePathname();
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();
  const [searchValue, setSearchValue] = useState("");
  const [menu, setMenu] = useState(false);

  // ✅ Cleaned up: No more automatic version checking or file deleting here.
  // The logic is now strictly inside the button click in Home.tsx

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const UserIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6 text-gray-400"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );

  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-300 overflow-hidden ${
          isDarkMode ? " bg-[#0E052A]" : " bg-white"
        }`}
      >
        <header className="absolute top-0 left-0 w-full z-[60] p-8">
          <div className="flex justify-end items-center">
            {/* ... [Keep Search, Menu, and User Icon Logic same as before] ... */}
            <div className="flex items-center space-x-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className={`px-2 py-1.5 rounded-2xl text-xs focus:outline-none border-none ${
                    isDarkMode ? "bg-[#1F163C]" : "bg-white"
                  }`}
                />
              </div>
              {/* User Profile */}
              <Link href={"/settings"}>
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    className="h-8 w-8 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex justify-center items-center bg-white">
                    <UserIcon />
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>
        {!path.includes("home") && (
          <img
            onClick={() => setMenu(!menu)}
            className="absolute inset-0 z-50 h-screen p-4"
            src="./layout.png"
            alt=""
          />
        )}
      </div>
      {children}
    </>
  );
};

export default Layout;
