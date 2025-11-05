"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import { useUser } from "@/context/UserContext";
import api from "@/utils/api";
import { items } from "@/utils/navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
type LayoutProps = {
  children: ReactNode;
};
const Layout = ({ children }: LayoutProps) => {
  const path = usePathname();
  const { user, setUser } = useUser(); // Get user and setter from context
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [searchValue, setSearchValue] = useState("");
  const [activeGameTabs, setActiveGameTabs] = useState(false);
  const [menu, setMenu] = useState(false);
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
  const fetch = async () => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const res = await api.get(`/users/${parsedUser.id}`);
    }
  };

  const fetchGameData = async () => {
    try {
      // Get existing local game data
      const localGameData = localStorage.getItem("gameData");
      const localGamePath = localStorage.getItem("gamePath");

      // Always fetch latest game version (id = 1)
      const res = await api.get(`/game-version/1`);
      const latestGame = res.data;

      if (!latestGame) return;

      // If no local game data — first-time setup
      if (!localGameData) {
        localStorage.setItem("gameData", JSON.stringify(latestGame));
        return;
      }

      const parsedGame = JSON.parse(localGameData);

      // Compare versions
      if (parsedGame.version !== latestGame.version) {
        console.log("🔄 New version detected, resetting local game data...");

        // 1️⃣ Update localStorage with new game info
        localStorage.setItem("gameData", JSON.stringify(latestGame));

        // 2️⃣ Remove old game path (forces launcher to re-download)
        if (localGamePath) {
          localStorage.removeItem("gamePath");
        }

        // 3️⃣ Optional: trigger a re-download if your launcher listens for this
        // You can emit a custom event if needed:
        window.dispatchEvent(new Event("gameVersionUpdated"));
      }
    } catch (err) {
      console.error("Error while checking game version:", err);
    }
  };

  useEffect(() => {
    fetch();
    fetchGameData();
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-300 overflow-hidden  ${
          isDarkMode ? " bg-[#0E052A]" : " bg-white"
        }`}
      >
        {/* Header */}
        <header className="absolute top-0 left-0 w-full z-[60] p-8">
          <div className="flex justify-end items-center">
            {menu && (
              <div
                className={` ${
                  isDarkMode ? "bg-[#4D349C]" : "bg-white"
                }  flex flex-col space-y-4 absolute top-[5.5rem] translate-x-0 p-2.5 rounded-lg`}
              >
                {items.map((item) => (
                  <Link href={`${item.path}`}>
                    {isDarkMode ? item.iconDark() : item.iconLight()}
                  </Link>
                ))}
              </div>
            )}

            {/* Search Bar and Theme Toggle */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className={` px-2 py-1.5 rounded-2xl  text-xs placeholder:text-[#BDBDBD] focus:outline-none border-none  ${
                    isDarkMode ? " bg-[#1F163C]" : " bg-white"
                  } `}
                />
              </div>

              <Link href={"/settings"}>
                {user && user?.profilePicture ? (
                  <img
                    src={user?.profilePicture}
                    className=" h-8 w-8 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className=" w-8 h-8 rounded-full flex justify-center items-center bg-white">
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
            className=" absolute inset-0 z-50  h-screen  p-4"
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
