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
      className="w-12 h-12 text-gray-400"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
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
                  <UserIcon />
                )}
              </Link>
            </div>
          </div>
        </header>

        {!path.includes("home") && (
          <img
            onClick={() => setMenu(!menu)}
            className=" absolute inset-0 z-50  h-screen  p-4"
            src="/layout.png"
            alt=""
          />
        )}
      </div>

      {children}
    </>
  );
};

export default Layout;
