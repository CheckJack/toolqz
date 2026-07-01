"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID, isAdSenseEnabled } from "@/lib/adsense";

type AdSenseFormat = "auto" | "rectangle" | "horizontal" | "vertical";

interface AdSenseProps {
  slot: string;
  format?: AdSenseFormat;
  className?: string;
  minHeight?: number;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const LABEL_HEIGHT = 12;

function SponsoredLabel() {
  return (
    <span className="block px-2 pt-1 pb-0 text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-muted-dim">
      Sponsored
    </span>
  );
}

export function AdSense({
  slot,
  format = "auto",
  className = "",
  minHeight = 90,
}: AdSenseProps) {
  const pushed = useRef(false);
  const adHeight = Math.max(minHeight - LABEL_HEIGHT, 48);
  const enabled = isAdSenseEnabled() && Boolean(slot);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, [enabled, slot]);

  return (
    <div
      className={`overflow-hidden ${enabled ? "" : "border border-dashed border-dark-border bg-dark-surface/60"} ${className}`}
    >
      <SponsoredLabel />
      {enabled ? (
        <div style={{ minHeight: adHeight }}>
          <ins
            className="adsbygoogle block"
            style={{ display: "block" }}
            data-ad-client={ADSENSE_CLIENT_ID}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        <div style={{ minHeight: adHeight }} aria-hidden />
      )}
    </div>
  );
}
