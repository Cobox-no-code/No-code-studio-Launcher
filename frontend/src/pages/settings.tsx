"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Helper Icon for better UI
const CheckIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"></path>
  </svg>
);

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

export default function Settings() {
  const router = useRouter();
  const divref = useRef<HTMLDivElement | null>(null);
  const pushedRef = useRef(false); // prevent double pushes

  const handleOutside = useCallback(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    router.push("/home");
  }, [router]);

  useOnClickOutside(divref, handleOutside);
  const [tab, setTab] = useState("Profile");
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const items = ["Profile", "Settings", "About", "What's new"];

  // Base styles for reuse
  const backdropClass = isDarkMode ? "bg-[#0E052A]/80" : "bg-[#F5F5F5]/68";
  const modalBgClass = isDarkMode ? "bg-[#0E052A]" : "bg-white";

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 z-[100] flex justify-center items-center backdrop-blur-sm transition-colors duration-300 ${backdropClass}`}
    >
      <div
        ref={divref}
        className={`rounded-3xl shadow-2xl min-w-5xl w-[60vw] max-w-5xl h-[75vh] py-12 px-8 transition-colors duration-300 ${modalBgClass}`}
      >
        <div className="flex mx-auto max-w-4xl h-full space-x-12">
          {/* Left Navigation */}
          <div className="flex flex-col w-1/3 pt-4">
            {items.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`text-md rounded-xl font-normal cursor-pointer w-full text-left px-5 py-2.5 mb-2 transition-all duration-200 ${
                  isDarkMode
                    ? tab === item
                      ? "bg-[#2A1B5A] text-white"
                      : "text-[#A0A0A0] hover:bg-[#1C1041]"
                    : tab === item
                    ? "bg-[#E0E0E0] text-black"
                    : "text-[#9F9F9F] hover:bg-[#EEEEEE]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="w-2/3 h-full overflow-y-auto px-4 pb-6">
            {tab === "Profile" && <Profile isDarkMode={isDarkMode} />}
            {tab === "Settings" && (
              <Setting
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
              />
            )}
            {tab === "About" && <About isDarkMode={isDarkMode} />}
            {tab === "What's new" && <WhatsNew isDarkMode={isDarkMode} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Component for Profile Tab ---
const Profile = ({ isDarkMode }) => {
  const inputBaseClass =
    "w-full px-4 py-3 rounded-lg outline-none transition-colors duration-300";
  const inputDarkClass =
    "bg-[#1C1041] text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-[#4A3F78]";
  const inputLightClass =
    "bg-[#EEEEEE] text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#BDBDBD]";
  const inputClass = `${inputBaseClass} ${
    isDarkMode ? inputDarkClass : inputLightClass
  }`;
  const labelClass = `mb-2 text-sm ${
    isDarkMode ? "text-gray-400" : "text-gray-600"
  }`;

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="flex items-center space-x-6">
        <div
          className={`w-24 h-24 rounded-full ${
            isDarkMode ? "bg-[#1C1041]" : "bg-[#E0E0E0]"
          }`}
        >
          {/* Profile Picture would go here */}
        </div>
        <div>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              isDarkMode
                ? "bg-[#2A1B5A] text-white hover:bg-[#4A3F78]"
                : "bg-[#E0E0E0] text-black hover:bg-[#BDBDBD]"
            }`}
          >
            Upload Photo
          </button>
          <p
            className={`mt-2 text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            PNG, JPG, GIF up to 5MB.
          </p>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/2">
          <label className={labelClass}>First Name</label>
          <input type="text" className={inputClass} placeholder="John" />
        </div>
        <div className="w-1/2">
          <label className={labelClass}>Last Name</label>
          <input type="text" className={inputClass} placeholder="Doe" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Username</label>
        <input type="text" className={inputClass} placeholder="johndoe" />
      </div>
      <div>
        <label className={labelClass}>Wallet Address</label>
        <input type="text" className={inputClass} placeholder="0xAbC...123" />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          className={inputClass}
          placeholder="john.doe@example.com"
        />
      </div>
    </div>
  );
};

