import { Gamepad2, Layers, Sparkles, Upload } from "lucide-react";
import { motion } from "motion/react";
import { CreatorHomeScene } from "./CreatorHomeScene";
import { SceneBoundary } from "./SceneBoundary";

export function CreatorHome() {
  return (
    <div className="relative h-full overflow-hidden">
      {/* ─── 3D background ─────────────────────────────────────────────── */}
      <SceneBoundary>
        <CreatorHomeScene />
      </SceneBoundary>

      {/* Subtle left-side darkening so content stays legible */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            "linear-gradient(90deg, rgba(15, 1, 22, 0.8) 0%, rgba(15, 1, 22, 0.4) 40%, transparent 100%)",
        }}
      />

      {/* ─── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col items-start justify-center p-10 max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-display font-black text-5xl leading-[0.95] tracking-tight"
        >
          WELCOME TO
          <br />
          <span className="bg-gradient-to-r from-white via-brand-300 to-brand-500 bg-clip-text text-transparent">
            NO CODE STUDIO
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-4 text-sm text-text-secondary leading-relaxed max-w-lg"
        >
          Your creator workspace. Build worlds and single-player experiences
          without writing a line of code — use the sidebar to create a new world
          or game, browse your saved projects, and manage what you've published.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-10 flex gap-6 text-xs text-text-muted"
        >
          <Tip
            icon={<Layers size={14} />}
            title="CREATE WORLD"
            body="Design stunning 3D environments you can reuse across games."
          />
          <Tip
            icon={<Gamepad2 size={14} />}
            title="CREATE GAME"
            body="Turn a world into a playable single-player experience."
          />
          <Tip
            icon={<Upload size={14} />}
            title="PUBLISH"
            body="Share your games with the Cobox community."
          />
        </motion.div>
      </div>
    </div>
  );
}

function Tip({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      className="max-w-[200px]"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-1.5 text-brand-300 font-bold tracking-[0.1em] mb-1.5">
        {icon}
        {title}
      </div>
      <p className="leading-relaxed">{body}</p>
    </motion.div>
  );
}
