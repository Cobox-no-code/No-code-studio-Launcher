"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import { useUser } from "@/context/UserContext"; // Adjust this path to your UserContext file
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
  const { logout } = useUser();
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

            <button
              key={"Logout"}
              onClick={logout}
              className={`text-md rounded-xl font-normal cursor-pointer w-full text-left px-5 py-2.5 mb-2 transition-all duration-200 ${
                isDarkMode
                  ? tab === "Logout"
                    ? "bg-[#2A1B5A] text-white"
                    : "text-[#A0A0A0] hover:bg-[#1C1041]"
                  : tab === "Logout"
                  ? "bg-[#E0E0E0] text-black"
                  : "text-[#9F9F9F] hover:bg-[#EEEEEE]"
              }`}
            >
              Logout
            </button>
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

// --- SVG Icon for default profile picture ---
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

// --- Component for Profile Tab ---
const Profile = ({ isDarkMode }) => {
  const { user, setUser } = useUser(); // Get user and setter from context
  const fileInputRef = useRef(null); // Ref for the hidden file input

  // --- Style classes ---
  const inputBaseClass =
    "w-full px-4 py-3 rounded-lg outline-none transition-colors duration-300 cursor-not-allowed";
  const inputDarkClass =
    "bg-[#1C1041] text-gray-200 placeholder-gray-500 border border-transparent";
  const inputLightClass =
    "bg-[#EEEEEE] text-gray-800 placeholder-gray-400 border border-transparent";
  const inputClass = `${inputBaseClass} ${
    isDarkMode ? inputDarkClass : inputLightClass
  }`;
  const labelClass = `mb-2 text-sm ${
    isDarkMode ? "text-gray-400" : "text-gray-600"
  }`;

  // --- Handle Photo Upload and Save to localStorage ---
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please upload an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file); // Convert image to Base64 string
    reader.onload = () => {
      const base64Image = reader.result;
      const updatedUser = { ...user, profilePicture: base64Image };

      // Update the global context state
      setUser(updatedUser);
      // Update localStorage to persist the change
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
  };

  if (!user) {
    return <div>Loading...</div>; // or some placeholder
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="flex items-center space-x-6">
        <div
          className={`relative flex items-center justify-center w-24 h-24 rounded-full overflow-hidden ${
            isDarkMode ? "bg-[#1C1041]" : "bg-[#E0E0E0]"
          }`}
        >
          {/* Display profile picture if it exists, otherwise show placeholder */}
          {user && user?.profilePicture ? (
            <img
              src={user?.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon />
          )}
        </div>
        <div>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/png, image/jpeg, image/gif"
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()} // Trigger hidden input
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
        <div className="w-full">
          <label className={labelClass}>First Name</label>
          <input
            type="text"
            className={inputClass}
            value={user?.name || "N/A"}
            readOnly
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Wallet Address</label>
        <input
          type="text"
          className={inputClass}
          value={user?.wallet_address || "N/A"}
          readOnly
        />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          className={inputClass}
          value={user?.email || "No email found"}
          readOnly
        />
      </div>
    </div>
  );
};

const Setting = ({ isDarkMode, toggleDarkMode }) => {
  const [updates, setUpdates] = useState({ auto: true, manual: false });

  // --- Style classes ---
  const textColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const headingColor = isDarkMode ? "text-white" : "text-black";
  const linkColor = `cursor-pointer ${
    isDarkMode
      ? "text-gray-300 hover:text-white"
      : "text-gray-600 hover:text-black"
  }`;

  // --- Reusable Checkbox Component ---
  const Checkbox = ({ label, checked, onChange }) => (
    <label className="flex items-center cursor-pointer space-x-3">
      <div
        onClick={onChange} // Added onClick here for better click handling
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
      <span onClick={onChange} className={textColor}>
        {label}
      </span>
    </label>
  );

  // --- Handler to toggle between Auto and Manual updates ---
  const handleUpdateSettingChange = (setting) => {
    if (setting === "auto") {
      setUpdates({ auto: true, manual: false });
    } else {
      setUpdates({ auto: false, manual: true });
    }
  };

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
            onChange={() => handleUpdateSettingChange("auto")}
          />
          <Checkbox
            label="Manual updates"
            checked={updates.manual}
            onChange={() => handleUpdateSettingChange("manual")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={`text-lg font-semibold mb-3 ${headingColor}`}>More</h3>
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
      <h2 className={`text-2xl font-bold ${headingColor}`}>About</h2>

      <p>
        A powerful sandbox-style creation engine built for rapid world-building
        and experimentation. Design sci-fi environments, customize every object,
        paint foliage, tune lighting, and drop in interactive gameplay
        assets—all in real time.
      </p>

      <p>
        Whether you&apos;re building a lab, a base, or a full-blown level, this
        engine gives you complete creative control with intuitive tools, physics
        options, and dynamic visual customization.
      </p>

      <p>
        This application is currently in active development. We appreciate your
        support and feedback as we continue to build and improve.
      </p>

      <div>
        <p>
          <strong>Version:</strong> Alpha
        </p>
        <p>
          <strong>Last Updated:</strong> August 2025
        </p>
      </div>

      <p className="text-sm">© 2025 COBOX Games Inc. All Rights Reserved.</p>
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
      <h2 className={`text-2xl font-bold mb-4 ${headingColor}`}>
        What&rsquo;s New
      </h2>

      <ChangeLog version="Version 1.1.0" date="November 2025">
        <li>
          <span className={tagClass}>NEW</span> Build. Create. Customize —
          Faster than Ever.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Drag-and-drop building with
          floors, walls, ceilings & sci-fi assets.
        </li>
        <li>
          <span className={tagClass}>NEW</span> New gizmo controls for quick
          move/rotate/scale adjustments.
        </li>
        <li>
          <span className={tagClass}>NEW</span> One-click actions for physics,
          collision, and axis-locking.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Foliage painting system with
          adjustable brush radius & density.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Real-time lighting controls:
          time-of-day, sun angle, intensity & fog.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Fully drivable drift-tuned car
          added for testing & fun.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Pre-built gameplay assets
          (traps, cannons, seesaws) for instant interaction.
        </li>
        <li>
          <span className={tagClass}>NEW</span> Custom material editor: color
          wheel, roughness, specular, emissive & metallic sliders.
        </li>
        <li>
          <span className={tagClass}>IMPROVEMENT</span> Enhanced geometry tools
          for modular level building.
        </li>
        <li>
          <span className={tagClass}>NEW</span> New 3D Text Actor with font,
          spacing & layout customization.
        </li>
      </ChangeLog>

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
