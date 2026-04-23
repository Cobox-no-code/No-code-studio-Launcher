import placeholder from "@renderer/assets/images/game-thumb-placeholder.png";
import { cobox } from "@renderer/lib/electron";
import type { PlayerGame } from "@renderer/lib/games-api";
import {
  displayInstalls,
  displayRating,
  fmtNum,
  gameThumb,
} from "@renderer/lib/games-api";
import {
  Check,
  Copy,
  Download,
  MessageCircle,
  Send,
  Star,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface Props {
  game: PlayerGame;
  onClose: () => void;
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
export function ShareModal({ game, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://cobox.games/games/${game.game_id}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(
    `Check out "${game.title}" on Cobox! 🎮`,
  );

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socials = [
    {
      name: "X",
      icon: <XIcon />,
      href: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: <Send size={14} />,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: "Facebook",
      icon: <FacebookIcon />,
      href: `https://facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "Discord",
      icon: <MessageCircle size={14} />,
      href: "https://discord.com/invite/KTMG3NxBEK",
    },
  ];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-surface-1 border border-border-strong rounded-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold tracking-[0.15em] text-text-secondary">
              SHARE GAME
            </h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white transition"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mini preview */}
          <div className="flex gap-3 mb-5 p-3 border border-border bg-white/[0.03] rounded-md">
            <img
              src={gameThumb(game, placeholder)}
              alt={game.title}
              className="w-14 h-14 object-cover rounded shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholder;
              }}
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{game.title}</p>
              <p className="text-text-muted text-xs mt-0.5">
                by {game.display_name || game.creator_name}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-text-secondary">
                    {displayRating(game).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-text-muted">
                  <Download size={10} />
                  <span className="text-xs">
                    {fmtNum(displayInstalls(game))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Copy row */}
          <div className="flex gap-2 mb-5">
            <div
              className="flex-1 bg-white/5 border border-border rounded px-3 py-2 text-[11px] text-text-muted truncate font-mono"
              data-selectable
            >
              {shareUrl}
            </div>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-4 py-2 bg-cta hover:bg-cta-hover rounded text-white text-xs font-bold transition shrink-0"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-[10px] text-text-muted tracking-[0.15em] mb-3">
            SHARE VIA
          </p>
          <div className="grid grid-cols-4 gap-2">
            {socials.map((s) => (
              <button
                key={s.name}
                onClick={() => cobox.auth.openExternal(s.href)}
                className="flex flex-col items-center gap-1.5 py-3 border border-border bg-white/[0.03] hover:border-brand-700/70 hover:bg-brand-700/10 rounded-md transition group"
              >
                <span className="text-text-secondary group-hover:text-brand-300 transition-transform group-hover:scale-110">
                  {s.icon}
                </span>
                <span className="text-[9px] text-text-muted group-hover:text-text-secondary transition text-center leading-tight">
                  {s.name}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
