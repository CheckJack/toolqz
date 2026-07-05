"use client";

import { useState } from "react";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/images";

export function ScreenshotGallery({
  screenshots,
  name,
}: {
  screenshots: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (screenshots.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-dark-border bg-dark">
        <Image
          src={screenshots[active]}
          alt={`${name} screenshot ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 896px"
          priority
          unoptimized={!canOptimizeImage(screenshots[active])}
        />
      </div>
      {screenshots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {screenshots.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border transition-all ${
                active === i
                  ? "border-neon ring-2 ring-neon/30"
                  : "border-dark-border opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="112px"
                unoptimized={!canOptimizeImage(src)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
