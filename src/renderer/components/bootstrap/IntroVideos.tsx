import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// Adjust filenames if you named them differently
import unrealSrc from "@renderer/assets/videos/intro-unreal.mp4";
import coboxSrc from "@renderer/assets/videos/intro-cobox.mp4";

type Props = {
  onComplete: () => void;
};

export function IntroVideos({ onComplete }: Props) {
  const [index, setIndex] = useState(0); // 0 = unreal, 1 = cobox, 2 = done
  const videoRef = useRef<HTMLVideoElement>(null);

  const sources = [unrealSrc, coboxSrc];

  // Safety fallback — if a video errors or hangs, advance after 8s
  useEffect(() => {
    if (index >= sources.length) return;
    const timer = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 2) {
        advance();
      }
    }, 8_000);
    return () => clearTimeout(timer);
  }, [index]);

  // When all done, fire onComplete once
  useEffect(() => {
    if (index >= sources.length) onComplete();
  }, [index, onComplete]);

  const advance = () => setIndex((i) => i + 1);

  if (index >= sources.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.video
          key={index}
          ref={videoRef}
          src={sources[index]}
          autoPlay
          muted={false}
          playsInline
          onEnded={advance}
          onError={advance}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>
    </div>
  );
}
