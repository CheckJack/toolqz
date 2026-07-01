"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPartnerMarkUrl } from "@/data/partners";
import type { Website } from "@/types";

interface PartnerMarqueeProps {
  partners: Website[];
  className?: string;
}

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

export function PartnerMarquee({ partners, className = "" }: PartnerMarqueeProps) {
  if (partners.length === 0) return null;

  const loop = [...partners, ...partners];

  return (
    <div className={`partner-marquee relative w-full ${className}`}>
      <div className="partner-marquee-viewport overflow-hidden">
        <ul className="partner-marquee-track flex w-max items-center gap-10 sm:gap-14 lg:gap-16">
          {loop.map((partner, index) => {
            const isDuplicate = index >= partners.length;
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
