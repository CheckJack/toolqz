"use client";

import { useEffect, useRef, useState } from "react";

const MUX_PLAYBACK_ID = "r6pXRAJb3005XEEbl1hYU1x01RFJDSn7KQApwNGgAHHbU";
const HERO_VIDEO_SRC = `https://stream.mux.com/${MUX_PLAYBACK_ID}.m3u8`;
const HERO_VIDEO_POSTER = `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.jpg?time=0`;

function lockToHighestQuality(hls: {
  levels: { height: number }[];
  currentLevel: number;
}) {
  const maxLevel = hls.levels.length - 1;
  if (maxLevel >= 0) {
    hls.currentLevel = maxLevel;
  }
}

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(motionQuery.matches);
    if (motionQuery.matches) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !videoRef.current) return;

      if (Hls.isSupported()) {
        const instance = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: false,
          startLevel: -1,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        instance.on(Hls.Events.MANIFEST_PARSED, () => {
          lockToHighestQuality(instance);
        });

        instance.on(Hls.Events.LEVEL_SWITCHED, () => {
          const maxLevel = instance.levels.length - 1;
          if (maxLevel >= 0 && instance.currentLevel !== maxLevel) {
            instance.currentLevel = maxLevel;
          }
        });

        instance.loadSource(HERO_VIDEO_SRC);
        instance.attachMedia(videoRef.current);
        hls = instance;
        return;
      }

      if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = HERO_VIDEO_SRC;
      }
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <video
        ref={videoRef}
        className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        poster={HERO_VIDEO_POSTER}
        preload={reduceMotion ? "none" : "auto"}
      />
      <div className="absolute inset-0 bg-dark/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/20 via-dark/40 to-dark/85" />
    </div>
  );
}