// --- Component for Settings Tab ---
const Setting = ({ isDarkMode, toggleDarkMode }) => {
  const [updates, setUpdates] = useState({ auto: true, manual: false });
  const textColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const headingColor = isDarkMode ? "text-white" : "text-black";
  const linkColor = `cursor-pointer ${
    isDarkMode
      ? "text-gray-300 hover:text-white"
      : "text-gray-600 hover:text-black"
  }`;

  const Checkbox = ({ label, checked, onChange }) => (
    <label className="flex items-center cursor-pointer space-x-3">
      <div
        className={`w-5 h-5 border-2 rounded flex justify-center items-center transition-all duration-200 ${
          isDarkMode
            ? checked
              ? "bg-[#4A3F78] border-[#4A3F78]"
              : "border-gray-500"
            : checked
            ? "bg-gray-600 border-gray-600"
            : "border-gray-400"
        }`}
      >
        {checked && <CheckIcon className="w-4 h-4 text-white" />}
      </div>
      <span className={textColor}>{label}</span>
    </label>
  );

  return (
    <div className={`w-full space-y-8 ${textColor}`}>
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${headingColor}`}>Theme</h3>
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleDarkMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#4A3F78]"></div>
          </label>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-3 ${headingColor}`}>
          Updates
        </h3>
        <div className="space-y-3">
          <Checkbox
            label="Auto download and install updates (recommended)"
            checked={updates.auto}
            onChange={() => setUpdates({ ...updates, auto: !updates.auto })}
          />
          <Checkbox
            label="Manual updates"
            checked={updates.manual}
            onChange={() => setUpdates({ ...updates, manual: !updates.manual })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={`text-lg font-semibold mb-3 ${headingColor}`}>More</h3>
        <p className={linkColor}>Auto launch on startup</p>
        <p className={linkColor}>Bug Report</p>
        <p className={linkColor}>Documentation</p>
        <p className={linkColor}>Contributors</p>
        <p className={linkColor}>Privacy Policy</p>
      </div>
    </div>
  );
};

// --- Component for About Tab ---
const About = ({ isDarkMode }) => {
  const textColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const headingColor = isDarkMode ? "text-white" : "text-black";

  return (
    <div className={`w-full space-y-6 ${textColor}`}>
      <h2 className={`text-2xl font-bold ${headingColor}`}>About Our App</h2>
      <p>
        Welcome to the next generation of decentralized applications. Our
        platform is built with cutting-edge technology to provide a seamless,
        secure, and user-centric experience in the world of Web3.
      </p>
      <p>
        This application is currently in active development. We appreciate your
        support and feedback as we continue to build and improve.
      </p>
      <div>
        <p>
          <strong>Version:</strong> 1.0.0 (Beta)
        </p>
        <p>
          <strong>Last Updated:</strong> August 2025
        </p>
      </div>
      <p className="text-sm">© 2025 Your App Inc. All Rights Reserved.</p>
    </div>
  );
};

// --- Component for What's New Tab ---
const WhatsNew = ({ isDarkMode }) => {
  const textColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const headingColor = isDarkMode ? "text-white" : "text-black";
  const tagClass = `px-2 py-0.5 text-xs rounded-full font-semibold ${
    isDarkMode ? "bg-green-900 text-green-300" : "bg-green-200 text-green-800"
  }`;
  const tagFixClass = `px-2 py-0.5 text-xs rounded-full font-semibold ${
    isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-200 text-blue-800"
  }`;

  const ChangeLog = ({ version, date, children }) => (
    <div>
      <h3 className={`text-xl font-semibold ${headingColor}`}>{version}</h3>
      <p
        className={`text-sm mb-3 ${
          isDarkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Released on {date}
      </p>
      <ul className="space-y-2 list-disc list-inside">{children}</ul>
    </div>
  );

  return (
    <div className={`w-full space-y-8 ${textColor}`}>
      <h2 className={`text-2xl font-bold mb-4 ${headingColor}`}>What's New</h2>
      <ChangeLog version="Version 1.0.0" date="August 1, 2025">
        <li>
          <span className={tagClass}>NEW</span> Initial public beta release.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Introduced Profile and Settings
          management.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Added Dark Mode and Light Mode
          themes.
        </li>
      </ChangeLog>
      <ChangeLog version="Version 0.9.5" date="July 22, 2025">
        <li>
          <span className={tagFixClass}>FIX</span> Resolved wallet connection
          issues on Safari.
        </li>
        <li>
          <span className={tagClass}>IMPROVEMENT</span> Performance
          optimizations for asset loading.
        </li>
      </ChangeLog>
    </div>
  );
};
