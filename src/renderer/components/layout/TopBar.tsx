import { IconButton } from "@renderer/components/ui/IconButton";
import { useAuthState } from "@renderer/hooks/useAuthState";

import logoSrc from "@renderer/assets/images/logo.png";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SettingsModal } from "../settings/SettingsModal";
export function TopBar() {
  const auth = useAuthState();
  const user = auth?.user;
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <header
      data-drag
      className="h-[60px] flex items-center justify-between px-6 py-3 "
    >
      {/* Logo */}
      <div className="flex items-center gap-2 font-display font-black h-16 w-20 text-white tracking-tight leading-none">
        <img src={logoSrc} alt="Cobox Logo" className=" scale-115" />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-1">
        <Link to="/home">
          <IconButton>
            <svg
              width="16"
              height="16"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.17143 0C10.3386 0 12.4171 0.860916 13.9495 2.39336C15.4819 3.9258 16.3429 6.00423 16.3429 8.17143C16.3429 10.1954 15.6011 12.056 14.3817 13.4891L14.7211 13.8286H15.7143L22 20.1143L20.1143 22L13.8286 15.7143V14.7211L13.4891 14.3817C12.056 15.6011 10.1954 16.3429 8.17143 16.3429C6.00423 16.3429 3.9258 15.4819 2.39336 13.9495C0.860916 12.4171 0 10.3386 0 8.17143C0 6.00423 0.860916 3.9258 2.39336 2.39336C3.9258 0.860916 6.00423 0 8.17143 0ZM8.17143 2.51429C5.02857 2.51429 2.51429 5.02857 2.51429 8.17143C2.51429 11.3143 5.02857 13.8286 8.17143 13.8286C11.3143 13.8286 13.8286 11.3143 13.8286 8.17143C13.8286 5.02857 11.3143 2.51429 8.17143 2.51429Z"
                fill="#868686"
              />
            </svg>
          </IconButton>
        </Link>
        <Link to="/recent">
          <IconButton>
            <svg
              width="18"
              height="16"
              viewBox="0 0 24 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.12 18.643L12 18.7629L11.868 18.643C6.168 13.4757 2.4 10.0589 2.4 6.59401C2.4 4.19619 4.2 2.39782 6.6 2.39782C8.448 2.39782 10.248 3.59673 10.884 5.22725H13.116C13.752 3.59673 15.552 2.39782 17.4 2.39782C19.8 2.39782 21.6 4.19619 21.6 6.59401C21.6 10.0589 17.832 13.4757 12.12 18.643ZM17.4 0C15.312 0 13.308 0.971117 12 2.49373C10.692 0.971117 8.688 0 6.6 0C2.904 0 0 2.88937 0 6.59401C0 11.1139 4.08 14.8185 10.26 20.4174L12 22L13.74 20.4174C19.92 14.8185 24 11.1139 24 6.59401C24 2.88937 21.096 0 17.4 0Z"
                fill="#868686"
              />
            </svg>
          </IconButton>
        </Link>
        <Link to="/store">
          <IconButton>
            <svg
              width="20"
              height="18"
              viewBox="0 0 25 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.11364 22C4.22727 22 3.45455 21.4789 3.07955 20.7263L0.113636 9.77263L0 9.26316C0 8.95607 0.119724 8.66155 0.332833 8.4444C0.545943 8.22726 0.834981 8.10526 1.13636 8.10526H6.34091L11.5682 0.497895C11.7727 0.196842 12.1136 0 12.5 0C12.8864 0 13.2386 0.196842 13.4432 0.509474L18.6591 8.10526H23.8636C24.165 8.10526 24.4541 8.22726 24.6672 8.4444C24.8803 8.66155 25 8.95607 25 9.26316L24.9545 9.59895L21.9205 20.7263C21.5455 21.4789 20.7727 22 19.8864 22H5.11364ZM12.5 3.17263L9.09091 8.10526H15.9091L12.5 3.17263ZM12.5 12.7368C11.8972 12.7368 11.3192 12.9808 10.8929 13.4151C10.4667 13.8494 10.2273 14.4384 10.2273 15.0526C10.2273 15.6668 10.4667 16.2558 10.8929 16.6901C11.3192 17.1244 11.8972 17.3684 12.5 17.3684C13.1028 17.3684 13.6808 17.1244 14.1071 16.6901C14.5333 16.2558 14.7727 15.6668 14.7727 15.0526C14.7727 14.4384 14.5333 13.8494 14.1071 13.4151C13.6808 12.9808 13.1028 12.7368 12.5 12.7368Z"
                fill="#868686"
              />
            </svg>
          </IconButton>
        </Link>
        <IconButton badge={0}>
          <svg
            width="16"
            height="20"
            viewBox="0 0 18 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 19.9048H11C11 21.0571 10.1 22 9 22C7.9 22 7 21.0571 7 19.9048ZM18 17.8095V18.8571H0V17.8095L2 15.7143V9.42857C2 6.18095 4 3.35238 7 2.40952V2.09524C7 0.942857 7.9 0 9 0C10.1 0 11 0.942857 11 2.09524V2.40952C14 3.35238 16 6.18095 16 9.42857V15.7143L18 17.8095ZM14 9.42857C14 6.49524 11.8 4.19048 9 4.19048C6.2 4.19048 4 6.49524 4 9.42857V16.7619H14V9.42857Z"
              fill="#868686"
            />
          </svg>
        </IconButton>
        <div className="ml-2" data-no-drag>
          <button
            onClick={() => setSettingsOpen(true)}
            data-no-drag
            aria-label="Settings"
            className="rounded-full transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            <img
              src={
                auth?.user?.avatar_url ??
                `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                  auth?.user?.email ?? "cobox",
                )}`
              }
              alt=""
              className="size-8 rounded-full border-2 border-brand-700/50"
            />
            {/* Optional online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success border-2 border-surface-1" />
          </button>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
