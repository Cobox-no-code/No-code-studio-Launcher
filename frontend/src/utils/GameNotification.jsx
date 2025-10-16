// components/GameNotification.jsx

import { toast } from "react-hot-toast";

// Simple 'X' icon for the dismiss button
const CloseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const GameNotification = ({ t, icon, title, message }) => {
  return (
    <div
      className={`
        max-w-md w-full bg-white/80 backdrop-blur-lg shadow-lg rounded-xl pointer-events-auto flex  ring-opacity-5
        transform-gpu transition-all duration-300 ease-in-out
        ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
      `}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-2xl pt-0.5">{icon}</div>
          <div className="ml-3 flex-1">
            <p className="text-base font-bold text-black">{title}</p>
            <p className="mt-1 text-sm text-gray-700">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-white/20">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-800 hover:bg-white/20 focus:outline-none transition-colors duration-200"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};
