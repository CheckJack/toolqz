"use client";

import { useEffect, useRef, useState } from "react";

const MUX_PLAYBACK_ID = "r6pXRAJb3005XEEbl1hYU1x01RFJDSn7KQApwNGgAHHbU";
const HERO_VIDEO_SRC = `https://stream.mux.com/${MUX_PLAYBACK_ID}.m3u8`;
const HERO_VIDEO_POSTER = `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.jpg?time=0&width=1920`;

function prefersStaticHero(): boolean {
  if (typeof window === "undefined") return true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (window.matchMedia("(max-width: 767px)").matches) return true;

  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (connection?.saveData) return true;

  return false;
}

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [staticHero, setStaticHero] = useState(true);

  useEffect(() => {
    if (prefersStaticHero()) return;
    setStaticHero(false);

    const video = videoRef.current;
    if (!video) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !videoRef.current) return;

      if (Hls.isSupported()) {
        const instance = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: true,
          startLevel: -1,
          maxBufferLength: 15,
          maxMaxBufferLength: 30,
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
      {staticHero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HERO_VIDEO_POSTER}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_VIDEO_POSTER}
          preload="none"
        />
      )}
      <div className="absolute inset-0 bg-dark/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/20 via-dark/40 to-dark/85" />
    </div>
  );
}
