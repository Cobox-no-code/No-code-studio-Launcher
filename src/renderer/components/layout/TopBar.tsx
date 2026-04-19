import { Avatar } from "@renderer/components/ui/Avatar";
import { IconButton } from "@renderer/components/ui/IconButton";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { Bell, Heart, Search, ShoppingBasket } from "lucide-react";

import logoSrc from "@renderer/assets/images/logo.png";
export function TopBar() {
  const auth = useAuthState();
  const user = auth?.user;

  return (
    <header
      data-drag
      className="h-[60px] flex items-center justify-between px-6 py-3 "
    >
      {/* Logo */}
      <div className="flex items-center gap-2 font-display font-black h-16 w-20 text-white tracking-tight leading-none">
        <img src={logoSrc} alt="Cobox Logo" className=" scale-125" />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-1">
        <IconButton>
          <Search size={18} />
        </IconButton>
        <IconButton>
          <Heart size={18} />
        </IconButton>
        <IconButton>
          <ShoppingBasket size={18} />
        </IconButton>
        <IconButton badge={0}>
          <Bell size={18} />
        </IconButton>
        <div className="ml-2" data-no-drag>
          <Avatar name={user?.name ?? user?.email} online={!!user} size={44} />
        </div>
      </div>
    </header>
  );
}
