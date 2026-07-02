"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPartnerMarkUrl } from "@/data/partners";
import type { Website } from "@/types";

interface PartnerMarqueeProps {
  partners: Website[];
  className?: string;
}

/** Rough width per logo slot (icon/text + flex gap) for pre-layout estimate */
const ESTIMATED_ITEM_PX = 112;

function PartnerLogo({ partner }: { partner: Website }) {
  const markUrl = getPartnerMarkUrl(partner);
  const [failed, setFailed] = useState(false);
  const showMark = Boolean(markUrl) && !failed;

  return (
    <Link
      href={`/tools/${partner.slug}`}
      title={`${partner.name} review`}
      className="group flex h-8 shrink-0 items-center opacity-70 transition-opacity hover:opacity-100 sm:h-9"
    >
      {showMark ? (
        <span className="relative block h-full w-8 sm:w-9">
          <Image
            src={markUrl!}
            alt={partner.name}
            fill
            className="object-contain"
            sizes="36px"
            onError={() => setFailed(true)}
            unoptimized
          />
        </span>
      ) : (
        <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-[16px]">
          {partner.name}
        </span>
      )}
    </Link>
  );
}

function buildSegment(partners: Website[], repeats: number) {
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
          <li key={`measure-${partner.slug}`}>
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
                key={`${partner.slug}-${index}`}
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
