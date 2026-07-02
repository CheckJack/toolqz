"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { ShowcasePartner } from "@/data/partners";

interface PartnerMarqueeProps {
  partners: ShowcasePartner[];
  className?: string;
}

/** Rough width per logo slot for pre-layout estimate */
const ESTIMATED_ITEM_PX = 140;

function PartnerLogo({ partner }: { partner: ShowcasePartner }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-[16px]">
        {partner.name}
      </span>
    );
  }

  return (
    <span
      className="flex h-7 shrink-0 items-center opacity-70 sm:h-8"
      title={partner.name}
      aria-label={partner.name}
    >
      <Image
        src={partner.logoUrl}
        alt={partner.name}
        width={140}
        height={40}
        className="h-full w-auto max-h-7 max-w-[8.5rem] object-contain object-center sm:max-h-8 sm:max-w-[9.5rem]"
        onError={() => setFailed(true)}
        unoptimized
      />
    </span>
  );
}

function buildSegment(partners: ShowcasePartner[], repeats: number) {
  return Array.from({ length: repeats }, () => partners).flat();
}

export function PartnerMarquee({ partners, className = "" }: PartnerMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const [segmentRepeats, setSegmentRepeats] = useState(3);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure || partners.length === 0) return;

    function syncRepeats() {
      const viewportWidth = viewport!.clientWidth;
      const measuredSegmentWidth = measure!.scrollWidth;

      if (measuredSegmentWidth > 0) {
        const repeats = Math.max(
          2,
          Math.ceil((viewportWidth * 1.15) / measuredSegmentWidth)
        );
        setSegmentRepeats((prev) => (prev === repeats ? prev : repeats));
        return;
      }

      const estimatedSingleSet = partners.length * ESTIMATED_ITEM_PX;
      const repeats = Math.max(
        2,
        Math.ceil((viewportWidth * 1.15) / estimatedSingleSet)
      );
      setSegmentRepeats((prev) => (prev === repeats ? prev : repeats));
    }

    syncRepeats();
    const observer = new ResizeObserver(syncRepeats);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [partners]);

  const segment = useMemo(
    () => buildSegment(partners, segmentRepeats),
    [partners, segmentRepeats]
  );

  const loop = useMemo(() => [...segment, ...segment], [segment]);

  if (partners.length === 0) return null;

  return (
    <div className={`partner-marquee relative w-full ${className}`}>
      {/* Hidden measure row — one segment worth of logos */}
      <ul
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute flex w-max items-center gap-10 opacity-0 sm:gap-14 lg:gap-16"
      >
        {partners.map((partner) => (
          <li key={`measure-${partner.id}`}>
            <PartnerLogo partner={partner} />
          </li>
        ))}
      </ul>

      <div ref={viewportRef} className="partner-marquee-viewport overflow-hidden">
        <ul className="partner-marquee-track flex w-max items-center gap-10 sm:gap-14 lg:gap-16">
          {loop.map((partner, index) => {
            const isDuplicate = index >= segment.length;
            return (
              <li
                key={`${partner.id}-${index}`}
                aria-hidden={isDuplicate || undefined}
                {...(isDuplicate ? { inert: true as const } : {})}
              >
                <PartnerLogo partner={partner} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
