// src/components/Layout.tsx
"use client";
import { Home, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, use, useEffect, useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("email");
      const storedIdToken = localStorage.getItem("idtoken");
      if (storedEmail) setEmail(storedEmail);
      if (storedIdToken) setIdToken(storedIdToken);
    }
  }, []);
  const path = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("idtoken");
    router.push("/login");
  };
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="./hero.svg"
          alt="Background"
          className="w-full h-full  object-cover"
        />
      </div>

      <div className="absolute top-10 left-6">
        <svg
          width="70"
          height="150"
          viewBox="0 0 70 254"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M9 182C9 189.732 15.268 196 23 196H61.7607L63 254L9.31738 214.271C3.45682 209.933 0 203.073 0 195.782V18.2803C0.000125693 11.0616 3.38317 4.34393 9 0.0351562V182Z"
            fill="white"
          />
          <rect
            x="-0.5"
            y="0.5"
            width="52"
            height="177"
            rx="11.5"
            transform="matrix(-1 0 0 1 69 5)"
            fill="#3E15AF"
            stroke="#3E15AF"
          />
        </svg>

        <button
          onClick={() => router.push("/home")}
          className={`absolute top-6 cursor-pointer z-20 left-8 ${
            path.includes("home") ? "text-white" : "text-gray-500"
          }`}
        >
          <Home size={18} />
        </button>

        <button
          onClick={() => router.push("/lobby")}
          className={`absolute top-16 cursor-pointer z-20 left-8 ${
            path.includes("lobby") ? "text-white" : "text-gray-500"
          }`}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 23 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="9.94721" height="10.7124" rx="2" fill="currentcolor" />
            <rect
              y="13.7729"
              width="12.2427"
              height="9.18204"
              rx="2"
              fill="currentcolor"
            />
            <rect
              x="12.2441"
              width="10.7124"
              height="10.7124"
              rx="2"
              fill="currentcolor"
            />
            <rect
              x="14.541"
              y="13.7729"
              width="8.41687"
              height="9.18204"
              rx="2"
              fill="currentcolor"
            />
          </svg>
        </button>
      </div>

      {/* Top Right User Dropdown */}
      {/* <div className="absolute top-4 right-4 z-30">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-1 cursor-pointer rounded-full text-white hover:bg-black/30 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
              <User size={16} />
            </div>
          </button>

          {/* Dropdown Menu */}
      {/* {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium text-gray-900">
                  User Profile
                </p>
                <p className="text-xs text-gray-500">{email}</p>
              </div>

              <div className="py-1">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile Settings
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Preferences
                </a>

                <div className="border-t">
                  <button
                    onClick={handleSignOut}
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )} */}
      {/* </div>
      </div> */}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
      {/* Main Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
