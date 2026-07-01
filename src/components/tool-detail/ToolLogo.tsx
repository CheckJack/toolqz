"use client";

import { useState } from "react";
import Image from "next/image";

const sizeClasses = {
  sm: {
    box: "h-12 w-12 rounded-lg text-lg",
    image: "h-12 w-12 rounded-lg",
    sizes: "48px",
  },
  md: {
    box: "h-16 w-16 rounded-lg text-2xl sm:h-20 sm:w-20 sm:text-3xl",
    image: "h-16 w-16 rounded-lg sm:h-20 sm:w-20",
    sizes: "80px",
  },
  lg: {
    box: "h-20 w-20 rounded-lg text-3xl",
    image: "h-20 w-20 rounded-lg",
    sizes: "80px",
  },
};

export function ToolLogo({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const classes = sizeClasses[size];

  if (failed || !logoUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center border border-dark-border bg-dark font-bold text-neon ${classes.box}`}
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-dark-border bg-white p-2 ${classes.image}`}
    >
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        fill
        className="object-contain p-1"
        sizes={classes.sizes}
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
}
