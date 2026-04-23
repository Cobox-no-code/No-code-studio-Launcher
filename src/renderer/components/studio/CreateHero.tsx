import { LauncherHandoff } from "@renderer/components/studio/LauncherHandoff";
import { Button } from "@renderer/components/ui/Button";
import { motion } from "motion/react";
import { useState } from "react";
import type { StudioIntent } from "../../../shared/types/game";

interface Props {
  title: string; // e.g. "NO CODE\nWORLD"
  description: string;
  ctaLabel: string; // e.g. "Create now"
  intent: StudioIntent; // "world" | "game"
  bgImage: string; // imported asset
}

export function CreateHero({
  title,
  description,
  ctaLabel,
  intent,
  bgImage,
}: Props) {
  const [handoff, setHandoff] = useState<StudioIntent | null>(null);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Full-bleed background image */}
      <img
        src={bgImage}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover scale-125  pointer-events-none select-none"
      />

      {/* Readability overlay */}
      <div className="bg-layout-shade " />

      {/* Content anchored bottom-left */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-10 pr-10 pl-10  max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="font-display font-black text-5xl leading-[0.95] tracking-tight whitespace-pre-line"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="mt-4 text-sm text-text-secondary max-w-md leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-6"
        >
          <Button
            className=" bg-brand-700 rounded!"
            variant="cta"
            size="md"
            onClick={() => setHandoff(intent)}
          >
            {ctaLabel}
          </Button>
        </motion.div>
      </div>

      <LauncherHandoff
        open={handoff !== null}
        intent={handoff}
        onClose={() => setHandoff(null)}
      />
    </div>
  );
}
